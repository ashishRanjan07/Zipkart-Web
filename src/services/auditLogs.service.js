import api from '../lib/apiClient';

// GET /admin/audit-logs
// params: admin_id, module, action_type, severity, date_from, date_to,
//         resource_type, resource_id, search, page, limit, sort_dir
// res:    { data: AuditLog[], meta: { page, limit, total, total_pages } }
const list = (params) => api.get('/admin/audit-logs', { params });

// GET /admin/audit-logs/:id
const getById = (id) => api.get(`/admin/audit-logs/${id}`);

// GET /admin/audit-logs/export
// params: same as list — returns CSV/Excel download URL
// res:    { download_url, expires_at }
const exportLogs = (params) => api.get('/admin/audit-logs/export', { params });

const auditLogsService = { list, getById, exportLogs };
export default auditLogsService;
