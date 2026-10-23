import React from 'react';
import { Image, Smartphone, Sparkles } from 'lucide-react';
import TmCrudPage from '../CrudPage';
import { videoThumbnail } from '../api';
import { TmBadge, TmImage, fmtDate } from '../ui';

const cap = (s) => (s ? String(s).replace(/^./, (c) => c.toUpperCase()) : '—');
// App screens a banner / popup can open (truckmitr.com create forms)
const REDIRECTS = [
  ['home', 'Home'], ['profile', 'Profile'], ['dashboard', 'Dashboard'], ['search', 'Search'], ['contactus', 'Contact Us'],
  ['referral', 'Referral'], ['appliedjobs', 'Applied Jobs'], ['availablejobs', 'Available Jobs'], ['suitsjobs', 'Suits Jobs'],
  ['addjob', 'Add Job'], ['viewjobs', 'View Jobs'], ['transporterappliedjobs', 'Transporter Applied Jobs'], ['adddriver', 'Add Driver'],
].map(([value, label]) => ({ value, label }));
const STATUS = [{ value: '1', label: 'Active' }, { value: '0', label: 'Inactive' }];

const media = (row) =>
  row.media_type === 'video'
    ? <TmImage src={row.thumbnail_path || 'images/default-video-thumb.jpg'} />
    : <TmImage src={row.media_path} />;

// The media type decides the thumbnail: videos send a frame captured in the browser, like truckmitr.com
const withThumbnail = async (values) => ({
  ...values,
  thumbnail: values.media_type === 'video' && values.media instanceof Blob ? await videoThumbnail(values.media) : undefined,
});

// truckmitr.com: Admin › Banners (BannerController)
export function Banners() {
  const config = {
    title: 'Banner Management',
    singular: 'Banner',
    listTitle: 'Banners',
    icon: Image,
    crumbs: [{ label: 'Banners' }],
    list: {
      path: '/admin/banners',
      key: 'banners',
      minWidth: 1100,
      search: (row, q) => `${row.title} ${row.description} ${row.user_type}`.toLowerCase().includes(q),
      columns: () => [
        { key: 'media', label: 'Thumbnail', render: media },
        {
          key: 'title',
          label: 'Title',
          render: (row) => (
            <div className="max-w-xs">
              <p className="font-semibold text-slate-900">{row.title}</p>
              {row.description && <p className="text-[11px] text-slate-500 line-clamp-1">{row.description}</p>}
            </div>
          ),
        },
        { key: 'media_type', label: 'Type', render: (row) => <TmBadge tone={row.media_type === 'image' ? 'blue' : 'amber'}>{cap(row.media_type)}</TmBadge> },
        { key: 'user_type', label: 'User Type', render: (row) => cap(row.user_type) },
        { key: 'created_at', label: 'Created At', render: (row) => fmtDate(row.created_at, true) },
        { key: 'updated_at', label: 'Updated At', render: (row) => fmtDate(row.updated_at, true) },
      ],
    },
    toggle: { path: (row) => `/admin/banners/${row.id}/toggle-status`, isOn: (row) => Boolean(Number(row.status)) },
    form: {
      createLabel: 'Create New Banner',
      defaults: { status: '1' },
      fields: (row) => [
        { name: 'title', label: 'Title', required: true, span: 2 },
        { name: 'description', label: 'Description', type: 'textarea', rows: 3 },
        { name: 'redirect_link', label: 'Redirect Page', type: 'select', placeholder: '-- Select Redirect Page --', options: REDIRECTS },
        { name: 'media_type', label: 'Media Type', type: 'select', required: true, placeholder: 'Select Media Type', options: [{ value: 'image', label: 'Image' }, { value: 'video', label: 'Video' }] },
        { name: 'user_type', label: 'User Type', type: 'select', required: true, placeholder: 'Select User Type', options: [{ value: 'transporter', label: 'Transporter' }, { value: 'driver', label: 'Driver' }, { value: 'both', label: 'Both' }] },
        { name: 'status', label: 'Status', type: 'select', required: true, options: STATUS },
        {
          name: 'media', label: 'Media', type: 'file', accept: 'image/*,video/*', required: !row, span: 2, current: row?.media_type === 'image' ? row.media_path : row?.thumbnail_path,
          help: 'Images: 1252 × 724 px, under 2 MB. Videos: under 50 MB.',
        },
      ],
      toValues: (row) => ({ title: row.title, description: row.description, redirect_link: row.redirect_link, media_type: row.media_type, user_type: row.user_type, status: String(Number(row.status)) }),
      prepare: withThumbnail,
      create: { path: '/admin/banners' },
      update: { path: (row) => `/admin/banners/${row.id}`, method: 'put' },
    },
    remove: { path: (row) => `/admin/banners/${row.id}`, label: (row) => `Delete the banner "${row.title}"?` },
  };
  return <TmCrudPage config={config} />;
}

const POPUP_USERS = [
  ['driver', 'Driver'], ['transporter', 'Transporter'], ['foreman', 'Foreman'], ['association', 'Association'], ['both', 'Driver & Transporter'], ['all', 'All Users'],
].map(([value, label]) => ({ value, label }));

