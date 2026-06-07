import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, ArrowLeft, ShieldCheck } from 'lucide-react';
import AuthLayout from '../../components/layout/AuthLayout';
import { useAuth } from '../../context/AuthContext';

const RULES = [
  { label: 'At least 8 characters',        test: (p) => p.length >= 8 },
  { label: 'One uppercase letter',          test: (p) => /[A-Z]/.test(p) },
  { label: 'One number',                    test: (p) => /\d/.test(p) },
  { label: 'One special character',         test: (p) => /[^A-Za-z0-9]/.test(p) },
];

function strength(password) {
  const passed = RULES.filter(r => r.test(password)).length;
  if (passed <= 1) return { score: 1, label: 'Weak',   color: 'bg-red-500',    text: 'text-red-500' };
  if (passed === 2) return { score: 2, label: 'Fair',   color: 'bg-yellow-500', text: 'text-yellow-600' };
  if (passed === 3) return { score: 3, label: 'Good',   color: 'bg-blue-500',   text: 'text-blue-600' };
  return               { score: 4, label: 'Strong', color: 'bg-green-500',  text: 'text-green-600' };
}

export default function ResetPassword() {
  const { resetPassword, loading, error, clearError } = useAuth();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [done, setDone] = useState(false);
  const [localError, setLocalError] = useState('');

  const str = password ? strength(password) : null;
  const allRulesPassed = RULES.every(r => r.test(password));
  const passwordsMatch = password === confirm;

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    setLocalError('');
    if (!allRulesPassed) { setLocalError('Password does not meet all requirements.'); return; }
    if (!passwordsMatch) { setLocalError('Passwords do not match.'); return; }
    const ok = await resetPassword(token, password);
    if (ok) setDone(true);
  };

  if (!token) {
    return (
      <AuthLayout>
        <div className="text-center py-6">
          <div className="w-14 h-14 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <AlertCircle size={26} className="text-red-500" />
          </div>
          <h2 className="text-xl font-extrabold text-gray-900">Invalid reset link</h2>
          <p className="text-gray-500 text-sm mt-2">This link is missing or has expired. Request a new one.</p>
          <Link to="/auth/forgot-password" className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors">
            Request new link
          </Link>
        </div>
      </AuthLayout>
    );
  }

  if (done) {
    return (
      <AuthLayout>
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-green-50 border border-green-200 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 size={32} className="text-green-500" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Password updated!</h2>
          <p className="text-gray-500 text-sm mt-2 leading-relaxed">
            Your password has been reset. Sign in with your new credentials.
          </p>
          <Link
            to="/auth/login"
            className="flex items-center justify-center gap-2 w-full mt-8 py-3 bg-orange-500 text-white text-sm font-semibold rounded-xl hover:bg-orange-600 transition-all shadow-md shadow-orange-200"
          >
            Go to login
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <Link to="/auth/login" className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors mb-6">
        <ArrowLeft size={13} /> Back to login
      </Link>

      <div className="w-12 h-12 bg-orange-50 border border-orange-200 rounded-2xl flex items-center justify-center mb-5">
        <Lock size={22} className="text-orange-500" />
      </div>

      <div className="mb-6">
        <h2 className="text-[1.6rem] font-extrabold text-gray-900 tracking-tight">Set new password</h2>
        <p className="text-gray-500 text-sm mt-1">Choose a strong password for your admin account.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* New password */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">New password</label>
          <div className="relative">
            <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={e => { setPassword(e.target.value); clearError(); setLocalError(''); }}
              placeholder="Min 8 chars, mixed case & special char"
              required
              autoFocus
              className="w-full pl-10 pr-11 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
            />
            <button type="button" tabIndex={-1} onClick={() => setShowPass(s => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>

          {/* Strength bar */}
          {password && str && (
            <div className="mt-2">
              <div className="flex gap-1 mb-1.5">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${i <= str.score ? str.color : 'bg-gray-200'}`} />
                ))}
              </div>
              <div className="flex items-center justify-between">
                <p className={`text-xs font-semibold ${str.text}`}>{str.label} password</p>
                <span className="text-xs text-gray-400">{str.score}/4</span>
              </div>
            </div>
          )}

          {/* Rules */}
          {password && (
            <div className="mt-3 grid grid-cols-2 gap-1.5">
              {RULES.map(rule => {
                const ok = rule.test(password);
                return (
                  <div key={rule.label} className={`flex items-center gap-1.5 text-xs ${ok ? 'text-green-600' : 'text-gray-400'}`}>
                    <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 transition-colors ${ok ? 'bg-green-500' : 'bg-gray-200'}`}>
                      {ok && <span className="text-white text-[8px] font-bold">✓</span>}
                    </div>
                    {rule.label}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Confirm */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Confirm password</label>
          <div className="relative">
            <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type={showConfirm ? 'text' : 'password'}
              value={confirm}
              onChange={e => { setConfirm(e.target.value); setLocalError(''); }}
              placeholder="Re-enter new password"
              required
              className={`w-full pl-10 pr-11 py-2.5 text-sm border rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                confirm && !passwordsMatch
                  ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                  : confirm && passwordsMatch
                  ? 'border-green-400 focus:border-green-400 focus:ring-green-100'
                  : 'border-gray-200 focus:border-orange-400 focus:ring-orange-100'
              }`}
            />
            <button type="button" tabIndex={-1} onClick={() => setShowConfirm(s => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {confirm && !passwordsMatch && <p className="text-xs text-red-500 mt-1">Passwords do not match</p>}
          {confirm && passwordsMatch && (
            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <CheckCircle2 size={11} strokeWidth={2.5} /> Passwords match
            </p>
          )}
        </div>

        {(error || localError) && (
          <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-3.5 py-3">
            <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs text-red-700 font-medium">{localError || error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !allRulesPassed || !passwordsMatch}
          className="w-full flex items-center justify-center gap-2 py-3 bg-orange-500 text-white text-sm font-semibold rounded-xl hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-md shadow-orange-200"
        >
          {loading
            ? <><Loader2 size={16} className="animate-spin" /> Updating…</>
            : <><ShieldCheck size={16} /> Reset password</>
          }
        </button>
      </form>
    </AuthLayout>
  );
}
