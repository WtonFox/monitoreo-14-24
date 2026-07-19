import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  X, Download, Users, MapPin, Activity,
  CheckCircle2, AlertTriangle, CheckCircle, Calendar, GraduationCap, Building2, XCircle, TrendingDown,
} from 'lucide-react';
import type { Indicator, IndicatorCategory } from '../hooks/useIndicators';
import type { BoardData } from '../hooks/useIndicatorBoards';
import type { Participant } from '../types';
import { formatNumber } from '../utils/formatters';
import { OverviewTab } from './indicator-modal/OverviewTab';
import { DetailTab } from './indicator-modal/DetailTab';
import { TrendTab } from './indicator-modal/TrendTab';
import { useSingleIndicatorExport } from '../hooks/useSingleIndicatorExport';
import { hybridExport, type ChartImageSource } from '../services/chartImageExporter';

const CATEGORY_META: Record<
  IndicatorCategory,
  { icon: React.FC<{ size?: number; color?: string }>; primary: string; bg: string; light: string }
> = {
  demograficos: { icon: Users, primary: '#2563eb', bg: '#eff6ff', light: '#dbeafe' },
  territoriales: { icon: MapPin, primary: '#059669', bg: '#ecfdf5', light: '#d1fae5' },
  programa: { icon: Activity, primary: '#d97706', bg: '#fffbeb', light: '#fef3c7' },
  'calidad-dato': { icon: CheckCircle, primary: '#7c3aed', bg: '#f5f3ff', light: '#ede9fe' },
  vulnerabilidad: { icon: AlertTriangle, primary: '#dc2626', bg: '#fef2f2', light: '#fecaca' },
  'cobertura-temporal': { icon: Calendar, primary: '#0891b2', bg: '#ecfeff', light: '#cffafe' },
  'nivel-educativo': { icon: GraduationCap, primary: '#0d9488', bg: '#f0fdfa', light: '#ccfbf1' },
  'desempeno-centro': { icon: Building2, primary: '#64748b', bg: '#f8fafc', light: '#e2e8f0' },
  'centros-sin-menores': { icon: XCircle, primary: '#ea580c', bg: '#fff7ed', light: '#fed7aa' },
  desercion: { icon: TrendingDown, primary: '#dc2626', bg: '#fef2f2', light: '#fecaca' },
};

interface IndicatorModalProps {
  indicator: Indicator;
  boardData: BoardData;
  filteredData: Participant[];
  onClose: () => void;
}

const OVERVIEW_CATEGORIES = new Set(['demograficos', 'territoriales', 'programa']);
const DETAIL_CATEGORIES = new Set(['calidad-dato', 'vulnerabilidad']);
const TREND_CATEGORIES = new Set(['cobertura-temporal', 'nivel-educativo', 'desempeno-centro']);