// truckmitr.com: Admin › Mobile Popups (MobilePopupController) - one active popup per audience
export function MobilePopups() {
  const config = {
    title: 'Mobile Popup Management',
    singular: 'Mobile Popup',
    listTitle: 'Mobile Popups',
    icon: Smartphone,
    crumbs: [{ label: 'Mobile Popups' }],
    list: {
      path: '/admin/mobile-popups',
      key: 'popups',
      minWidth: 1000,
      columns: () => [
        { key: 'media', label: 'Preview', render: (row) => <TmImage src={row.media_type === 'video' ? row.thumbnail_path : row.media_path} /> },
        { key: 'title', label: 'Title', render: (row) => <span className="font-semibold text-slate-900">{row.title}</span> },
        { key: 'media_type', label: 'Type', render: (row) => <TmBadge tone="blue">{String(row.media_type || '').toUpperCase()}</TmBadge> },
        { key: 'user_type', label: 'User Type', render: (row) => POPUP_USERS.find((u) => u.value === row.user_type)?.label || cap(row.user_type) },
        { key: 'status', label: 'Status', render: (row) => (Number(row.status) ? <TmBadge tone="green">Active</TmBadge> : <TmBadge tone="red">Inactive</TmBadge>) },
        { key: 'created_at', label: 'Created', render: (row) => fmtDate(row.created_at) },
        { key: 'updated_at', label: 'Updated', render: (row) => fmtDate(row.updated_at) },
      ],
    },
    form: {
      createLabel: 'Create Mobile Popup',
      defaults: { status: '1' },
      fields: (row) => [
        { name: 'title', label: 'Title', required: true, span: 2 },
        { name: 'description', label: 'Description', type: 'textarea', rows: 3 },
        { name: 'redirect_link', label: 'Redirect Page', type: 'select', placeholder: '-- Select Redirect Page --', options: REDIRECTS },
        { name: 'media_type', label: 'Media Type', type: 'select', required: true, placeholder: 'Select Media Type', options: [{ value: 'image', label: 'Image' }, { value: 'gif', label: 'GIF' }, { value: 'video', label: 'Video' }] },
        { name: 'user_type', label: 'User Type', type: 'select', required: true, placeholder: 'Select User Type', options: POPUP_USERS },
        { name: 'status', label: 'Status', type: 'select', options: STATUS, help: 'Activating a popup deactivates the other active popups for the same users.' },
        { name: 'media', label: 'Media', type: 'file', accept: 'image/*,video/*', required: !row, span: 2, current: row?.media_type === 'video' ? row?.thumbnail_path : row?.media_path },
      ],
      toValues: (row) => ({ title: row.title, description: row.description, redirect_link: row.redirect_link, media_type: row.media_type, user_type: row.user_type, status: String(Number(row.status)) }),
      prepare: withThumbnail,
      create: { path: '/admin/mobile-popups' },
      update: { path: (row) => `/admin/mobile-popups/${row.id}`, method: 'put' },
    },
    remove: { path: (row) => `/admin/mobile-popups/${row.id}`, label: (row) => `Delete the popup "${row.title}"?` },
  };
  return <TmCrudPage config={config} />;
}

const ROLES = ['driver', 'transporter', 'foreman', 'dhaba', 'puncture', 'association'];
const rolesOf = (row) => {
  if (Array.isArray(row.target_roles)) return row.target_roles;
  try { return JSON.parse(row.target_roles || '[]') || []; } catch { return []; }
};

// truckmitr.com: Admin › Popup Banners (PopupBannerController) - guide images in English / Hindi / Hinglish
export function PopupBanners() {
  const config = {
    title: 'Popup Banners Management',
    singular: 'Popup Banner',
    listTitle: 'Popup Banners',
    icon: Sparkles,
    crumbs: [{ label: 'Popup Banners' }],
    list: {
      path: '/admin/popup-banners',
      key: 'guides',
      columns: () => [
        { key: 'id', label: 'ID' },
        { key: 'title', label: 'Title', render: (row) => <span className="font-semibold text-slate-900">{row.title}</span> },
        { key: 'target_roles', label: 'Target Roles', render: (row) => rolesOf(row).map(cap).join(', ') || 'All' },
        { key: 'is_active', label: 'Status', render: (row) => (row.is_active ? <TmBadge tone="green">Active</TmBadge> : <TmBadge>Inactive</TmBadge>) },
        {
          key: 'images',
          label: 'Images (EN/HI/HN)',
          render: (row) => (
            <div className="flex gap-1">
              {row.image_en && <TmBadge tone="blue">EN</TmBadge>}
              {row.image_hi && <TmBadge tone="blue">HI</TmBadge>}
              {row.image_hn && <TmBadge tone="blue">HN</TmBadge>}
            </div>
          ),
        },
      ],
    },
    form: {
      createLabel: 'Add Popup Banner',
      defaults: { is_active: true, target_roles: [] },
      fields: [
        { name: 'title', label: 'Title', required: true, span: 2 },
        { name: 'target_roles', label: 'Target Roles', type: 'checkboxes', options: ROLES.map((r) => ({ value: r, label: cap(r) })), span: 2 },
        { name: 'image_en', label: 'Image (English)', type: 'file', accept: 'image/*' },
        { name: 'image_hi', label: 'Image (Hindi)', type: 'file', accept: 'image/*' },
        { name: 'image_hn', label: 'Image (Hinglish)', type: 'file', accept: 'image/*' },
        { name: 'is_active', label: 'Active', type: 'checkbox', checkLabel: 'Active' },
      ],
      toValues: (row) => ({ title: row.title, target_roles: rolesOf(row), is_active: Boolean(row.is_active) }),
      // The controller treats any is_active value as "on": leave it out to save as inactive
      prepare: ({ title, target_roles, image_en, image_hi, image_hn, is_active }) => ({
        title, target_roles, image_en, image_hi, image_hn, ...(is_active ? { is_active: 1 } : {}),
      }),
      create: { path: '/admin/popup-banners' },
      update: { path: (row) => `/admin/popup-banners/${row.id}` },
    },
    remove: { path: (row) => `/admin/popup-banners/${row.id}/delete`, method: 'get', label: (row) => `Delete the popup banner "${row.title}"?` },
  };
  return <TmCrudPage config={config} />;
}
