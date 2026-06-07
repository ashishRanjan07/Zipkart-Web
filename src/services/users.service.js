import api from '../lib/apiClient';

// GET /admin/users
// params: status, tier, segment, search, is_blocked, date_from, date_to,
//         sort_by, sort_dir, page, limit
const list = (params) => api.get('/admin/users', { params });

// GET /admin/users/:id
const getById = (id) => api.get(`/admin/users/${id}`);

// PATCH /admin/users/:id/block
// body: { reason }
const block = (id, reason) => api.patch(`/admin/users/${id}/block`, { reason });

// PATCH /admin/users/:id/unblock
const unblock = (id) => api.patch(`/admin/users/${id}/unblock`, {});

// PATCH /admin/users/:id/wallet/adjust
// body: { amount, type (credit|debit), reason, admin_note }
const adjustWallet = (id, body) => api.patch(`/admin/users/${id}/wallet/adjust`, body);

// GET /admin/users/:id/orders
// params: page, limit
const userOrders = (id, params) => api.get(`/admin/users/${id}/orders`, { params });

// GET /admin/users/:id/wallet-transactions
// params: page, limit
const walletTransactions = (id, params) =>
  api.get(`/admin/users/${id}/wallet-transactions`, { params });

// PATCH /admin/users/:id/cod-block
// body: { reason }
const blockCod = (id, reason) => api.patch(`/admin/users/${id}/cod-block`, { reason });

// PATCH /admin/users/:id/cod-unblock
const unblockCod = (id) => api.patch(`/admin/users/${id}/cod-unblock`, {});

// POST /admin/users/:id/notes
// body: { note }
const addNote = (id, note) => api.post(`/admin/users/${id}/notes`, { note });

const usersService = {
  list, getById, block, unblock, adjustWallet,
  userOrders, walletTransactions, blockCod, unblockCod, addNote,
};
export default usersService;
