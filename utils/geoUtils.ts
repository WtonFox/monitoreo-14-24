import { REGION_PROVINCES } from '../constants';

// Mapeo manual para casos especiales de nombres de provincias
export const PROVINCE_NAME_MAPPING: Record<string, string> = {
    "SAN PEDRO DE MACORIS": "San Pedro de Macorís",
    "SAN JOSÉ DE OCOA": "San José de Ocoa",
    "SANTIAGO RODRIGUEZ": "Santiago Rodríguez",
    "BAHORUCO": "Baoruco",
    "SAN JUAN DE LA MAGUANA": "San Juan",
    "SANCHEZ RAMIREZ": "Sánchez Ramírez",
    "MARIA TRINIDAD SANCHEZ": "María Trinidad Sánchez",
    "BARAHONA": "Barahona",
    "ESPAILLAT": "Espaillat",
    "ELIAS PIÑA": "Elías Piña",
    "DAJABON": "Dajabón",
    "SAMANA": "Samaná",
    "MONSEÑOR NOUEL": "Monseñor Nouel",
    "MONSENOR NOUEL": "Monseñor Nouel",
};

// Coordenadas aproximadas del centro de cada provincia
export const PROVINCE_COORDINATES: Record<string, [number, number]> = {
    "Azua": [18.453, -70.734],
    "Baoruco": [18.510, -71.334],
    "Barahona": [18.208, -71.100],
    "Dajabón": [19.549, -71.708],
    "Distrito Nacional": [18.486, -69.931],
    "Duarte": [19.200, -70.050],
    "Elías Piña": [18.887, -71.687],
    "El Seibo": [18.767, -69.050],
    "Espaillat": [19.617, -70.367],
    "Hato Mayor": [18.767, -69.267],
    "Hermanas Mirabal": [19.367, -70.350],
    "Independencia": [18.700, -71.667],
    "La Altagracia": [18.600, -68.633],
    "La Romana": [18.427, -68.973],
    "La Vega": [19.222, -70.529],
    "María Trinidad Sánchez": [19.400, -69.850],
    "Monseñor Nouel": [18.917, -70.417],
    "Monte Cristi": [19.850, -71.450],
    "Monte Plata": [18.807, -69.783],
    "Pedernales": [18.033, -71.767],
    "Peravia": [18.283, -70.333],
    "Puerto Plata": [19.800, -70.683],
    "Samaná": [19.200, -69.333],
    "San Cristóbal": [18.417, -70.100],
    "San José de Ocoa": [18.546, -70.506],
    "San Juan": [18.806, -71.230],
    "San Pedro de Macorís": [18.462, -69.308],
    "Sánchez Ramírez": [19.050, -70.150],
    "Santiago": [19.450, -70.700],
    "Santiago Rodríguez": [19.467, -71.333],
    "Santo Domingo": [18.500, -69.867],
    "Valverde": [19.583, -71.167]
};

// Códigos de provincia según GeoJSON (para filtrado estricto)
export const PROVINCE_IDS: Record<string, string> = {
    "Azua": "02",
    "Baoruco": "03",
    "Barahona": "04",
    "Dajabón": "05",
    "Distrito Nacional": "01",
    "Duarte": "06",
    "Elías Piña": "07",
    "El Seibo": "08",
    "Espaillat": "09",
    "Hato Mayor": "30",
    "Hermanas Mirabal": "19",
    "Independencia": "10",
    "La Altagracia": "11",
    "La Romana": "12",
    "La Vega": "13",
    "María Trinidad Sánchez": "14",
    "Monseñor Nouel": "28",
    "Monte Cristi": "15",
    "Monte Plata": "29",
    "Pedernales": "16",
    "Peravia": "17",
    "Puerto Plata": "18",
    "Samaná": "20",
    "San Cristóbal": "21",
    "San José de Ocoa": "31",
    "San Juan": "22",
    "San Pedro de Macorís": "23",
    "Sánchez Ramírez": "24",
    "Santiago": "25",
    "Santiago Rodríguez": "26",
    "Santo Domingo": "32",
    "Valverde": "27"
};

