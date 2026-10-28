/**
 * ImportUtils.js
 * ─────────────────────────────────────────────────────────────────
 * Motor central de importación desde archivos Excel (.xlsx) con:
 * - Parseo seguro con ExcelJS (reutilizando la dependencia del proyecto)
 * - Mapeo flexible y detección de encabezados
 * - Validación por fila y por tipo de dato con generación de errores detallados
 * - Escritura resiliente en Firestore usando writeBatch en lotes de tamaño configurable
 * - Control de interrupciones, checkpointing, pausado y reintento
 * - Generación automática de sub-registros relacionados (cuotas en historialCreditos)
 */

import ExcelJS from "exceljs";
import {
  collection,
  doc,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import { IMPORT_SCHEMAS, normalizeHeaderString } from "./importSchemas";

const MAX_BATCH_SIZE = 400; // Margen de seguridad sobre el límite de 500 de Firestore

/**
 * Lee y parsea un archivo Excel (.xlsx / .xls) a un arreglo de objetos planos.
 * @param {File} file - Archivo proveniente del input file o dropzone
 * @returns {Promise<{ sheetName: string, headers: string[], rows: object[] }>}
 */
export async function parseExcelFile(file) {
  const buffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error("El archivo Excel no contiene ninguna hoja con datos.");
  }

  const sheetName = worksheet.name;
  let headerRowNumber = -1;
  let headers = [];

  // Encontrar la fila de encabezados: la primera fila con más de 2 celdas no vacías
  worksheet.eachRow((row, rowNumber) => {
    if (headerRowNumber !== -1) return;
    const nonEmptyCells = [];
    row.eachCell((cell) => {
      const val = String(cell.value ?? "").trim();
      if (val) nonEmptyCells.push(val);
    });

    if (nonEmptyCells.length >= 2) {
      headerRowNumber = rowNumber;
      headers = row.values.slice(1).map((v) => {
        if (v && typeof v === "object" && v.text) return String(v.text).trim();
        return String(v ?? "").trim();
      });
    }
  });

  if (headerRowNumber === -1 || headers.length === 0) {
    throw new Error("No se pudo detectar la fila de encabezados en la hoja de Excel.");
  }

  const rawRows = [];
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber <= headerRowNumber) return; // Saltar encabezados y metadatos superiores

    const rowObj = { _rowIndex: rowNumber };
    let hasAnyData = false;

    headers.forEach((header, colIdx) => {
      if (!header) return;
      const cell = row.getCell(colIdx + 1);
      let val = cell.value;

      // Desempaquetar valores especiales de ExcelJS (fórmulas, hipervínculos, fechas, richText)
      if (val != null && typeof val === "object") {
        if (val instanceof Date) {
          // Mantener fecha
        } else if (val.result !== undefined) {
          val = val.result;
        } else if (val.text !== undefined) {
          val = val.text;
        } else if (Array.isArray(val.richText)) {
          val = val.richText.map((rt) => rt.text).join("");
        }
      }

      if (val !== undefined && val !== null && String(val).trim() !== "") {
        hasAnyData = true;
      }

      rowObj[header] = val;
    });

    if (hasAnyData) {
      rawRows.push(rowObj);
    }
  });

  return { sheetName, headers, rawRows };
}

/**
 * Normaliza las filas leídas usando los alias de cabeceras definidos en el esquema.
 * Usa normalización flexible (sin tildes, signos ni mayúsculas).
 */
export function normalizeRowsWithSchema(rawRows, schemaKey) {
  const schema = IMPORT_SCHEMAS[schemaKey];
  if (!schema) throw new Error(`Esquema no encontrado: ${schemaKey}`);

  const aliases = schema.headerAliases || {};
  // Mapear aliases con cabecera normalizada
  const normalizedAliasMap = {};
  Object.entries(aliases).forEach(([aliasKey, targetKey]) => {
    normalizedAliasMap[normalizeHeaderString(aliasKey)] = targetKey;
  });

  return rawRows.map((raw) => {
    const normalized = { _rowIndex: raw._rowIndex };

    Object.entries(raw).forEach(([header, value]) => {
      if (header === "_rowIndex") return;
      const cleanHeader = normalizeHeaderString(header);
      const internalKey = normalizedAliasMap[cleanHeader] || header;
      normalized[internalKey] = value;
    });

    return normalized;
  });
}

