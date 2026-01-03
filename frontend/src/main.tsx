import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { useAuthStore } from './stores/authStore';

// Suprimir warnings específicos de React 19 con Material-UI v5
// Estos warnings son conocidos y no afectan la funcionalidad
// Se resolverán cuando Material-UI actualice su código para React 19
if (import.meta.env.DEV) {
  const originalWarn = console.warn;
  const originalError = console.error;
  
  console.warn = (...args: any[]) => {
    const message = args[0]?.toString() || '';
    // Filtrar warnings específicos de React 19 ref deprecation
    if (
      message.includes('Accessing element.ref was removed in React 19') ||
      message.includes('element.ref was removed') ||
      message.includes('ref is now a regular prop')
    ) {
      return; // No mostrar estos warnings
    }
    originalWarn.apply(console, args);
  };
  
  console.error = (...args: any[]) => {
    const message = args[0]?.toString() || '';
    // También filtrar errores relacionados con ref deprecation
    if (
      message.includes('Accessing element.ref was removed in React 19') ||
      message.includes('element.ref was removed') ||
      message.includes('ref is now a regular prop')
    ) {
      return; // No mostrar estos errores
    }
    originalError.apply(console, args);
  };
}

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
