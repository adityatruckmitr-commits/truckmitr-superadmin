import React, { useCallback, useRef, useState } from 'react';
import { BookOpen, Eye, EyeOff, Film, HeartPulse, Layers, ListTree, PlayCircle } from 'lucide-react';
import TmCrudPage from '../CrudPage';
import { tm, tmFile, tmSend, tmError } from '../api';
import { TmBadge, TmIconButton, TmImage, TmModal, fmtDate, fmtNum, notify } from '../ui';

const mediaUrl = (path) => (path && /^https?:/.test(path) ? path : tmFile(path));

function useVideoPlayer() {
  const [src, setSrc] = useState(null);
  const player = (
    <TmModal open={Boolean(src)} title="Video Player" onClose={() => setSrc(null)} size="lg">
      {src && <video src={src} controls autoPlay className="w-full rounded-lg bg-black max-h-[70vh]" />}
    </TmModal>
  );
  const play = (path) => (path ? <TmIconButton icon={PlayCircle} title="Play" tone="blue" onClick={() => setSrc(mediaUrl(path))} /> : '—');
  return [player, play];
}

// Topics of a module for the Module / Topic dropdowns (GET /get-topics?module_id=, returns {id: name})
function useModuleTopics() {
  const [topics, setTopics] = useState({});
  const asked = useRef({});
  const load = useCallback((moduleId) => {
    if (!moduleId || asked.current[moduleId]) return;
    asked.current[moduleId] = true;
    tm.get('/get-topics', { params: { module_id: moduleId } })
      .then(({ data }) => setTopics((prev) => ({ ...prev, [moduleId]: Object.entries(data || {}).map(([value, label]) => ({ value, label })) })))
      .catch((err) => notify.error(tmError(err).message));
  }, []);
  return [topics, load];
}

// truckmitr.com: Admin › Video › Module (AdminController@module)
export function VideoModules() {
  const config = {
    title: 'Video Modules',
    singular: 'Module',
    listTitle: 'Module List',
    icon: Layers,
    crumbs: [{ label: 'Video' }, { label: 'Module' }],
    list: {
      path: '/admin/module',
      key: 'module',
      columns: () => [{ key: 'name', label: 'Module Name', render: (row) => <span className="font-semibold text-slate-900">{row.name}</span> }],
    },
    form: {
      createLabel: 'Add Module',
      fields: [{ name: 'name', label: 'Module Name', required: true, span: 2 }],
      prepare: ({ name }) => ({ name }),
      create: { path: '/admin/create_module' },
    },
  };
  return <TmCrudPage config={config} />;
}

// truckmitr.com: Admin › Video › Module Topic (AdminController@module_topic)
export function VideoTopics() {
  const config = {
    title: 'Topics',
    singular: 'Topic',
    listTitle: 'Topic List',
    icon: ListTree,
    crumbs: [{ label: 'Video' }, { label: 'Module Topic' }],
    list: {
      path: '/admin/module-topic',
      key: 'Topic',
      rowKey: 'video_topic_id',
      search: (row, q) => `${row.name} ${row.topic_name}`.toLowerCase().includes(q),
      columns: () => [
        { key: 'name', label: 'Module Name' },
        { key: 'topic_name', label: 'Topic Name', render: (row) => <span className="font-semibold text-slate-900">{row.topic_name}</span> },
      ],
    },
    form: {
      createLabel: 'Add Topic',
      fields: (row, data) => [
        { name: 'mu_id', label: 'Module', type: 'select', required: true, options: (data?.Module || []).map((m) => ({ value: m.id, label: m.name })) },
        { name: 'topic_name', label: 'Topic Name', required: true },
      ],
      prepare: ({ mu_id, topic_name }) => ({ mu_id, topic_name }),
      create: { path: '/admin/create_module_topic' },
    },
    remove: {
      path: (row) => `/admin/module_topic/delete/${row.video_topic_id}`,
      method: 'get',
      label: (row) => `Delete the topic "${row.topic_name}"?`,
    },
  };
  return <TmCrudPage config={config} />;
}

