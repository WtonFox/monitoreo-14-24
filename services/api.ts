import { PaginationResult } from '../types';
import { API_BASE_URL, API_ENDPOINT, API_TOKEN } from '../constants';

// Caché en memoria para evitar peticiones repetidas a la API
const requestCache = new Map<
  string,
  { data: PaginationResult; timestamp: number }
>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Detectar si estamos en desarrollo (Vite dev server con proxy)
const isDevelopment = import.meta.env.DEV;

// Permite pasar un token personalizado para reintentos
export const fetchParticipants = async (
  pageIndex: number,
  pageSize: number,
  retryCount = 0,
  customToken?: string,
): Promise<PaginationResult> => {
  const activeToken = customToken || API_TOKEN;

  // Construir URL según el entorno
  let targetUrl: URL;

  if (isDevelopment) {
    // En desarrollo, usar el proxy de Vite (URL relativa)
    targetUrl = new URL(`${API_ENDPOINT}`, window.location.origin);
  } else {
    // En producción, usar la URL completa de la API
    const base = API_BASE_URL || window.location.origin;
    targetUrl = new URL(`${API_ENDPOINT}`, base);
  }

  targetUrl.searchParams.append('pageIndex', pageIndex.toString());
  targetUrl.searchParams.append('pageSize', pageSize.toString());
  // Cache buster para evitar que proxies sirvan páginas de error desactualizadas
  targetUrl.searchParams.append('_t', Date.now().toString());

  const urlString = targetUrl.toString();

  // 1. Verificar caché (ignorando el parámetro timestamp para la clave)
  const cacheKey = `${API_ENDPOINT}?pageIndex=${pageIndex}&pageSize=${pageSize}`;
  // Solo usar caché si se usa el token por defecto (seguridad)
  if (!customToken) {
    const cached = requestCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
  }

  // 2. Definir Estrategia única
  // Al haber configurado vercel.json y netlify.toml, la ruta /api...
  // será redirigida automáticamente por la plataforma (igual que hace Vite en dev).
  const strategies = [
    {
      name: isDevelopment ? 'ViteProxy' : 'DeployProxy',
      url: urlString,
    },
  ];

  let lastError: any = null;

  for (const strategy of strategies) {
    try {
      // Crear controlador para timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s de timeout por estrategia

      const fetchOptions: RequestInit = {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${activeToken}`,
        },
        signal: controller.signal,
      };

      const response = await fetch(strategy.url, fetchOptions);

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown Error');
        throw new Error(
          `HTTP ${response.status} [${strategy.name}]: ${errorText.slice(0, 100)}`,
        );
      }

      const data = await response.json();

      // Validar estructura de datos - aceptar items como array u objeto completo
      if (!data) {
        throw new Error('Invalid JSON structure received');
      }

      // Actualizar caché si es válido
      requestCache.set(cacheKey, { data, timestamp: Date.now() });

      return data;
    } catch (error: any) {
      lastError = error;
      // Solo registrar advertencia, continuar con la siguiente estrategia
      if (error.name !== 'AbortError') {
        console.warn(
          `Strategy '${strategy.name}' failed for page ${pageIndex}:`,
          error.message,
        );
      }
    }
  }

  // Lógica de reintento global (Exponential Backoff)
  const isAuthError =
    lastError?.message?.includes('HTTP 401') ||
    lastError?.message?.includes('HTTP 403');

  // Reintentar 3 veces para errores de red
  if (retryCount < 3 && !isAuthError) {
    const delay = 2000 * Math.pow(1.5, retryCount);
    console.log(`Retrying fetch for page ${pageIndex} in ${delay}ms...`);
    await wait(delay);
    return fetchParticipants(pageIndex, pageSize, retryCount + 1, activeToken);
  }

  throw new Error(
    lastError?.message ||
      'Network Error: Failed to connect to API via any strategy.',
  );
};

/**
 * Clear the in-memory API cache so the next fetch reaches the real API.
 */
export function clearApiCache(): void {
  requestCache.clear();
}
