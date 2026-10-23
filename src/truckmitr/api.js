// Client for the truckmitr.com admin panel bridge (/api/tm on the superadmin backend): the original
// truckmitr.com admin controllers, returning each page's data as JSON ({status, view, data}).
import axios from 'axios';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
const IMAGE_BASE = (import.meta.env.VITE_IMAGE_BASE_URL || 'https://truckmitr.com/public/').replace(/\/?$/, '/');

export const tm = axios.create({
  baseURL: `${API_BASE}/tm`,
  headers: { Accept: 'application/json' },
  timeout: 180000,
});

// The console login token (TeleHead login, admins table)
tm.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

tm.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      ['tm_admin_token', 'tm_admin_user', 'token', 'user'].forEach((key) => localStorage.removeItem(key));
      window.location.href = '/login?expired=1';
    }
    return Promise.reject(error);
  }
);

/** Data a truckmitr.com admin page renders (the variables its Blade view receives). */
export async function tmView(path, params) {
  const { data } = await tm.get(path, { params });
  if (data?.status === false) throw new Error(data.message || 'Could not load this page');
  return data?.data ?? data;
}

const appendValue = (fd, key, value) => {
  if (value === undefined || value === null) return;
  if (Array.isArray(value)) {
    // rows of fields (benefits[0][hindi]) keep their index; plain lists are key[]
    value.forEach((item, i) => appendValue(fd, item && typeof item === 'object' && !(item instanceof Blob) ? `${key}[${i}]` : `${key}[]`, item));
  } else if (typeof value === 'object' && !(value instanceof Blob)) {
    Object.entries(value).forEach(([sub, item]) => appendValue(fd, `${key}[${sub}]`, item));
  } else if (typeof value === 'boolean') {
    fd.append(key, value ? '1' : '0');
  } else {
    fd.append(key, value);
  }
};

/**
 * Submits a truckmitr.com admin form (store/update/delete) as multipart, like the Blade forms do.
 * PUT/PATCH/DELETE are sent as POST + _method, as Laravel forms do. Resolves to {status, message}.
 */
export async function tmSend(path, values = {}, method = 'post') {
  const fd = new FormData();
  Object.entries(values).forEach(([key, value]) => appendValue(fd, key, value));
  const verb = method.toLowerCase();
  if (verb !== 'post' && verb !== 'get') fd.append('_method', verb.toUpperCase());
  const { data } = verb === 'get' ? await tm.get(path, { params: values }) : await tm.post(path, fd);
  if (data?.status === false) {
    const error = new Error(data.message || 'Request failed');
    error.errors = data.errors;
    throw error;
  }
  return data;
}

/** Readable message for a failed request, plus field errors for forms. */
export function tmError(error) {
  const body = error?.response?.data;
  const errors = error?.errors || body?.errors || null;
  const first = errors && Object.values(errors).flat()[0];
  return {
    message: first || body?.message || error?.message || 'Something went wrong',
    errors: errors || {},
  };
}

/** Downloads an export (Excel/CSV) from the bridge; method 'post' sends params as a form (truckmitr export forms). */
export async function tmDownload(path, params, fallbackName = 'export.xlsx', method = 'get') {
  let response;
  try {
    if (method === 'post') {
      const fd = new FormData();
      Object.entries(params || {}).forEach(([key, value]) => appendValue(fd, key, value));
      response = await tm.post(path, fd, { responseType: 'blob' });
    } else {
      response = await tm.get(path, { params, responseType: 'blob' });
    }
  } catch (error) {
    // Error bodies come back as a Blob too: read the JSON message
    const blob = error?.response?.data;
    if (blob instanceof Blob) {
      try {
        error.response.data = JSON.parse(await blob.text());
      } catch { /* keep the original error */ }
    }
    throw error;
  }
  if ((response.headers['content-type'] || '').includes('application/json')) {
    const body = JSON.parse(await response.data.text());
    throw Object.assign(new Error(body.message || 'Export failed'), { errors: body.errors });
  }
  const disposition = response.headers['content-disposition'] || '';
  const match = disposition.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
  const name = match ? decodeURIComponent(match[1]) : fallbackName;
  const url = URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/**
 * JPEG data URL of a video's frame at 1 second, 320x180 - the "thumbnail" the truckmitr.com banner and
 * popup forms capture in the browser before upload.
 */
export function videoThumbnail(file) {
  return new Promise((resolve) => {
    if (!(file instanceof Blob)) return resolve(undefined);
    const video = document.createElement('video');
    const url = URL.createObjectURL(file);
    video.src = url;
    video.muted = true;
    video.playsInline = true;
    const done = (value) => { URL.revokeObjectURL(url); resolve(value); };
    video.addEventListener('loadeddata', () => { video.currentTime = Math.min(1, video.duration || 1); });
    video.addEventListener('seeked', () => {
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 180;
      canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
      done(canvas.toDataURL('image/jpeg'));
    });
    video.addEventListener('error', () => done(undefined));
  });
}

/** URL of a file truckmitr.com serves from public/ (url('public/...') in Blade). */
export function tmFile(path) {
  if (!path) return '';
  if (/^(https?:)?\/\//.test(path) || path.startsWith('data:')) return path;
  return IMAGE_BASE + String(path).replace(/^\/?(public\/)?/, '');
}
