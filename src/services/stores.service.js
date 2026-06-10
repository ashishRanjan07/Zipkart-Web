import api from '../lib/apiClient';

const stats               = ()           => api.get('/admin/dark-stores/stats');
const list                = (params)     => api.get('/admin/dark-stores', { params });
const create              = (body)       => api.post('/admin/dark-stores', body);
const getById             = (id)         => api.get(`/admin/dark-stores/${id}`);
const update              = (id, body)   => api.patch(`/admin/dark-stores/${id}`, body);
const deleteStore         = (id, body)   => api.delete(`/admin/dark-stores/${id}`, { body });
const updateStatus        = (id, body)   => api.patch(`/admin/dark-stores/${id}/status`, body);
const emergencyShutdown   = (id, body)   => api.post(`/admin/dark-stores/${id}/emergency-shutdown`, body);
const assignManager       = (id, body)   => api.patch(`/admin/dark-stores/${id}/manager`, body);
const updatePincodes      = (id, body)   => api.patch(`/admin/dark-stores/${id}/pincodes`, body);
const updateZones         = (id, body)   => api.patch(`/admin/dark-stores/${id}/delivery-zones`, body);
const updateSla           = (id, body)   => api.patch(`/admin/dark-stores/${id}/sla`, body);
const updateCapacity      = (id, body)   => api.patch(`/admin/dark-stores/${id}/capacity`, body);
const updateHours         = (id, body)   => api.patch(`/admin/dark-stores/${id}/operating-hours`, body);
const listDocuments       = (id)         => api.get(`/admin/dark-stores/${id}/documents`);
const addDocument         = (id, body)   => api.post(`/admin/dark-stores/${id}/documents`, body);
const updateDocument      = (id, dId, b) => api.patch(`/admin/dark-stores/${id}/documents/${dId}`, b);
const deleteDocument      = (id, dId)    => api.delete(`/admin/dark-stores/${id}/documents/${dId}`);
const expiringDocuments   = (params)     => api.get('/admin/dark-stores/alerts/expiring-documents', { params });
const listEquipment       = (id)         => api.get(`/admin/dark-stores/${id}/equipment`);
const addEquipment        = (id, body)   => api.post(`/admin/dark-stores/${id}/equipment`, body);
const updateEquipment     = (id, eId, b) => api.patch(`/admin/dark-stores/${id}/equipment/${eId}`, b);
const decommission        = (id, eId)    => api.delete(`/admin/dark-stores/${id}/equipment/${eId}`);
const getPerformance      = (id)         => api.get(`/admin/dark-stores/${id}/performance`);

const storesService = {
  stats, list, create, getById, update, deleteStore,
  updateStatus, emergencyShutdown, assignManager,
  updatePincodes, updateZones,
  updateSla, updateCapacity, updateHours,
  listDocuments, addDocument, updateDocument, deleteDocument, expiringDocuments,
  listEquipment, addEquipment, updateEquipment, decommission,
  getPerformance,
};
export default storesService;
