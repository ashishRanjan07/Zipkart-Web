const variants = {
  green:  'bg-green-100 text-green-700',
  red:    'bg-red-100 text-red-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  blue:   'bg-blue-100 text-blue-700',
  orange: 'bg-orange-100 text-orange-700',
  gray:   'bg-gray-100 text-gray-600',
  purple: 'bg-purple-100 text-purple-700',
};

export default function Badge({ children, variant = 'gray', dot = false }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${variants[variant]}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColor(variant)}`} />}
      {children}
    </span>
  );
}

function dotColor(v) {
  const map = { green: 'bg-green-500', red: 'bg-red-500', yellow: 'bg-yellow-500', blue: 'bg-blue-500', orange: 'bg-orange-500', gray: 'bg-gray-400', purple: 'bg-purple-500' };
  return map[v] ?? 'bg-gray-400';
}

export function statusVariant(status) {
  const map = {
    active: 'green', available: 'green', delivered: 'green', captured: 'green',
    delivered_pushes: 'green', sent: 'blue',
    on_order: 'blue', dispatched: 'blue', confirmed: 'blue', picking: 'blue', packed: 'blue',
    payment_pending: 'yellow', pending: 'yellow', scheduled: 'yellow',
    offline: 'gray', inactive: 'gray', ended: 'gray', cancelled: 'gray', refunded: 'gray',
    failed: 'red', maintenance: 'orange', bounced: 'red',
    queued: 'yellow', refund_pending: 'orange',
  };
  return map[status] ?? 'gray';
}