// truckmitr.com: Admin › Video › Video (AdminController@video, create_video, update_video)
export function TrainingVideos() {
  const [player, play] = useVideoPlayer();
  const [topics, loadTopics] = useModuleTopics();
  const config = {
    title: 'Videos',
    singular: 'Video',
    listTitle: 'Video List',
    icon: Film,
    crumbs: [{ label: 'Video' }, { label: 'Video' }],
    list: {
      path: '/admin/video',
      key: 'video',
      search: (row, q) => `${row.video_title_name} ${row.name} ${row.topic_name}`.toLowerCase().includes(q),
      minWidth: 980,
      columns: () => [
        { key: 'video_title_name', label: 'Video Title', render: (row) => <span className="font-semibold text-slate-900 line-clamp-2 max-w-sm">{row.video_title_name}</span> },
        { key: 'name', label: 'Module Name' },
        { key: 'topic_name', label: 'Topic Name' },
        { key: 'created_at', label: 'Upload Date', render: (row) => fmtDate(row.created_at || row.Created_at, true) },
        { key: 'thumb', label: 'Thumbnail', render: (row) => (row.video ? <TmImage src={row.video.replace(/\.\w+$/, '.png')} /> : '—') },
        { key: 'video', label: 'Video', render: (row) => play(row.video) },
      ],
    },
    form: {
      createLabel: 'Add Video',
      onChange: (values) => loadTopics(values.module),
      fields: (row, data, formData, values) => [
        { name: 'module', label: 'Module', type: 'select', required: true, placeholder: 'Select Module', options: (data?.modules || []).map((m) => ({ value: m.id, label: m.name })) },
        { name: 'topic', label: 'Topic', type: 'select', required: true, placeholder: 'Select Topic', options: topics[values?.module] || [] },
        { name: 'video_title_name', label: 'Video Title', required: true, span: 2 },
        { name: 'video', label: 'Video (mp4, mov, avi, flv, webm, mkv)', type: 'file', accept: 'video/*', required: !row, span: 2, help: row ? 'Leave empty to keep the current video.' : '' },
      ],
      load: (row) => (row ? `/admin/video/edit/${row.id}` : null),
      toValuesFromLoad: (loaded, row) => ({ ...row, module: loaded.video?.module ?? '', topic: loaded.video?.topic ?? '', video: undefined }),
      toValues: (row) => ({ ...row, video: undefined }),
      prepare: ({ module, topic, video_title_name, video }) => ({ module, topic, video_title_name, video }),
      create: { path: '/admin/create_video' },
      update: { path: (row) => `/admin/video/update/${row.id}`, method: 'put' },
    },
    remove: {
      path: (row) => `/admin/video/delete/${row.id}`,
      method: 'get',
      label: (row) => `Delete the video "${row.video_title_name}"?`,
    },
  };
  return (
    <>
      <TmCrudPage config={config} />
      {player}
    </>
  );
}

// truckmitr.com: Admin › Video › Health Hygiene (AdminController@health_hygiene)
export function HealthHygiene() {
  const [player, play] = useVideoPlayer();
  const [topics, loadTopics] = useModuleTopics();
  const config = {
    title: 'Health & Hygiene Videos',
    singular: 'Health & Hygiene Video',
    listTitle: 'Health & Hygiene Video List',
    icon: HeartPulse,
    crumbs: [{ label: 'Video' }, { label: 'Health Hygiene' }],
    list: {
      path: '/admin/health-hygiene',
      key: 'HealthHygine',
      search: (row, q) => `${row.name} ${row.topic_name} ${row.video_topic_name}`.toLowerCase().includes(q),
      columns: () => [
        { key: 'name', label: 'Module Name' },
        { key: 'topic_name', label: 'Topic Name' },
        { key: 'video_topic_name', label: 'Video Topic Name', render: (row) => <span className="font-semibold text-slate-900">{row.video_topic_name}</span> },
        { key: 'video', label: 'Video', render: (row) => play(row.video) },
      ],
    },
    form: {
      createLabel: 'Add Health & Hygiene',
      onChange: (values) => loadTopics(values.module),
      fields: (row, data, formData, values) => [
        { name: 'module', label: 'Module', type: 'select', placeholder: 'Select Module', options: (data?.modules || []).map((m) => ({ value: m.id, label: m.name })) },
        { name: 'topic', label: 'Topic', type: 'select', placeholder: 'Select Topic', options: topics[values?.module] || [] },
        { name: 'video_topic_name', label: 'Video Topic Name', required: true, span: 2 },
        { name: 'video', label: 'Video (mp4, mov, avi, flv)', type: 'file', accept: 'video/*', required: true, span: 2 },
      ],
      prepare: ({ module, topic, video_topic_name, video }) => ({ module, topic, video_topic_name, video }),
      create: { path: '/admin/create_health_hygiene' },
    },
    remove: {
      path: (row) => `/admin/health_hygiene/delete/${row.id}`,
      method: 'get',
      label: (row) => `Delete "${row.video_topic_name}"?`,
    },
  };
  return (
    <>
      <TmCrudPage config={config} />
      {player}
    </>
  );
}

