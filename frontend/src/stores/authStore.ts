import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { UserRole } from '../types/user';

interface User {
    _id: string;
    username: string;
    role: 'ADMINISTRADOR' | 'JUNTA' | 'TRABAJADOR';
}

interface AuthState {
    token: string | null;
    user: User | null;
    setAuth: (token: string, user: User) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            token: null,
            user: null,
            setAuth: (token: string, user: User) => {
                set({
                    token,
                    user
                });
            },
            logout: () => {
                set({
                    token: null,
                    user: null
                });
            }
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => localStorage),
            skipHydration: false
        }
    )
);

// Forzar la hidratación al cargar
if (typeof window !== 'undefined') {
    useAuthStore.persist.rehydrate();
} 