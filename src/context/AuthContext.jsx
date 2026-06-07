import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import authService from '../services/auth.service';
import { tokenStore } from '../lib/apiClient';
import toast from '../lib/toast';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

// ── Mock fallback (only when VITE_USE_MOCK=true) ──────────────────────────────
const MOCK_ADMINS = [
  { id: 'adm1', email: 'admin@zipkart.in', password: 'Admin@123', display_name: 'Vipul Admin', role_name: 'Super Admin', avatar: 'VA' },
  { id: 'adm2', email: 'ops@zipkart.in',   password: 'Ops@1234',  display_name: 'Ops Manager',  role_name: 'Ops Manager',  avatar: 'OM' },
];
const DEMO_OTP        = '123456';
const DEMO_RESET_TOKEN = 'demo_reset_token';
// ─────────────────────────────────────────────────────────────────────────────

function extractErrorMessage(err, fallback) {
  if (!err) return fallback;
  if (err.message === 'Failed to fetch')
    return 'Unable to connect to the server. Please check your internet connection.';
  if (err.status >= 500)
    return 'A server error occurred. Please try again later.';
  return err.message ?? fallback;
}

function assertSuccess(res, fallback) {
  if (res && res.success === false) {
    const err = new Error(res.message ?? fallback);
    err.status = 400;
    throw err;
  }
}

const AuthContext = createContext(null);
const SESSION_KEY = 'zk_admin_session';

function loadSession() {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)); } catch { return null; }
}

