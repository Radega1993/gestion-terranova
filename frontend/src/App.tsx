import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box, AppBar, Toolbar, Typography, Container, Button } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createTheme } from '@mui/material/styles';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import Dashboard from './components/dashboard/Dashboard';
import LogoutButton from './components/auth/LogoutButton';
import UsersList from './components/users/UsersList';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { UserRole } from './types/user';
import SociosList from './components/socios/SociosList';
import CreateSocioForm from './components/socios/CreateSocioForm';
import { Navbar } from './components/layout/Navbar';
import { InventoryView } from './components/inventory/InventoryView';
import VentasList from './components/ventas/VentasList';
import { ReservasList } from './components/reservas/ReservasList';
import { DeudasList } from './components/deudas/DeudasList';
import RecaudacionesList from './components/recaudaciones/RecaudacionesList';
import InvitacionesList from './components/invitaciones/InvitacionesList';

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
                  path="/deudas"
                  element={
                    <ProtectedRoute allowedRoles={[UserRole.ADMINISTRADOR, UserRole.JUNTA]}>
                      <DeudasList />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/reservas"
                  element={
                    <ProtectedRoute allowedRoles={[UserRole.ADMINISTRADOR, UserRole.JUNTA, UserRole.TRABAJADOR]}>
                      <ReservasList />
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
                  path="/inventory"
                  element={
                    <ProtectedRoute allowedRoles={[UserRole.ADMINISTRADOR, UserRole.TRABAJADOR]}>
                      <InventoryView />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/recaudaciones"
                  element={
                    <ProtectedRoute allowedRoles={[UserRole.ADMINISTRADOR, UserRole.JUNTA]}>
                      <RecaudacionesList />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/invitaciones"
                  element={
                    <ProtectedRoute allowedRoles={[UserRole.ADMINISTRADOR, UserRole.JUNTA]}>
                      <InvitacionesList />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/socios"
                  element={
                    <ProtectedRoute>
                      <SociosList />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/socios/create"
                  element={
                    <ProtectedRoute>
                      <CreateSocioForm />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/socios/editar/:id"
                  element={
                    <ProtectedRoute>
                      <CreateSocioForm editMode={true} />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/stock"
                  element={
                    <ProtectedRoute>
                      <div>Stock Module</div>
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
