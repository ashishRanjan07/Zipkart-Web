// Module-level singleton — survives React navigation without any context
let _toasts = [];
let _nextId  = 0;
const _listeners = new Set();

function notify() {
  _listeners.forEach((cb) => cb([..._toasts]));
}

const toast = {
  /** Subscribe to the toast list. Returns an unsubscribe function. */
  subscribe: (cb) => {
    _listeners.add(cb);
    return () => _listeners.delete(cb);
  },

  getAll: () => [..._toasts],

  show: (type, message, duration = 4500) => {
    const id = ++_nextId;
    _toasts = [..._toasts, { id, type, message, duration, createdAt: Date.now() }];
    notify();
    setTimeout(() => toast.dismiss(id), duration);
    return id;
  },

  dismiss: (id) => {
    _toasts = _toasts.filter((t) => t.id !== id);
    notify();
  },

  success: (message, duration)  => toast.show('success', message, duration),
  error:   (message, duration)  => toast.show('error',   message, duration),
  warning: (message, duration)  => toast.show('warning', message, duration),
  info:    (message, duration)  => toast.show('info',    message, duration),
};

export default toast;
