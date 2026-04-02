/**
 * exportUtils.js
 * ─────────────────────────────────────────────────────────────────
 * Exportación a Excel (ExcelJS) y PDF (jsPDF + autoTable).
 *
 * Instalación:
 *   npm install exceljs file-saver jspdf jspdf-autotable
 *
 * ColumnDef:
 * {
 *   key       : string           — clave en el objeto de dato
 *   header    : string           — encabezado visible
 *   type      : 'text' | 'number' | 'currency' | 'date'
 *   width?    : number           — ancho fijo; si se omite se calcula automáticamente
 *   getValue? : (row) => any     — extractor personalizado
 * }
 *
 * ExportMeta (opcional en exportToExcel / exportToPDF):
 * {
 *   empresa?  : string   — nombre de la empresa
 *   usuario?  : string   — usuario que generó el reporte
 *   extra?    : string   — línea adicional libre (período, sucursal, etc.)
 * }
 */

import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ─────────────────────────────────────────────────────────────────
// Helpers compartidos
// ─────────────────────────────────────────────────────────────────

function resolveValue(row, col) {
  if (col.getValue) return col.getValue(row);
  const raw = row[col.key];

  switch (col.type) {
    case "date": {
      if (raw == null) return "---";
      const d = raw?.toDate?.() ?? (raw instanceof Date ? raw : new Date(raw));
      return isNaN(d.getTime()) ? String(raw) : d;
    }
    case "currency":
    case "number":
      return raw == null ? 0 : Number(raw);
    default:
      return raw == null ? "---" : String(raw);
  }
}

function calcWidth(header, rows, col, max = 60) {
  const headerLen = String(header).length;
  const dataLen = rows.reduce((m, row) => {
    const val = col.getValue
      ? String(col.getValue(row) ?? "")
      : String(row[col.key] ?? "");
    return Math.max(m, val.length);
  }, 0);
  // Si el encabezado es largo (como 'Fecha de generación'), dale un mínimo mayor
  const minWidth = headerLen >= 16 ? headerLen + 6 : headerLen + 2;
  return Math.min(max, Math.max(minWidth, dataLen + 2));
}

// ─────────────────────────────────────────────────────────────────
// Constantes de estilo Excel
// ─────────────────────────────────────────────────────────────────

const HEADER_BG  = "1E40AF"; // blue-800  — encabezado de columnas
const HEADER_FG  = "FFFFFF";
const ALT_ROW_BG = "EFF6FF"; // blue-50   — filas alternas
const BORDER_CLR = "BFDBFE"; // blue-200  — bordes de datos
const TOTAL_BG   = "DBEAFE"; // blue-100  — fila de totales
const META_BG    = "1E3A8A"; // blue-900  — bloque de empresa (título)
const META_SUB   = "1D4ED8"; // blue-700  — subtítulo empresa

// ── Formatos de número ─────────────────────────────────────────
// "L. #,##0.00" muestra el símbolo de lempira directamente en la celda
const NUM_FMT  = "#,##0";
const CURR_FMT = '"L. "#,##0.00';   // ← formato correcto con símbolo
const DATE_FMT = "dd/mm/yyyy";

// ─────────────────────────────────────────────────────────────────
// Excel — ExcelJS
// ─────────────────────────────────────────────────────────────────

/**
 * @param {object[]}    rows
 * @param {ColumnDef[]} columns
 * @param {string}      filename      — sin extensión
 * @param {string}      [sheetName]
 * @param {ExportMeta}  [meta]        — info de encabezado empresarial
 */
