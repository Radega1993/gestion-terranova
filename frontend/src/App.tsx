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
import AsociadosForm from './components/socios/AsociadosForm';
import { InventoryView } from './components/inventory/InventoryView';
import { Layout } from './components/layout/Layout';
import { ReservasList } from './components/reservas/ReservasList';
import './styles/sweetalert.css';

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
            <AppBar position="sticky">
              <Toolbar>
                <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                  Gestión Terranova
                </Typography>
                <LogoutButton />
              </Toolbar>
            </AppBar>
            <Container sx={{ pt: 4, flexGrow: 1 }}>
              <Routes>
                <Route path="/login" element={<LoginForm />} />
                <Route path="/register" element={<RegisterForm />} />
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <Dashboard />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
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
                <Route
                  path="/deudas"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <div>Deudas Module</div>
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
                <Route
                  path="/ventas"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <div>Ventas Module</div>
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
                  path="/socios/:id/asociados"
                  element={
                    <ProtectedRoute allowedRoles={[UserRole.ADMINISTRADOR, UserRole.JUNTA]}>
                      <Layout>
                        <AsociadosForm />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
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
                  path="/users"
                  element={
                    <ProtectedRoute allowedRoles={[UserRole.ADMINISTRADOR, UserRole.JUNTA]}>
                      <Layout>
                        <UsersList />
                      </Layout>
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
