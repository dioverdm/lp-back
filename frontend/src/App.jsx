import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, ThemeProvider, ToastProvider, CartProvider, useApp } from './context/AppContext.jsx';
import AppLayout  from './layouts/AppLayout.jsx';
import POSLayout  from './layouts/POSLayout.jsx';

import LoginPage    from './pages/auth/Login.jsx';
import RegisterPage from './pages/auth/Register.jsx';
import OnboardPage  from './pages/auth/Onboard.jsx';

import Dashboard    from './pages/dashboard/Dashboard.jsx';
import POSPage      from './pages/pos/POS.jsx';
import CatalogPage  from './pages/catalog/Catalog.jsx';
import InventoryPage from './pages/inventory/Inventory.jsx';
import OrdersPage   from './pages/orders/Orders.jsx';
import TeamPage     from './pages/settings/Team.jsx';
import SettingsPage from './pages/settings/Settings.jsx';
import StorePage    from './pages/public/Store.jsx';

function PrivateRoute({ children }) {
  const { state } = useApp();
  if (state.loading) return <div className="loading-screen"><div className="spinner spinner-lg" /></div>;
  if (!state.user)   return <Navigate to="/login" replace />;
  if (!state.company) return <Navigate to="/onboard" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { state } = useApp();
  if (state.loading) return <div className="loading-screen"><div className="spinner spinner-lg" /></div>;
  if (state.user && state.company) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/onboard"  element={<OnboardPage />} />
      <Route path="/@:slug"   element={<StorePage />} />

      {/* App (sidebar layout) */}
      <Route path="/" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
        <Route index          element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard"  element={<Dashboard />} />
        <Route path="catalog"    element={<CatalogPage />} />
        <Route path="inventory"  element={<InventoryPage />} />
        <Route path="orders"     element={<OrdersPage />} />
        <Route path="team"       element={<TeamPage />} />
        <Route path="settings"   element={<SettingsPage />} />
      </Route>

      {/* POS (full screen layout) */}
      <Route path="/pos" element={<PrivateRoute><CartProvider><POSLayout /></CartProvider></PrivateRoute>}>
        <Route index element={<POSPage />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <ToastProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </ToastProvider>
      </AppProvider>
    </ThemeProvider>
  );
}
