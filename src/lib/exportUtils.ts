import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ExportColumn<T> {
  header: string;
  accessor: (item: T) => string | number;
  /** Approximate column width in PDF (mm). Optional. */
  width?: number;
}

function timestamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}

export function exportToExcel<T>(opts: {
  filename: string;       // base filename (no extension)
  sheetName: string;      // tab name in Excel
  data: T[];
  columns: ExportColumn<T>[];
}): void {
  const { filename, sheetName, data, columns } = opts;
  const rows = data.map(item => {
    const row: Record<string, string | number> = {};
    columns.forEach(col => {
      const val = col.accessor(item);
      row[col.header] = val ?? '';
    });
    return row;
  });
  const ws = XLSX.utils.json_to_sheet(rows);

  // Auto-size columns based on content length
  const colWidths = columns.map(col => {
    const headerLen = col.header.length;
    const maxDataLen = data.reduce((max, item) => {
      const s = String(col.accessor(item) ?? '');
      return Math.max(max, Math.min(s.length, 80));
    }, 0);
    return { wch: Math.max(headerLen, maxDataLen) + 2 };
  });
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  // Sheet name max length is 31, sanitize special chars
  const safeSheet = sheetName.slice(0, 31).replace(/[\\/?*[\]:]/g, '_');
  XLSX.utils.book_append_sheet(wb, ws, safeSheet);
  XLSX.writeFile(wb, `${filename}_${timestamp()}.xlsx`);
}

export function exportToPDF<T>(opts: {
  filename: string;
  title: string;
  subtitle?: string;
  data: T[];
  columns: ExportColumn<T>[];
}): void {
  const { filename, title, subtitle, data, columns } = opts;
  // Use landscape for wider tables
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  doc.setFontSize(14);
  doc.setTextColor(31, 41, 55); // gray-800
  doc.text(title, 14, 14);

  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128); // gray-500
  const exportedLine = `Exported ${new Date().toLocaleString()} · ${data.length} ${data.length === 1 ? 'entry' : 'entries'}`;
  doc.text(exportedLine, 14, 20);
  if (subtitle) doc.text(subtitle, 14, 25);

  autoTable(doc, {
    startY: subtitle ? 30 : 25,
    head: [columns.map(c => c.header)],
    body: data.map(item => columns.map(c => {
      const v = c.accessor(item);
      return v == null ? '' : String(v);
    })),
    styles: { fontSize: 7.5, cellPadding: 1.8, overflow: 'linebreak', valign: 'top' },
    headStyles: { fillColor: [124, 58, 237], textColor: 255, fontStyle: 'bold', fontSize: 8 },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    columnStyles: columns.reduce((acc, c, i) => {
      if (c.width) acc[i] = { cellWidth: c.width };
      return acc;
    }, {} as Record<number, { cellWidth: number }>),
    margin: { left: 14, right: 14 },
  });

  // Footer with page numbers
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175); // gray-400
    doc.text(
      `Physical AI Community Hub · Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 6,
      { align: 'center' },
    );
  }

  doc.save(`${filename}_${timestamp()}.pdf`);
}
