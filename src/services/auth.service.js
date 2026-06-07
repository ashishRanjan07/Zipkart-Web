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
const resendOtp = (email) =>
  api.post('/admin/auth/resend-otp', { email });

// ── Forgot-password (3-step) ──────────────────────────────────────────────────

// Step 1 — send reset OTP to email
// POST /admin/auth/forgot-password
// body: { email }
// res:  { success, message, data: { sent_to, expires_in_seconds } }
const forgotPassword = (email) =>
  api.post('/admin/auth/forgot-password', { email });

// Step 2 — verify OTP, receive reset_token
// POST /admin/auth/verify-reset-otp
// body: { email, otp }
// res:  { success, message, data: { reset_token, expires_in_seconds } }
const verifyResetOtp = (email, otp) =>
  api.post('/admin/auth/verify-reset-otp', { email, otp });

// Step 3 — set new password using reset_token
// POST /admin/auth/reset-password
// body: { email, reset_token, new_password, confirm_password }
// res:  { success, message, data: {} }
const resetPassword = (email, resetToken, newPassword, confirmPassword) =>
  api.post('/admin/auth/reset-password', {
    email,
    reset_token:      resetToken,
    new_password:     newPassword,
    confirm_password: confirmPassword,
  });

// ─────────────────────────────────────────────────────────────────────────────

// POST /admin/auth/refresh
// body: { refresh_token }
const refresh = (refreshToken) =>
  api.post('/admin/auth/refresh', { refresh_token: refreshToken });

// POST /admin/auth/logout
// body: { refresh_token }
const logout = (refreshToken) =>
  api.post('/admin/auth/logout', { refresh_token: refreshToken });

// GET /admin/auth/me
const me = () => api.get('/admin/auth/me');

const authService = {
  login, verifyOtp, resendOtp,
  forgotPassword, verifyResetOtp, resetPassword,
  refresh, logout, me,
};
export default authService;
