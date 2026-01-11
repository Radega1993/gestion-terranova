import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { UserRole, User } from '../types/user';

interface AuthState {
    token: string | null;
    user: User | null;
    userRole: UserRole | null;
    setAuth: (token: string, user: User) => void;
    logout: () => void;
    isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            token: null,
            user: null,
            userRole: null,
            setAuth: (token: string, user: User) => {
                set({
                    token,
                    user,
                    userRole: user.role
                });
            },
            logout: () => {
                set({
                    token: null,
                    user: null,
                    userRole: null
                });
            },
            isAuthenticated: () => {
                const state = get();
                return !!state.token && !!state.user;
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