import api from '../lib/apiClient';

// GET /admin/orders
// params: status, store_id, partner_id, user_id, date_from, date_to,
//         payment_method, sla_breached, search, page, limit, sort_by, sort_dir
// res:    { data: Order[], meta: { page, limit, total, total_pages } }
const list = (params) => api.get('/admin/orders', { params });

// GET /admin/orders/:id
// res: { data: OrderDetail }
const getById = (id) => api.get(`/admin/orders/${id}`);

// PATCH /admin/orders/:id/cancel
// body: { reason, notes }
const cancel = (id, body) => api.patch(`/admin/orders/${id}/cancel`, body);

// PATCH /admin/orders/:id/status
// body: { status }
const updateStatus = (id, body) => api.patch(`/admin/orders/${id}/status`, body);

// POST /admin/orders/:id/reassign-partner
// body: { partner_id }
const reassignPartner = (id, partnerId) =>
  api.post(`/admin/orders/${id}/reassign-partner`, { partner_id: partnerId });

// GET /admin/orders/summary
// params: date, store_id, city
// res:    { total_orders, gmv, avg_delivery_minutes, sla_breach_count, ... }
const summary = (params) => api.get('/admin/orders/summary', { params });

// GET /admin/orders/:id/timeline
// res: { data: OrderStatusHistory[] }
const timeline = (id) => api.get(`/admin/orders/${id}/timeline`);

const ordersService = { list, getById, cancel, updateStatus, reassignPartner, summary, timeline };
export default ordersService;
