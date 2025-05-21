import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

// Crear una instancia de axios con la URL base
const axiosInstance = axios.create({
    baseURL: 'http://localhost:3000',
});

// Interceptor para añadir el token a todas las peticiones
axiosInstance.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().token;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor para manejar errores de autenticación
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            useAuthStore.getState().logout();
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default axiosInstance; 