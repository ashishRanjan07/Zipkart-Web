import api from '../lib/apiClient';

// GET /admin/app-config/configs
// params: category, environment, is_active, search, page, limit
const listConfigs = (params) => api.get('/admin/app-config/configs', { params });

// PATCH /admin/app-config/configs/:key
// body: { value, change_note }
const updateConfig = (key, body) => api.patch(`/admin/app-config/configs/${encodeURIComponent(key)}`, body);

// GET /admin/app-config/feature-flags
// params: status, platform, search, page, limit
const listFlags = (params) => api.get('/admin/app-config/feature-flags', { params });

// POST /admin/app-config/feature-flags
const createFlag = (body) => api.post('/admin/app-config/feature-flags', body);

// PUT /admin/app-config/feature-flags/:id
const updateFlag = (id, body) => api.put(`/admin/app-config/feature-flags/${id}`, body);

// PATCH /admin/app-config/feature-flags/:id/toggle
// body: { enabled }
const toggleFlag = (id, enabled) =>
  api.patch(`/admin/app-config/feature-flags/${id}/toggle`, { enabled });

// GET /admin/app-config/maintenance-windows
const listMaintenance = (params) => api.get('/admin/app-config/maintenance-windows', { params });

// POST /admin/app-config/maintenance-windows
const createMaintenance = (body) => api.post('/admin/app-config/maintenance-windows', body);

// PATCH /admin/app-config/maintenance-windows/:id/end
const endMaintenance = (id) => api.patch(`/admin/app-config/maintenance-windows/${id}/end`, {});

// GET /admin/app-config/ab-experiments
// params: status, page, limit
const listExperiments = (params) => api.get('/admin/app-config/ab-experiments', { params });

// POST /admin/app-config/ab-experiments
const createExperiment = (body) => api.post('/admin/app-config/ab-experiments', body);

// PATCH /admin/app-config/ab-experiments/:id/status
// body: { status (running|paused|concluded) }
const updateExperimentStatus = (id, body) =>
  api.patch(`/admin/app-config/ab-experiments/${id}/status`, body);

const appConfigService = {
  listConfigs, updateConfig,
  listFlags, createFlag, updateFlag, toggleFlag,
  listMaintenance, createMaintenance, endMaintenance,
  listExperiments, createExperiment, updateExperimentStatus,
};
export default appConfigService;