export const IndicatorModal: React.FC<IndicatorModalProps> = ({
  indicator,
  boardData,
  filteredData,
  onClose,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const meta = CATEGORY_META[indicator.category];
  const Icon = meta.icon;
  const isPending = indicator.status === 'pending';
  const isNotViable = indicator.status === 'no-viable';

  const { sheets } = useSingleIndicatorExport({
    indicator,
    filteredData,
    boardData,
  });

  const handleExport = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isExporting || sheets.length === 0) return;
    setIsExporting(true);

    try {
      // ── Force Recharts to recalculate dimensions ─────────────────
      window.dispatchEvent(new Event('resize'));
      // Brief pause for Recharts to render
      await new Promise(resolve => setTimeout(resolve, 300));

      // ── Option A: capture chart cards from the DOM ──────────────
      const charts: ChartImageSource[] = [];
      if (contentRef.current) {
        // Find chart cards: .bg-gray-50 containers that have .recharts-wrapper inside
        const allCards = contentRef.current.querySelectorAll<HTMLElement>('div.bg-gray-50');
        allCards.forEach((card) => {
          if (!card.querySelector('.recharts-wrapper')) return;
          const title = card.querySelector('h4')?.textContent?.trim() || 'Gráfica';
          // Capture the entire card (title + chart)
          charts.push({ name: title, element: card });
        });
      }

      const safeName = indicator.name
        .replace(/[^a-zA-Z0-9áéíóúñ ]/g, '').trim().slice(0, 50);
      const fileName = `${safeName}_${new Date().toISOString().slice(0, 10)}.xlsx`;

      const result = await hybridExport({
        dataSheets: sheets,
        charts: charts.length > 0 ? charts : undefined,
        fileName,
      });

      if (!result.imageExportSucceeded && result.imageCount === 0 && charts.length > 0) {
        console.warn('Chart images not available — data-only export was used');
      }
    } catch (err) {
      console.error('Error al exportar indicador:', err);
    } finally {
      setIsExporting(false);
    }
  }, [indicator, sheets, isExporting]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const renderContext = () => {
    if (OVERVIEW_CATEGORIES.has(indicator.category)) {
      return <OverviewTab indicator={indicator} boardData={boardData} meta={meta} />;
    }
    if (DETAIL_CATEGORIES.has(indicator.category)) {
      return <DetailTab indicator={indicator} boardData={boardData} meta={meta} />;
    }
    if (TREND_CATEGORIES.has(indicator.category)) {
      return <TrendTab indicator={indicator} boardData={boardData} meta={meta} />;
    }
    return null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={handleBackdrop}>
      <div ref={contentRef} className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto animate-in zoom-in-95 duration-200" style={{ borderTop: `4px solid ${meta.primary}` }}>
        <div className={`flex items-start justify-between px-6 py-4 border-b ${meta.bg}`}>
          <div className="flex items-start gap-3 min-w-0">
            <div className={`p-2 rounded-xl mt-0.5 ${meta.light}`}>
              <Icon size={20} color={meta.primary} />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-gray-900 leading-snug">{indicator.name}</h2>
              <p className="text-xs text-gray-500 font-mono mt-0.5">{indicator.formula}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-200/70 transition-colors text-gray-400 hover:text-gray-600 ml-4 flex-shrink-0" aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>

        {!indicator.topItems?.length && (
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="text-3xl font-bold break-words leading-tight" style={{ color: isNotViable ? '#9ca3af' : meta.primary }}>
            {indicator.value}
          </div>
          {isPending && indicator.pendingReason && (
            <div className="flex items-center gap-1.5 mt-2 text-xs text-orange-700 bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-200">
              <AlertTriangle size={14} /> {indicator.pendingReason}
            </div>
          )}
          {isNotViable && (
            <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
              <XCircle size={14} /> No hay datos suficientes para calcular este indicador con los filtros actuales.
            </div>
          )}
        </div>
        )}

        <div className="px-6 py-3 border-b border-gray-100">
          <p className="text-sm text-gray-600 leading-relaxed">{indicator.description}</p>
        </div>

        {/* Top Items Table */}
        {indicator.status === 'viable' && indicator.topItems && indicator.topItems.length > 0 && (
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Top {indicator.topCount ?? 5}</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 text-gray-500 font-medium w-8">#</th>
                    <th className="text-left py-2 px-3 text-gray-500 font-medium">Nombre</th>
                    <th className="text-right py-2 px-3 text-gray-500 font-medium">Cantidad</th>
                    {indicator.topItems[0]?.pct !== undefined && (
                      <th className="text-right py-2 px-3 text-gray-500 font-medium">%</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {indicator.topItems.map((item, i) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 px-3 text-gray-400 font-medium">{i + 1}</td>
                      <td className="py-2 px-3 text-gray-700 break-words">{item.name}</td>
                      <td className="py-2 px-3 text-right font-semibold text-gray-900 tabular-nums">{formatNumber(item.value)}</td>
                      {item.pct !== undefined && (
                        <td className="py-2 px-3 text-right text-gray-600 tabular-nums">{item.pct.toFixed(1)}%</td>
                      )}
                    </tr>
                  ))}
                  {indicator.resto !== undefined && indicator.resto > 0 && (
                    <tr className="bg-gray-50 font-medium">
                      <td className="py-2 px-3 text-gray-400"></td>
                      <td className="py-2 px-3 text-gray-600">Resto</td>
                      <td className="py-2 px-3 text-right text-gray-800 tabular-nums">{formatNumber(indicator.resto)}</td>
                      {indicator.topItems[0]?.pct !== undefined && (
                        <td className="py-2 px-3 text-right text-gray-500 tabular-nums">
                          {(() => {
                            const totalItems = indicator.topItems.reduce((s, it) => s + it.value, 0) + indicator.resto;
                            return totalItems > 0 ? ((indicator.resto / totalItems) * 100).toFixed(1) : '0.0';
                          })()}%
                        </td>
                      )}
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {indicator.status === 'viable' && ['vulnerabilidad', 'calidad-dato', 'nivel-educativo'].includes(indicator.category) && (
          <div className="mx-6 my-3 flex items-start gap-2 text-[11px] text-amber-700 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
            <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" />
            <span>Los porcentajes se calculan solo sobre registros con informaci&oacute;n disponible (excluye N/A, N/D). Los registros sin dato se indican como <strong>s/dato</strong>.</span>
          </div>
        )}

        {indicator.status === 'viable' && indicator.topDataNote && (
          <div className="mx-6 my-3 flex items-start gap-2 text-[11px] text-amber-700 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
            <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" />
            <span>{indicator.topDataNote}</span>
          </div>
        )}

        {indicator.status === 'viable' && (
          <div className="px-6 py-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Datos contextuales</h3>
            {renderContext()}
          </div>
        )}

        <div className="px-6 py-3 bg-gray-50 rounded-b-2xl flex items-center justify-between">
          <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${isPending ? 'bg-orange-100 text-orange-700 border border-orange-200' : isNotViable ? 'bg-gray-100 text-gray-500 border border-gray-200' : 'bg-green-100 text-green-700 border border-green-200'}`}>
            {isPending ? <AlertTriangle size={12} /> : isNotViable ? <XCircle size={12} /> : <CheckCircle2 size={12} />}
            {isPending ? 'PENDIENTE' : isNotViable ? 'NO VIABLE' : 'VIABLE'}
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              disabled={isExporting}
              className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                isExporting
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-emerald-600 hover:text-emerald-800'
              }`}
            >
              <Download size={14} />
              {isExporting ? 'Exportando...' : 'Descargar Excel'}
            </button>
            <span className="text-gray-200">|</span>
            <button onClick={onClose} className="text-xs text-gray-400 hover:text-gray-600 font-medium transition-colors">
              Cerrar <span className="text-gray-300">(ESC)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
