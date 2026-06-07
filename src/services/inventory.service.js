import api from '../lib/apiClient';

// GET /admin/inventory
// params: store_id, sku, product_id, status (low_stock|out_of_stock|in_stock),
//         category_id, search, page, limit
const list = (params) => api.get('/admin/inventory', { params });

// GET /admin/inventory/:id
const getById = (id) => api.get(`/admin/inventory/${id}`);

// PATCH /admin/inventory/:id/adjust
// body: { quantity_delta, reason, notes, reference_id }
const adjust = (id, body) => api.patch(`/admin/inventory/${id}/adjust`, body);

// GET /admin/inventory/movements
// params: store_id, product_id, movement_type, date_from, date_to, page, limit
const movements = (params) => api.get('/admin/inventory/movements', { params });

// GET /admin/inventory/batches
// params: store_id, product_id, expiring_within_days, qc_status, page, limit
const batches = (params) => api.get('/admin/inventory/batches', { params });

// GET /admin/inventory/purchase-orders
// params: store_id, supplier_id, status, date_from, date_to, page, limit
const purchaseOrders = (params) => api.get('/admin/inventory/purchase-orders', { params });

// POST /admin/inventory/purchase-orders
// body: PurchaseOrder
const createPurchaseOrder = (body) => api.post('/admin/inventory/purchase-orders', body);

// PATCH /admin/inventory/purchase-orders/:id/status
// body: { status }
const updatePurchaseOrderStatus = (id, body) =>
  api.patch(`/admin/inventory/purchase-orders/${id}/status`, body);

// POST /admin/inventory/damage-log
// body: { inventory_id, quantity_damaged, reason, evidence_photo_urls }
const logDamage = (body) => api.post('/admin/inventory/damage-log', body);

const inventoryService = {
  list, getById, adjust, movements, batches,
  purchaseOrders, createPurchaseOrder, updatePurchaseOrderStatus, logDamage,
};
export default inventoryService;
