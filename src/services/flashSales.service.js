import api from '../lib/apiClient';

// GET /admin/flash-sales
// params: status (scheduled|active|ended), store_id, date_from, date_to, page, limit
const list = (params) => api.get('/admin/flash-sales', { params });

// GET /admin/flash-sales/:id
const getById = (id) => api.get(`/admin/flash-sales/${id}`);

// POST /admin/flash-sales
// body: FlashSale (without products)
const create = (body) => api.post('/admin/flash-sales', body);

// PUT /admin/flash-sales/:id
const update = (id, body) => api.put(`/admin/flash-sales/${id}`, body);

// PATCH /admin/flash-sales/:id/approve
// body: { notes }
const approve = (id, notes) => api.patch(`/admin/flash-sales/${id}/approve`, { notes });

// PATCH /admin/flash-sales/:id/cancel
// body: { reason }
const cancel = (id, reason) => api.patch(`/admin/flash-sales/${id}/cancel`, { reason });

// GET /admin/flash-sales/:id/products
const products = (id) => api.get(`/admin/flash-sales/${id}/products`);

// POST /admin/flash-sales/:id/products
// body: FlashSaleProduct[]
const addProducts = (id, body) => api.post(`/admin/flash-sales/${id}/products`, body);

// DELETE /admin/flash-sales/:id/products/:productId
const removeProduct = (id, productId) =>
  api.delete(`/admin/flash-sales/${id}/products/${productId}`);

// GET /admin/flash-sales/:id/metrics
const metrics = (id) => api.get(`/admin/flash-sales/${id}/metrics`);

const flashSalesService = {
  list, getById, create, update, approve, cancel,
  products, addProducts, removeProduct, metrics,
};
export default flashSalesService;
