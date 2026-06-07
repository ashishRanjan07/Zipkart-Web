import api from '../lib/apiClient';

// GET /admin/notifications/campaigns
// params: status, channel, date_from, date_to, search, page, limit
const listCampaigns = (params) => api.get('/admin/notifications/campaigns', { params });

// GET /admin/notifications/campaigns/:id
const getCampaign = (id) => api.get(`/admin/notifications/campaigns/${id}`);

// POST /admin/notifications/campaigns
// body: NotificationCampaign
const createCampaign = (body) => api.post('/admin/notifications/campaigns', body);

// PUT /admin/notifications/campaigns/:id
const updateCampaign = (id, body) => api.put(`/admin/notifications/campaigns/${id}`, body);

// POST /admin/notifications/campaigns/:id/send-test
// body: { recipient_admin_ids }
const sendTest = (id, body) =>
  api.post(`/admin/notifications/campaigns/${id}/send-test`, body);

// POST /admin/notifications/campaigns/:id/send
const send = (id) => api.post(`/admin/notifications/campaigns/${id}/send`, {});

// PATCH /admin/notifications/campaigns/:id/cancel
const cancelCampaign = (id) => api.patch(`/admin/notifications/campaigns/${id}/cancel`, {});

// GET /admin/notifications/campaigns/:id/delivery-logs
// params: status, channel, page, limit
const deliveryLogs = (id, params) =>
  api.get(`/admin/notifications/campaigns/${id}/delivery-logs`, { params });

// GET /admin/notifications/templates
// params: channel, page, limit
const listTemplates = (params) => api.get('/admin/notifications/templates', { params });

// POST /admin/notifications/templates
const createTemplate = (body) => api.post('/admin/notifications/templates', body);

// PUT /admin/notifications/templates/:id
const updateTemplate = (id, body) => api.put(`/admin/notifications/templates/${id}`, body);

// GET /admin/notifications/channel-health
const channelHealth = () => api.get('/admin/notifications/channel-health');

const notificationsService = {
  listCampaigns, getCampaign, createCampaign, updateCampaign,
  sendTest, send, cancelCampaign, deliveryLogs,
  listTemplates, createTemplate, updateTemplate, channelHealth,
};
export default notificationsService;
