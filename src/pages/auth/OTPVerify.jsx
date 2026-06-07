import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Loader2, AlertCircle, ArrowLeft, RefreshCw, ShieldCheck } from 'lucide-react';
import AuthLayout from '../../components/layout/AuthLayout';
import { useAuth } from '../../context/AuthContext';

const OTP_LENGTH = 6;
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export default function OTPVerify() {
  const { pendingUser, isAuthenticated, verifyOTP, resendOtp, loading, error, clearError } = useAuth();
  const navigate = useNavigate();

  const [digits, setDigits]           = useState(Array(OTP_LENGTH).fill(''));
  const [resendCooldown, setResendCooldown] = useState(30);
  const [resendStatus, setResendStatus]     = useState('idle'); // idle | sending | sent | error
  const inputRefs = useRef([]);

  // Guard: if no pending session and not authenticated, send back to login
  useEffect(() => {
    if (!pendingUser && !isAuthenticated) {
      navigate('/auth/login', { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // After successful OTP → isAuthenticated flips true → go to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Resend cooldown countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleDigitChange = (idx, val) => {
    clearError();
    // Allow paste of full OTP
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
    await verifyOTP(otp); // navigation handled by the isAuthenticated effect above
  };

  const handleResend = async () => {
    setResendStatus('sending');
    setDigits(Array(OTP_LENGTH).fill(''));
    inputRefs.current[0]?.focus();
    const ok = await resendOtp();
    if (ok) {
      setResendStatus('sent');
      setResendCooldown(30);
      setTimeout(() => setResendStatus('idle'), 3000);
    } else {
      setResendStatus('error');
      setTimeout(() => setResendStatus('idle'), 3000);
    }
  };

  // Auto-submit when all 6 digits are filled
  useEffect(() => {
    if (digits.every((d) => d !== '') && !loading) handleSubmit();
  }, [digits]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!pendingUser && !isAuthenticated) return null;

  return (
    <AuthLayout>
      <Link to="/auth/login" className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors mb-6">
        <ArrowLeft size={13} /> Back to login
      </Link>

      {/* Icon */}
      <div className="w-14 h-14 bg-orange-50 border border-orange-200 rounded-2xl flex items-center justify-center mb-5">
        <Mail size={26} className="text-orange-500" />
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900">Check your email</h2>
        <p className="text-gray-500 text-sm mt-1.5 leading-relaxed">
          We sent a 6-digit code to{' '}
          <span className="font-semibold text-gray-800">{pendingUser?.sentTo ?? 'your email'}</span>
        </p>
        <p className="text-xs text-gray-400 mt-1">
          The code expires in {Math.floor((pendingUser?.expiresInSeconds ?? 600) / 60)} minutes.
        </p>
        {USE_MOCK && (
          <p className="text-xs text-orange-600 mt-1">
            Demo OTP: <code className="font-mono bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded">123456</code>
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
                  ? 'border-orange-400 bg-orange-50 text-orange-600'
                  : 'border-gray-200 bg-white text-gray-900 focus:border-orange-400 focus:bg-orange-50/40'
              }`}
            />
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mt-5">
            <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || digits.some((d) => !d)}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-orange-500 text-white text-sm font-semibold rounded-xl hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-sm shadow-orange-200 mt-6"
        >
          {loading
            ? <><Loader2 size={16} className="animate-spin" /> Verifying…</>
            : <><ShieldCheck size={16} /> Verify &amp; Sign In</>}
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
            <RefreshCw size={14} /> Code resent to {pendingUser?.sentTo}
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
              className="flex items-center justify-center gap-1.5 text-sm text-orange-500 hover:text-orange-600 font-medium mx-auto transition-colors"
            >
              <RefreshCw size={14} /> Resend code
            </button>
          )
        )}
      </div>

      {/* Step indicator */}
      <div className="mt-8 flex items-center gap-2 justify-center">
        <div className="w-2 h-2 rounded-full bg-gray-300" />
        <div className="w-6 h-2 rounded-full bg-orange-500" />
      </div>
      <p className="text-center text-xs text-gray-400 mt-2">Step 2 of 2</p>
    </AuthLayout>
  );
}
