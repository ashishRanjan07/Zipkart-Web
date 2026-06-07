import { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import toastStore from '../../lib/toast';

const CONFIG = {
  success: {
    Icon:        CheckCircle2,
    bar:         'bg-green-500',
    iconColor:   'text-green-600',
    bg:          'bg-white',
    border:      'border-green-200',
    titleColor:  'text-green-800',
    msgColor:    'text-green-700',
    label:       'Success',
  },
  error: {
    Icon:        XCircle,
    bar:         'bg-red-500',
    iconColor:   'text-red-600',
    bg:          'bg-white',
    border:      'border-red-200',
    titleColor:  'text-red-800',
    msgColor:    'text-red-700',
    label:       'Error',
  },
  warning: {
    Icon:        AlertTriangle,
    bar:         'bg-yellow-500',
    iconColor:   'text-yellow-600',
    bg:          'bg-white',
    border:      'border-yellow-200',
    titleColor:  'text-yellow-800',
    msgColor:    'text-yellow-700',
    label:       'Warning',
  },
  info: {
    Icon:        Info,
    bar:         'bg-blue-500',
    iconColor:   'text-blue-600',
    bg:          'bg-white',
    border:      'border-blue-200',
    titleColor:  'text-blue-800',
    msgColor:    'text-blue-700',
    label:       'Info',
  },
};

function ToastItem({ toast, onDismiss }) {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(100);
  const cfg = CONFIG[toast.type] ?? CONFIG.info;
  const { Icon } = cfg;

  // Slide in on mount
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  // Progress bar countdown
  useEffect(() => {
    const interval = 50;
    const step = (interval / toast.duration) * 100;
    const timer = setInterval(() => {
      setProgress((p) => {
        if (p <= 0) { clearInterval(timer); return 0; }
        return p - step;
      });
    }, interval);
    return () => clearInterval(timer);
  }, [toast.duration]);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    setTimeout(() => onDismiss(toast.id), 300);
  }, [toast.id, onDismiss]);

  return (
    <div
      className={`
        relative overflow-hidden flex items-start gap-3 w-80 rounded-xl border shadow-lg px-4 py-3.5
        transition-all duration-300 ease-out cursor-default
        ${cfg.bg} ${cfg.border}
        ${visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      {/* Progress bar */}
      <div
        className={`absolute top-0 left-0 h-1 rounded-tl-xl transition-all ${cfg.bar}`}
        style={{ width: `${progress}%`, transitionDuration: '50ms' }}
      />

      {/* Icon */}
      <Icon size={18} className={`shrink-0 mt-0.5 ${cfg.iconColor}`} />

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-semibold leading-none mb-0.5 ${cfg.titleColor}`}>
          {cfg.label}
        </p>
        <p className={`text-xs leading-relaxed ${cfg.msgColor}`}>
          {toast.message}
        </p>
      </div>

      {/* Dismiss */}
      <button
        onClick={handleDismiss}
        className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors mt-0.5"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export default function Toast() {
  const [toasts, setToasts] = useState(() => toastStore.getAll());

  useEffect(() => toastStore.subscribe(setToasts), []);

  const dismiss = useCallback((id) => toastStore.dismiss(id), []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} onDismiss={dismiss} />
        </div>
      ))}
    </div>
  );
}
