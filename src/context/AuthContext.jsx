import { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

// Mock admin accounts
const MOCK_ADMINS = [
  { id: 'adm1', email: 'admin@zipkart.in', password: 'Admin@123', name: 'Vipul Admin', role: 'Super Admin', avatar: 'VA', phone: '+919900000001' },
  { id: 'adm2', email: 'ops@zipkart.in',   password: 'Ops@1234',  name: 'Ops Manager',  role: 'Ops Manager',  avatar: 'OM', phone: '+919900000002' },
];

// OTP is always 123456 in demo
const DEMO_OTP = '123456';

// Persist session in sessionStorage so refresh keeps you logged in within the tab
const SESSION_KEY = 'zk_admin_session';

function loadSession() {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)); } catch { return null; }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(loadSession);         // { user, token }
  const [pendingUser, setPendingUser] = useState(null);        // user waiting for OTP
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const clearError = useCallback(() => setError(''), []);

  // Step 1: validate credentials → move to OTP step
  const initiateLogin = useCallback(async (email, password) => {
    setLoading(true);
    setError('');
    await new Promise(r => setTimeout(r, 800));          // simulate network
    const admin = MOCK_ADMINS.find(a => a.email === email && a.password === password);
    setLoading(false);
    if (!admin) {
      setError('Invalid email or password.');
      return false;
    }
    const { password: _, ...safeUser } = admin;
    setPendingUser(safeUser);
    return true;
  }, []);

  // Step 2: verify OTP → create session
  const verifyOTP = useCallback(async (otp) => {
    setLoading(true);
    setError('');
    await new Promise(r => setTimeout(r, 600));
    setLoading(false);
    if (otp !== DEMO_OTP) {
      setError('Incorrect OTP. Use 123456 for demo.');
      return false;
    }
    const sessionData = {
      user: pendingUser,
      token: `zk_tok_${Date.now()}`,
      loginAt: new Date().toISOString(),
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    setSession(sessionData);
    setPendingUser(null);
    return true;
  }, [pendingUser]);

  // Forgot password — simulate sending reset email
  const requestPasswordReset = useCallback(async (email) => {
    setLoading(true);
    setError('');
    await new Promise(r => setTimeout(r, 900));
    setLoading(false);
    const exists = MOCK_ADMINS.some(a => a.email === email);
    if (!exists) {
      setError('No admin account found with that email.');
      return false;
    }
    return true;
  }, []);

  // Reset password — simulate accepting new password
  const resetPassword = useCallback(async (token, newPassword) => {
    setLoading(true);
    setError('');
    await new Promise(r => setTimeout(r, 700));
    setLoading(false);
    // In demo, any token + password combination succeeds
    return true;
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
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
