import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { KeyRound, Loader2, AlertCircle, ArrowLeft, RefreshCw, ShieldCheck } from 'lucide-react';
import AuthLayout from '../../components/layout/AuthLayout';
import { useAuth } from '../../context/AuthContext';

const OTP_LENGTH = 6;
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export default function ResetOTPVerify() {
  const { pendingReset, verifyResetOtp, resendResetOtp, loading, error, clearError } = useAuth();
  const navigate = useNavigate();

  const [digits, setDigits]                 = useState(Array(OTP_LENGTH).fill(''));
  const [resendCooldown, setResendCooldown] = useState(30);
  const [resendStatus, setResendStatus]     = useState('idle'); // idle | sending | sent | error
  const inputRefs = useRef([]);

  // Guard: if no pending reset session, redirect back to step 1
  useEffect(() => {
    if (!pendingReset) navigate('/auth/forgot-password', { replace: true });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // After OTP verified, pendingReset gains a resetToken → go to step 3
  useEffect(() => {
    if (pendingReset?.resetToken) navigate('/auth/reset-password', { replace: true });
  }, [pendingReset, navigate]);

  // Resend cooldown countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleDigitChange = (idx, val) => {
    clearError();
    if (val.length === OTP_LENGTH && /^\d{6}$/.test(val)) {
      setDigits(val.split(''));
      inputRefs.current[OTP_LENGTH - 1]?.focus();
      return;
    }
    if (!/^\d?$/.test(val)) return;
    const next = [...digits];
    next[idx] = val;
    setDigits(next);
    if (val && idx < OTP_LENGTH - 1) inputRefs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) inputRefs.current[idx - 1]?.focus();
    if (e.key === 'ArrowLeft'  && idx > 0)              inputRefs.current[idx - 1]?.focus();
    if (e.key === 'ArrowRight' && idx < OTP_LENGTH - 1) inputRefs.current[idx + 1]?.focus();
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const otp = digits.join('');
    if (otp.length < OTP_LENGTH) return;
    clearError();
    await verifyResetOtp(otp); // navigation handled by the pendingReset effect above
  };

  const handleResend = async () => {
    setResendStatus('sending');
    setDigits(Array(OTP_LENGTH).fill(''));
    inputRefs.current[0]?.focus();
    const ok = await resendResetOtp();
    if (ok) {
      setResendStatus('sent');
      setResendCooldown(30);
      setTimeout(() => setResendStatus('idle'), 3000);
    } else {
      setResendStatus('error');
      setTimeout(() => setResendStatus('idle'), 3000);
    }
  };

  // Auto-submit when all 6 digits are entered
  useEffect(() => {
    if (digits.every((d) => d !== '') && !loading) handleSubmit();
  }, [digits]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!pendingReset) return null;

  return (
    <AuthLayout>
      <Link
        to="/auth/forgot-password"
        className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors mb-6"
      >
        <ArrowLeft size={13} /> Back
      </Link>

      {/* Icon */}
      <div className="w-14 h-14 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-center mb-5">
        <KeyRound size={26} className="text-blue-500" />
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900">Enter reset code</h2>
        <p className="text-gray-500 text-sm mt-1.5 leading-relaxed">
          We sent a 6-digit reset code to{' '}
          <span className="font-semibold text-gray-800">{pendingReset?.sentTo ?? 'your email'}</span>
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Code expires in {Math.floor((pendingReset?.expiresInSeconds ?? 600) / 60)} minutes.
        </p>
        {USE_MOCK && (
          <p className="text-xs text-blue-600 mt-1">
            Demo OTP: <code className="font-mono bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">123456</code>
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-8">
        {/* OTP digit inputs */}
        <div className="flex gap-3 justify-center">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={OTP_LENGTH}
              value={d}
              autoFocus={i === 0}
              onChange={(e) => handleDigitChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onFocus={(e) => e.target.select()}
              className={`w-12 h-14 text-center text-xl font-bold border-2 rounded-xl focus:outline-none transition-all ${
                error
                  ? 'border-red-300 bg-red-50 text-red-600'
                  : d
                  ? 'border-blue-400 bg-blue-50 text-blue-600'
                  : 'border-gray-200 bg-white text-gray-900 focus:border-blue-400 focus:bg-blue-50/40'
              }`}
            />
          ))}
        </div>

        {error && (
          <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mt-5">
            <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs text-red-700 font-medium">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || digits.some((d) => !d)}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-sm mt-6"
        >
          {loading
            ? <><Loader2 size={16} className="animate-spin" /> Verifying…</>
            : <><ShieldCheck size={16} /> Verify OTP</>}
        </button>
      </form>

      {/* Resend */}
      <div className="mt-6 text-center">
        {resendStatus === 'sending' && (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
            <Loader2 size={14} className="animate-spin" /> Sending…
          </div>
        )}
        {resendStatus === 'sent' && (
          <div className="flex items-center justify-center gap-2 text-sm text-green-600 font-medium">
            <RefreshCw size={14} /> Code resent to {pendingReset?.sentTo}
          </div>
        )}
        {resendStatus === 'error' && (
          <p className="text-sm text-red-500">Could not resend. Please go back and try again.</p>
        )}
        {resendStatus === 'idle' && (
          resendCooldown > 0 ? (
            <p className="text-sm text-gray-400">
              Resend code in <span className="font-semibold text-gray-600 tabular-nums">{resendCooldown}s</span>
            </p>
          ) : (
            <button
              onClick={handleResend}
              className="flex items-center justify-center gap-1.5 text-sm text-blue-500 hover:text-blue-600 font-medium mx-auto transition-colors"
            >
              <RefreshCw size={14} /> Resend code
            </button>
          )
        )}
      </div>

      {/* Step indicator */}
      <div className="mt-8 flex items-center gap-2 justify-center">
        <div className="w-2 h-2 rounded-full bg-gray-300" />
        <div className="w-6 h-2 rounded-full bg-blue-500" />
        <div className="w-2 h-2 rounded-full bg-gray-200" />
      </div>
      <p className="text-center text-xs text-gray-400 mt-2">Step 2 of 3</p>
    </AuthLayout>
  );
}
