# Dashboard de Monitoreo - Programa Oportunidad 14-24

Plataforma de analisis y visualizacion de datos para monitorear el impacto del programa social **Oportunidad 14-24** en Republica Dominicana. Proporciona una interfaz interactiva para visualizar estadisticas, mapas geograficos de cobertura y metricas de impacto social.

## Security

Do not commit `.env`. Copy `.env.example` and replace `VITE_API_TOKEN` with the value from the API administrator.

The committed `.env.example` value `YOUR_BEARER_TOKEN_HERE` is a placeholder, not a credential.

See `openspec/changes/project-health-sweep/specs/credential-incident-containment/spec.md` for the historical incident and rotation procedure.

## Caracteristicas Principales

- **Tablero de Estadisticas:** Visualizacion de participantes por genero, edad, provincia y estado
- **Dashboard de Impacto Social:** Metricas sobre reduccion de pobreza, prevencion de delincuencia y educacion tecnica
- **Mapa Interactivo:** Visualizacion coropletica a nivel de provincias, regiones y municipios
- **Gestion de Participantes:** Tabla paginada con filtros, busqueda en tiempo real y selector de columnas
- **Exportacion de Datos:** Descarga en formatos CSV, XLSX y JSON
- **Sincronizacion Automatica:** Detecta nuevos registros en la API cada 15 minutos
- **Control de Acceso RBAC:** Roles de Administrador, Supervisor y Consultor con permisos por ruta

## Tecnologias

- **Frontend:** React 19, TypeScript 5.8
- **Build Tool:** Vite 6
- **Estilos:** Tailwind CSS (CDN), Lucide React (iconos)
- **Visualizacion:** Recharts (graficos), Leaflet + react-leaflet (mapas)
- **Datos:** PapaParse (CSV), SheetJS (XLSX), IndexedDB via idb
- **Enrutamiento:** React Router v7 (HashRouter para integracion con .NET)
- **Autenticacion:** JWT via `window.__AUTH_TOKEN` (inyectado por servidor .NET)

## Instalacion y Ejecucion Local

```bash
npm install
cp .env.example .env  # Configurar VITE_API_TOKEN
npm run dev
```

La aplicacion estara disponible en `http://localhost:3000`.

## Integracion con .NET

1. Construir el proyecto: `npm run build`
2. Copiar el contenido de `dist/` al proyecto .NET como archivos estaticos
3. Configurar `VITE_BASE_PATH` si la app se sirve desde un subdirectorio
4. El servidor .NET debe inyectar el token JWT antes del `<div id="root">`:
   ```html
   <script>window.__AUTH_TOKEN = '<jwt>';</script>
   ```

El HashRouter no requiere URL rewriting del lado del servidor.

## Estructura del Proyecto

```
monitoreo-14-24/
├── components/     # Componentes UI (graficos, mapas, tabla, layout)
├── contexts/       # React Contexts (Dashboard, Auth, Filters)
├── hooks/          # Custom Hooks (useDashboardData, useFilters, etc.)
├── pages/          # Componentes de pagina por ruta
├── services/       # API, IndexedDB, exportacion
├── types/          # Definiciones de tipos TypeScript
├── utils/          # Utilidades y formateo
├── public/         # Assets estaticos (geojson, imagenes)
├── App.tsx         # Layout principal con Sidebar + Header + Outlet
├── router.tsx      # Configuracion de rutas (HashRouter)
└── index.tsx       # Punto de entrada
```