/**
 * Valida un arreglo de filas contra el esquema especificado.
 * @returns {{
 *   validRows: object[],
 *   invalidRows: object[],
 *   errorsList: Array<{ row: number, campo: string, error: string, valor: any }>,
 *   summary: { total: number, validCount: number, errorCount: number }
 * }}
 */
export function validateImportData(normalizedRows, schemaKey, refData = {}) {
  const schema = IMPORT_SCHEMAS[schemaKey];
  if (!schema) throw new Error(`Esquema no encontrado: ${schemaKey}`);

  const validRows = [];
  const invalidRows = [];
  const errorsList = [];

  normalizedRows.forEach((row) => {
    const rowIdx = row._rowIndex ?? 0;
    const { isValid, errors, transformedData } = schema.validateRow(row, rowIdx, refData);

    if (isValid) {
      validRows.push({
        _rowIndex: rowIdx,
        _original: row,
        ...transformedData,
      });
    } else {
      invalidRows.push({
        _rowIndex: rowIdx,
        _original: row,
        errors,
      });

      errors.forEach((err) => {
        errorsList.push({
          fila: rowIdx,
          campo: err.campo,
          error: err.error,
          valor: row[err.campo] ?? row[err.campo.toLowerCase()] ?? "—",
        });
      });
    }
  });

  return {
    validRows,
    invalidRows,
    errorsList,
    summary: {
      total: normalizedRows.length,
      validCount: validRows.length,
      errorCount: invalidRows.length,
    },
  };
}

/**
 * Ejecuta la escritura por lotes en Firestore con control de resiliencia y checkpointing.
 *
 * @param {object} params
 * @param {string} params.schemaKey
 * @param {object[]} params.records - Filas válidas transformadas
 * @param {number} [params.startBatchIndex=0] - Para reanudar desde checkpoint
 * @param {function} [params.onProgress] - ({ current, total, percentage, currentBatch, totalBatches })
 * @param {function} [params.shouldCancel] - Retorna booleano para abortar amigablemente
 * @returns {Promise<{
 *   success: boolean,
 *   insertedCount: number,
 *   failedBatchIndex?: number,
 *   lastError?: string
 * }>}
 */
