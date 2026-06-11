import api from '../lib/apiClient';

const stats               = (params)         => api.get('/admin/partners/stats', { params });
const kycExpiringAlert    = (params)         => api.get('/admin/partners/alerts/kyc-expiring', { params });
const list                = (params)         => api.get('/admin/partners', { params });
const create              = (body)           => api.post('/admin/partners', body);
const getById             = (id)             => api.get(`/admin/partners/${id}`);
const update              = (id, body)       => api.patch(`/admin/partners/${id}`, body);
const deletePartner       = (id, body)       => api.delete(`/admin/partners/${id}`, { body });
const updateStatus        = (id, body)       => api.patch(`/admin/partners/${id}/status`, body);
const updateOnboarding    = (id, body)       => api.patch(`/admin/partners/${id}/onboarding`, body);
const reassignStore       = (id, body)       => api.patch(`/admin/partners/${id}/dark-store`, body);
const updateKyc           = (id, body)       => api.patch(`/admin/partners/${id}/kyc`, body);
const listKycDocs         = (id)             => api.get(`/admin/partners/${id}/kyc-documents`);
const addKycDoc           = (id, body)       => api.post(`/admin/partners/${id}/kyc-documents`, body);
const updateKycDoc        = (id, dId, body)  => api.patch(`/admin/partners/${id}/kyc-documents/${dId}`, body);
const deleteKycDoc        = (id, dId)        => api.delete(`/admin/partners/${id}/kyc-documents/${dId}`);
const updateVehicle       = (id, body)       => api.patch(`/admin/partners/${id}/vehicle`, body);
const updateBankAccount   = (id, body)       => api.patch(`/admin/partners/${id}/bank-account`, body);
const updateCommission    = (id, body)       => api.patch(`/admin/partners/${id}/commission`, body);
const updateBgCheck       = (id, body)       => api.patch(`/admin/partners/${id}/background-check`, body);
const listPenalties       = (id)             => api.get(`/admin/partners/${id}/penalties`);
const addPenalty          = (id, body)       => api.post(`/admin/partners/${id}/penalties`, body);
const waivePenalty        = (id, pId, body)  => api.patch(`/admin/partners/${id}/penalties/${pId}/waive`, body);
const listIncentives      = (id, params)     => api.get(`/admin/partners/${id}/incentives`, { params });
const addIncentive        = (id, body)       => api.post(`/admin/partners/${id}/incentives`, body);
const updateIncentive     = (id, iId, body)  => api.patch(`/admin/partners/${id}/incentives/${iId}`, body);
const deleteIncentive     = (id, iId)        => api.delete(`/admin/partners/${id}/incentives/${iId}`);
const getEarnings         = (id, params)     => api.get(`/admin/partners/${id}/earnings`, { params });
const addEarningRecord    = (id, body)       => api.post(`/admin/partners/${id}/earnings/record`, body);
const triggerPayout       = (id, body)       => api.post(`/admin/partners/${id}/earnings/payout`, body);
const updatePerformance   = (id, body)       => api.patch(`/admin/partners/${id}/performance`, body);

const partnersService = {
  stats, kycExpiringAlert,
  list, create, getById, update, deletePartner,
  updateStatus, updateOnboarding, reassignStore,
  updateKyc, listKycDocs, addKycDoc, updateKycDoc, deleteKycDoc,
  updateVehicle, updateBankAccount, updateCommission, updateBgCheck,
  listPenalties, addPenalty, waivePenalty,
  listIncentives, addIncentive, updateIncentive, deleteIncentive,
  getEarnings, addEarningRecord, triggerPayout,
  updatePerformance,
};
export default partnersService;
