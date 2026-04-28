import axios, { AxiosError } from 'axios';
import { API_BASE_URL } from '../config';
import { useAuthStore } from '../stores/authStore';

export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

api.interceptors.request.use((config) => {
    // Obtener el token del store de Zustand
    const token = useAuthStore.getState().token;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        // Si recibimos un 401 (No autorizado), normalmente token expirado/ inválido.
        if (error.response?.status === 401) {
            // Verificar si el error es específicamente de token expirado
            const errorData = error.response?.data as any;
            const errorMessage = Array.isArray(errorData?.message)
                ? errorData.message.join(' ').toLowerCase()
                : (errorData?.message || '').toLowerCase();
            const isTokenExpired = errorData?.code === 'TOKEN_EXPIRED' ||
                                  errorMessage.includes('expirado') ||
                                  errorMessage.includes('expired');
            const isPermissionError = errorMessage.includes('permiso') || errorMessage.includes('acceso denegado');
            
            // Endpoints que pueden devolver 401 por razones de negocio (no por token inválido)
            // Estos no deben cerrar la sesión automáticamente
            const url = error.config?.url || '';
            const endpointsIgnorados = [
                '/tiendas/mi-tienda',  // Puede devolver 401 si el usuario no tiene tienda asignada
                '/trabajadores/mi-tienda',  // Puede devolver 401 si el usuario no tiene tienda asignada
            ];
            
            const debeIgnorar = endpointsIgnorados.some(endpoint => url.includes(endpoint));
            
            if (!debeIgnorar && !isPermissionError) {
                const authStore = useAuthStore.getState();
                
                // Limpiar el token y el usuario del store
                authStore.logout();
                
                // Guardar mensaje de sesión expirada en localStorage para mostrarlo en el login
                localStorage.setItem('sessionExpired', 'true');
                
                // Si es un token expirado, guardar información adicional
                if (isTokenExpired) {
                    localStorage.setItem('tokenExpired', 'true');
                }
                
                // Redirigir al login
                // Usamos window.location para asegurar que se recargue la página y limpie el estado
                window.location.href = '/login';
            }
        }
        
        return Promise.reject(error);
    }
); 