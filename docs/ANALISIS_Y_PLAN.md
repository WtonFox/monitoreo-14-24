# Análisis Técnico y Plan de Trabajo — Monitoreo 14-24

> Documento de análisis, discusión y planificación. No incluye implementación.
> Fecha: Julio 2026

---

## 1. Resumen Ejecutivo

Se realizó un análisis completo del sistema de monitoreo para identificar:

- Estructura actual de navegación (rutas, tabs, dropdowns)
- Indicadores existentes y su clasificación
- Variables disponibles en la API vs. las que existen en la base de datos
- Oportunidades de mejora en la organización de la UI
- Lineamientos para un futuro sistema de alertas

El sistema actual consume una API que expone ~28 campos del participante. La base de datos subyacente tiene ~40 tablas con información mucho más rica (seguimiento, cohortes, empleadores, motivos de abandono, etc.).

---

## 2. Estructura Actual de Navegación

### 2.1 Sidebar (navegación principal)

```
Monitoreo 14-24
├── 📊 Estadísticas          → /estadisticas
├── 📈 Indicadores           → /indicadores (y sub-rutas)
├── 🌍 Impacto Social        → /impacto-social
├── 🗺️ Mapa Interactivo     → /mapa-interactivo
├── 📋 Participantes         → /participantes
└── 🔍 Diagnóstico           → /diagnostico
```

### 2.2 Tabs de Indicadores (IndicadoresLayout)

**4 tabs fijos (MAIN_TABS):**

| Tab | Ruta | Icono |
|-----|------|-------|
| Resumen | `/indicadores` | LayoutDashboard |
| Demográficos | `/indicadores/demograficos` | Users |
| Territoriales | `/indicadores/territoriales` | MapPin |
| Estado del Programa | `/indicadores/programa` | Activity |

**9 tabs en dropdown "Más indicadores" (MORE_TABS) — actualmente SIN agrupación:**

| # | Tab | Ruta | Categoría Lógica |
|---|-----|------|-------------------|
| 1 | Calidad del Dato | `/indicadores/calidad-dato` | Datos y Calidad |
| 2 | Vulnerabilidad | `/indicadores/vulnerabilidad` | Riesgo Social |
| 3 | Cobertura Temporal | `/indicadores/cobertura-temporal` | Cobertura |
| 4 | Nivel Educativo | `/indicadores/nivel-educativo` | Educación |
| 5 | Desempeño Centro | `/indicadores/desempeno-centro` | Operaciones |
| 6 | Centros sin Menores | `/indicadores/centros-sin-menores` | Cobertura |
| 7 | Deserción | `/indicadores/desercion` | Riesgo Social |
| 8 | Registro Diario | `/indicadores/registro-diario` | Operaciones |
| 9 | Calidad ND | `/indicadores/calidad-nd` | Datos y Calidad |

### 2.3 Problema Identificado

El dropdown de "Más indicadores" muestra 9 ítems en una lista plana sin separadores. A medida que crezca (y va a crecer con nuevas variables de BD), se vuelve difícil de escanear. Carece de jerarquía visual.

---

## 3. Propuesta de Reorganización de Tabs

### 3.1 Tabs fijos (se mantienen)

Los 4 tabs fijos actuales cubren las dimensiones fundamentales del monitoreo: **visión general → quiénes → dónde → cómo va el programa**. Se propone mantenerlos.

### 3.2 Dropdown "Más indicadores" con separadores

Se agruparán los 9 indicadores actuales en 4 grupos con separadores visuales:

**Datos y Calidad**
- Calidad del Dato
- Calidad ND
- Centros sin Menores

**Riesgo Social**
- Vulnerabilidad
- Deserción

**Educación y Cobertura**
- Nivel Educativo
- Cobertura Temporal

**Operaciones y Seguimiento**
- Registro Diario
- Desempeño Centro

### 3.3 Consideraciones Adicionales

- Existe un `SocialesBoard.tsx` en disco marcado como dead code (`@ts-nocheck`). Si revive, iría en "Riesgo Social".
- Si se agregan tablas como Seguimiento o Auditoría desde la BD, crear nuevos grupos.
- La ruta `/indicadores/sociales` actualmente redirige a `/indicadores`.

---

## 4. Variables Actuales vs. Base de Datos

### 4.1 Variables actualmente disponibles en el sistema (tipo Participant)

```
id, nombres, apellidos, cedula, edad, fechaNacimiento, fechaRegistro,
fechaInclusion, tutor, cedulaTutor, vulnerabilidades, estado, sexo,
provincia, municipio, centro, direccion, rutaFormativa, telefonos,
telefonosResponsable, edadRegistro, estadoCivil, nivelEstudio,
alergias, discapacidades, enfermedades, programasSociales
```

