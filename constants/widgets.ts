import { BarChart3, TrendingUp, Map, MapPin, Users, Calendar, Activity, AlertTriangle, Heart, BookOpen, Shield, Accessibility, type LucideIcon } from 'lucide-react';

export interface WidgetDefinition {
  id: string;
  label: string;
  icon: LucideIcon;
  defaultVisible: boolean;
}

export const WIDGET_CATALOG: WidgetDefinition[] = [
  { id: 'registros', label: 'Evolución de Registros', icon: BarChart3, defaultVisible: true },
  { id: 'inclusiones', label: 'Evolución de Inclusiones', icon: TrendingUp, defaultVisible: true },
  { id: 'mapa', label: 'Mapa de República Dominicana', icon: Map, defaultVisible: true },
  { id: 'ubicacion', label: 'Distribución por Ubicación', icon: MapPin, defaultVisible: true },
  { id: 'genero', label: 'Distribución por Género', icon: Users, defaultVisible: true },
  { id: 'edad', label: 'Distribución por Edad', icon: Calendar, defaultVisible: true },
  { id: 'estado-participacion', label: 'Estado de Participación', icon: Activity, defaultVisible: true },
  { id: 'vulnerabilidades', label: 'Vulnerabilidades Detectadas', icon: AlertTriangle, defaultVisible: true },
  { id: 'estado-civil', label: 'Distribución por Estado Civil', icon: Heart, defaultVisible: true },
  { id: 'nivel-estudio', label: 'Nivel de Estudio', icon: BookOpen, defaultVisible: true },
  { id: 'programas-sociales', label: 'Programas Sociales', icon: Shield, defaultVisible: true },
  { id: 'salud', label: 'Discapacidades y Enfermedades', icon: Accessibility, defaultVisible: true },
];

export type WidgetId = (typeof WIDGET_CATALOG)[number]['id'];

export const DEFAULT_VISIBLE_WIDGET_IDS: string[] = WIDGET_CATALOG.map(w => w.id);
