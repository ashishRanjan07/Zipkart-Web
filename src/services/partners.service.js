import api from '../lib/apiClient';

// GET /admin/partners
// params: status, store_id, onboarding_status, kyc_status, search, page, limit
const list = (params) => api.get('/admin/partners', { params });

// GET /admin/partners/:id
const getById = (id) => api.get(`/admin/partners/${id}`);

// PATCH /admin/partners/:id/status
// body: { status, reason }
const updateStatus = (id, body) => api.patch(`/admin/partners/${id}/status`, body);

// GET /admin/partners/:id/earnings
// params: date_from, date_to, page, limit
const earnings = (id, params) => api.get(`/admin/partners/${id}/earnings`, { params });

// GET /admin/partners/:id/kyc-documents
const kycDocuments = (id) => api.get(`/admin/partners/${id}/kyc-documents`);

// PATCH /admin/partners/:id/kyc-documents/:docId
// body: { status (approved|rejected), rejection_reason }
const updateKycDocument = (id, docId, body) =>
  api.patch(`/admin/partners/${id}/kyc-documents/${docId}`, body);

// GET /admin/partners/:id/performance
// params: date_from, date_to
const performance = (id, params) => api.get(`/admin/partners/${id}/performance`, { params });

// POST /admin/partners/:id/penalties
// body: { reason, penalty_amount_inr, description }
const addPenalty = (id, body) => api.post(`/admin/partners/${id}/penalties`, body);

// POST /admin/partners/:id/incentives
// body: { incentive_type, amount_inr, valid_from, valid_to, description }
const addIncentive = (id, body) => api.post(`/admin/partners/${id}/incentives`, body);

// GET /admin/partners/live
// params: store_id, status
// res: array of partners with current lat/lng for map view
const live = (params) => api.get('/admin/partners/live', { params });

const partnersService = {
  list, getById, updateStatus, earnings, kycDocuments,
  updateKycDocument, performance, addPenalty, addIncentive, live,
};
export default partnersService;