export async function exportToExcel(
  rows,
  columns,
  filename,
  sheetName = "Datos",
  meta = {},
) {
  const { empresa = "", usuario = "", extra = "" } = meta;
  const fechaGen = new Date().toLocaleDateString("es-HN");
  const horaGen  = new Date().toLocaleTimeString("es-HN", {
    hour: "2-digit", minute: "2-digit",
  });

  const wb = new ExcelJS.Workbook();
  wb.creator = empresa || "Sistema";
  wb.created = new Date();

  const ws = wb.addWorksheet(sheetName);

  // Total de columnas para los merges
  const numCols = columns.length;

  // ── BLOQUE 1: Nombre de la empresa ─────────────────────────────
  let currentRow = 1;

  if (empresa) {
    ws.mergeCells(currentRow, 1, currentRow, numCols);
    const empresaCell = ws.getCell(currentRow, 1);
    empresaCell.value     = empresa.toUpperCase();
    empresaCell.font      = { bold: true, size: 14, color: { argb: HEADER_FG }, name: "Arial" };
    empresaCell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: META_BG } };
    empresaCell.alignment = { horizontal: "center", vertical: "middle" };
    ws.getRow(currentRow).height = 28;
    currentRow++;
  }

  // ── BLOQUE 2: Título del reporte (= filename humanizado) ────────
  ws.mergeCells(currentRow, 1, currentRow, numCols);
  const tituloCell = ws.getCell(currentRow, 1);
  tituloCell.value     = sheetName;
  tituloCell.font      = { bold: true, size: 11, color: { argb: HEADER_FG }, name: "Arial" };
  tituloCell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: META_SUB } };
  tituloCell.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(currentRow).height = 22;
  currentRow++;

  // ── BLOQUE 3: Metadatos (fecha, usuario, extra) ─────────────────
  // Se muestran como pares clave-valor en filas separadas con fondo gris claro

  const metaItems = [
    ["Fecha de generación:", `${fechaGen} ${horaGen}`],
    ...(usuario ? [["Generado por:", usuario]] : []),
    ...(extra   ? [["Detalle:", extra]] : []),
  ];

  for (const [label, value] of metaItems) {
    // Columna A: etiqueta
    const labelCell = ws.getCell(currentRow, 1);
    labelCell.value     = label;
    labelCell.font      = { bold: true, size: 9, name: "Arial", color: { argb: "374151" } };
    labelCell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: "F3F4F6" } };
    labelCell.alignment = { horizontal: "right", vertical: "middle" };

    // Columnas B en adelante: valor (merge del resto)
    if (numCols > 1) {
      ws.mergeCells(currentRow, 2, currentRow, numCols);
    }
    const valueCell = ws.getCell(currentRow, 2);
    valueCell.value     = value;
    valueCell.font      = { size: 9, name: "Arial", color: { argb: "111827" } };
    valueCell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: "F3F4F6" } };
    valueCell.alignment = { horizontal: "left", vertical: "middle" };

    ws.getRow(currentRow).height = 16;
    currentRow++;
  }

  // Fila separadora vacía entre metadatos y tabla
  ws.getRow(currentRow).height = 6;
  currentRow++;

  // ── Anchos de columna ───────────────────────────────────────────
  ws.columns = columns.map((col) => ({
    width: col.width ?? calcWidth(col.header, rows, col),
  }));

  // ── Fila de encabezado de la tabla ──────────────────────────────
  const headerRowIndex = currentRow;
  const headerRow = ws.addRow(columns.map((c) => c.header));

  headerRow.eachCell((cell) => {
    cell.font      = { bold: true, color: { argb: HEADER_FG }, name: "Arial", size: 10 };
    cell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: HEADER_BG } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border    = { bottom: { style: "medium", color: { argb: HEADER_FG } } };
  });
  headerRow.height = 20;
  currentRow++;

  // Congelar hasta la fila de encabezado (inclusive)
  ws.views = [{ state: "frozen", ySplit: headerRowIndex }];

  // ── Filas de datos ──────────────────────────────────────────────
  const dataStartRow = currentRow;

  rows.forEach((row, rowIdx) => {
    const values = columns.map((col) => resolveValue(row, col));
    const dataRow = ws.addRow(values);
    const isEven  = rowIdx % 2 === 1;

    dataRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const col = columns[colNumber - 1];

      if (isEven) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ALT_ROW_BG } };
      }

      cell.font      = { name: "Arial", size: 9 };
      cell.alignment = { vertical: "middle" };
      cell.border    = { bottom: { style: "thin", color: { argb: BORDER_CLR } } };

      switch (col?.type) {
        case "number":
          cell.numFmt    = NUM_FMT;
          cell.alignment = { ...cell.alignment, horizontal: "right" };
          break;
        case "currency":
          cell.numFmt    = CURR_FMT;   // "L. #,##0.00" — símbolo en la celda
          cell.alignment = { ...cell.alignment, horizontal: "right" };
          break;
        case "date":
          if (cell.value instanceof Date) {
            cell.numFmt    = DATE_FMT;
            cell.alignment = { ...cell.alignment, horizontal: "center" };
          }
          break;
        default:
          cell.alignment = { ...cell.alignment, horizontal: "left" };
      }
    });

    currentRow++;
  });

  const dataEndRow = currentRow - 1;

  // ── Fila de totales ─────────────────────────────────────────────
  const hasTotals = columns.some(
    (c) => c.type === "currency" || c.type === "number",
  );

  if (hasTotals && rows.length > 0) {
    const totalValues = columns.map((col, idx) => {
      if (col.type !== "currency" && col.type !== "number") return "TOTAL";
      const colLetter = ws.getColumn(idx + 1).letter;
      return { formula: `SUM(${colLetter}${dataStartRow}:${colLetter}${dataEndRow})` };
    });

    const totalRow = ws.addRow(totalValues);
    totalRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const col = columns[colNumber - 1];
      cell.font   = { bold: true, name: "Arial", size: 9 };
      cell.border = { top: { style: "medium", color: { argb: HEADER_BG } } };
      cell.fill   = { type: "pattern", pattern: "solid", fgColor: { argb: TOTAL_BG } };
      if (col?.type === "currency") {
        cell.numFmt    = CURR_FMT;
        cell.alignment = { horizontal: "right", vertical: "middle" };
      }
      if (col?.type === "number") {
        cell.numFmt    = NUM_FMT;
        cell.alignment = { horizontal: "right", vertical: "middle" };
      }
      if (!col?.type || col.type === "text") {
        cell.alignment = { horizontal: "right", vertical: "middle" };
        cell.font      = { ...cell.font, color: { argb: "374151" } };
      }
    });
  }

  // ── Guardar ─────────────────────────────────────────────────────
  const buffer = await wb.xlsx.writeBuffer();
  saveAs(
    new Blob([buffer], { type: "application/octet-stream" }),
    `${filename}.xlsx`,
  );
}