// Función para normalizar nombres de provincias (convertir de mayúsculas a título)
export const normalizeProvinceName = (name: string): string => {
    if (!name) return '';

    const trimmedName = name.trim();
    const upperName = trimmedName.toUpperCase();

    // Mapeos directos (incluyendo variaciones comunes y sin acentos)
    const MAPPINGS: Record<string, string> = {
        // ... PROVINCE_NAME_MAPPING existente
        ...PROVINCE_NAME_MAPPING,
        // Variaciones adicionales reportadas
        "PEDERNALES": "Pedernales",
        "PERDENALES": "Pedernales",
        "HERMANAS MIRABAL": "Hermanas Mirabal",
        "SALCEDO": "Hermanas Mirabal", // Nombre antiguo comúnmente usado
        "EL SEIBO": "El Seibo",
        "HATO MAYOR": "Hato Mayor",
        "MONTE PLATA": "Monte Plata",
        "MONTE CRISTI": "Monte Cristi",
        "MONTECRISTI": "Monte Cristi",
        "PERAVIA": "Peravia",
        "VALVERDE": "Valverde",
        "LA ROMANA": "La Romana",
        "LA ALTAGRACIA": "La Altagracia",
        "AZUA": "Azua",
        "BAORUCO": "Baoruco",
        "BAHORUCO": "Baoruco",
        "INDEPENDENCIA": "Independencia",
        "LA VEGA": "La Vega",
        "SAMANA": "Samaná",
        "SAN CRISTOBAL": "San Cristóbal",
        "SAN JUAN": "San Juan",
        "SAN JUAN DE LA MAGUANA": "San Juan",
        "SANTIAGO": "Santiago",
        "MARIA TRINIDAD SANCHEZ": "María Trinidad Sánchez",
        "MARIA TRINIDAD SÁNCHEZ": "María Trinidad Sánchez",
        "SANCHEZ RAMIREZ": "Sánchez Ramírez",
        "SÁNCHEZ RAMIREZ": "Sánchez Ramírez",
        "SAN PEDRO DE MACORIS": "San Pedro de Macorís",
        "SAN PEDRO DE MACORÍS": "San Pedro de Macorís",
        "SAN JOSE DE OCOA": "San José de Ocoa",
        "ELIAS PIÑA": "Elías Piña",
        "ELIAS PINA": "Elías Piña",
        "DAJABON": "Dajabón",
        "SANTIAGO RODRIGUEZ": "Santiago Rodríguez",
        "MONSEÑOR NOUEL": "Monseñor Nouel",
        "MONSENOR NOUEL": "Monseñor Nouel",
        "ESPAILLAT": "Espaillat",
        "PUERTO PLATA": "Puerto Plata",
        "SANTO DOMINGO": "Santo Domingo",
        "DISTRITO NACIONAL": "Distrito Nacional"
    };

    if (MAPPINGS[upperName]) {
        return MAPPINGS[upperName];
    }

    // Si no está en el mapa, intentar Title Case básico
    return trimmedName
        .toLowerCase()
        .split(' ')
        .filter(Boolean) // Remove empty strings from double spaces
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

// Mapeo manual para casos especiales de nombres de municipios
export const MUNICIPALITY_NAME_MAPPING: Record<string, string> = {
    "SANTO DOMINGO DE GUZMAN": "Santo Domingo de Guzmán",
    "SANTO DOMINGO DE GUZMÁN": "Santo Domingo de Guzmán",
    "SANTIAGO DE LOS CABALLEROS": "Santiago",
    "SAN FRANCISCO DE MACORIS": "San Francisco de Macorís",
    "SAN PEDRO DE MACORIS": "San Pedro de Macorís",
    "SAN CRISTOBAL": "San Cristóbal",
    "CONCEPCION DE LA VEGA": "La Vega",
    "SANTA CRUZ DE BARAHONA": "Barahona",
    "SAN FELIPE DE PUERTO PLATA": "Puerto Plata",
    "SANTA CRUZ DE EL SEIBO": "El Seibo",
    "SANTA BARBARA DE SAMANA": "Samaná",
    "SANTA BÁRBARA DE SAMANÁ": "Samaná",
    "COMENDADOR": "Comendador", // A veces llamado Elías Piña
    "SAN IGNACIO DE SABANETA": "San Ignacio de Sabaneta",
    "SABANETA": "San Ignacio de Sabaneta",
    "MAO": "Mao",
    "SANAT CRUZ DE MAO": "Mao",
    "HIGUEY": "Higüey",
    "SALVALEON DE HIGUEY": "Higüey",
    "BONAO": "Bonao",
    "MOCA": "Moca",
    "AZUA DE COMPOSTELA": "Azua de Compostela",
    "AZUA": "Azua de Compostela",
    "BANI": "Baní",
    "NAGUA": "Nagua",
    "COTUI": "Cotuí",
    "HATO MAYOR DEL REY": "Hato Mayor del Rey",
    "HATO MAYOR": "Hato Mayor del Rey",
    "JIMANI": "Jimaní",
    "NEIBA": "Neiba",
    "NEYBA": "Neiba",
    "DAJABON": "Dajabón",
    "MONTE CRISTI": "Monte Cristi",
    "SAN FERNANDO DE MONTE CRISTI": "Monte Cristi",
    "PEDERNALES": "Pedernales",
    "SALCEDO": "Salcedo",
    "SAN JOSE DE OCOA": "San José de Ocoa",
    "SAN JUAN DE LA MAGUANA": "San Juan de la Maguana",
    "MONTE PLATA": "Monte Plata",
};

// Función para normalizar nombres de municipios/lugares (sin acentos, minúsculas)
export const normalizeLocationName = (name: string): string => {
    if (!name) return '';

    const trimmedName = name.trim();
    const upperName = trimmedName.toUpperCase();

    // 1. Verificar mapeo directo
    if (MUNICIPALITY_NAME_MAPPING[upperName]) {
        // Normalizar la salida del mapping también para asegurar coincidencia con claves de mapas
        // (Aunque las claves del mapping ya deberían estar bien)
        return MUNICIPALITY_NAME_MAPPING[upperName].toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim();
    }

    // 2. Normalización estándar robusta
    return trimmedName
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Eliminar acentos
        .replace(/\s+/g, ' ') // Normalizar espacios múltiples
        .trim();
};

// Función para convertir a Title Case visualmente
export const toTitleCase = (str: string) => {
    return str.replace(
        /\w\S*/g,
        text => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
    );
};

// Helper to find region for a province
export const findRegion = (province: string): string => {
    if (!province) return 'Desconocido';
    const normalizedProv = normalizeProvinceName(province);
    for (const [region, provinces] of Object.entries(REGION_PROVINCES)) {
        if (provinces.includes(normalizedProv)) return region;
    }
    return 'Desconocido';
};
