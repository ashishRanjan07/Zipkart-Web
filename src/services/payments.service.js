import api from '../lib/apiClient';

// GET /admin/payments/transactions
// params: status, gateway, method, date_from, date_to, search, page, limit
const listTransactions = (params) => api.get('/admin/payments/transactions', { params });

// GET /admin/payments/transactions/:id
const getTransaction = (id) => api.get(`/admin/payments/transactions/${id}`);

// GET /admin/payments/refunds
// params: status, date_from, date_to, order_id, user_id, page, limit
const listRefunds = (params) => api.get('/admin/payments/refunds', { params });

// POST /admin/payments/refunds
// body: { order_id, amount, reason, refund_mode (original|wallet) }
const createRefund = (body) => api.post('/admin/payments/refunds', body);

// PATCH /admin/payments/refunds/:id/approve
const approveRefund = (id) => api.patch(`/admin/payments/refunds/${id}/approve`, {});

// PATCH /admin/payments/refunds/:id/reject
// body: { reason }
const rejectRefund = (id, reason) =>
  api.patch(`/admin/payments/refunds/${id}/reject`, { reason });

// GET /admin/payments/partner-payouts
// params: partner_id, status, date_from, date_to, page, limit
const listPayouts = (params) => api.get('/admin/payments/partner-payouts', { params });

// POST /admin/payments/partner-payouts/:id/trigger
const triggerPayout = (id) => api.post(`/admin/payments/partner-payouts/${id}/trigger`, {});

// GET /admin/payments/settlements
// params: gateway, date_from, date_to, page, limit
const listSettlements = (params) => api.get('/admin/payments/settlements', { params });

// GET /admin/payments/disputes
// params: status, page, limit
const listDisputes = (params) => api.get('/admin/payments/disputes', { params });

// GET /admin/payments/summary
// params: date_from, date_to
const summary = (params) => api.get('/admin/payments/summary', { params });

const paymentsService = {
  listTransactions, getTransaction,
  listRefunds, createRefund, approveRefund, rejectRefund,
  listPayouts, triggerPayout,
  listSettlements, listDisputes, summary,
};
export default paymentsService;