export async function executeBatchImport({
  schemaKey,
  records,
  startBatchIndex = 0,
  onProgress,
  shouldCancel = () => false,
}) {
  const schema = IMPORT_SCHEMAS[schemaKey];
  if (!schema) throw new Error(`Esquema no configurado: ${schemaKey}`);

  // Dividir los registros en chunks según MAX_BATCH_SIZE
  const chunks = [];
  for (let i = 0; i < records.length; i += MAX_BATCH_SIZE) {
    chunks.push(records.slice(i, i + MAX_BATCH_SIZE));
  }

  const totalBatches = chunks.length;
  let totalInserted = startBatchIndex * MAX_BATCH_SIZE;

  for (let batchIdx = startBatchIndex; batchIdx < totalBatches; batchIdx++) {
    // 1. Revisar si el usuario canceló
    if (shouldCancel()) {
      return {
        success: false,
        cancelled: true,
        insertedCount: totalInserted,
        failedBatchIndex: batchIdx,
        lastError: "Operación cancelada por el usuario.",
      };
    }

    // 2. Revisar conexión de red
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      return {
        success: false,
        insertedCount: totalInserted,
        failedBatchIndex: batchIdx,
        lastError: "Se detectó pérdida de conexión a internet. Puede reanudar cuando vuelva la conexión.",
      };
    }

    const chunk = chunks[batchIdx];
    const batch = writeBatch(db);

    try {
      for (const item of chunk) {
        // Remover campos internos de tracking
        const { _rowIndex, _original, ...dataToWrite } = item;

        // Referencia principal en Firestore
        const mainDocRef = doc(collection(db, schema.collectionName));

        batch.set(mainDocRef, {
          ...dataToWrite,
          fechaRegistro: dataToWrite.fechaRegistro || serverTimestamp(),
          ultimaModificacion: serverTimestamp(),
          importadoExcel: true,
        });

        // Caso especial: para 'historialCreditos', si tiene cuotasPagadas > 0,
        // generar automáticamente los documentos correspondientes en la colección 'cuotas'
        if (schemaKey === "historialCreditos" && dataToWrite.cuotasPagadas > 0) {
          const numCuotas = Math.min(dataToWrite.cuotasPagadas, 50); // Límite razonable por seguridad
          const cuotaMonto = dataToWrite.datosFinancierosHistoricos?.cuotaMensual || 0;
          let saldoRestante = dataToWrite.datosFinancierosHistoricos?.totalCredito || 0;

          for (let c = 1; c <= numCuotas; c++) {
            saldoRestante = Math.max(0, Number((saldoRestante - cuotaMonto).toFixed(2)));
            const fechaCuota = dataToWrite.fechaAutoriza ? new Date(dataToWrite.fechaAutoriza.getTime() + (c * 30 * 24 * 60 * 60 * 1000)) : serverTimestamp();
            const cuotaDocRef = doc(collection(db, "cuotas"));

            batch.set(cuotaDocRef, {
              creditoId: mainDocRef.id,
              empleadoId: dataToWrite.empleadoId || "",
              empleadoNombre: `${dataToWrite.empleadoNombres ?? ""} ${dataToWrite.empleadoApellidos ?? ""}`.trim(),
              numeroCuota: c,
              montoCuota: cuotaMonto,
              saldoPendiente: saldoRestante,
              fechaCobro: fechaCuota,
              mesCobro: `${fechaCuota instanceof Date ? `${fechaCuota.getFullYear()}-${String(fechaCuota.getMonth() + 1).padStart(2, "0")}` : `Mes ${c}`}`,
              registradoPor: "Importación Excel",
              fechaRegistro: serverTimestamp(),
            });
          }
        }
      }

      // Ejecutar commit del lote en Firestore
      await batch.commit();

      totalInserted += chunk.length;

      if (onProgress) {
        const percentage = Math.min(100, Math.round(((batchIdx + 1) / totalBatches) * 100));
        onProgress({
          current: totalInserted,
          total: records.length,
          percentage,
          currentBatch: batchIdx + 1,
          totalBatches,
        });
      }
    } catch (err) {
      console.error(`Error escribiendo lote ${batchIdx + 1}:`, err);
      return {
        success: false,
        insertedCount: totalInserted,
        failedBatchIndex: batchIdx,
        lastError: err?.message || "Fallo en la comunicación con la base de datos.",
      };
    }
  }

  return {
    success: true,
    insertedCount: records.length,
  };
}

/**
 * Genera y descarga un archivo Excel con el informe detallado de errores.
 */
export async function downloadErrorReport(errorsList, schemaLabel) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Errores de Importación");

  ws.columns = [
    { header: "Fila Excel", key: "fila", width: 14 },
    { header: "Columna / Campo", key: "campo", width: 22 },
    { header: "Valor Encontrado", key: "valor", width: 30 },
    { header: "Descripción del Error", key: "error", width: 50 },
  ];

  // Estilo cabecera
  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "DC2626" }, // Rojo alerta
  };

  errorsList.forEach((err) => {
    ws.addRow({
      fila: err.fila,
      campo: err.campo,
      valor: String(err.valor ?? "—"),
      error: err.error,
    });
  });

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Errores_Importacion_${schemaLabel}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  a.click();
  URL.revokeObjectURL(a);
}
