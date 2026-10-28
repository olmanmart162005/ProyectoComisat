/**
 * ImportButton.jsx
 * ─────────────────────────────────────────────────────────────────
 * Botón reutilizable de importación desde archivos Excel (.xlsx),
 * diseñado con la misma estética y experiencia de usuario que ExportButtons.
 *
 * Props:
 *   schemaKey         {string}    — 'empleados' | 'productos' | 'historialCreditos'
 *   onImportSuccess?  {function}  — callback para refrescar la lista de la tabla tras guardar
 *   refData?          {object}    — datos auxiliares (departamentos, categorías, empleados)
 *   user?             {object}    — usuario actual para registrar en bitácora
 *   nombreEmpleado?   {string}    — nombre del empleado en sesión
 *   disabled?         {boolean}
 *   className?        {string}
 */

import { useState, useRef } from "react";
import { IMPORT_SCHEMAS } from "./importSchemas";
import { parseExcelFile, normalizeRowsWithSchema, validateImportData } from "./ImportUtils";
import ImportPreviewModal from "./ImportPreviewModal";
import { notify } from "../services/notifier";

function IconUpload() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
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

export default function ImportButton({
  schemaKey = "empleados",
  onImportSuccess,
  refData = {},
  user = {},
  nombreEmpleado = "",
  disabled = false,
  className = "",
}) {
  const [readingFile, setReadingFile] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState("");
  const fileInputRef = useRef(null);

  const schemaConfig = IMPORT_SCHEMAS[schemaKey];

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Reset
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      notify.error("Formato no soportado. Por favor sube un archivo Excel (.xlsx o .xls).");
      return;
    }

    setReadingFile(true);
    setSelectedFileName(file.name);

    try {
      // 1. Parsear archivo con ExcelJS
      const { rawRows } = await parseExcelFile(file);

      if (rawRows.length === 0) {
        notify.warning({
          title: "Archivo sin datos",
          description: "La hoja de cálculo no contiene filas de datos para procesar.",
        });
        return;
      }

      // 2. Normalizar columnas según encabezados del esquema
      const normalizedRows = normalizeRowsWithSchema(rawRows, schemaKey);

      // 3. Validar fila por fila contra tipos y reglas
      const result = validateImportData(normalizedRows, schemaKey, refData);

      setValidationResult(result);
      setModalOpen(true);
    } catch (err) {
      console.error("Error al procesar archivo Excel:", err);
      notify.error({
        title: "Error al leer Excel",
        description: err?.message || "No se pudo leer el archivo seleccionado.",
      });
    } finally {
      setReadingFile(false);
    }
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".xlsx, .xls"
        className="hidden"
      />

      <button
        type="button"
        onClick={handleButtonClick}
        disabled={disabled || readingFile}
        title={`Importar ${schemaConfig?.label || "datos"} desde Excel`}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
          border border-emerald-600 text-emerald-700 bg-emerald-50
          hover:bg-emerald-600 hover:text-white
          dark:border-emerald-500 dark:text-emerald-400 dark:bg-emerald-500/10
          dark:hover:bg-emerald-500 dark:hover:text-white
          disabled:opacity-40 disabled:cursor-not-allowed
          disabled:hover:bg-emerald-50 dark:disabled:hover:bg-emerald-500/10 ${className}`}
      >
        {readingFile ? <Spinner /> : <IconUpload />}
        Importar Excel
      </button>

      {modalOpen && validationResult && (
        <ImportPreviewModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          schemaKey={schemaKey}
          schemaConfig={schemaConfig}
          validationResult={validationResult}
          fileName={selectedFileName}
          refData={refData}
          user={user}
          nombreEmpleado={nombreEmpleado}
          onImportSuccess={() => {
            onImportSuccess?.();
          }}
        />
      )}
    </>
  );
}
