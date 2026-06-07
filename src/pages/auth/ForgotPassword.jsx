import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Loader2, AlertCircle, ArrowLeft, SendHorizonal } from 'lucide-react';
import AuthLayout from '../../components/layout/AuthLayout';
import { useAuth } from '../../context/AuthContext';

export default function ForgotPassword() {
  const { requestPasswordReset, loading, error, clearError } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    const ok = await requestPasswordReset(email.trim());
    if (ok) navigate('/auth/reset-otp');
  };

  return (
    <AuthLayout>
      <Link
        to="/auth/login"
        className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors mb-6"
      >
        <ArrowLeft size={13} /> Back to login
      </Link>

      {/* Icon */}
      <div className="w-12 h-12 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-center mb-5">
        <Mail size={22} className="text-blue-500" />
      </div>

      <div className="mb-6">
        <h2 className="text-[1.6rem] font-extrabold text-gray-900 tracking-tight">Forgot password?</h2>
        <p className="text-gray-500 text-sm mt-1.5 leading-relaxed">
          Enter your admin email. We'll send a one-time code to verify it's you.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            Admin email address
          </label>
          <div className="relative">
            <Mail
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); clearError(); }}
              placeholder="you@zipkart.in"
              required
              autoFocus
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-3.5 py-3">
            <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs text-red-700 font-medium">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-sm"
        >
          {loading
            ? <><Loader2 size={16} className="animate-spin" /> Sending OTP…</>
            : <><SendHorizonal size={16} /> Send reset OTP</>}
        </button>
      </form>

      {/* Step indicator */}
      <div className="mt-8 flex items-center gap-2 justify-center">
        <div className="w-6 h-2 rounded-full bg-blue-500" />
        <div className="w-2 h-2 rounded-full bg-gray-200" />
        <div className="w-2 h-2 rounded-full bg-gray-200" />
      </div>
      <p className="text-center text-xs text-gray-400 mt-2">Step 1 of 3</p>

      <p className="text-xs text-gray-400 text-center mt-6">
        Remember your password?{' '}
        <Link to="/auth/login" className="text-gray-600 hover:text-gray-800 font-medium transition-colors">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
