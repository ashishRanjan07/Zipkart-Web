import api from '../lib/apiClient';

// GET /admin/coupons
// params: type, status, search, valid_on, page, limit
const list = (params) => api.get('/admin/coupons', { params });

// GET /admin/coupons/:id
const getById = (id) => api.get(`/admin/coupons/${id}`);

// POST /admin/coupons
// body: Coupon
const create = (body) => api.post('/admin/coupons', body);

// PUT /admin/coupons/:id
const update = (id, body) => api.put(`/admin/coupons/${id}`, body);

// PATCH /admin/coupons/:id/toggle
// body: { is_active }
const toggle = (id, isActive) => api.patch(`/admin/coupons/${id}/toggle`, { is_active: isActive });

// GET /admin/coupons/:id/usage-logs
// params: page, limit
const usageLogs = (id, params) => api.get(`/admin/coupons/${id}/usage-logs`, { params });

// GET /admin/coupons/:id/analytics
const analytics = (id) => api.get(`/admin/coupons/${id}/analytics`);

// POST /admin/coupons/validate
// body: { code, user_id, order_value, dark_store_id }
// res:  { valid, discount_amount, reason }
const validate = (body) => api.post('/admin/coupons/validate', body);

const couponsService = { list, getById, create, update, toggle, usageLogs, analytics, validate };
export default couponsService;
