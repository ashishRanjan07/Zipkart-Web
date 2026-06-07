import { Zap, ShoppingCart, Clock, TrendingUp, Bell, Shield, Package, Users } from 'lucide-react';

const STATS = [
  { icon: ShoppingCart, label: 'Orders Today',    value: '2,081',  color: 'bg-orange-500/20 text-orange-400' },
  { icon: Clock,        label: 'Avg Delivery',    value: '7.2 min', color: 'bg-green-500/20 text-green-400' },
  { icon: TrendingUp,   label: 'GMV This Week',   value: '₹7.3L',  color: 'bg-blue-500/20 text-blue-400' },
  { icon: Bell,         label: 'Uptime Today',    value: '99.9%',  color: 'bg-purple-500/20 text-purple-400' },
  { icon: Package,      label: 'Active Stores',   value: '4 / 5',  color: 'bg-teal-500/20 text-teal-400' },
  { icon: Users,        label: 'Active Partners', value: '3 avail', color: 'bg-pink-500/20 text-pink-400' },
];

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen w-full flex bg-white">

      {/* ── Left panel ────────────────────────────────── */}
      <div className="hidden lg:flex w-[46%] bg-gray-950 flex-col relative overflow-hidden shrink-0">

        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Gradient orbs */}
          <div className="absolute top-[-80px] left-[-80px] w-80 h-80 bg-orange-500/25 rounded-full blur-3xl" />
          <div className="absolute bottom-[-60px] right-[-60px] w-72 h-72 bg-blue-600/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-400/5 rounded-full blur-3xl" />
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
              backgroundSize: '40px 40px',
            }}
          />
        </div>

        <div className="relative flex flex-col h-full px-10 py-10">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/40">
              <Zap size={20} className="text-white" fill="white" />
            </div>
            <div>
              <div className="text-white font-bold text-lg leading-none tracking-tight">ZipKart</div>
              <div className="text-gray-500 text-xs leading-none mt-0.5 tracking-wide uppercase">Admin Portal</div>
            </div>
          </div>

          {/* Hero */}
          <div className="mt-16 flex-1">
            <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-full px-3 py-1 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
              <span className="text-orange-400 text-xs font-medium tracking-wide">Live Operations</span>
            </div>

            <h1 className="text-[2.6rem] font-extrabold text-white leading-[1.15] tracking-tight">
              Command centre<br />
              for{' '}
              <span className="relative">
                <span className="text-orange-400">sub-8-min</span>
              </span>
              <br />
              delivery
            </h1>
            <p className="text-gray-400 mt-5 text-[15px] leading-relaxed max-w-sm">
              Manage orders, inventory, dark stores, delivery partners, and every
              operational metric — all from a single, powerful dashboard.
            </p>

            {/* Stats grid */}
            <div className="mt-10 grid grid-cols-2 gap-3">
              {STATS.map(({ icon: Icon, label, value, color }) => (
                <div
                  key={label}
                  className="bg-white/[0.04] border border-white/[0.07] rounded-xl p-4 hover:bg-white/[0.07] transition-colors"
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center mb-2.5 ${color.split(' ')[0]}`}>
                    <Icon size={14} className={color.split(' ')[1]} />
                  </div>
                  <div className="text-white text-lg font-bold leading-none">{value}</div>
                  <div className="text-gray-500 text-xs mt-1">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center gap-2 pt-6 border-t border-white/10 mt-6">
            <Shield size={13} className="text-gray-600" />
            <span className="text-gray-600 text-xs tracking-wide">
              JWT · 2FA · TLS 1.3 · OWASP hardened
            </span>
          </div>
        </div>
      </div>

      {/* ── Right panel ───────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 relative min-h-screen px-6 py-12">

        {/* Subtle background dots */}
        <div
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{
            backgroundImage: `radial-gradient(circle, #d1d5db 1px, transparent 1px)`,
            backgroundSize: '28px 28px',
          }}
        />
        {/* Fade edges */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 80% 80% at 50% 50%, transparent 40%, #f9fafb 100%)' }}
        />

        {/* Mobile logo */}
        <div className="flex items-center gap-2 mb-8 lg:hidden relative">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center shadow-md shadow-orange-200">
            <Zap size={15} className="text-white" fill="white" />
          </div>
          <div>
            <span className="font-bold text-gray-900 text-sm">ZipKart</span>
            <span className="text-gray-400 text-xs ml-1">Admin</span>
          </div>
        </div>

        {/* Form card */}
        <div className="relative w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/80 border border-gray-200/60 px-8 py-9">
            {children}
          </div>
        </div>

        {/* Bottom caption */}
        <p className="relative mt-8 text-xs text-gray-400 text-center">
          © {new Date().getFullYear()} ZipKart · Quick-commerce platform
        </p>
      </div>

    </div>
  );
}
