import api from '../lib/apiClient';

// GET /admin/analytics/dashboard
// params: date_from, date_to, store_id, city
// res:    { gmv, orders, avg_order_value, delivery_time, sla_breach_rate, ... }
const dashboard = (params) => api.get('/admin/analytics/dashboard', { params });

// GET /admin/analytics/orders/trend
// params: date_from, date_to, store_id, granularity (hourly|daily|weekly)
const orderTrend = (params) => api.get('/admin/analytics/orders/trend', { params });

// GET /admin/analytics/orders/funnel
// params: date_from, date_to, store_id
const orderFunnel = (params) => api.get('/admin/analytics/orders/funnel', { params });

// GET /admin/analytics/stores/performance
// params: date_from, date_to, city, sort_by, sort_dir
const storePerformance = (params) =>
  api.get('/admin/analytics/stores/performance', { params });

// GET /admin/analytics/partners/performance
// params: date_from, date_to, store_id, sort_by
const partnerPerformance = (params) =>
  api.get('/admin/analytics/partners/performance', { params });

// GET /admin/analytics/products/top
// params: date_from, date_to, store_id, category_id, metric (revenue|quantity|orders), limit
const topProducts = (params) => api.get('/admin/analytics/products/top', { params });

// GET /admin/analytics/categories/breakdown
// params: date_from, date_to, store_id
const categoryBreakdown = (params) =>
  api.get('/admin/analytics/categories/breakdown', { params });

// GET /admin/analytics/users/cohorts
// params: cohort_period (weekly|monthly), date_from, date_to
const userCohorts = (params) => api.get('/admin/analytics/users/cohorts', { params });

// GET /admin/analytics/payments/methods
// params: date_from, date_to
const paymentMethods = (params) =>
  api.get('/admin/analytics/payments/methods', { params });

// GET /admin/analytics/delivery/sla
// params: date_from, date_to, store_id
const deliverySla = (params) => api.get('/admin/analytics/delivery/sla', { params });

const analyticsService = {
  dashboard, orderTrend, orderFunnel, storePerformance, partnerPerformance,
  topProducts, categoryBreakdown, userCohorts, paymentMethods, deliverySla,
};
export default analyticsService;
