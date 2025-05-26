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
                    <ProtectedRoute>
                      <div>Deudas Module</div>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/reservas"
                  element={
                    <ProtectedRoute>
                      <div>Reservas Module</div>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/ventas"
                  element={
                    <ProtectedRoute>
                      <div>Ventas Module</div>
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
