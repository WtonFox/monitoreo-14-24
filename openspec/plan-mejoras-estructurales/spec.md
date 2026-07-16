# Plan de Mejoras Estructurales — Monitoreo 14-24

> Rama: `feat/mejoras-estructurales`
> Estrategia: cada mejora en SDD auto-mode con pausa post-verify.
> Solo merge a `main` al completar las 10 mejoras.

---

## 📋 Índice

1. [Zustand — State Management](#1-zustand--state-management)
2. [Web Workers — Filtrado pesado off-main-thread](#2-web-workers--filtrado-pesado-off-main-thread)
3. [Notificaciones de Sincronización](#3-notificaciones-de-sincronización)
4. [PWA + Service Worker](#4-pwa--service-worker)
5. [Tests E2E (Playwright)](#5-tests-e2e-playwright)
6. [Dashboard Configurable](#6-dashboard-configurable)
7. [Reportes Exportables (PDF)](#7-reportes-exportables-pdf)
8. [Modo Comparativo](#8-modo-comparativo)
9. [Perfil de Participante Expandido](#9-perfil-de-participante-expandido)
10. [Historial de Cambios](#10-historial-de-cambios)

---

## Fase 1 — Fundación

### 1. Zustand — State Management

**Objetivo**: Reemplazar los 3 React Context (`DashboardContext`, `AuthContext`, `FiltersContext`) por stores de Zustand con suscripciones selectivas.

**Archivos a afectar**:

| Archivo | Cambio |
|---|---|
| `package.json` | Agregar `zustand` como dependencia |
| `contexts/DashboardContext.tsx` | Eliminar / migrar a store |
| `contexts/AuthContext.tsx` | Eliminar / migrar a store |
| `contexts/FiltersContext.tsx` | Eliminar / migrar a store |
| `stores/participantStore.ts` | **Nuevo** — datos + sync |
| `stores/authStore.ts` | **Nuevo** — auth token + login |
| `stores/filterStore.ts` | **Nuevo** — filtros globales |
| `stores/uiStore.ts` | **Nuevo** — sidebar, modales, preferencias |
| `App.tsx` | Eliminar providers, envolver con stores |
| `hooks/useDashboardData.ts` | Migrar a zustand actions |
| `hooks/useParticipantesFilters.ts` | Migrar a filterStore |
| `hooks/useMassExport.ts` | Leer de store en vez de context |
| `hooks/useAlerts.ts` | Leer de store en vez de prop drilling |
| `pages/*.tsx` | Todos los `useDashboard()` → `useParticipantStore()` |
| `components/*.tsx` | Todos los `useDashboard()` → store selectivo |

**Store design**:

```typescript
// participantStore — actions asincrónicas, datos crudos
interface ParticipantState {
  data: Participant[];
  isSyncing: boolean;
  syncStats: SyncStats;
  lastUpdated: Date | null;
  // actions
  startSync: () => Promise<void>;
  refreshData: () => Promise<void>;
}

// filterStore — filtros persistentes + derivados
interface FilterState {
  // raw filters
  search: string;
  provincia: string;
  municipio: string;
  // ... etc
  // computed (via middleware)
  filteredData: Participant[];
}
```

**Criterio de éxito**:
- La app funciona idéntico visualmente
- `DashboardProvider` ya no existe en el árbol
- Cada página se suscribe solo al slice que necesita

---

### 2. Web Workers — Filtrado pesado

**Objetivo**: Mover el filtrado de participantes (provincia, municipio, sexo, año, búsqueda textual) a un Web Worker para no bloquear el main thread.

**Archivos**:

| Archivo | Cambio |
|---|---|
| `workers/filterWorker.ts` | **Nuevo** — worker que recibe data + filtros, devuelve resultado |
| `hooks/useFilterWorker.ts` | **Nuevo** — hook que envía al worker y recibe resultados |
| `stores/filterStore.ts` | Conectar al worker en vez de filtrar inline |
| `pages/Participantes.tsx` | Usar `useFilterWorker` |
| `pages/Alertas.tsx` | Idem |

**API del worker**:

```typescript
// Mensaje entrante
interface FilterRequest {
  data: Participant[];
  filters: {
    search: string;
    provincia: string;
    municipio: string;
    sexo: string;
    year: string;
    estado: string;
    // ...
  };
}

// Mensaje saliente
interface FilterResponse {
  filtered: Participant[];
  duration: number; // ms
}
```

**Criterio de éxito**:
- Filtrado de 10K+ registros sin congelar la UI
- Fallback síncrono si el worker no carga

---

### 3. Notificaciones de Sincronización

**Objetivo**: Notificar al usuario cuando la sincronización de datos complete, usando la Browser Notification API.

**Archivos**:

| Archivo | Cambio |
|---|---|
| `hooks/useSyncNotifications.ts` | **Nuevo** — escucha estado de sync y dispara notificación |
| `App.tsx` | Usar el hook |
| `stores/participantStore.ts` | Exponer evento de sync-complete |

**Comportamiento**:
- Pedir permiso de notificación una vez (al primer sync exitoso)
- Mostrar: `"Sincronización completa: 1,234 participantes cargados"`
- No mostrar si la pestaña está activa y visible (usar `document.visibilityState`)
- Configurable desde UI (opt-out)

**Criterio de éxito**:
- Notificación aparece al completar sync con pestaña en background
- No molesta si el usuario está activo en la app

---

## Fase 2 — Calidad de vida + Performance

### 4. PWA + Service Worker

**Objetivo**: Convertir la app en una Progressive Web App instalable con soporte offline total.

**Archivos**:

| Archivo | Cambio |
|---|---|
| `package.json` | Agregar `vite-plugin-pwa` |
| `vite.config.ts` | Configurar plugin PWA |
| `public/manifest.json` | **Nuevo** o generar via plugin |
| `workers/sw.ts` | Service worker custom si es necesario |
| `components/InstallPrompt.tsx` | **Nuevo** — botón "Instalar app" |
| `index.html` | Meta tags para PWA |

**Requisitos**:
- Service worker cachea assets (App Shell pattern)
- IndexedDB provee datos offline
- Pantalla de fallback offline
- Iconos en múltiples tamaños (192px, 512px)
- Tema color: `#1e3a5f` (azul del header)

**Criterio de éxito**:
- Lighthouse PWA audit ≥ 90
- App instalable en Chrome/Edge móvil y desktop
- Navegación offline con datos cacheados

---

### 5. Tests E2E (Playwright)

**Objetivo**: Establecer cobertura E2E con Playwright para rutas críticas.

**Archivos**:

| Archivo | Cambio |
|---|---|
| `package.json` | Agregar `@playwright/test` |
| `playwright.config.ts` | **Nuevo** — configuración |
| `e2e/` | **Nuevo** — carpeta de tests |
| `.github/workflows/e2e.yml` | **Nuevo** — CI opcional |

**Tests a cubrir**:
1. Login con token válido → redirige a dashboard
2. Login con token inválido → muestra error
3. Navegación entre todas las rutas principales
4. Tabla de participantes: carga y renderiza filas
5. Modal de detalle de participante: abre y cierra
6. Filtros de participantes: provincia, búsqueda, año
7. Alertas: se renderizan tarjetas
8. Export: modal de exportación masiva

**Criterio de éxito**:
- `npx playwright test` pasa en CI
- Cobertura de las rutas principales

---

## Fase 3 — Features de valor

### 6. Dashboard Configurable

**Objetivo**: Permitir al usuario elegir qué gráficos/widgets ver en el dashboard y en qué orden.

**Archivos**:

| Archivo | Cambio |
|---|---|
| `stores/uiStore.ts` | Agregar persisted `dashboardLayout` |
| `components/ChartsSection.tsx` | Refactorizar para leer layout del store |
| `components/DashboardEditor.tsx` | **Nuevo** — toggle + reordenar widgets |
| `pages/Estadisticas.tsx` | Leer de store |

**UX**:
- Botón "Configurar dashboard" en estadísticas
- Modal/panel con toggle por widget
- Orden por drag (opcional v1: orden fijo, solo toggle)
- Persistencia en localStorage vía middleware `persist`

**Widgets disponibles**:
- Evolución de registros
- Evolución de inclusiones
- Mapa geográfico
- Gráfico de localización
- Gráfico de género
- Gráfico de edad
- Gráfico de estado
- Vulnerabilidades
- Estado civil
- Nivel de estudio
- Programas sociales
- Discapacidades y enfermedades

**Criterio de éxito**:
- Ocultar widgets funciona y persiste al recargar
- UI clara de qué está visible

---

### 7. Reportes Exportables (PDF)

**Objetivo**: Generar reportes PDF descargables con datos filtrados y gráficos.

**Archivos**:

| Archivo | Cambio |
|---|---|
| `package.json` | Agregar `@react-pdf/renderer` o `jspdf` |
| `services/pdfExport.ts` | **Nuevo** — lógica de generación |
| `components/ExportPDFButton.tsx` | **Nuevo** — botón de descarga |
| `pages/Participantes.tsx` | Agregar botón |
| `pages/Alertas.tsx` | Agregar botón |

**Formatos**:
- Reporte de participantes filtrados: tabla + totales + fecha
- Reporte de alertas: listado con severidad y recomendaciones
- Reporte de dashboard: gráficos embebidos como imágenes

**Criterio de éxito**:
- PDF se genera correctamente con datos actuales
- El PDF es legible y profesional

---

### 8. Modo Comparativo

**Objetivo**: Comparar dos conjuntos de datos lado a lado (provincias, períodos, centros).

**Archivos**:

| Archivo | Cambio |
|---|---|
| `pages/Comparativo.tsx` | **Nueva** — página de comparación |
| `router.tsx` | Agregar ruta `/comparativo` |
| `hooks/useComparativo.ts` | **Nuevo** — selección de dos filtros |
| `components/ComparativoChart.tsx` | **Nuevo** — dual chart |
| `workers/filterWorker.ts` | Procesar dos datasets en paralelo |

**UX**:
- Selector A: filtro (provincia/año/centro)
- Selector B: filtro (provincia/año/centro)
- KPIs lado a lado (totales, género, edades, deserción)
- Gráficos duplicados comparando A vs B

**Criterio de éxito**:
- Dos conjuntos se renderizan simultáneamente
- Diferencia porcentual visible en cada KPI

---

## Fase 4 — Datos expandidos

### 9. Perfil de Participante Expandido

**Objetivo**: Mejorar el modal de detalle del participante con timeline visual, datos derivados y más contexto.

**Archivos**:

| Archivo | Cambio |
|---|---|
| `components/ParticipantDetailModal.tsx` | Agregar timeline, secciones colapsables |
| `components/ParticipantTimeline.tsx` | **Nuevo** — línea de tiempo visual |
| `stores/uiStore.ts` | Preferencias de perfil |

**Timeline**:
- Hito: Fecha de Registro
- Hito: Fecha de Inclusión
- Hito: Edad al registrar
- Hoy: línea hasta la fecha actual
- Coloreado por estado

**Criterio de éxito**:
- Timeline se ve clara e informativa
- Modal mantiene rendimiento aceptable

---

### 10. Historial de Cambios

**Objetivo**: Mostrar modificaciones históricas del participante si la API lo expone.

**Archivos**:

| Archivo | Cambio |
|---|---|
| `services/api.ts` | Endpoint de historial |
| `components/ParticipantChangeLog.tsx` | **Nuevo** |
| `hooks/useChangeLog.ts` | **Nuevo** |

> ⚠️ **BLOQUEADO**: Depende de que la API exponga datos de modificaciones.
> Sin API coverage, no se implementa.

**Criterio de éxito**:
- Lista de cambios con fecha, campo modificado, valor anterior → nuevo

---

## Flujo de trabajo

```
Por cada mejora (1–10):
  ├── SDD: /sdd-new → spec → design → tasks
  │     └── Ejecución con sub-agentes (yo orquesto)
  ├── SDD: /sdd-apply (auto-mode)
  │     └── Sub-agentes implementan
  ├── SDD: /sdd-verify
  │     └── Sub-agentes verifican
  ├── ⏸️ PAUSA — revisión del usuario
  │     ├── ✅ Aprueba → guardar memoria + commit a branch
  │     └── ❌ Ajustes → corregir, re-verify
  └── Pasar a siguiente mejora

Al completar todas:
  └── git merge feat/mejoras-estructurales → main → push → deploy
```

## Convenciones de rama

- Rama de trabajo: `feat/mejoras-estructurales`
- Commits por mejora: `feat: [número] [nombre]` — ej. `feat: 01 zustand state management`
- Sin commits directos a `main` hasta el final

## Skills a cargar por mejora

Cada sub-agente recibe el spec de esta mejora + los skills relevantes:

| Mejora | Skills |
|---|---|
| 01 Zustand | `sdd-apply` |
| 02 Web Workers | `sdd-apply` |
| 03 Notificaciones | `sdd-apply` |
| 04 PWA | `sdd-apply` + skill PWA |
| 05 E2E | `sdd-apply` + `go-testing` |
| 06 Dashboard configurable | `sdd-apply` |
| 07 PDF | `sdd-apply` |
| 08 Comparativo | `sdd-apply` |
| 09 Perfil expandido | `sdd-apply` |
| 10 Historial | `sdd-apply` |

---

## Historial de ejecución

| # | Mejora | Estado | Notas |
|---|---|---|---|
| 1 | Zustand | ✅ Completado | 4 stores, 3 contexts eliminados |
| 2 | Web Workers | ✅ Completado | Filtrado off-main-thread + fallback |
| 3 | Sync Notifications | ✅ Completado | Browser Notification API |
| 4 | PWA + Service Worker | ✅ Completado | vite-plugin-pwa, instalable offline |
| 5 | E2E Playwright | ✅ Completado | 25 tests en 4 specs |
| 6 | Dashboard Configurable | ✅ Completado | 12 widgets toggleables |
| 7 | PDF Reports | ✅ Completado | jsPDF, logo, branding, flushSync |
| 8 | Modo Comparativo | ✅ Completado | 7 dimensiones, 8 charts, KPIs con delta |
| 9 | Perfil Expandido | ✅ Completado | Timeline horizontal con hitos reales |
| 10 | Historial de Cambios | ⏭️ No implementado | La API no expone modificaciones |

**Merge a `main`**: `d8aba11` — 16 jul 2026
**Despliegue**: Automático vía Vercel
