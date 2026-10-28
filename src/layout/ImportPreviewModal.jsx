/**
 * ImportPreviewModal.jsx
 * ─────────────────────────────────────────────────────────────────
 * Modal interactivo de validación previa antes de escribir en Firestore.
 * Muestra:
 * - Resumen numérico (total, válidos, erróneos)
 * - Tabs:
 *     1. "Registros Válidos" (tabla preview con paginación)
 *     2. "Errores Encontrados" (tabla de fila, campo, valor inválido, mensaje de error)
 * - Botón para descargar reporte de errores en Excel
 * - Barra de progreso en tiempo real durante la escritura
 * - Manejo de pausas, fallos por desconexión / DB y botón para reanudar desde el último checkpoint
 */

import { useState, useRef } from "react";
import { Modal } from "../components/ui/modal";
import { downloadErrorReport, executeBatchImport } from "./ImportUtils";
import { notify } from "../services/notifier";
import { registrarBitacora } from "../services/bitacora";

export default function ImportPreviewModal({
  isOpen,
  onClose,
  schemaKey,
  schemaConfig,
  validationResult,
  fileName,
  refData = {},
  user = {},
  nombreEmpleado = "",
  onImportSuccess,
}) {
  const [activeTab, setActiveTab] = useState("preview"); // 'preview' | 'errors'
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({
    current: 0,
    total: 0,
    percentage: 0,
    currentBatch: 0,
    totalBatches: 0,
  });

  // Estado para recuperación de interrupciones
  const [failedCheckpoint, setFailedCheckpoint] = useState(null); // { batchIndex, errorMsg }
  const [importCompleted, setImportCompleted] = useState(false);
  const cancelRequestedRef = useRef(false);

  if (!validationResult) return null;

  const { validRows = [], errorsList = [], summary = {} } = validationResult;
  const hasErrors = errorsList.length > 0;
  const canImport = validRows.length > 0 && !importing && !importCompleted;

  // Manejo de importación / escritura
  const handleStartImport = async (startFromBatch = 0) => {
    setImporting(true);
    setFailedCheckpoint(null);
    cancelRequestedRef.current = false;

    const result = await executeBatchImport({
      schemaKey,
      records: validRows,
      startBatchIndex: startFromBatch,
      onProgress: (prog) => {
        setProgress(prog);
      },
      shouldCancel: () => cancelRequestedRef.current,
    });

    setImporting(false);

    if (result.success) {
      setImportCompleted(true);
      notify.success({
        title: "Importación Exitosa",
        description: `Se insertaron ${result.insertedCount} registros correctamente en ${schemaConfig.label}.`,
      });

      // Registrar en bitácora
      await registrarBitacora({
        usuario: user?.email || "desconocido",
        nombre: nombreEmpleado || user?.email || "desconocido",
        coleccion: schemaConfig.collectionName,
        accion: "importacion_excel",
        metadata: {
          archivo: fileName,
          totalFilas: summary.total,
          registrosInsertados: result.insertedCount,
          registrosConError: summary.errorCount,
        },
      });

      if (onImportSuccess) {
        onImportSuccess();
      }
    } else {
      if (result.cancelled) {
        notify.info("La importación fue detenida por el usuario.");
      } else {
        notify.error({
          title: "Interrupción de Importación",
          description: result.lastError || "Ocurrió un error escribiendo en la base de datos.",
        });

        // Guardar checkpoint para permitir reintento
        setFailedCheckpoint({
          batchIndex: result.failedBatchIndex || 0,
          errorMsg: result.lastError,
          insertedCount: result.insertedCount,
        });
      }
    }
  };

  const handleCancelImport = () => {
    cancelRequestedRef.current = true;
  };

  // Preview de las primeras 50 filas válidas
  const previewRows = validRows.slice(0, 50);

  return (
    <Modal
      isOpen={isOpen}
      onClose={importing ? () => {} : onClose}
      className="max-w-4xl p-6"
    >
      <div className="space-y-5">
        {/* Encabezado */}
        <div className="border-b pb-4 dark:border-white/10 space-y-3">
          <div className="pr-12 sm:pr-14">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white">
              Importar {schemaConfig.label} desde Excel
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Archivo analizado: <span className="font-semibold text-gray-700 dark:text-gray-300">{fileName}</span>
            </p>
          </div>

          {/* Medidores rápidos */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 text-xs rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20">
              Total: {summary.total}
            </span>
            <span className="px-2.5 py-1 text-xs rounded-full bg-green-50 text-green-700 font-semibold border border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20">
              Válidos: {summary.validCount}
            </span>
            {hasErrors && (
              <span className="px-2.5 py-1 text-xs rounded-full bg-red-50 text-red-700 font-semibold border border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20">
                Con Error: {summary.errorCount}
              </span>
            )}
          </div>
        </div>

        {/* Alerta de errores si existen */}
        {hasErrors && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-300 flex items-center justify-between gap-2">
            <div>
              <strong>Atención:</strong> Se detectaron {errorsList.length} incidencias en {summary.errorCount} filas. Las filas con error no se escribirán en la base de datos hasta que sean corregidas.
            </div>
            <button
              onClick={() => downloadErrorReport(errorsList, schemaConfig.label)}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg shadow-xs transition shrink-0"
            >
              Descargar Reporte Excel
            </button>
          </div>
        )}

        {/* Barra de progreso de escritura */}
        {importing && (
          <div className="p-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl space-y-2">
            <div className="flex justify-between text-xs font-semibold text-blue-900 dark:text-blue-300">
              <span>Guardando en base de datos...</span>
              <span>
                {progress.percentage}% ({progress.current} de {validRows.length})
              </span>
            </div>
            <div className="w-full bg-blue-200 dark:bg-blue-950 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
            <div className="flex justify-between items-center pt-1 text-xs text-blue-700 dark:text-blue-400">
              <span>
                Lote {progress.currentBatch} de {progress.totalBatches}
              </span>
              <button
                onClick={handleCancelImport}
                className="text-red-600 hover:underline font-medium"
              >
                Detener
              </button>
            </div>
          </div>
        )}

        {/* Alerta de Checkpoint por Interrupción / Fallo */}
        {failedCheckpoint && !importing && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-300 space-y-2">
            <p className="font-bold">
              La importación se interrumpió en el lote {failedCheckpoint.batchIndex + 1}.
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              Causa: {failedCheckpoint.errorMsg}
            </p>
            <p className="text-green-700 dark:text-green-400 font-semibold">
              Se guardaron con éxito los primeros {failedCheckpoint.insertedCount} registros. No se duplicarán si reanuda.
            </p>
            <div className="pt-2 flex gap-2">
              <button
                onClick={() => handleStartImport(failedCheckpoint.batchIndex)}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium shadow-xs"
              >
                Reintentar Lotes Pendientes
              </button>
            </div>
          </div>
        )}

        {/* Selector de pestañas */}
        <div className="flex border-b border-gray-200 dark:border-white/10 text-sm">
          <button
            onClick={() => setActiveTab("preview")}
            className={`pb-2 px-4 font-semibold border-b-2 transition ${
              activeTab === "preview"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
            }`}
          >
            Vista Previa Válidos ({validRows.length})
          </button>
          <button
            onClick={() => setActiveTab("errors")}
            className={`pb-2 px-4 font-semibold border-b-2 transition ${
              activeTab === "errors"
                ? "border-red-600 text-red-600 dark:text-red-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
            }`}
          >
            Errores Encontrados ({errorsList.length})
          </button>
        </div>

        {/* Contenido de la pestaña activa */}
        <div className="max-h-72 overflow-y-auto border rounded-xl border-gray-200 dark:border-white/10 text-xs">
          {activeTab === "preview" ? (
            validRows.length === 0 ? (
              <div className="p-8 text-center text-gray-400 italic">
                No hay registros válidos para importar.
              </div>
            ) : (
              <table className="w-full divide-y divide-gray-200 dark:divide-white/10">
                <thead className="bg-gray-50 dark:bg-white/[0.03] text-gray-500 dark:text-gray-400 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Fila</th>
                    {schemaKey === "empleados" && (
                      <>
                        <th className="px-3 py-2 text-left font-medium">Código</th>
                        <th className="px-3 py-2 text-left font-medium">DNI</th>
                        <th className="px-3 py-2 text-left font-medium">Nombre Completo</th>
                        <th className="px-3 py-2 text-left font-medium">Correo</th>
                        <th className="px-3 py-2 text-right font-medium">Salario</th>
                      </>
                    )}
                    {schemaKey === "productos" && (
                      <>
                        <th className="px-3 py-2 text-left font-medium">Nombre</th>
                        <th className="px-3 py-2 text-left font-medium">Categoría</th>
                        <th className="px-3 py-2 text-right font-medium">Precio Contado</th>
                        <th className="px-3 py-2 text-right font-medium">Stock</th>
                        <th className="px-3 py-2 text-center font-medium">Estado</th>
                      </>
                    )}
                    {schemaKey === "historialCreditos" && (
                      <>
                        <th className="px-3 py-2 text-left font-medium">Empleado</th>
                        <th className="px-3 py-2 text-left font-medium">Artículo</th>
                        <th className="px-3 py-2 text-center font-medium">Progreso</th>
                        <th className="px-3 py-2 text-right font-medium">Saldo</th>
                        <th className="px-3 py-2 text-center font-medium">Estado</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300">
                  {previewRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                      <td className="px-3 py-2 font-mono text-gray-400">{row._rowIndex}</td>
                      {schemaKey === "empleados" && (
                        <>
                          <td className="px-3 py-2 font-mono">{row.codigoEmpleado}</td>
                          <td className="px-3 py-2">{row.dni}</td>
                          <td className="px-3 py-2 font-medium">{`${row.nombres} ${row.apellidos}`}</td>
                          <td className="px-3 py-2 text-gray-500">{row.correo}</td>
                          <td className="px-3 py-2 text-right font-mono">L. {Number(row.salario).toLocaleString()}</td>
                        </>
                      )}
                      {schemaKey === "productos" && (
                        <>
                          <td className="px-3 py-2 font-medium">{row.nombre}</td>
                          <td className="px-3 py-2 text-gray-500">{row.categoriaNombre}</td>
                          <td className="px-3 py-2 text-right font-mono">L. {Number(row.precioContado).toLocaleString()}</td>
                          <td className="px-3 py-2 text-right font-mono">{row.stock}</td>
                          <td className="px-3 py-2 text-center">{row.estado}</td>
                        </>
                      )}
                      {schemaKey === "historialCreditos" && (
                        <>
                          <td className="px-3 py-2 font-medium">{`${row.empleadoNombres} ${row.empleadoApellidos}`}</td>
                          <td className="px-3 py-2 text-gray-500">{row.productoNombre}</td>
                          <td className="px-3 py-2 text-center font-mono">
                            {row.cuotasPagadas} de {row.datosFinancierosHistoricos?.plazoCuotas} cuotas
                          </td>
                          <td className="px-3 py-2 text-right font-mono">L. {Number(row.saldoPendiente).toLocaleString()}</td>
                          <td className="px-3 py-2 text-center">{row.estadoCredito}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : (
            errorsList.length === 0 ? (
              <div className="p-8 text-center text-green-600 dark:text-green-400 font-medium">
                ✓ No se detectaron errores en ninguna fila. Todos los registros son válidos.
              </div>
            ) : (
              <table className="w-full divide-y divide-gray-200 dark:divide-white/10">
                <thead className="bg-red-50 dark:bg-red-500/10 text-red-800 dark:text-red-300 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Fila</th>
                    <th className="px-3 py-2 text-left font-medium">Columna</th>
                    <th className="px-3 py-2 text-left font-medium">Valor Leído</th>
                    <th className="px-3 py-2 text-left font-medium">Error Encontrado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300">
                  {errorsList.map((err, idx) => (
                    <tr key={idx} className="hover:bg-red-50/50 dark:hover:bg-red-500/5">
                      <td className="px-3 py-2 font-mono text-gray-500 font-semibold">{err.fila}</td>
                      <td className="px-3 py-2 font-medium text-red-700 dark:text-red-400">{err.campo}</td>
                      <td className="px-3 py-2 font-mono text-gray-600 dark:text-gray-400 truncate max-w-[150px]">
                        {String(err.valor)}
                      </td>
                      <td className="px-3 py-2 text-gray-800 dark:text-gray-200">{err.error}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>

        {/* Pie y Botones de acción */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t dark:border-white/10">
          <button
            type="button"
            onClick={onClose}
            disabled={importing}
            className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg transition"
          >
            {importCompleted ? "Cerrar" : "Cancelar"}
          </button>

          {!importCompleted && (
            <button
              type="button"
              onClick={() => handleStartImport(0)}
              disabled={!canImport}
              className="w-full sm:w-auto px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition flex items-center justify-center gap-2"
            >
              {importing ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  <span>Importando...</span>
                </>
              ) : (
                <span>Confirmar e Importar ({validRows.length} registros)</span>
              )}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
