import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { theme } from './theme';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import Dashboard from './components/dashboard/Dashboard';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { UserRole } from './types/user';
import SociosList from './components/socios/SociosList';
import CreateSocioForm from './components/socios/CreateSocioForm';
import { InventoryView } from './components/inventory/InventoryView';
import UsersList from './components/users/UsersList';
import { Layout } from './components/layout/Layout';
import { ReservasList } from './components/reservas/ReservasList';
import './styles/sweetalert.css';

// Create a client
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Routes>
            {/* Rutas públicas */}
            <Route path="/login" element={<LoginForm />} />
            <Route path="/register" element={<RegisterForm />} />

            {/* Rutas protegidas */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Rutas que requieren rol específico */}
            <Route
              path="/stock"
              element={
                <ProtectedRoute allowedRoles={[UserRole.ADMINISTRADOR, UserRole.JUNTA, UserRole.TRABAJADOR]}>
                  <Layout>
                    <InventoryView />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/socios"
              element={
                <ProtectedRoute allowedRoles={[UserRole.ADMINISTRADOR, UserRole.JUNTA]}>
                  <Layout>
                    <SociosList />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/socios/crear"
              element={
                <ProtectedRoute allowedRoles={[UserRole.ADMINISTRADOR, UserRole.JUNTA]}>
                  <Layout>
                    <CreateSocioForm />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/socios/editar/:id"
              element={
                <ProtectedRoute allowedRoles={[UserRole.ADMINISTRADOR, UserRole.JUNTA]}>
                  <Layout>
                    <CreateSocioForm editMode={true} />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/users"
              element={
                <ProtectedRoute allowedRoles={[UserRole.ADMINISTRADOR, UserRole.JUNTA]}>
                  <Layout>
                    <UsersList />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/reservas"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ReservasList />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Redirección por defecto */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
