import api from '../lib/apiClient';

// GET /admin/stores
// params: status, city, search, page, limit
const list = (params) => api.get('/admin/stores', { params });

// GET /admin/stores/:id
const getById = (id) => api.get(`/admin/stores/${id}`);

// POST /admin/stores
// body: DarkStore
const create = (body) => api.post('/admin/stores', body);

// PUT /admin/stores/:id
// body: DarkStore (partial allowed)
const update = (id, body) => api.put(`/admin/stores/${id}`, body);

// PATCH /admin/stores/:id/status
// body: { status, reason }
const updateStatus = (id, body) => api.patch(`/admin/stores/${id}/status`, body);

// GET /admin/stores/:id/capacity
// res: { active_orders, max_orders, utilization_pct, surge_level }
const capacity = (id) => api.get(`/admin/stores/${id}/capacity`);

// PATCH /admin/stores/:id/sla-config
// body: SlaConfig
const updateSlaConfig = (id, body) => api.patch(`/admin/stores/${id}/sla-config`, body);

// GET /admin/stores/:id/documents
const documents = (id) => api.get(`/admin/stores/${id}/documents`);

// PUT /admin/stores/:id/documents/:docId
// body: { document_url, expiry_date }
const updateDocument = (id, docId, body) =>
  api.put(`/admin/stores/${id}/documents/${docId}`, body);

// GET /admin/stores/:id/performance
// params: date_from, date_to
const performance = (id, params) => api.get(`/admin/stores/${id}/performance`, { params });

const storesService = {
  list, getById, create, update, updateStatus,
  capacity, updateSlaConfig, documents, updateDocument, performance,
};
export default storesService;
