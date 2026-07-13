import React, { createContext, useContext, useMemo, useCallback, useState, useEffect, type ReactNode } from 'react';
import { UserRole, ROUTE_PERMISSIONS } from '../types/routes';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AuthUser {
  role: UserRole;
  name?: string;
  exp?: number; // token expiration timestamp (seconds since epoch)
}

export interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAuthReady: boolean; // true after the initial token check completes
  hasPermission: (route: string) => boolean;
  login: (token: string) => void;
  logout: () => void;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const AuthContext = createContext<AuthContextValue | null>(null);

// ---------------------------------------------------------------------------
// JWT helpers (no external library needed — just base64 decode the payload)
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'auth_token';

const DEFAULT_ROLE = UserRole.ADMIN;

function decodeToken(token: string): AuthUser | null {
  try {
    // Trim whitespace — avoids issues when pasting tokens with accidental spaces
    const cleanToken = token.trim();
    const parts = cleanToken.split('.');
    if (parts.length !== 3) return null;

    const payload = parts[1];
    // JWTs use base64url — convert back to standard base64
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(atob(base64));

    // Check expiration
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      return null;
    }

    return {
      // The VITE_API_TOKEN JWT may not include a role claim — default to ADMIN
      role: (decoded.role as UserRole) || DEFAULT_ROLE,
      name: decoded.name,
      exp: decoded.exp,
    };
  } catch {
    return null;
  }
}

function readToken(): AuthUser | null {
  // 1. Check window.__AUTH_TOKEN (set by .NET server-side)
  const globalToken = (window as { __AUTH_TOKEN?: string }).__AUTH_TOKEN;
  if (globalToken) {
    const user = decodeToken(globalToken);
    if (user) return user;
    // Token expired — clear it
    delete (window as { __AUTH_TOKEN?: string }).__AUTH_TOKEN;
  }

  // 2. Fallback to localStorage
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    const user = decodeToken(stored);
    if (user) return user;
    // Token expired — clear it
    localStorage.removeItem(STORAGE_KEY);
  }

  return null;
}

// ---------------------------------------------------------------------------
// Dev fallback
// ---------------------------------------------------------------------------

function getDevFallbackUser(): AuthUser | null {
  // Only apply in development / when running `npm run dev`
  if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
    // Allow overriding the role via URL hash param for testing:
    //   http://localhost:3000/#/?role=supervisor
    const params = new URLSearchParams(
      window.location.hash.split('?')[1] || '',
    );
    const roleParam = params.get('role');
    if (
      roleParam &&
      Object.values(UserRole).includes(roleParam as UserRole)
    ) {
      return { role: roleParam as UserRole, name: 'Dev User' };
    }
    // Default dev user: admin
    return { role: UserRole.ADMIN, name: 'Dev Admin' };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Production API token fallback — uses VITE_API_TOKEN for auth when deployed
// ---------------------------------------------------------------------------

function getApiTokenUser(): AuthUser | null {
  const apiToken = import.meta.env.VITE_API_TOKEN as string | undefined;
  if (!apiToken) return null;

  const user = decodeToken(apiToken);
  if (!user) return null;

  // Persist to localStorage so the token survives soft refreshes
  try {
    localStorage.setItem(STORAGE_KEY, apiToken);
  } catch {
    // localStorage may be unavailable (private browsing, quota, etc.)
  }

  return user;
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // On mount: check for existing token
  useEffect(() => {
    let resolvedUser = readToken();

    if (!resolvedUser) {
      resolvedUser = getDevFallbackUser();
    }

    // Production fallback: use VITE_API_TOKEN from env vars for auth
    if (!resolvedUser) {
      resolvedUser = getApiTokenUser();
    }

    setUser(resolvedUser);
    setIsAuthReady(true);
  }, []);

  const hasPermission = useCallback(
    (route: string): boolean => {
      if (!user) return false;

      const permission = ROUTE_PERMISSIONS[route];
      if (!permission) return false; // route not in the permission matrix

      return permission.roles.includes(user.role);
    },
    [user],
  );

  const login = useCallback((token: string) => {
    const decoded = decodeToken(token);
    if (decoded) {
      localStorage.setItem(STORAGE_KEY, token);
      (window as { __AUTH_TOKEN?: string }).__AUTH_TOKEN = token;
      setUser(decoded);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    delete (window as { __AUTH_TOKEN?: string }).__AUTH_TOKEN;
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isAuthReady,
      hasPermission,
      login,
      logout,
    }),
    [user, isAuthReady, hasPermission, login, logout],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};
