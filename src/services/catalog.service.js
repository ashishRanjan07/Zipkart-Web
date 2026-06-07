import api from '../lib/apiClient';

// ── Products ────────────────────────────────────────────────────────────────
// GET /admin/catalog/products
// params: category_id, brand_id, status, search, page, limit, sort_by, sort_dir
const listProducts = (params) => api.get('/admin/catalog/products', { params });

// GET /admin/catalog/products/:id
const getProduct = (id) => api.get(`/admin/catalog/products/${id}`);

// POST /admin/catalog/products
// body: Product
const createProduct = (body) => api.post('/admin/catalog/products', body);

// PUT /admin/catalog/products/:id
const updateProduct = (id, body) => api.put(`/admin/catalog/products/${id}`, body);

// PATCH /admin/catalog/products/:id/status
// body: { status (active|inactive|pending_review) }
const updateProductStatus = (id, body) =>
  api.patch(`/admin/catalog/products/${id}/status`, body);

// GET /admin/catalog/products/:id/pricing-history
const pricingHistory = (id) => api.get(`/admin/catalog/products/${id}/pricing-history`);

// ── Categories ───────────────────────────────────────────────────────────────
// GET /admin/catalog/categories
// params: parent_id, level, is_active, page, limit
const listCategories = (params) => api.get('/admin/catalog/categories', { params });

// POST /admin/catalog/categories
const createCategory = (body) => api.post('/admin/catalog/categories', body);

// PUT /admin/catalog/categories/:id
const updateCategory = (id, body) => api.put(`/admin/catalog/categories/${id}`, body);

// ── Brands ───────────────────────────────────────────────────────────────────
// GET /admin/catalog/brands
// params: search, is_active, page, limit
const listBrands = (params) => api.get('/admin/catalog/brands', { params });

// POST /admin/catalog/brands
const createBrand = (body) => api.post('/admin/catalog/brands', body);

// ── Approval queue ───────────────────────────────────────────────────────────
// GET /admin/catalog/approvals
// params: status (pending|approved|rejected), page, limit
const listApprovals = (params) => api.get('/admin/catalog/approvals', { params });

// PATCH /admin/catalog/approvals/:id
// body: { status, review_notes }
const updateApproval = (id, body) => api.patch(`/admin/catalog/approvals/${id}`, body);

const catalogService = {
  listProducts, getProduct, createProduct, updateProduct, updateProductStatus, pricingHistory,
  listCategories, createCategory, updateCategory,
  listBrands, createBrand,
  listApprovals, updateApproval,
};
export default catalogService;
