import api from '../lib/apiClient';

// POST /admin/auth/login
// body: { email, password }
// res:  { success, message, data: { sent_to, expires_in_seconds } }
const login = (email, password) =>
  api.post('/admin/auth/login', { email, password });

// POST /admin/auth/verify-otp
// body: { email, otp }
// res:  { success, message, data: { access_token, refresh_token, token_type, expires_in, admin } }
const verifyOtp = (email, otp) =>
  api.post('/admin/auth/verify-otp', { email, otp });

// POST /admin/auth/resend-otp
// body: { email }
// res:  { success, message, data: { sent_to, expires_in_seconds } }
const resendOtp = (email) =>
  api.post('/admin/auth/resend-otp', { email });

// POST /admin/auth/refresh
// body: { refresh_token }
// res:  { success, data: { access_token, expires_in } }
const refresh = (refreshToken) =>
  api.post('/admin/auth/refresh', { refresh_token: refreshToken });

// POST /admin/auth/logout
// body: { refresh_token }
const logout = (refreshToken) =>
  api.post('/admin/auth/logout', { refresh_token: refreshToken });

// POST /admin/auth/forgot-password
// body: { email }
const forgotPassword = (email) =>
  api.post('/admin/auth/forgot-password', { email });

// POST /admin/auth/reset-password
// body: { token, new_password }
const resetPassword = (token, newPassword) =>
  api.post('/admin/auth/reset-password', { token, new_password: newPassword });

// GET /admin/auth/me
// res: { success, data: { admin } }
const me = () => api.get('/admin/auth/me');

const authService = {
  login, verifyOtp, resendOtp, refresh, logout, forgotPassword, resetPassword, me,
};
export default authService;
