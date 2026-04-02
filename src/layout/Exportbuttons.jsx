/**
 * ExportButtons.jsx
 * ─────────────────────────────────────────────────────────────────
 * Botones reutilizables de exportación (Excel + PDF).
 *
 * Props:
 *   rows        {object[]}    — datos a exportar
 *   columns     {ColumnDef[]} — definición de columnas (ver exportUtils.js)
 *   filename    {string}      — nombre base sin extensión
 *   sheetName?  {string}      — nombre de la hoja Excel (default: "Datos")
 *   pdfOptions? {object}      — { title, subtitle, orientation }
 *   meta?       {object}      — { empresa, usuario, extra }
 *                               Se pasa a AMBAS exportaciones (Excel y PDF)
 *   disabled?   {boolean}
 *   className?  {string}
 */

import { useState } from "react";
import { exportToExcel, exportToPDF } from "../layout/exportUtils";

function IconExcel() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M9 17v-2m3 2v-4m3 4v-6M5 20h14a2 2 0 002-2V6l-5-5H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  );
}

function IconPDF() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 13h4M10 17h4M10 9h1" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

export default function ExportButtons({
  rows       = [],
  columns    = [],
  filename   = "exportacion",
  sheetName  = "Datos",
  pdfOptions = {},
  meta       = {},           // ← nuevo: { empresa, usuario, extra }
  disabled   = false,
  className  = "",
}) {
  const [loadingExcel, setLoadingExcel] = useState(false);
  const [loadingPDF,   setLoadingPDF]   = useState(false);

  const isEmpty    = rows.length === 0;
  const isDisabled = disabled || isEmpty;

  const handleExcel = async () => {
    setLoadingExcel(true);
    try {
      await new Promise((r) => setTimeout(r, 50));
      await exportToExcel(rows, columns, filename, sheetName, meta);
    } catch (err) {
      console.error("Error exportando Excel:", err);
    } finally {
      setLoadingExcel(false);
    }
  };

  const handlePDF = async () => {
    setLoadingPDF(true);
    try {
      await new Promise((r) => setTimeout(r, 50));
      exportToPDF(rows, columns, filename, { ...pdfOptions, meta });
    } catch (err) {
      console.error("Error exportando PDF:", err);
    } finally {
      setLoadingPDF(false);
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={handleExcel}
        disabled={isDisabled || loadingExcel}
        title={isEmpty ? "Sin datos para exportar" : "Exportar a Excel"}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
          border border-green-600 text-green-700 bg-green-50
          hover:bg-green-600 hover:text-white
          dark:border-green-500 dark:text-green-400 dark:bg-green-500/10
          dark:hover:bg-green-500 dark:hover:text-white
          disabled:opacity-40 disabled:cursor-not-allowed
          disabled:hover:bg-green-50 dark:disabled:hover:bg-green-500/10"
      >
        {loadingExcel ? <Spinner /> : <IconExcel />}
        Excel
      </button>

      <button
        onClick={handlePDF}
        disabled={isDisabled || loadingPDF}
        title={isEmpty ? "Sin datos para exportar" : "Exportar a PDF"}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
          border border-red-500 text-red-600 bg-red-50
          hover:bg-red-500 hover:text-white
          dark:border-red-400 dark:text-red-400 dark:bg-red-500/10
          dark:hover:bg-red-500 dark:hover:text-white
          disabled:opacity-40 disabled:cursor-not-allowed
          disabled:hover:bg-red-50 dark:disabled:hover:bg-red-500/10"
      >
        {loadingPDF ? <Spinner /> : <IconPDF />}
        PDF
      </button>
    </div>
  );
}