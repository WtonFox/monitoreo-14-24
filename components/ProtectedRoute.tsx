import React, { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { UserRole, ROUTES } from '../types/routes';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ProtectedRouteProps {
  children: ReactNode;
  /** Optional override — if omitted the route path is looked up in ROUTE_PERMISSIONS */
  requiredRoles?: UserRole[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles,
}) => {
  const user = useAuthStore(s => s.user);
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const isAuthReady = useAuthStore(s => s.isAuthReady);
  const hasPermission = useAuthStore(s => s.hasPermission);
  const location = useLocation();

  // 1. Still checking auth state
  if (!isAuthReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600" />
          <p className="text-sm text-gray-500">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  // 2. Not authenticated — show inline message (in dev this never happens
  //    because of the dev fallback; in production .NET injects the token).
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-sm px-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m0 0v2m0-2h2m-2 0H10m9.364-7.364A9 9 0 1112 3a9 9 0 017.364 4.636z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            Sesión no iniciada
          </h2>
          <p className="text-sm text-gray-500">
            No se encontró una sesión activa. Si el problema persiste,
            contacta al administrador del sistema.
          </p>
        </div>
      </div>
    );
  }

  // 3. Check permission
  const route = location.pathname;
  const hasAccess = requiredRoles
    ? requiredRoles.includes(user!.role)
    : hasPermission(route);

  if (!hasAccess) {
    return <Navigate to={ROUTES.FORBIDDEN} replace />;
  }

  // 4. Authorized — render children
  return <>{children}</>;
};

export default ProtectedRoute;
