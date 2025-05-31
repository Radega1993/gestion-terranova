import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box, Container } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createTheme } from '@mui/material/styles';
import { useAuthStore } from './stores/authStore';
import { UserRole } from './types/user';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import Dashboard from './components/dashboard/Dashboard';
import SociosList from './components/socios/SociosList';
import CreateSocioForm from './components/socios/CreateSocioForm';
import { Navbar } from './components/layout/Navbar';
import { InventoryView } from './components/inventory/InventoryView';
import VentasList from './components/ventas/VentasList';
import { ReservasList } from './components/reservas/ReservasList';
import UsersList from './components/users/UsersList';

// Create a client
const queryClient = new QueryClient();

// Create a theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

// Componente para proteger rutas
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}> = ({ children, allowedRoles }) => {
  const { token, user } = useAuthStore();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Navbar />
            <Container sx={{ pt: 4, flexGrow: 1 }}>
              <Routes>
                <Route path="/login" element={<LoginForm />} />
                <Route path="/register" element={<RegisterForm />} />
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/socios"
                  element={
                    <ProtectedRoute allowedRoles={[UserRole.ADMINISTRADOR, UserRole.JUNTA]}>
                      <SociosList />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/socios/create"
                  element={
                    <ProtectedRoute allowedRoles={[UserRole.ADMINISTRADOR, UserRole.JUNTA]}>
                      <CreateSocioForm />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/socios/editar/:id"
                  element={
                    <ProtectedRoute allowedRoles={[UserRole.ADMINISTRADOR, UserRole.JUNTA]}>
                      <CreateSocioForm editMode={true} />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/inventory"
                  element={
                    <ProtectedRoute allowedRoles={[UserRole.ADMINISTRADOR, UserRole.TRABAJADOR]}>
                      <InventoryView />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/ventas"
                  element={
                    <ProtectedRoute allowedRoles={[UserRole.ADMINISTRADOR, UserRole.TRABAJADOR]}>
                      <VentasList />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/reservas"
                  element={
                    <ProtectedRoute>
                      <ReservasList />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/users"
                  element={
                    <ProtectedRoute allowedRoles={[UserRole.ADMINISTRADOR, UserRole.JUNTA]}>
                      <UsersList />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </Container>
          </Box>
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
