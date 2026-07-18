import React, { useState, useMemo, useCallback } from 'react';
import { DominicanRepublicMap } from './DominicanRepublicMap';
import { MapFilters } from './MapFilters';
import { LocationInfoBox } from './LocationInfoBox';
import { useMapStats } from '../hooks/useMapStats';
import { useMapExport } from '../hooks/useMapExport';
import { ExportSheetSelector } from './ExportSheetSelector';
import { exportMultiSheet, SheetConfig } from '../services/multiSheetExporter';
import { fetchAllData } from '../services/exporter';
import { sanitizeParticipant } from '../utils/dataUtils';
import { Participant } from '../types';
import { FileSpreadsheet, Layers } from 'lucide-react';

interface MapSectionProps {
    data: Participant[];
}

export const MapSection: React.FC<MapSectionProps> = ({ data }) => {
    // State for filters
    const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
    const [selectedMunicipality, setSelectedMunicipality] = useState<string | null>(null);
    const [selectedGender, setSelectedGender] = useState<string | null>(null);
    const [selectedAgeRange, setSelectedAgeRange] = useState<string | null>(null);

    // New Filters: Years
    const [selectedYearIngreso, setSelectedYearIngreso] = useState<string | null>(null);
    const [selectedYearInclusion, setSelectedYearInclusion] = useState<string | null>(null);

    // State for map view
    const [mapLevel, setMapLevel] = useState<'region' | 'province' | 'municipality'>('province');

    // Export state
    const [isExportOpen, setIsExportOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState(0);

    // Derived lists for filters
    const availableProvinces = useMemo(() => {
        if (!data || !Array.isArray(data)) return [];
        return Array.from(new Set(data.filter(p => p).map(p => p.provincia || '').filter(Boolean)));
    }, [data]);

    const availableMunicipalities = useMemo(() => {
        if (!data || !Array.isArray(data)) return [];
        let filteredData = data;
        if (selectedProvince) {
            filteredData = filteredData.filter(p => p && p.provincia === selectedProvince);
        }
        return Array.from(new Set(filteredData.filter(p => p).map(p => p.municipio || '').filter(Boolean)));
    }, [data, selectedProvince]);

    // Handle filter changes
    const handleProvinceChange = (prov: string | null) => {
        setSelectedProvince(prov);
        setSelectedMunicipality(null); // Reset municipality when province changes

        // Auto-switch level suggestion
        if (prov) {
            setMapLevel('municipality');
        } else {
            setMapLevel('province');
        }
    };

    const handleClearFilters = () => {
        setSelectedProvince(null);
        setSelectedMunicipality(null);
        setSelectedGender(null);
        setSelectedAgeRange(null);
        setSelectedYearIngreso(null);
        setSelectedYearInclusion(null);
        setMapLevel('province');
    };

    // Location selection state (tap/click on polygon)
    const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

    const handleLocationSelect = (name: string | null) => {
        if (name === selectedLocation) {
            setSelectedLocation(null);
        } else {
            setSelectedLocation(name);
        }
    };

    // ── Export handler ─────────────────────────────────────────────
    const handleMapExport = useCallback(async (selectedSheets: SheetConfig[]) => {
        const hasRawSheet = selectedSheets.some(s => s.name === 'Participantes (raw)');
        const aggregateSheets = selectedSheets.filter(s => s.name !== 'Participantes (raw)');

        setIsExporting(true);
        setExportProgress(0);

        try {
            let finalSheets: SheetConfig[] = [...aggregateSheets];
            let warningMsg: string | undefined;

            if (hasRawSheet) {
                // Download all data from API for raw sheet
                const { data: allData, receipt } = await fetchAllData((progress) => {
                    setExportProgress(progress.percentage);
                });

                // Check for partial failure
                if (receipt.partialFailure) {
                    warningMsg = `ADVERTENCIA: Exportación incompleta. Se esperaban ${receipt.totalRecordsExpected} registros, se descargaron ${receipt.totalRecordsDownloaded}. Páginas con error: ${receipt.failedPages.join(', ')}.`;
                }

                // Build sanitized rows matching exportToExcel format
                const rawRows: unknown[][] = allData.map((item, idx) => {
                    const clean = sanitizeParticipant(item, idx);
                    return [
                        clean.id,
                        clean.cedula || '',
                        clean.nombres || '',
                        clean.apellidos || '',
                        clean.edad,
                        clean.fechaNacimiento || '',
                        clean.fechaRegistro || '',
                        clean.fechaInclusion || '',
                        clean.tutor || '',
                        clean.cedulaTutor || '',
                        clean.vulnerabilidades || '',
                        clean.estado || '',
                        clean.sexo || '',
                        clean.provincia || '',
                        clean.municipio || '',
                        clean.centro || '',
                        clean.direccion || '',
                        clean.rutaFormativa || '',
                        clean.telefonos || '',
                        clean.telefonosResponsable || '',
                        clean.edadRegistro,
                        clean.estadoCivil || '',
                        clean.nivelEstudio || '',
                        clean.alergias || '',
                        clean.discapacidades || '',
                        clean.enfermedades || '',
                        clean.programasSociales || '',
                    ];
                });

                finalSheets.push({
                    name: 'Participantes (raw)',
                    headers: [
                        'ID', 'Cédula', 'Nombres', 'Apellidos', 'Edad',
                        'Fecha Nacimiento', 'Fecha Registro', 'Fecha Inclusión',
                        'Tutor', 'Cédula Tutor', 'Vulnerabilidades', 'Estado',
                        'Sexo', 'Provincia', 'Municipio', 'Centro', 'Dirección',
                        'Ruta Formativa', 'Teléfonos', 'Teléfonos Responsable',
                        'Edad Registro', 'Estado Civil', 'Nivel Estudio',
                        'Alergias', 'Discapacidades', 'Enfermedades', 'Programas Sociales',
                    ],
                    rows: rawRows,
                    columnWidths: [8, 15, 20, 20, 6, 14, 14, 14, 20, 15, 25, 15, 8, 20, 20, 25, 30, 20, 15, 15, 10, 15, 20, 20, 20, 25, 25],
                    sheetType: 'table',
                });

                setExportProgress(100);
            }

            await exportMultiSheet({
                sheets: finalSheets,
                warning: warningMsg,
                fileName: `mapa_${new Date().toISOString().slice(0, 10)}.xlsx`,
            });
        } catch (error) {
            console.error('Error exportando datos del mapa:', error);
        } finally {
            setIsExporting(false);
            setExportProgress(0);
            setIsExportOpen(false);
        }
    }, []);

    // Filter Data
    const filteredData = useMemo(() => {
        if (!data || !Array.isArray(data)) return [];
        return data.filter(p => {
            if (!p) return false;
            if (selectedProvince && p.provincia !== selectedProvince) return false;
            if (selectedMunicipality && p.municipio !== selectedMunicipality) return false;
            if (selectedGender && p.sexo?.toUpperCase() !== selectedGender) return false;

            if (selectedAgeRange) {
                const age = p.edad || 0;
                if (selectedAgeRange === '14-17') return age >= 14 && age <= 17;
                if (selectedAgeRange === '18-24') return age >= 18 && age <= 24;
                if (selectedAgeRange === '25-29') return age >= 25 && age <= 29;
                if (selectedAgeRange === '30+') return age >= 30;
            }

            // Year Filters
            if (selectedYearIngreso) {
                if (!p.fechaRegistro) return false;
                const y = new Date(p.fechaRegistro).getFullYear().toString();
                if (y !== selectedYearIngreso) return false;
            }

            if (selectedYearInclusion) {
                if (!p.fechaInclusion) return false;
                const y = new Date(p.fechaInclusion).getFullYear().toString();
                if (y !== selectedYearInclusion) return false;
            }

            return true;
        });
    }, [data, selectedProvince, selectedMunicipality, selectedGender, selectedAgeRange, selectedYearIngreso, selectedYearInclusion]);

    // Map stats lifted from DominicanRepublicMap for LocationInfoBox
    const {
        mapData: computedMapData,
        locationStats,
        maxCount,
        getColor,
        nationalPhoneRate,
        nationalVulnerabilityRate,
        nationalAvgAge,
        nationalGenderRate,
        nationalEducationRate,
        nationalStatusRate,
    } = useMapStats(filteredData, mapLevel, selectedProvince);

    // Build map export sheets
    const {
        sheets: mapSheets,
        preselectNames,
    } = useMapExport({
        filteredData,
        mapStats: {
            mapData: computedMapData,
            locationStats,
            nationalPhoneRate,
            nationalVulnerabilityRate,
            nationalAvgAge,
            nationalGenderRate,
            nationalEducationRate,
            nationalStatusRate,
        },
        selectedProvince,
        selectedLocation,
        level: mapLevel,
    });

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4 h-[calc(100vh-140px)] min-h-[600px]">

                {/* Left Side - Filters & Controls (25%) */}
                <div className="w-full md:w-1/4 flex flex-col gap-4 overflow-y-auto pr-2">

                    {/* Map Controls Card */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-3">
                            <Layers size={18} className="text-blue-600" />
                            Visualización
                        </h3>

                        <div className="space-y-3">
                            {/* Level Toggle Grid */}
                            <div className="bg-gray-100 p-1 rounded-lg grid grid-cols-3 gap-1">
                                <button
                                    onClick={() => setMapLevel('region')}
                                    className={`flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded-md transition-all ${mapLevel === 'region'
                                        ? 'bg-white text-blue-600 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    🌍 Regiones
                                </button>
                                <button
                                    onClick={() => setMapLevel('province')}
                                    className={`flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded-md transition-all ${mapLevel === 'province'
                                        ? 'bg-white text-blue-600 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    📍 Provincias
                                </button>
                                <button
                                    onClick={() => setMapLevel('municipality')}
                                    className={`flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded-md transition-all ${mapLevel === 'municipality'
                                        ? 'bg-white text-blue-600 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    🏘️ Municipios
                                </button>
                            </div>

                            {/* Export Button */}
                            <button
                                onClick={() => setIsExportOpen(true)}
                                disabled={filteredData.length === 0}
                                title={filteredData.length === 0 ? 'No hay datos filtrados para exportar' : undefined}
                                className={`w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all ${filteredData.length === 0
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm active:scale-[0.98]'
                                    }`}
                            >
                                <FileSpreadsheet size={16} />
                                Exportar Excel
                            </button>
                        </div>
                    </div>

                    {/* Conditionally render LocationInfoBox or MapFilters */}
                    {selectedLocation && locationStats[selectedLocation] ? (
                        <LocationInfoBox
                            locationName={selectedLocation}
                            totalParticipants={filteredData.length}
                            stats={locationStats[selectedLocation]}
                            level={mapLevel}
                            onClose={() => setSelectedLocation(null)}
                            nationalPhoneRate={nationalPhoneRate}
                            nationalVulnerabilityRate={nationalVulnerabilityRate}
                            nationalAvgAge={nationalAvgAge}
                            nationalGenderRate={nationalGenderRate}
                            nationalEducationRate={nationalEducationRate}
                            nationalStatusRate={nationalStatusRate}
                        />
                    ) : (
                        <MapFilters
                            selectedProvince={selectedProvince}
                            selectedMunicipality={selectedMunicipality}
                            selectedGender={selectedGender}
                            selectedAgeRange={selectedAgeRange}
                            // New props for years
                            selectedYearIngreso={selectedYearIngreso}
                            selectedYearInclusion={selectedYearInclusion}

                            availableProvinces={availableProvinces}
                            availableMunicipalities={availableMunicipalities}

                            onProvinceChange={handleProvinceChange}
                            onMunicipalityChange={setSelectedMunicipality}
                            onGenderChange={setSelectedGender}
                            onAgeRangeChange={setSelectedAgeRange}
                            // New handlers
                            onYearIngresoChange={setSelectedYearIngreso}
                            onYearInclusionChange={setSelectedYearInclusion}

                            onClearFilters={handleClearFilters}
                        />
                    )}

                    {/* Stats Summary Card (Enhanced) */}
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                        <h4 className="text-blue-800 font-semibold mb-3 text-sm">📊 Resumen de Selección</h4>

                        <div className="text-2xl font-bold text-blue-900 mb-1">
                            {filteredData.length.toLocaleString('en-US')}
                        </div>
                        <div className="text-xs text-blue-600 mb-3">Participantes filtrados</div>

                        {/* Stats Grid */}
                        <div className="space-y-2">
                            {/* Gender Breakdown */}
                            <div className="grid grid-cols-2 gap-2">
                                <div className="bg-white p-2 rounded border border-blue-100">
                                    <div className="text-xs text-gray-500">Masc.</div>
                                    <div className="font-semibold text-gray-800">
                                        {filteredData.filter(p => p.sexo === 'M').length.toLocaleString('en-US')}
                                    </div>
                                </div>
                                <div className="bg-white p-2 rounded border border-blue-100">
                                    <div className="text-xs text-gray-500">Fem.</div>
                                    <div className="font-semibold text-gray-800">
                                        {filteredData.filter(p => p.sexo === 'F').length.toLocaleString('en-US')}
                                    </div>
                                </div>
                            </div>

                            {/* Unique Centers */}
                            <div className="bg-white p-2 rounded border border-blue-100">
                                <div className="text-xs text-gray-500">Centros Únicos</div>
                                <div className="font-semibold text-gray-800">
                                    {new Set(filteredData.map(p => p.centro).filter(Boolean)).size.toLocaleString('en-US')}
                                </div>
                            </div>

                            {/* Average Age */}
                            <div className="bg-white p-2 rounded border border-blue-100">
                                <div className="text-xs text-gray-500">Edad Promedio</div>
                                <div className="font-semibold text-gray-800">
                                    {filteredData.length > 0
                                        ? Math.round(filteredData.reduce((sum, p) => sum + (p.edad || 0), 0) / filteredData.length)
                                        : 0} años
                                </div>
                            </div>

                            {/* Top Province (only if no province filter active) */}
                            {!selectedProvince && filteredData.length > 0 && (() => {
                                const provinceCounts: Record<string, number> = {};
                                filteredData.forEach(p => {
                                    const prov = p.provincia || 'Desconocido';
                                    provinceCounts[prov] = (provinceCounts[prov] || 0) + 1;
                                });
                                const topProvince = Object.entries(provinceCounts)
                                    .sort((a, b) => b[1] - a[1])[0];
                                return (
                                    <div className="bg-white p-2 rounded border border-blue-100">
                                        <div className="text-xs text-gray-500">Provincia Principal</div>
                                        <div className="font-semibold text-gray-800 text-xs">
                                            {topProvince[0]} ({topProvince[1].toLocaleString('en-US')})
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Top Status */}
                            {filteredData.length > 0 && (() => {
                                const statusCounts: Record<string, number> = {};
                                filteredData.forEach(p => {
                                    const status = p.estado || 'Sin Estado';
                                    statusCounts[status] = (statusCounts[status] || 0) + 1;
                                });
                                const topStatus = Object.entries(statusCounts)
                                    .sort((a, b) => b[1] - a[1])[0];
                                return topStatus ? (
                                    <div className="bg-white p-2 rounded border border-blue-100">
                                        <div className="text-xs text-gray-500">Estado Principal</div>
                                        <div className="font-semibold text-gray-800 text-xs">
                                            {topStatus[0]} ({topStatus[1].toLocaleString('en-US')})
                                        </div>
                                    </div>
                                ) : null;
                            })()}
                        </div>
                    </div>

                </div>

                {/* Right Side - Map (75%) */}
                <div className="w-full md:w-3/4 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative">
                    <div className="absolute top-4 right-4 z-[400] bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-sm border border-gray-200 text-xs font-medium text-gray-600">
                        {mapLevel === 'province' && 'Vista Provincial'}
                        {mapLevel === 'municipality' && 'Vista Municipal'}
                        {mapLevel === 'region' && 'Vista Regional'}

                        {selectedProvince && ` • ${selectedProvince}`}
                    </div>

                    <DominicanRepublicMap
                        data={filteredData} // Pass filtered data to map so it colors based on selection
                        showLabels={true}
                        viewMode="polygon" // Forced to polygon for this section as per requirement
                        level={mapLevel}
                        selectedProvince={selectedProvince}
                        selectedMunicipality={selectedMunicipality}
                        mapData={computedMapData}
                        locationStats={locationStats}
                        getColor={getColor}
                        maxCount={maxCount}
                        onLocationSelect={handleLocationSelect}
                    />
                </div>

            </div>

            {/* Export Modal */}
            <ExportSheetSelector
                isOpen={isExportOpen}
                onClose={() => setIsExportOpen(false)}
                title="Exportar datos del mapa"
                sheets={mapSheets}
                defaultSelected={preselectNames}
                isExporting={isExporting}
                exportProgress={exportProgress}
                exportLabel={isExporting ? 'Descargando datos...' : undefined}
                onExport={handleMapExport}
                description="Selecciona las hojas para incluir en el archivo Excel con los datos del mapa"
            />
        </div>
    );
};
