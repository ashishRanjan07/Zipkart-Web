import api from '../lib/apiClient';

const stats = () =>
  api.get('/admin/customers/stats');

const list = (params) =>
  api.get('/admin/customers', { params });

const create = (body) =>
  api.post('/admin/customers', body);

const getById = (id) =>
  api.get(`/admin/customers/${id}`);

const update = (id, body) =>
  api.patch(`/admin/customers/${id}`, body);

const updateStatus = (id, body) =>
  api.patch(`/admin/customers/${id}/status`, body);

const updateTier = (id, body) =>
  api.patch(`/admin/customers/${id}/tier`, body);

const updateFraud = (id, body) =>
  api.patch(`/admin/customers/${id}/fraud`, body);

const updateCod = (id, body) =>
  api.patch(`/admin/customers/${id}/cod`, body);

const creditWallet = (id, body) =>
  api.patch(`/admin/customers/${id}/wallet/credit`, body);

const debitWallet = (id, body) =>
  api.patch(`/admin/customers/${id}/wallet/debit`, body);

const blockWallet = (id, body) =>
  api.patch(`/admin/customers/${id}/wallet/block`, body);

const getWalletTransactions = (id, params) =>
  api.get(`/admin/customers/${id}/wallet/transactions`, { params });

const getSessions = (id) =>
  api.get(`/admin/customers/${id}/sessions`);

const revokeAllSessions = (id) =>
  api.post(`/admin/customers/${id}/sessions/revoke-all`);

const deleteCustomer = (id, body) =>
  api.delete(`/admin/customers/${id}`, { body });

const usersService = {
  stats, list, create, getById, update, updateStatus, updateTier, updateFraud,
  updateCod, creditWallet, debitWallet, blockWallet, getWalletTransactions,
  getSessions, revokeAllSessions, deleteCustomer,
};
export default usersService;
