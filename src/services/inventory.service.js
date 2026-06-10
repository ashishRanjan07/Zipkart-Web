import api from '../lib/apiClient';

// GET /admin/inventory/inventory/dashboard?dark_store_id=...
// (double /inventory/ because the router is mounted at /admin/inventory AND the route is defined as /inventory/dashboard)
const dashboard = (params) => api.get('/admin/inventory/inventory/dashboard', { params });

// GET /admin/inventory?dark_store_id=...&page=1&limit=20&status=&category=&search=&low_stock_only=&out_of_stock_only=
const list = (params) => api.get('/admin/inventory', { params });

// POST /admin/inventory
const create = (body) => api.post('/admin/inventory', body);

// GET /admin/inventory/:id
const getById = (id) => api.get(`/admin/inventory/${id}`);

// PATCH /admin/inventory/:id  (config: reorder_point, selling_price, auto_reorder_enabled, location…)
const update = (id, body) => api.patch(`/admin/inventory/${id}`, body);

// PATCH /admin/inventory/:id/status  body: { status, note }
const updateStatus = (id, body) => api.patch(`/admin/inventory/${id}/status`, body);

// POST /admin/inventory/:id/batches  body: { batch_no, lot_number, quantity_received, cost_price_per_unit, mrp, expiry_date, manufactured_date, qc_status, received_by }
const receiveBatch = (id, body) => api.post(`/admin/inventory/${id}/batches`, body);

// GET /admin/inventory/:id/batches
const listBatches = (id, params) => api.get(`/admin/inventory/${id}/batches`, { params });

// POST /admin/inventory/:id/adjust  body: { quantity_change, movement_type, adjustment_reason, notes }
const adjust = (id, body) => api.post(`/admin/inventory/${id}/adjust`, body);

// POST /admin/inventory/:id/write-off  body: { batch_id, quantity, reason, notes }
const writeOff = (id, body) => api.post(`/admin/inventory/${id}/write-off`, body);

// GET /admin/inventory/:id/movements?page=1&limit=20&movement_type=
const movements = (id, params) => api.get(`/admin/inventory/${id}/movements`, { params });

// GET /admin/inventory/alerts/low-stock?dark_store_id=
const lowStockAlerts = (params) => api.get('/admin/inventory/alerts/low-stock', { params });

// GET /admin/inventory/alerts/expiry?dark_store_id=&days=7
const expiryAlerts = (params) => api.get('/admin/inventory/alerts/expiry', { params });

// POST /admin/inventory/damage-log  body: { inventory_id, quantity_damaged, damage_type, damage_reason, write_off_immediately }
const reportDamage = (body) => api.post('/admin/inventory/damage-log', body);

// GET /admin/inventory/inventory/damage-log?dark_store_id=&is_verified=
const listDamageLog = (params) => api.get('/admin/inventory/inventory/damage-log', { params });

// ─── Purchase Orders ───────────────────────────────────────────────────────────

// GET /admin/purchase-orders?dark_store_id=&status=&supplier_id=
const listPOs = (params) => api.get('/admin/purchase-orders', { params });

// POST /admin/purchase-orders
const createPO = (body) => api.post('/admin/purchase-orders', body);

// GET /admin/purchase-orders/:id
const getPO = (id) => api.get(`/admin/purchase-orders/${id}`);

// PATCH /admin/purchase-orders/:id/status  body: { status, notes }
const updatePOStatus = (id, body) => api.patch(`/admin/purchase-orders/${id}/status`, body);

// POST /admin/purchase-orders/:id/receive  body: { received_by, notes, items: [...] }
const receivePO = (id, body) => api.post(`/admin/purchase-orders/${id}/receive`, body);

const inventoryService = {
  dashboard, list, create, getById, update, updateStatus,
  receiveBatch, listBatches, adjust, writeOff, movements,
  lowStockAlerts, expiryAlerts, reportDamage, listDamageLog,
  listPOs, createPO, getPO, updatePOStatus, receivePO,
};
export default inventoryService;
