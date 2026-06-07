import { Bell, Search, LogOut, ChevronDown } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const titles = {
  '/': 'Dashboard',
  '/orders': 'Orders',
  '/inventory': 'Inventory',
  '/users': 'Users',
  '/stores': 'Dark Stores',
  '/partners': 'Delivery Partners',
  '/catalog': 'Catalog',
  '/payments': 'Payments',
  '/coupons': 'Coupons',
  '/flash-sales': 'Flash Sales',
  '/notifications': 'Notifications',
  '/analytics': 'Analytics',
  '/audit-logs': 'Audit Logs',
  '/app-config': 'App Config',
};

export default function Header() {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const title = titles[pathname] ?? 'ZipKart Admin';

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => { if (!menuRef.current?.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const handleLogout = () => {
    logout();
    navigate('/auth/login', { replace: true });
  };

  return (
    <header className="fixed top-0 left-56 right-0 h-14 bg-white border-b border-gray-200 flex items-center px-6 gap-4 z-20">
      <h1 className="text-base font-semibold text-gray-900 flex-1">{title}</h1>

      <div className="relative hidden sm:block">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="pl-9 pr-4 py-1.5 text-sm bg-gray-100 rounded-lg border border-transparent focus:border-gray-300 focus:bg-white outline-none w-56 transition-colors"
          placeholder="Search anything..."
        />
      </div>

      <button className="relative p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
        <Bell size={18} />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full"></span>
      </button>

      {/* User menu */}
      <div className="relative pl-2 border-l border-gray-200" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(o => !o)}
          className="flex items-center gap-2 hover:bg-gray-50 rounded-lg px-2 py-1 transition-colors"
        >
          <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
            {user?.avatar ?? 'AD'}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-semibold text-gray-900 leading-none">{user?.name ?? 'Admin'}</div>
            <div className="text-xs text-gray-500 leading-none mt-0.5">{user?.role ?? 'Super Admin'}</div>
          </div>
          <ChevronDown size={14} className={`text-gray-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl border border-gray-200 shadow-lg py-1 z-50">
            <div className="px-4 py-2.5 border-b border-gray-100">
              <div className="text-xs font-semibold text-gray-900">{user?.name}</div>
              <div className="text-xs text-gray-400 truncate">{user?.email}</div>
              <div className="mt-1 inline-block bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full font-medium">
                {user?.role}
              </div>
            </div>
            <div className="py-1">
              <button className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                Profile & Settings
              </button>
              <button className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                Change Password
              </button>
            </div>
            <div className="border-t border-gray-100 py-1">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
              >
                <LogOut size={14} /> Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
