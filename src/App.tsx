import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import PricingAndPromotions from './pages/PricingAndPromotions';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import ClientList from './pages/ClientList';
import ClientDetail from './pages/ClientDetail';
import Profile from './pages/Profile';
import EditProfile from './pages/EditProfile';
import BeersAndEquipment from './pages/BeersAndEquipment';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import PendingActivation from './pages/PendingActivation';
import SelectTenant from './pages/SelectTenant';
import AdminPanel from './pages/AdminPanel';
import AuthRedirect from './pages/AuthRedirect';
import Logout from './pages/Logout';
import { useStore } from './store/useStore';
import { ToastProvider } from './contexts/ToastContext';
import ToastContainer from './components/Toast/Toast';

function App() {
  const { initializeAuth, isLoading, isInitialized } = useStore();

  useEffect(() => {
    // Inicializar autenticación al cargar la aplicación
    initializeAuth().catch(() => {});
  }, []); // Solo ejecutar una vez al montar

  // Mostrar loading mientras se inicializa
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando BeCard...</p>
          <p className="text-sm text-gray-400">Inicializando autenticación</p>
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <Router>
        <ToastContainer />
        <Routes>
          {/* Rutas públicas (no requieren autenticación) */}
          <Route
            path="/login"
            element={
              <ProtectedRoute requireAuth={false}>
                <Login />
              </ProtectedRoute>
            }
          />
          <Route
            path="/auth-redirect"
            element={
              <ProtectedRoute requireAuth={false}>
                <AuthRedirect />
              </ProtectedRoute>
            }
          />
          <Route
            path="/logout"
            element={
              <ProtectedRoute requireAuth={false}>
                <Logout />
              </ProtectedRoute>
            }
          />
          <Route
            path="/register"
            element={
              <ProtectedRoute requireAuth={false}>
                <Register />
              </ProtectedRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <ProtectedRoute requireAuth={false}>
                <ForgotPassword />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reset-password"
            element={
              <ProtectedRoute requireAuth={false}>
                <ResetPassword />
              </ProtectedRoute>
            }
          />
          <Route
            path="/verify-email"
            element={
              <ProtectedRoute requireAuth={false}>
                <VerifyEmail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pending-activation"
            element={
              <ProtectedRoute requireAuth={false}>
                <PendingActivation />
              </ProtectedRoute>
            }
          />
          <Route
            path="/select-tenant"
            element={
              <ProtectedRoute>
                <SelectTenant />
              </ProtectedRoute>
            }
          />

          {/* Rutas protegidas (requieren autenticación) */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="pricing" element={<PricingAndPromotions />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
            <Route path="clients" element={<ClientList />} />
            <Route path="clients/:id" element={<ClientDetail />} />
            <Route path="profile" element={<Profile />} />
            <Route path="profile/edit" element={<EditProfile />} />
            <Route path="beers" element={<BeersAndEquipment />} />
          </Route>

          <Route
            path="/admin"
            element={
              <ProtectedRoute requireTenant={false} allowedRoles={['superadmin']}>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminPanel />} />
            <Route path="profile" element={<Profile />} />
            <Route path="profile/edit" element={<EditProfile />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Ruta por defecto - redirigir al login si no está autenticado */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </ToastProvider>
  );
}

export default App;
