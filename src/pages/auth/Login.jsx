import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import AuthLayout from '../../components/layout/AuthLayout';
import { useAuth } from '../../context/AuthContext';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export default function Login() {
  const { initiateLogin, loading, error, clearError } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    const ok = await initiateLogin(email.trim(), password);
    if (ok) navigate('/auth/verify-otp');
  };

  return (
    <AuthLayout>
      <div className="mb-6">
        <h2 className="text-[1.6rem] font-extrabold text-gray-900 tracking-tight">Welcome back</h2>
        <p className="text-gray-500 text-sm mt-1">Sign in to your ZipKart admin account</p>
      </div>

      {/* Demo hint — only shown in mock mode */}
      {USE_MOCK && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-3.5 flex gap-3 mb-6">
          <span className="text-orange-400 text-sm leading-none mt-0.5">💡</span>
          <div className="text-xs text-orange-700 leading-relaxed">
            <span className="font-semibold">Demo mode: </span>
            <code className="font-mono bg-orange-100 px-1 rounded">admin@zipkart.in</code>
            {' / '}
            <code className="font-mono bg-orange-100 px-1 rounded">Admin@123</code>
            <span className="block mt-1 text-orange-600">OTP: <code className="font-mono bg-orange-100 px-1 rounded">123456</code></span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email address</label>
          <div className="relative">
            <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); clearError(); }}
              placeholder="you@zipkart.in"
              required
              autoFocus
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-xs font-semibold text-gray-700">Password</label>
            <Link to="/auth/forgot-password" className="text-xs text-orange-500 hover:text-orange-600 font-medium transition-colors">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={(e) => { setPassword(e.target.value); clearError(); }}
              placeholder="••••••••"
              required
              className="w-full pl-10 pr-11 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPass((s) => !s)}
              tabIndex={-1}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-3.5 py-3">
            <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 bg-orange-500 text-white text-sm font-semibold rounded-xl hover:bg-orange-600 active:bg-orange-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-md shadow-orange-200 mt-1"
        >
          {loading
            ? <><Loader2 size={16} className="animate-spin" /> Verifying…</>
            : <><ArrowRight size={16} /> Continue</>}
        </button>
      </form>

      {/* Mock quick-fill buttons */}
      {USE_MOCK && (
        <>
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">quick fill</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => { setEmail('admin@zipkart.in'); setPassword('Admin@123'); clearError(); }}
              className="py-2 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 hover:border-gray-300 transition-colors"
            >
              Super Admin
            </button>
            <button
              type="button"
              onClick={() => { setEmail('ops@zipkart.in'); setPassword('Ops@1234'); clearError(); }}
              className="py-2 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 hover:border-gray-300 transition-colors"
            >
              Ops Manager
            </button>
          </div>
        </>
      )}

      <p className="text-[11px] text-gray-400 text-center mt-6">
        By signing in you agree to our{' '}
        <a href="#" className="underline hover:text-gray-600">Terms</a>
        {' & '}
        <a href="#" className="underline hover:text-gray-600">Privacy Policy</a>
      </p>
    </AuthLayout>
  );
}