// ─────────────────────────────────────────────────────────────────
// PDF — jsPDF + autoTable
// ─────────────────────────────────────────────────────────────────

/**
 * @param {object[]}    rows
 * @param {ColumnDef[]} columns
 * @param {string}      filename
 * @param {object}      [options]
 * @param {string}      [options.title]
 * @param {string}      [options.subtitle]
 * @param {'portrait'|'landscape'} [options.orientation]
 * @param {ExportMeta}  [options.meta]
 */
export function exportToPDF(rows, columns, filename, options = {}) {
  const {
    title       = filename,
    subtitle    = "",
    orientation = "landscape",
    meta        = {},
  } = options;

  const { empresa = "", usuario = "", extra = "" } = meta;

  const doc   = new jsPDF({ orientation, unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const fechaGen = new Date().toLocaleDateString("es-HN");
  const horaGen  = new Date().toLocaleTimeString("es-HN", {
    hour: "2-digit", minute: "2-digit",
  });

  let y = 20; // cursor vertical

  // ── Bloque de empresa ───────────────────────────────────────────
  if (empresa) {
    // Fondo azul oscuro para la franja de empresa
    doc.setFillColor(30, 58, 138);   // blue-900
    doc.rect(0, 0, pageW, 36, "F");

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text(empresa.toUpperCase(), pageW / 2, 24, { align: "center" });
    y = 44;
  }

  // ── Título del reporte ──────────────────────────────────────────
  doc.setFillColor(29, 78, 216);     // blue-700
  doc.rect(0, y, pageW, 26, "F");

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text(title, pageW / 2, y + 17, { align: "center" });
  y += 34;

  // ── Bloque de metadatos ─────────────────────────────────────────
  // Fondo gris muy claro
  const metaItems = [
    ["Fecha de generación:", `${fechaGen}  ${horaGen}`],
    ...(subtitle ? [["Período / Detalle:", subtitle]] : []),
    ...(extra    ? [["Detalle:",           extra]]     : []),
    ...(usuario  ? [["Generado por:",      usuario]]   : []),
  ];

  const metaBlockH = metaItems.length * 14 + 10;
  doc.setFillColor(243, 244, 246);   // gray-100
  doc.rect(0, y, pageW, metaBlockH, "F");

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");

  const labelX = 40;
  const valueX = 160;
  let metaY = y + 12;

  for (const [label, value] of metaItems) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(55, 65, 81);   // gray-700
    doc.text(label, labelX, metaY);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(17, 24, 39);   // gray-900
    doc.text(String(value), valueX, metaY);

    metaY += 14;
  }

  y += metaBlockH + 6;

  // ── Tabla de datos ──────────────────────────────────────────────
  const body = rows.map((row) =>
    columns.map((col) => {
      const val = resolveValue(row, col);
      if (col.type === "currency") {
        return `L. ${Number(val).toLocaleString("es-HN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`;
      }
      if (col.type === "date" && val instanceof Date) {
        return val.toLocaleDateString("es-HN");
      }
      return val;
    }),
  );

  const columnStyles = {};
  columns.forEach((col, idx) => {
    if (col.type === "currency" || col.type === "number") {
      columnStyles[idx] = { halign: "right" };
    } else if (col.type === "date") {
      columnStyles[idx] = { halign: "center", cellWidth: 70 };
    }
  });

  autoTable(doc, {
    startY             : y,
    head               : [columns.map((c) => c.header)],
    body,
    theme              : "grid",
    styles             : { fontSize: 8, font: "helvetica", cellPadding: 4, overflow: "linebreak" },
    headStyles         : {
      fillColor        : [30, 64, 175],  // blue-800
      textColor        : 255,
      fontStyle        : "bold",
      halign           : "center",
    },
    alternateRowStyles : { fillColor: [239, 246, 255] },  // blue-50
    columnStyles,
    didDrawPage        : ({ pageNumber }) => {
      const total = doc.internal.getNumberOfPages();
      doc.setFontSize(7);
      doc.setTextColor(156, 163, 175);
      doc.text(
        `${empresa ? empresa + "  •  " : ""}Página ${pageNumber} de ${total}  •  Generado: ${fechaGen}`,
        pageW / 2,
        pageH - 8,
        { align: "center" },
      );
    },
  });

  doc.save(`${filename}.pdf`);
}