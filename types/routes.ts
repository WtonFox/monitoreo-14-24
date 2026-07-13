export const ROUTES = {
  ESTADISTICAS: '/estadisticas',
  IMPACTO_SOCIAL: '/impacto-social',
  MAPA_INTERACTIVO: '/mapa-interactivo',
  PARTICIPANTES: '/participantes',
  DIAGNOSTICO: '/diagnostico',
  INDICADORES: '/indicadores',
  INDICADORES_DEMOGRAFICOS: '/indicadores/demograficos',
  INDICADORES_TERRITORIALES: '/indicadores/territoriales',
  INDICADORES_PROGRAMA: '/indicadores/programa',
  INDICADORES_SOCIALES: '/indicadores/sociales',
  INDICADORES_CALIDAD: '/indicadores/calidad-dato',
  INDICADORES_VULNERABILIDAD: '/indicadores/vulnerabilidad',
  INDICADORES_COBERTURA: '/indicadores/cobertura-temporal',
  INDICADORES_NIVEL_EDUCATIVO: '/indicadores/nivel-educativo',
  INDICADORES_DESEMPENO_CENTRO: '/indicadores/desempeno-centro',
  FORBIDDEN: '/forbidden',
} as const;

export enum UserRole {
  ADMIN = 'admin',
  SUPERVISOR = 'supervisor',
  CONSULTOR = 'consultor',
}

export type RoutePermission = {
  roles: UserRole[];
};

export const ROUTE_PERMISSIONS: Record<string, RoutePermission> = {
  [ROUTES.ESTADISTICAS]: { roles: [UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.CONSULTOR] },
  [ROUTES.IMPACTO_SOCIAL]: { roles: [UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.CONSULTOR] },
  [ROUTES.MAPA_INTERACTIVO]: { roles: [UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.CONSULTOR] },
  [ROUTES.PARTICIPANTES]: { roles: [UserRole.ADMIN, UserRole.SUPERVISOR] },
  [ROUTES.DIAGNOSTICO]: { roles: [UserRole.ADMIN, UserRole.SUPERVISOR] },
  [ROUTES.INDICADORES]: { roles: [UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.CONSULTOR] },
  [ROUTES.INDICADORES_DEMOGRAFICOS]: { roles: [UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.CONSULTOR] },
  [ROUTES.INDICADORES_TERRITORIALES]: { roles: [UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.CONSULTOR] },
  [ROUTES.INDICADORES_PROGRAMA]: { roles: [UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.CONSULTOR] },
  [ROUTES.INDICADORES_SOCIALES]: { roles: [UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.CONSULTOR] },
  [ROUTES.INDICADORES_CALIDAD]: { roles: [UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.CONSULTOR] },
  [ROUTES.INDICADORES_VULNERABILIDAD]: { roles: [UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.CONSULTOR] },
  [ROUTES.INDICADORES_COBERTURA]: { roles: [UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.CONSULTOR] },
  [ROUTES.INDICADORES_NIVEL_EDUCATIVO]: { roles: [UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.CONSULTOR] },
  [ROUTES.INDICADORES_DESEMPENO_CENTRO]: { roles: [UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.CONSULTOR] },
};
