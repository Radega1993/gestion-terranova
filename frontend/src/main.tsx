import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { useAuthStore } from './stores/authStore';

// Forzar la hidratación del store de autenticación
useAuthStore.persist.rehydrate();

const currentPath = window.location.pathname;

if (currentPath !== '/login' && currentPath !== '/register') {
  const authState = useAuthStore.getState();
  if (!authState.token) {
    window.location.href = '/login';
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