**Total: ~28 campos.**

### 4.2 Variables existentes en la BD pero NO disponibles en la API actual

| Variable | Tabla BD | Relevancia | Impacto si se agrega |
|----------|----------|-----------|---------------------|
| **sector_id → Sector** | Persona → Sector | **Crítica** | Ya identificada como PENDIENTE en indicadores territoriales. Permite análisis por barrio/sector. |
| **fechaExclusion** | Participante | **Crítica** | Permite tracking real de deserción (no solo estado), tendencias temporales de abandono. |
| **cohorte_id → Cohorte** | Participante → Cohorte | **Alta** | Análisis por cohortes, seguimiento de grupos a través del tiempo. Esencial para evaluaciones. |
| **motivoAbandonoEscolar_id → MotivoAbandonoEscolar** | ParticipanteMotivoAbandono | **Alta** | Identificar causas raíz de deserción escolar. |
| **Seguimiento / ParticipanteSeguimiento** | Seguimiento | **Alta** | Tracking de intervenciones, visitas, llamadas. Base para sistema de alertas. |
| **email** | Persona | **Media** | Canal de comunicación directa. |
| **estudia** (boolean) | Participante | **Media** | Saber si el participante está estudiando actualmente. |
| **gradoEscolar_id → GradoEscolar** | Participante → GradoEscolar | **Media** | Nivel educativo más granular que nivelEstudio. |
| **ingresoMensual** | Familiar | **Media** | Perfil socioeconómico de la familia. |
| **Empleador / tipoEmpleador_id** | Familiar → Empleador | **Media** | Seguimiento laboral de egresados. |
| **pais_id → Pais** | Persona | **Media-Baja** | Origen del participante. |
| **parentesco_id → Parentesco** | Participante | **Media-Baja** | Relación del responsable con el participante. |
| **NumeroCuenta / CuentaParticipante** | Participante | **Baja** | Inclusión financiera. |
| **hijosNacidos / hijosPorNacer** | Participante | **Baja** | Perfil demográfico adicional. |
| **peso / talla_id → Tallas** | Participante | **Baja** | Salud y nutrición. |
| **PersonalTecnico / usuario_id** | Participante → Usuario | **Media** | Saber qué técnico registró al participante. |
| **AntecedentePenal** | AntecedentePenal | **Baja** | Información sensible, requiere permisos. |
| **Auditoria / Evento** | Auditoría | **Media** | Trazabilidad de cambios en los datos. |

### 4.3 Tablas completas de la BD no representadas en el sistema actual

1. **Seguimiento** + **ParticipanteSeguimiento** — Intervenciones, visitas, seguimiento
2. **PersonalTecnico** + **Especialidad** — Staff del programa
3. **Empleador** + **TipoEmpleador** — Seguimiento laboral
4. **MotivoAbandonoEscolar** — Causas de deserción
5. **Auditoria** + **Evento** — Trazabilidad
6. **AntecedentePenal** — Antecedentes
7. **Tallas** — Medidas antropométricas
8. **GuiaOrientacion** — Guías de orientación

---

## 5. Propuesta Conceptual: Sistema de Alertas

### 5.1 Objetivo

Detectar automáticamente patrones que requieren atención del equipo operativo, basados en los datos disponibles y futuros.

### 5.2 Tipos de Alerta

#### ⚠️ Nivel 1 — Operativas (diarias/semanales)
- **Deserciones detectadas**: Participantes cuyo estado cambia a "Retirado", "Desertor", "Baja", etc. en la última semana.
- **Registro reducido**: Disminución significativa (>20%) en registros nuevos respecto al promedio semanal.
- **Centros sin actividad**: Centros que no han registrado participantes en los últimos N días.

#### 🔶 Nivel 2 — Tácticas (mensuales)
- **Zonas con bajo rendimiento**: Municipios/provincias con tasa de activos por debajo del percentil 25.
- **Sesgo de cursos**: Cuando >60% de los participantes están concentrados en solo 2-3 cursos/rutas.
- **Brecha de género ampliada**: Cuando la diferencia hombre/mujer supera el 20% en algún territorio.

#### 🔴 Nivel 3 — Estratégicas (trimestrales)
- **Tendencia de decrecimiento**: 3 meses consecutivos con menos registros que el mismo período del año anterior.
- **Deserción temprana**: Participantes que abandonan dentro de los primeros 30 días.
- **Estancamiento de egreso**: Tasa de egreso por debajo del objetivo del programa.

### 5.3 Arquitectura Propuesta

