export const API_BASE_URL = ''; // Usaremos el proxy en Vite (dev) y Vercel/Netlify rewrites (prod)
export const API_ENDPOINT = '/api/estadisticasPresidencia/getParticipantsStaticsPaged';

// Ideally this should be in an environment variable, but for this demo it is included here as requested.
export const API_TOKEN = (import.meta.env.VITE_API_TOKEN || '').trim();

export const PAGE_SIZES = [10, 20, 50, 100];
export const DEFAULT_PAGE_SIZE = 10;

// Static lists to ensure UI is usable even before data loads completely
export const DOMINICAN_PROVINCES = [
  "Azua", "Baoruco", "Barahona", "Dajabón", "Distrito Nacional", "Duarte",
  "Elías Piña", "El Seibo", "Espaillat", "Hato Mayor", "Hermanas Mirabal",
  "Independencia", "La Altagracia", "La Romana", "La Vega", "María Trinidad Sánchez",
  "Monseñor Nouel", "Monte Cristi", "Monte Plata", "Pedernales", "Peravia",
  "Puerto Plata", "Samaná", "San Cristóbal", "San José de Ocoa", "San Juan",
  "San Pedro de Macorís", "Sánchez Ramírez", "Santiago", "Santiago Rodríguez",
  "Santo Domingo", "Valverde"
];

// Statuses to exclude from Impact Analysis
export const IMPACT_ANALYSIS_EXCLUDED_STATUSES = [
  "Desertor", "No admitido", "Retirado", "Baja", "Cancelado", "Inactivo"
];

export const PARTICIPANT_STATUSES = [
  "Activo", "Retirado", "Egresado", "En Proceso", "Pendiente"
];

// Mapping of provinces to their municipalities
export const PROVINCE_MUNICIPALITIES: Record<string, string[]> = {
  "Azua": ["Azua de Compostela", "Estebanía", "Guayabal", "Las Charcas", "Las Yayas de Viajama", "Padre Las Casas", "Peralta", "Sabana Yegua", "Pueblo Viejo", "Tábara Arriba"],
  "Baoruco": ["Neiba", "Galván", "Los Ríos", "Tamayo", "Villa Jaragua"],
  "Barahona": ["Barahona", "Cabral", "El Peñón", "Enriquillo", "Fundación", "Jaquimeyes", "La Ciénaga", "Las Salinas", "Paraíso", "Polo", "Vicente Noble"],
  "Dajabón": ["Dajabón", "El Pino", "Loma de Cabrera", "Partido", "Restauración"],
  "Distrito Nacional": ["Santo Domingo de Guzmán"],
  "Duarte": ["San Francisco de Macorís", "Arenoso", "Castillo", "Eugenio María de Hostos", "Las Guáranas", "Pimentel", "Villa Riva"],
  "Elías Piña": ["Comendador", "Bánica", "El Llano", "Hondo Valle", "Juan Santiago", "Pedro Santana"],
  "El Seibo": ["El Seibo", "Miches"],
  "Espaillat": ["Moca", "Cayetano Germosén", "Gaspar Hernández", "Jamao al Norte"],
  "Hato Mayor": ["Hato Mayor del Rey", "El Valle", "Sabana de la Mar"],
  "Hermanas Mirabal": ["Salcedo", "Tenares", "Villa Tapia"],
  "Independencia": ["Jimaní", "Cristóbal", "Duvergé", "La Descubierta", "Mella", "Postrer Río"],
  "La Altagracia": ["Higüey", "San Rafael del Yuma"],
  "La Romana": ["La Romana", "Guaymate", "Villa Hermosa"],
  "La Vega": ["La Vega", "Constanza", "Jarabacoa", "Jima Abajo"],
  "María Trinidad Sánchez": ["Nagua", "Cabrera", "El Factor", "Río San Juan"],
  "Monseñor Nouel": ["Bonao", "Maimón", "Piedra Blanca"],
  "Monte Cristi": ["Monte Cristi", "Castañuelas", "Guayubín", "Las Matas de Santa Cruz", "Pepillo Salcedo", "Villa Vásquez"],
  "Monte Plata": ["Monte Plata", "Bayaguana", "Peralvillo", "Sabana Grande de Boyá", "Yamasá"],
  "Pedernales": ["Pedernales", "Oviedo"],
  "Peravia": ["Baní", "Matanzas", "Nizao"],
  "Puerto Plata": ["Puerto Plata", "Altamira", "Guananico", "Imbert", "Los Hidalgos", "Luperón", "Sosúa", "Villa Isabela", "Villa Montellano"],
  "Samaná": ["Samaná", "Las Terrenas", "Sánchez"],
  "San Cristóbal": ["San Cristóbal", "Bajos de Haina", "Cambita Garabitos", "Los Cacaos", "Sabana Grande de Palenque", "San Gregorio de Nigua", "Villa Altagracia", "Yaguate"],
  "San José de Ocoa": ["San José de Ocoa", "Rancho Arriba", "Sabana Larga"],
  "San Juan": ["San Juan de la Maguana", "Bohechío", "El Cercado", "Juan de Herrera", "Las Matas de Farfán", "Vallejuelo"],
  "San Pedro de Macorís": ["San Pedro de Macorís", "Consuelo", "Guayacanes", "Los Llanos", "Quisqueya", "Ramón Santana"],
  "Sánchez Ramírez": ["Cotuí", "Cevicos", "Fantino", "La Mata"],
  "Santiago": ["Santiago", "Bisonó", "Jánico", "Licey al Medio", "Puñal", "Sabana Iglesia", "San José de las Matas", "Tamboril", "Villa González"],
  "Santiago Rodríguez": ["San Ignacio de Sabaneta", "Monción", "Villa Los Almácigos"],
  "Santo Domingo": ["Santo Domingo Este", "Santo Domingo Norte", "Santo Domingo Oeste", "Boca Chica", "Los Alcarrizos", "Pedro Brand", "San Antonio de Guerra", "Guerra"],
  "Valverde": ["Mao", "Esperanza", "Laguna Salada"]
};

// Age groups for filtering
export const AGE_GROUPS = [
  { value: '', label: 'Todos' },
  { value: '14-17', label: '14-17 años' },
  { value: '18-20', label: '18-20 años' },
  { value: '21-24', label: '21-24 años' },
  { value: '25-29', label: '25-29 años' },
  { value: '30+', label: '30+ años' },
];

// Standard Regions of Planning (Regiones Únicas de Planificación)
export const REGION_PROVINCES: Record<string, string[]> = {
  "Cibao Norte": ["Santiago", "Puerto Plata", "Espaillat"],
  "Cibao Sur": ["La Vega", "Monseñor Nouel", "Sánchez Ramírez"],
  "Cibao Nordeste": ["Duarte", "María Trinidad Sánchez", "Hermanas Mirabal", "Samaná"],
  "Cibao Noroeste": ["Valverde", "Santiago Rodríguez", "Monte Cristi", "Dajabón"],
  "Valdesia": ["San Cristóbal", "Peravia", "San José de Ocoa", "Azua"],
  "Enriquillo": ["Barahona", "Baoruco", "Independencia", "Pedernales"],
  "El Valle": ["San Juan", "Elías Piña"],
  "Yuma": ["La Romana", "La Altagracia", "El Seibo"],
  "Higuamo": ["San Pedro de Macorís", "Hato Mayor", "Monte Plata"],
  "Ozama": ["Distrito Nacional", "Santo Domingo"]
};