export function AuthProvider({ children }) {
  const [session, setSession]           = useState(loadSession);

  // Login flow: { email, sentTo, expiresInSeconds }
  const [pendingUser, setPendingUser]   = useState(null);

  // Reset-password flow:
  //   Phase 1 (after email): { email, sentTo, expiresInSeconds }
  //   Phase 2 (after OTP):   { email, resetToken, resetTokenExpiresInSeconds }
  const [pendingReset, setPendingReset] = useState(null);

  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');

  const clearError = useCallback(() => setError(''), []);

  useEffect(() => {
    const onExpired = () => {
      setSession(null);
      setPendingUser(null);
      setError('');
      toast.error('Your session has expired. Please sign in again.');
    };
    window.addEventListener('zk:session-expired', onExpired);
    return () => window.removeEventListener('zk:session-expired', onExpired);
  }, []);

  // ── Login: Step 1 ─────────────────────────────────────────────────────────
  const initiateLogin = useCallback(async (email, password) => {
    setLoading(true);
    setError('');
    try {
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 800));
        const found = MOCK_ADMINS.find((a) => a.email === email && a.password === password);
        if (!found) throw new Error('Invalid email or password.');
        setPendingUser({ email, sentTo: email.replace(/(.{2}).*(@.*)/, '$1***$2'), expiresInSeconds: 600 });
        return true;
      }
      const res = await authService.login(email, password);
      assertSuccess(res, 'Login failed.');
      setPendingUser({ email, sentTo: res.data?.sent_to ?? email, expiresInSeconds: res.data?.expires_in_seconds ?? 600 });
      return true;
    } catch (err) {
      const msg = extractErrorMessage(err, 'Login failed. Please try again.');
      setError(msg);
      toast.error(msg);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Login: Step 2 ─────────────────────────────────────────────────────────
  const verifyOTP = useCallback(async (otp) => {
    setLoading(true);
    setError('');
    try {
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 600));
        if (otp !== DEMO_OTP) throw new Error('Incorrect OTP. Use 123456 for demo.');
        const found = MOCK_ADMINS.find((a) => a.email === pendingUser?.email);
        const { password: _, ...admin } = found;
        const sessionData = { user: admin, loginAt: new Date().toISOString() };
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
        setSession(sessionData);
        setPendingUser(null);
        toast.success(`Welcome back, ${admin.display_name}!`);
        return true;
      }
      const res = await authService.verifyOtp(pendingUser.email, otp);
      assertSuccess(res, 'OTP verification failed.');
      const { access_token, refresh_token, admin } = res.data;
      tokenStore.setAccess(access_token);
      if (refresh_token) tokenStore.setRefresh(refresh_token);
      const sessionData = { user: admin, loginAt: new Date().toISOString() };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
      setSession(sessionData);
      setPendingUser(null);
      toast.success(`Welcome back, ${admin.display_name ?? 'Admin'}!`);
      return true;
    } catch (err) {
      const msg = extractErrorMessage(err, 'OTP verification failed. Please try again.');
      setError(msg);
      toast.error(msg);
      return false;
    } finally {
      setLoading(false);
    }
  }, [pendingUser]);

  // ── Login: resend OTP ─────────────────────────────────────────────────────
  const resendOtp = useCallback(async () => {
    if (!pendingUser?.email) return false;
    setLoading(true);
    setError('');
    try {
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 600));
        toast.success('OTP resent successfully!');
        return true;
      }
      const res = await authService.resendOtp(pendingUser.email);
      assertSuccess(res, 'Could not resend OTP.');
      if (res.data?.expires_in_seconds)
        setPendingUser((p) => ({ ...p, expiresInSeconds: res.data.expires_in_seconds }));
      toast.success('A new OTP has been sent to your email.');
      return true;
    } catch (err) {
      const msg = extractErrorMessage(err, 'Could not resend OTP. Please go back and try again.');
      setError(msg);
      toast.error(msg);
      return false;
    } finally {
      setLoading(false);
    }
  }, [pendingUser]);

  // ── Reset password: Step 1 — send OTP ────────────────────────────────────
  const requestPasswordReset = useCallback(async (email) => {
    setLoading(true);
    setError('');
    try {
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 900));
        if (!MOCK_ADMINS.some((a) => a.email === email)) throw new Error('No admin account found with that email.');
        setPendingReset({ email, sentTo: email.replace(/(.{2}).*(@.*)/, '$1***$2'), expiresInSeconds: 600 });
        return true;
      }
      const res = await authService.forgotPassword(email);
      assertSuccess(res, 'Request failed.');
      setPendingReset({ email, sentTo: res.data?.sent_to ?? email, expiresInSeconds: res.data?.expires_in_seconds ?? 600 });
      return true;
    } catch (err) {
      const msg = extractErrorMessage(err, 'Request failed. Please try again.');
      setError(msg);
      toast.error(msg);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Reset password: Step 2 — verify OTP, get reset_token ─────────────────
  const verifyResetOtp = useCallback(async (otp) => {
    if (!pendingReset?.email) return false;
    setLoading(true);
    setError('');
    try {
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 600));
        if (otp !== DEMO_OTP) throw new Error('Incorrect OTP. Use 123456 for demo.');
        setPendingReset((p) => ({ ...p, resetToken: DEMO_RESET_TOKEN, resetTokenExpiresInSeconds: 900 }));
        return true;
      }
      const res = await authService.verifyResetOtp(pendingReset.email, otp);
      assertSuccess(res, 'OTP verification failed.');
      // res.data = { reset_token, expires_in_seconds }
      setPendingReset((p) => ({
        ...p,
        resetToken:                   res.data.reset_token,
        resetTokenExpiresInSeconds:   res.data.expires_in_seconds ?? 900,
      }));
      return true;
    } catch (err) {
      const msg = extractErrorMessage(err, 'OTP verification failed. Please try again.');
      setError(msg);
      toast.error(msg);
      return false;
    } finally {
      setLoading(false);
    }
  }, [pendingReset]);

  // ── Reset password: resend OTP (re-calls step 1 with same email) ──────────
  const resendResetOtp = useCallback(async () => {
    if (!pendingReset?.email) return false;
    setLoading(true);
    setError('');
    try {
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 600));
        toast.success('Reset OTP resent successfully!');
        return true;
      }
      const res = await authService.forgotPassword(pendingReset.email);
      assertSuccess(res, 'Could not resend OTP.');
      if (res.data?.expires_in_seconds)
        setPendingReset((p) => ({ ...p, expiresInSeconds: res.data.expires_in_seconds }));
      toast.success('A new reset OTP has been sent to your email.');
      return true;
    } catch (err) {
      const msg = extractErrorMessage(err, 'Could not resend OTP. Please go back and try again.');
      setError(msg);
      toast.error(msg);
      return false;
    } finally {
      setLoading(false);
    }
  }, [pendingReset]);

  // ── Reset password: Step 3 — set new password ─────────────────────────────
  const resetPassword = useCallback(async (newPassword, confirmPassword) => {
    if (!pendingReset?.email || !pendingReset?.resetToken) return false;
    setLoading(true);
    setError('');
    try {
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 700));
        setPendingReset(null);
        toast.success('Password updated successfully. Please sign in.');
        return true;
      }
      const res = await authService.resetPassword(
        pendingReset.email,
        pendingReset.resetToken,
        newPassword,
        confirmPassword,
      );
      assertSuccess(res, 'Password reset failed.');
      setPendingReset(null);
      toast.success('Password updated successfully. Please sign in.');
      return true;
    } catch (err) {
      const msg = extractErrorMessage(err, 'Reset failed. The link may have expired.');
      setError(msg);
      toast.error(msg);
      return false;
    } finally {
      setLoading(false);
    }
  }, [pendingReset]);

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    if (!USE_MOCK) {
      try { await authService.logout(tokenStore.getRefresh()); } catch { /* best-effort */ }
    }
    tokenStore.clearAll();
    setSession(null);
    setPendingUser(null);
    setPendingReset(null);
    setError('');
  }, []);

  return (
    <AuthContext.Provider value={{
      user: session?.user ?? null,
      isAuthenticated: !!session,
      pendingUser,
      pendingReset,
      loading,
      error,
      clearError,
      initiateLogin,
      verifyOTP,
      resendOtp,
      requestPasswordReset,
      verifyResetOtp,
      resendResetOtp,
      resetPassword,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