```
┌─────────────┐   ┌──────────────────┐   ┌──────────────────┐
│  API Data   │ → │  Motor de        │ → │  Panel de        │
│  (actual)   │   │  Reglas de       │   │  Alertas en UI   │
│  + BD       │   │  Alertas         │   │  + Notificaciones│
└─────────────┘   └──────────────────┘   └──────────────────┘
                          │
                          ↓
                  ┌──────────────────┐
                  │  Histórico de    │
                  │  Alertas (BD)    │
                  └──────────────────┘
```

### 5.4 Variables Clave para Alertas (desde BD)

| Alerta | Variable Requerida | Estado Actual |
|--------|-------------------|---------------|
| Deserción temprana | fechaInclusion + fechaExclusion | ❌ No disponible (falta fechaExclusion) |
| Seguimiento de intervenciones | ParticipanteSeguimiento.fecha | ❌ No disponible (tabla Seguimiento) |
| Motivos de abandono | ParticipanteMotivoAbandono.motivo_id | ❌ No disponible |
| Análisis por cohorte | cohorte_id | ❌ No disponible |
| Personal asignado | PersonalTecnico | ❌ No disponible |
| Efectividad de egreso | Empleador (seguimiento laboral) | ❌ No disponible |

### 5.5 Próximos Pasos para Alertas

1. Gestionar con el equipo de Oportunidad 1424 la exposición de nuevas variables de BD vía API
2. Priorizar: **fechaExclusion**, **cohorte_id**, **Seguimiento** (top 3 críticos)
3. Diseñar el motor de reglas como un hook React (`useAlerts`) que reciba los datos filtrados
4. Implementar un componente `AlertBanner` o `AlertPanel` en el dashboard principal
5. Probar con datos históricos simulados antes de habilitar alertas en producción

---

## 6. Pendientes y Discusiones Abiertas

1. ✅ **Reorganizar dropdown "Más indicadores"** con separadores de grupo (aprobado conceptualmente)
2. ⏳ **Definir si crece el número de tabs fijos** o se mantienen 4 (propuesta: mantener)
3. ❓ **Sistema de alertas**: definir N° de reglas iniciales y si debe ser configurable por rol
4. ❓ **Priorización de variables BD**: ordenar por impacto vs. esfuerzo de integración
5. ❓ **Dashboard de "Seguimiento"**: nueva sección o integración en Indicadores
6. ❓ **Correo al equipo 1424**: revisar y aprobar borrador antes de envío

---

## 7. Resumen de Indicadores por Categoría (línea base)

| Categoría | Cant. Indicadores | Viables | Pendientes | No Viables |
|-----------|:---:|:-------:|:----------:|:----------:|
| Demográficos | 14 | 14 | 0 | 0 |
| Territoriales | 8 | 6 | 2 | 0 |
| Estado del Programa | 6 | 6 | 0 | 0 |
| Calidad del Dato | 8 | 8 | 0 | 0 |
| Salud y Vulnerabilidad | 7 | 7 | 0 | 0 |
| Cobertura Temporal | 5 | 5 | 0 | 0 |
| Nivel Educativo | 5 | 5 | 0 | 0 |
| Desempeño por Centro | 6 | 6 | 0 | 0 |
| **Total** | **59** | **57** | **2** | **0** |

Los 2 indicadores PENDIENTES corresponden a "Cantidad/Porcentaje de participantes por sector" — variable `sector` no disponible en la API actual.

---

## 8. Cambios en Rutas y URLs

Actualmente las rutas usan HashRouter con el formato:

```
#/estadisticas
#/indicadores/demograficos
#/mapa-interactivo
```

Si se decide migrar a rutas más limpias o cambiar naming, documentar aquí. Por ahora el HashRouter es intencional para compatibilidad con integración .NET.

---

## 9. Open Issue — Alertas "Centro sin activos" falsas

**Problema**: La alerta "Centro sin participantes activos" se dispara para TODOS los centros reportados con datos, indicando 0 activos en cada uno.

**Causa raíz**: La función `isActiveStatus()` en `utils/normalize.ts` solo reconoce 3 valores:
```
'activo' | 'identificado' | 'en proceso'
```
Si la API devuelve valores distintos (ej: "Activo" con mayúscula inicial, "Vigente", u otro), el conteo de activos da 0 para todos los centros y la alerta se vuelve ruido.

**Impacto**:
- Todas las alertas de "Centro sin activos" y "Centro con mayoría desertores" pueden ser espurias
- Los indicadores que dependen de `isActiveStatus` también se ven afectados (todo el sistema usa la misma función)

**Acción pendiente**:
1. Verificar qué valores de `estado` está devolviendo la API real
2. Agregar esos valores a `isActiveStatus()` en `utils/normalize.ts`
3. Probar que las alertas reflejen correctamente la realidad operativa

---

*Documento generado para discusión del equipo.*
