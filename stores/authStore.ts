import { create } from 'zustand';
import { UserRole, ROUTE_PERMISSIONS } from '../types/routes';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AuthUser {
    role: UserRole;
    name?: string;
    exp?: number; // token expiration timestamp (seconds since epoch)
}

interface AuthState {
    user: AuthUser | null;
    isAuthenticated: boolean;
    isAuthReady: boolean;
    hasPermission: (route: string) => boolean;
    login: (token: string) => void;
    logout: () => void;
    init: () => void;
}

// ---------------------------------------------------------------------------
// JWT helpers (no external library needed — just base64 decode the payload)
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'auth_token';
const DEFAULT_ROLE = UserRole.ADMIN;

function decodeToken(token: string): AuthUser | null {
    try {
        const cleanToken = token.trim();
        const parts = cleanToken.split('.');
        if (parts.length !== 3) return null;

        const payload = parts[1];
        const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
        const decoded = JSON.parse(atob(base64));

        if (decoded.exp && decoded.exp * 1000 < Date.now()) {
            return null;
        }

        return {
            role: (decoded.role as UserRole) || DEFAULT_ROLE,
            name: decoded.name,
            exp: decoded.exp,
        };
    } catch {
        return null;
    }
}

function readToken(): AuthUser | null {
    const globalToken = (window as { __AUTH_TOKEN?: string }).__AUTH_TOKEN;
    if (globalToken) {
        const user = decodeToken(globalToken);
        if (user) return user;
        delete (window as { __AUTH_TOKEN?: string }).__AUTH_TOKEN;
    }

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        const user = decodeToken(stored);
        if (user) return user;
        localStorage.removeItem(STORAGE_KEY);
    }

    return null;
}

function getDevFallbackUser(): AuthUser | null {
    if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
        const params = new URLSearchParams(
            window.location.hash.split('?')[1] || '',
        );
        const roleParam = params.get('role');
        if (roleParam && Object.values(UserRole).includes(roleParam as UserRole)) {
            return { role: roleParam as UserRole, name: 'Dev User' };
        }
        return { role: UserRole.ADMIN, name: 'Dev Admin' };
    }
    return null;
}

function getApiTokenUser(): AuthUser | null {
    const apiToken = import.meta.env.VITE_API_TOKEN as string | undefined;
    if (!apiToken) return null;

    const user = decodeToken(apiToken);
    if (!user) return null;

    try {
        localStorage.setItem(STORAGE_KEY, apiToken);
    } catch {
        // localStorage may be unavailable
    }

    return user;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    isAuthenticated: false,
    isAuthReady: false,

    hasPermission: (route: string): boolean => {
        const { user } = get();
        if (!user) return false;

        const permission = ROUTE_PERMISSIONS[route];
        if (!permission) return false;

        return permission.roles.includes(user.role);
    },

    login: (token: string) => {
        const decoded = decodeToken(token);
        if (decoded) {
            localStorage.setItem(STORAGE_KEY, token);
            (window as { __AUTH_TOKEN?: string }).__AUTH_TOKEN = token;
            set({ user: decoded, isAuthenticated: true });
        }
    },

    logout: () => {
        localStorage.removeItem(STORAGE_KEY);
        delete (window as { __AUTH_TOKEN?: string }).__AUTH_TOKEN;
        set({ user: null, isAuthenticated: false });
    },

    init: () => {
        let resolvedUser = readToken();

        if (!resolvedUser) {
            resolvedUser = getDevFallbackUser();
        }

        if (!resolvedUser) {
            resolvedUser = getApiTokenUser();
        }

        set({
            user: resolvedUser,
            isAuthenticated: resolvedUser !== null,
            isAuthReady: true,
        });
    },
}));
