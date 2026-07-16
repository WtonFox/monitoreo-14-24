import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Participant } from '../types';
import type { Alert } from '../hooks/useAlerts';
import { formatNumber } from '../utils/formatters';

// ── Logo cache ──

let _logoBase64: string | null = null;

async function loadLogo(): Promise<string | null> {
  if (_logoBase64) return _logoBase64;
  try {
    const res = await fetch('/op-1424.jpg');
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        _logoBase64 = reader.result as string;
        resolve(_logoBase64);
      };
      reader.readAsDataURL(blob);
    });
  } catch {
    console.warn('No se pudo cargar el logo para el PDF');
    return null;
  }
}

// ── Helpers ──

function formatDate(): string {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function addPageNumbers(doc: jsPDF): void {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Página ${i} de ${formatNumber(pageCount)}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' },
    );
  }
}

function drawHeader(doc: jsPDF, title: string, totalLabel: string, logo: string | null): void {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Logo
  if (logo) {
    try {
      doc.addImage(logo, 'JPEG', 14, 8, 18, 18);
    } catch {
      // Silently skip if image fails to render
    }
  }

  // Institution
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  const instX = logo ? 36 : 14;
  doc.text('Programa Oportunidad 14-24 | Gabinete de Política Social', instX, 13);

  // Separator line
  doc.setDrawColor(200, 200, 200);
  doc.line(14, 28, pageWidth - 14, 28);

  // Title
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text(title, instX, 22);

  // Date + total on the right
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(`Fecha: ${formatDate()}`, pageWidth - 14, 13, { align: 'right' });
  doc.text(totalLabel, pageWidth - 14, 22, { align: 'right' });
}

// ── Public API ──

export function downloadPDF(doc: jsPDF, filename: string): void {
  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function exportParticipantsPDF(data: Participant[], title: string): Promise<void> {
  const doc = new jsPDF('landscape', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const logo = await loadLogo();

  drawHeader(doc, title, `Total: ${formatNumber(data.length)} registros`, logo);

  // ── Table body ──
  const tableData = data.map((p) => [
    `${p.nombres ?? ''} ${p.apellidos ?? ''}`.trim(),
    p.cedula ?? '',
    p.edad?.toString() ?? '',
    p.sexo === 'm' ? 'Masculino' : p.sexo === 'f' ? 'Femenino' : (p.sexo ?? ''),
    p.provincia ?? '',
    p.estado ?? '',
    p.centro ?? '',
  ]);

  // ── autoTable ──
  autoTable(doc, {
    startY: 32,
    head: [['Nombre', 'Cédula', 'Edad', 'Sexo', 'Provincia', 'Estado', 'Centro']],
    body: tableData,
    styles: { fontSize: 7, font: 'helvetica' },
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontSize: 8, font: 'helvetica' },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 30 },
      2: { cellWidth: 14, halign: 'center' },
      3: { cellWidth: 22 },
      4: { cellWidth: 38 },
      5: { cellWidth: 28 },
    },
    margin: { top: 14, bottom: 20 },
    pageBreak: 'auto',
  });

  addPageNumbers(doc);

  const safeName = title
    .replace(/[^a-zA-Z0-9áéíóúüñÑ ]/g, '')
    .replace(/\s+/g, '_')
    .toLowerCase();
  downloadPDF(doc, `${safeName}.pdf`);

  // Help GC release jsPDF document memory
  (doc as unknown as Record<string, unknown>).__proto__ = null;
}

export async function exportAlertsPDF(alerts: Alert[], title: string): Promise<void> {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginBottom = 20;
  const logo = await loadLogo();

  drawHeader(doc, title, `Total: ${formatNumber(alerts.length)} alertas`, logo);

  const severityOrder: Record<string, number> = { critical: 0, warning: 1, info: 2 };
  const severityLabels: Record<string, string> = {
    critical: 'Crítica',
    warning: 'Advertencia',
    info: 'Informativa',
  };
  const severityColors: Record<string, [number, number, number]> = {
    critical: [220, 38, 38],
    warning: [234, 88, 12],
    info: [37, 99, 235],
  };

  const sorted = [...alerts].sort(
    (a, b) => (severityOrder[a.severity] ?? 99) - (severityOrder[b.severity] ?? 99),
  );

  let yPos = 36;

  for (const alert of sorted) {
    // New page if not enough space
    if (yPos > pageHeight - marginBottom - 30) {
      doc.addPage();
      yPos = 20;
    }

    const color = severityColors[alert.severity] ?? [100, 100, 100];

    // ── Severity badge ──
    doc.setFillColor(color[0], color[1], color[2]);
    doc.rect(14, yPos, 28, 6, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text(severityLabels[alert.severity] || alert.severity, 16, yPos + 4.5);
    doc.setTextColor(0, 0, 0);

    // ── Title ──
    doc.setFontSize(11);
    doc.text(alert.title, 46, yPos + 4.5);
    yPos += 10;

    // ── Description ──
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    const descLines = doc.splitTextToSize(alert.description, pageWidth - 28);
    doc.text(descLines, 14, yPos);
    yPos += descLines.length * 4 + 3;

    // ── Value, threshold, affected ──
    doc.setTextColor(60, 60, 60);
    const metaText = `Valor: ${alert.value}  |  Umbral: ${alert.threshold}  |  Afectados: ${alert.affectedCount}`;
    doc.text(metaText, 14, yPos);
    yPos += 6;

    // ── Recommendation ──
    if (alert.recommendation) {
      doc.setTextColor(30, 64, 175);
      const recLines = doc.splitTextToSize(`Recomendación: ${alert.recommendation}`, pageWidth - 28);
      doc.text(recLines, 14, yPos);
      yPos += recLines.length * 4 + 3;
    }

    // ── Top affected ──
    if (alert.topAffected && alert.topAffected.length > 0) {
      doc.setTextColor(80, 80, 80);
      doc.setFontSize(8);
      doc.text('Principales afectados:', 14, yPos);
      yPos += 4;
      for (const item of alert.topAffected) {
        const line = `${item.name}: ${item.value}`;
        const maxW = pageWidth - 40;
        const display = line.length > 80 ? line.substring(0, 77) + '...' : line;
        const textArr = doc.splitTextToSize(display, maxW);
        doc.text(textArr, 18, yPos);
        yPos += 4;
      }
      yPos += 2;
    }

    // ── Separator ──
    doc.setDrawColor(220, 220, 220);
    doc.line(14, yPos, pageWidth - 14, yPos);
    yPos += 6;
  }

  addPageNumbers(doc);

  const safeName = title
    .replace(/[^a-zA-Z0-9áéíóúüñÑ ]/g, '')
    .replace(/\s+/g, '_')
    .toLowerCase();
  downloadPDF(doc, `${safeName}.pdf`);

  // Help GC release jsPDF document memory
  (doc as unknown as Record<string, unknown>).__proto__ = null;
}
