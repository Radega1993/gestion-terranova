import { useAuthStore } from '../stores/authStore';

/**
 * Función helper para manejar fetch con autenticación y manejo automático de errores 401
 * Esta función centraliza el manejo de tokens expirados
 */
export const authenticatedFetch = async (
    url: string,
    options: RequestInit = {}
): Promise<Response> => {
    const token = useAuthStore.getState().token;
    
    // Preparar headers
    const headers = new Headers(options.headers);
    
    // Solo establecer Content-Type si no es FormData (para uploads)
    if (!(options.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
    }
    
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    // Realizar la petición
    const response = await fetch(url, {
        ...options,
        headers,
    });

    // Si recibimos un 401, manejar el cierre de sesión
    if (response.status === 401) {
        // Endpoints que pueden devolver 401 por razones de negocio (no por token inválido)
        const urlObj = new URL(url, window.location.origin);
        const endpointsIgnorados = [
            '/tiendas/mi-tienda',  // Puede devolver 401 si el usuario no tiene tienda asignada
        ];
        
        const debeIgnorar = endpointsIgnorados.some(endpoint => urlObj.pathname.includes(endpoint));
        
        if (!debeIgnorar) {
            const authStore = useAuthStore.getState();
            
            // Limpiar el token y el usuario del store
            authStore.logout();
            
            // Guardar mensaje de sesión expirada en localStorage para mostrarlo en el login
            localStorage.setItem('sessionExpired', 'true');
            
            // Redirigir al login
            // Usamos window.location para asegurar que se recargue la página y limpie el estado
            window.location.href = '/login';
            
            // Lanzar un error para que el código que llama pueda manejarlo
            throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        }
    }

    return response;
};

/**
 * Función helper para fetch con manejo automático de JSON y errores
 */
export const authenticatedFetchJson = async <T = any>(
    url: string,
    options: RequestInit = {}
): Promise<T> => {
    try {
        const response = await authenticatedFetch(url, options);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));
            throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
        }
        
        return response.json();
    } catch (error) {
        // Si el error es de sesión expirada, ya fue manejado en authenticatedFetch
        // Solo re-lanzar el error para que el código que llama pueda manejarlo
        throw error;
    }
};

