import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Layout from './components/layout/Layout';

// Auth pages
import Login from './pages/auth/Login';
import OTPVerify from './pages/auth/OTPVerify';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Admin pages
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Inventory from './pages/Inventory';
import Users from './pages/Users';
import DarkStores from './pages/DarkStores';
import Partners from './pages/Partners';
import Catalog from './pages/Catalog';
import Payments from './pages/Payments';
import Coupons from './pages/Coupons';
import FlashSales from './pages/FlashSales';
import Notifications from './pages/Notifications';
import Analytics from './pages/Analytics';
import AuditLogs from './pages/AuditLogs';
import AppConfig from './pages/AppConfig';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public auth routes */}
          <Route path="/auth/login"          element={<Login />} />
          <Route path="/auth/verify-otp"     element={<OTPVerify />} />
          <Route path="/auth/forgot-password" element={<ForgotPassword />} />
          <Route path="/auth/reset-password"  element={<ResetPassword />} />

          {/* Protected admin routes */}
          <Route path="/*" element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/"             element={<Dashboard />} />
                  <Route path="/orders"       element={<Orders />} />
                  <Route path="/inventory"    element={<Inventory />} />
                  <Route path="/users"        element={<Users />} />
                  <Route path="/stores"       element={<DarkStores />} />
                  <Route path="/partners"     element={<Partners />} />
                  <Route path="/catalog"      element={<Catalog />} />
                  <Route path="/payments"     element={<Payments />} />
                  <Route path="/coupons"      element={<Coupons />} />
                  <Route path="/flash-sales"  element={<FlashSales />} />
                  <Route path="/notifications" element={<Notifications />} />
                  <Route path="/analytics"    element={<Analytics />} />
                  <Route path="/audit-logs"   element={<AuditLogs />} />
                  <Route path="/app-config"   element={<AppConfig />} />
                  {/* Fallback */}
                  <Route path="*"             element={<Navigate to="/" replace />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
