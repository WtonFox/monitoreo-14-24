import { useState, useEffect } from 'react';
import { openDB } from 'idb';
import { GeoJsonObject } from 'geojson';

const DB_NAME = 'geo-db';
const STORE_NAME = 'geojson-store';
const DB_VERSION = 1;

interface GeoJSONStore {
    key: string;
    value: {
        data: GeoJsonObject;
        timestamp: number;
    };
}

const CACHE_VALIDITY_DAYS = 7;

export const useGeoJSON = (level: 'region' | 'province' | 'municipality', viewMode: 'pin' | 'polygon') => {
    const [geoJSON, setGeoJSON] = useState<GeoJsonObject | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Only load if needed (polygon mode or municipality level for centroids)
        const shouldLoad = viewMode === 'polygon' || (viewMode === 'pin' && level === 'municipality');

        if (!shouldLoad) {
            setGeoJSON(null);
            return;
        }

        const fetchGeoJSON = async () => {
            setIsLoading(true);
            setError(null);
            setGeoJSON(null); // Clear previous to avoid ghosts

            let url = '';
            switch (level) {
                case 'region': url = '/geojson/RD_RUP.json'; break;
                case 'province': url = '/geojson/RD_PROVINCIAS.json'; break;
                case 'municipality': url = '/geojson/RD_MUNICIPIOS.json'; break;
                default: url = '/geojson/RD_PROVINCIAS.json';
            }

            try {
                // Initialize DB
                const db = await openDB(DB_NAME, DB_VERSION, {
                    upgrade(db) {
                        if (!db.objectStoreNames.contains(STORE_NAME)) {
                            db.createObjectStore(STORE_NAME);
                        }
                    },
                });

                const cacheKey = `geojson-${level}`;

                // 1. Try to get from Cache
                const cached = await db.get(STORE_NAME, cacheKey);

                if (cached) {
                    const now = Date.now();
                    const ageInDays = (now - cached.timestamp) / (1000 * 60 * 60 * 24);

                    if (ageInDays < CACHE_VALIDITY_DAYS) {
                        console.log(`[useGeoJSON] Loaded ${level} from IndexedDB cache`);
                        setGeoJSON(cached.data);
                        setIsLoading(false);
                        return;
                    } else {
                        console.log(`[useGeoJSON] Cache expired for ${level}`);
                    }
                }

                // 2. Fetch from Network if not cached or expired
                console.log(`[useGeoJSON] Fetching ${level} from network...`);
                const response = await fetch(url);

                if (!response.ok) {
                    throw new Error(`Failed to fetch GeoJSON: ${response.statusText}`);
                }

                const data = await response.json();

                // 3. Save to Cache
                try {
                    await db.put(STORE_NAME, {
                        data,
                        timestamp: Date.now()
                    }, cacheKey);
                    console.log(`[useGeoJSON] Cached ${level} to IndexedDB`);
                } catch (dbErr) {
                    console.warn('[useGeoJSON] Failed to cache to IndexedDB (quota exceeded?)', dbErr);
                }

                setGeoJSON(data);

            } catch (err: any) {
                console.error('[useGeoJSON] Error:', err);
                setError(err.message || 'Error loading map data');
            } finally {
                setIsLoading(false);
            }
        };

        fetchGeoJSON();

    }, [level, viewMode]);

    return { geoJSON, isLoading, error };
};
