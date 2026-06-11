import api from '../lib/apiClient';

// Stats
const stats              = ()             => api.get('/admin/catalog/stats');

// Categories
const categoryTree       = ()             => api.get('/admin/catalog/categories/tree');
const listCategories     = (params)       => api.get('/admin/catalog/categories', { params });
const getCategory        = (id)           => api.get(`/admin/catalog/categories/${id}`);
const createCategory     = (body)         => api.post('/admin/catalog/categories', body);
const updateCategory     = (id, body)     => api.patch(`/admin/catalog/categories/${id}`, body);
const deleteCategory     = (id)           => api.delete(`/admin/catalog/categories/${id}`);
const reorderCategories  = (body)         => api.patch('/admin/catalog/categories/reorder', body);

// Brands
const listBrands         = (params)       => api.get('/admin/catalog/brands', { params });
const getBrand           = (id)           => api.get(`/admin/catalog/brands/${id}`);
const createBrand        = (body)         => api.post('/admin/catalog/brands', body);
const updateBrand        = (id, body)     => api.patch(`/admin/catalog/brands/${id}`, body);
const deleteBrand        = (id)           => api.delete(`/admin/catalog/brands/${id}`);

// Products
const listProducts       = (params)       => api.get('/admin/catalog/products', { params });
const getProduct         = (id)           => api.get(`/admin/catalog/products/${id}`);
const createProduct      = (body)         => api.post('/admin/catalog/products', body);
const updateProduct      = (id, body)     => api.patch(`/admin/catalog/products/${id}`, body);
const deleteProduct      = (id, body)     => api.delete(`/admin/catalog/products/${id}`, { body });
const updateProductStatus= (id, body)     => api.patch(`/admin/catalog/products/${id}/status`, body);
const updatePricing      = (id, body)     => api.patch(`/admin/catalog/products/${id}/pricing`, body);
const getPricingHistory  = (id)           => api.get(`/admin/catalog/products/${id}/pricing-history`);
const submitForApproval  = (id)           => api.post(`/admin/catalog/products/${id}/submit-approval`, {});

// Approvals
const listApprovals      = (params)       => api.get('/admin/catalog/approvals', { params });
const getApproval        = (id)           => api.get(`/admin/catalog/approvals/${id}`);
const reviewApproval     = (id, body)     => api.patch(`/admin/catalog/approvals/${id}`, body);

// Variants
const listVariants       = (id)           => api.get(`/admin/catalog/products/${id}/variants`);
const addVariant         = (id, body)     => api.post(`/admin/catalog/products/${id}/variants`, body);
const updateVariant      = (id, vId, b)   => api.patch(`/admin/catalog/products/${id}/variants/${vId}`, b);
const deleteVariant      = (id, vId)      => api.delete(`/admin/catalog/products/${id}/variants/${vId}`);

// Media
const listMedia          = (id)           => api.get(`/admin/catalog/products/${id}/media`);
const addMedia           = (id, body)     => api.post(`/admin/catalog/products/${id}/media`, body);
const updateMedia        = (id, mId, b)   => api.patch(`/admin/catalog/products/${id}/media/${mId}`, b);
const deleteMedia        = (id, mId)      => api.delete(`/admin/catalog/products/${id}/media/${mId}`);

// Attributes & Tags
const updateAttributes   = (id, body)     => api.put(`/admin/catalog/products/${id}/attributes`, body);
const updateTags         = (id, body)     => api.put(`/admin/catalog/products/${id}/tags`, body);

// Bulk
const bulkStatus         = (body)         => api.post('/admin/catalog/products/bulk/status', body);
const bulkPrice          = (body)         => api.post('/admin/catalog/products/bulk/price', body);
const bulkCategory       = (body)         => api.post('/admin/catalog/products/bulk/category', body);

const catalogService = {
  stats,
  categoryTree, listCategories, getCategory, createCategory, updateCategory, deleteCategory, reorderCategories,
  listBrands, getBrand, createBrand, updateBrand, deleteBrand,
  listProducts, getProduct, createProduct, updateProduct, deleteProduct,
  updateProductStatus, updatePricing, getPricingHistory, submitForApproval,
  listApprovals, getApproval, reviewApproval,
  listVariants, addVariant, updateVariant, deleteVariant,
  listMedia, addMedia, updateMedia, deleteMedia,
  updateAttributes, updateTags,
  bulkStatus, bulkPrice, bulkCategory,
};
export default catalogService;