// truckmitr.com: Admin › Video › Driver Welfare (Admin\DriverWelfareController)
export function DriverWelfare() {
  const [player, play] = useVideoPlayer();
  const [busy, setBusy] = useState(null);
  const [listKey, setListKey] = useState(0);
  const toggle = async (row) => {
    setBusy(row.id);
    try {
      const result = await tmSend(`/admin/driver-welfare/toggle-show/${row.id}`, {}, 'get');
      notify.success(result?.message || 'Visibility updated');
      setListKey((k) => k + 1);
    } catch (err) {
      notify.error(tmError(err).message);
    } finally {
      setBusy(null);
    }
  };
  const config = {
    title: 'Driver Welfare Videos',
    singular: 'Welfare Video',
    listTitle: 'All Welfare Videos',
    icon: BookOpen,
    crumbs: [{ label: 'Video' }, { label: 'Driver Welfare' }],
    list: {
      path: '/admin/driver-welfare',
      key: 'videos',
      minWidth: 1200,
      columns: () => [
        { key: 'thumbnail_path', label: 'Thumbnail', render: (row) => <TmImage src={row.thumbnail_path} /> },
        { key: 'video_title_name', label: 'Title', render: (row) => <span className="font-semibold text-slate-900">{row.video_title_name}</span> },
        { key: 'topic', label: 'Topic', render: (row) => row.topic?.name || '—' },
        { key: 'like_count', label: 'Likes', align: 'center', render: (row) => fmtNum(row.like_count) },
        { key: 'total_views', label: 'Views', align: 'center', render: (row) => fmtNum(row.total_views) },
        { key: 'completed_views', label: 'Completed', align: 'center', render: (row) => fmtNum(row.completed_views) },
        { key: 'avg_watch_percentage', label: 'Avg Watch', align: 'center', render: (row) => (row.avg_watch_percentage != null ? `${row.avg_watch_percentage}%` : '—') },
        {
          key: 'show',
          label: 'Visible',
          render: (row) => (
            <button type="button" disabled={busy === row.id} onClick={() => toggle(row)} title={row.show ? 'Click to Hide' : 'Click to Show'} className="cursor-pointer disabled:opacity-50">
              <TmBadge tone={row.show ? 'green' : 'red'}>{row.show ? <><Eye className="w-3 h-3 mr-1" />Visible</> : <><EyeOff className="w-3 h-3 mr-1" />Hidden</>}</TmBadge>
            </button>
          ),
        },
        { key: 'created_at', label: 'Uploaded', render: (row) => fmtDate(row.created_at) },
        { key: 'video', label: 'Video', render: (row) => play(row.video_path) },
      ],
    },
    form: {
      createLabel: 'Upload New Welfare Video',
      fields: (row, data) => [
        { name: 'topic_id', label: 'Topic', type: 'select', required: true, placeholder: '-- Select Topic --', options: (data?.topics || []).map((t) => ({ value: t.id, label: t.name })) },
        { name: 'video_title_name', label: 'Video Title', required: true },
        { name: 'video', label: 'Video', type: 'file', accept: 'video/*', required: !row, help: row ? 'Leave empty to keep the current video.' : '' },
        { name: 'thumbnail', label: 'Thumbnail', type: 'file', accept: 'image/*', current: row?.thumbnail_path },
      ],
      toValues: (row) => ({ topic_id: row.topic_id, video_title_name: row.video_title_name }),
      prepare: ({ topic_id, video_title_name, video, thumbnail }) => ({ topic_id, video_title_name, video, thumbnail }),
      create: { path: '/admin/driver-welfare/store-video' },
      update: { path: (row) => `/admin/driver-welfare/update-video/${row.id}` },
    },
    remove: {
      path: (row) => `/admin/driver-welfare/delete-video/${row.id}`,
      method: 'get',
      label: (row) => `Delete the welfare video "${row.video_title_name}"?`,
    },
  };
  return (
    <>
      <TmCrudPage key={listKey} config={config} />
      {player}
    </>
  );
}

// truckmitr.com: Admin › Driver Welfare › Topics (Admin\DriverWelfareController@topicsIndex)
export function WelfareTopics() {
  const config = {
    title: 'Welfare Topics',
    singular: 'Topic',
    listTitle: 'All Topics',
    icon: ListTree,
    crumbs: [{ label: 'Video' }, { label: 'Driver Welfare', to: '/driver-welfare' }, { label: 'Topics' }],
    list: {
      path: '/admin/driver-welfare/topics',
      key: 'topics',
      columns: () => [
        { key: 'name', label: 'Topic Name', render: (row) => <span className="font-semibold text-slate-900">{row.name}</span> },
        { key: 'videos_count', label: 'Videos Count', align: 'center', render: (row) => <TmBadge tone="blue">{row.videos_count}</TmBadge> },
        { key: 'created_at', label: 'Created At', render: (row) => fmtDate(row.created_at) },
      ],
    },
    form: {
      createLabel: 'Add New Topic',
      fields: [{ name: 'name', label: 'Topic Name', required: true, span: 2 }],
      prepare: ({ name }) => ({ name }),
      create: { path: '/admin/driver-welfare/topics/store' },
      update: { path: (row) => `/admin/driver-welfare/topics/update/${row.id}` },
    },
    remove: {
      path: (row) => `/admin/driver-welfare/topics/delete/${row.id}`,
      method: 'get',
      label: (row) => `Delete the topic "${row.name}"?`,
    },
  };
  return <TmCrudPage config={config} />;
}
