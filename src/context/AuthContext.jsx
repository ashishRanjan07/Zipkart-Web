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
const DEMO_OTP = '123456';
// ─────────────────────────────────────────────────────────────────────────────

// Normalise error message from API response or JS Error
function extractErrorMessage(err, fallback) {
  if (!err) return fallback;
  if (err.message === 'Failed to fetch')
    return 'Unable to connect to the server. Please check your internet connection.';
  if (err.status >= 500)
    return 'A server error occurred. Please try again later.';
  return err.message ?? fallback;
}

// Some backends return HTTP 200 with { success: false, message: "..." }
// This guard throws so the catch block handles it uniformly
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
  const [session, setSession]         = useState(loadSession);
  // pendingUser holds { email, sentTo, expiresInSeconds } between step 1 and step 2
  const [pendingUser, setPendingUser] = useState(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');

  const clearError = useCallback(() => setError(''), []);

  // API client fires this when it cannot refresh the access token
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

  // ── Step 1 — validate email + password, trigger OTP email ────────────────
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

      // res = { success: true, message: "...", data: { sent_to, expires_in_seconds } }
      setPendingUser({
        email,
        sentTo:           res.data?.sent_to         ?? email,
        expiresInSeconds: res.data?.expires_in_seconds ?? 600,
      });
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

  // ── Step 2 — verify OTP, receive tokens + admin profile ──────────────────
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

      // Real API — body = { email, otp }
      const res = await authService.verifyOtp(pendingUser.email, otp);
      assertSuccess(res, 'OTP verification failed.');

      // res = { success: true, message: "Login successful", data: { access_token, refresh_token, expires_in, admin } }
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

  // ── Resend OTP ─────────────────────────────────────────────────────────────
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
      if (res.data?.expires_in_seconds) {
        setPendingUser((p) => ({ ...p, expiresInSeconds: res.data.expires_in_seconds }));
      }
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

  // ── Forgot password ────────────────────────────────────────────────────────
  const requestPasswordReset = useCallback(async (email) => {
    setLoading(true);
    setError('');

    try {
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 900));
        if (!MOCK_ADMINS.some((a) => a.email === email)) throw new Error('No admin account found with that email.');
        toast.success('Password reset link sent to your email.');
        return true;
      }
      const res = await authService.forgotPassword(email);
      assertSuccess(res, 'Request failed.');
      toast.success('Password reset link sent. Check your inbox.');
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

  // ── Reset password ─────────────────────────────────────────────────────────
  const resetPassword = useCallback(async (token, newPassword) => {
    setLoading(true);
    setError('');

    try {
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 700));
        toast.success('Password updated successfully. Please sign in.');
        return true;
      }
      const res = await authService.resetPassword(token, newPassword);
      assertSuccess(res, 'Reset failed.');
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
  }, []);

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    if (!USE_MOCK) {
      try { await authService.logout(tokenStore.getRefresh()); } catch { /* best-effort */ }
    }
    tokenStore.clearAll();
    setSession(null);
    setPendingUser(null);
    setError('');
  }, []);

  return (
    <AuthContext.Provider value={{
      user: session?.user ?? null,
      isAuthenticated: !!session,
      pendingUser,
      loading,
      error,
      clearError,
      initiateLogin,
      verifyOTP,
      resendOtp,
      requestPasswordReset,
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
