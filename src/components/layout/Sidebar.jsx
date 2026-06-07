import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingCart, Package, Users, Store,
  Bike, BookOpen, CreditCard, Tag, Zap, Bell, BarChart2,
  Shield, Settings, ChevronRight
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboard },
  { label: 'Orders', to: '/orders', icon: ShoppingCart },
  { label: 'Inventory', to: '/inventory', icon: Package },
  { label: 'Users', to: '/users', icon: Users },
  { label: 'Dark Stores', to: '/stores', icon: Store },
  { label: 'Partners', to: '/partners', icon: Bike },
  { label: 'Catalog', to: '/catalog', icon: BookOpen },
  { label: 'Payments', to: '/payments', icon: CreditCard },
  { label: 'Coupons', to: '/coupons', icon: Tag },
  { label: 'Flash Sales', to: '/flash-sales', icon: Zap },
  { label: 'Notifications', to: '/notifications', icon: Bell },
  { label: 'Analytics', to: '/analytics', icon: BarChart2 },
  { label: 'Audit Logs', to: '/audit-logs', icon: Shield },
  { label: 'App Config', to: '/app-config', icon: Settings },
];

export default function Sidebar() {
  return (
    <aside className="fixed top-0 left-0 h-full w-56 bg-gray-900 flex flex-col z-30">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-gray-700">
        <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <Zap size={16} className="text-white" />
        </div>
        <div>
          <div className="text-white font-bold text-sm leading-none">ZipKart</div>
          <div className="text-gray-400 text-xs leading-none mt-0.5">Admin Portal</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {navItems.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg mb-0.5 text-sm transition-colors ${
                isActive
                  ? 'bg-orange-500 text-white font-medium'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`
            }
          >
            <Icon size={16} />
            <span className="flex-1">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gray-600 rounded-full flex items-center justify-center text-xs text-white font-semibold">A</div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-xs font-medium truncate">Admin</div>
            <div className="text-gray-500 text-xs truncate">admin@zipkart.in</div>
          </div>
          <ChevronRight size={14} className="text-gray-500" />
        </div>
      </div>
    </aside>
  );
}
