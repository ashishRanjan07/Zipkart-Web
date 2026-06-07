import api from '../lib/apiClient';

// GET /admin/me — full admin profile (more complete than /admin/auth/me)
const getProfile = () => api.get('/admin/me');

// PATCH /admin/users/:id — update editable fields
// body: { first_name, last_name, department, designation }
const updateProfile = (adminId, body) =>
  api.patch(`/admin/users/${adminId}`, body);

// DELETE /admin/users/:id — soft delete (sets is_deleted = true)
const deleteAccount = (adminId) =>
  api.delete(`/admin/users/${adminId}`);

// POST /admin/auth/change-password — logged-in password change (not reset)
// body: { current_password, new_password, confirm_password }
const changePassword = (currentPassword, newPassword, confirmPassword) =>
  api.post('/admin/auth/change-password', {
    current_password: currentPassword,
    new_password:     newPassword,
    confirm_password: confirmPassword,
  });

const profileService = { getProfile, updateProfile, deleteAccount, changePassword };
export default profileService;
