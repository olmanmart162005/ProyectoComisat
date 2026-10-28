/**
 * importSchemas.js
 * ─────────────────────────────────────────────────────────────────
 * Definición de esquemas de validación y mapeo para importación desde Excel.
 * Coincide con las columnas y formatos exportados o estándar del sistema.
 */

import {
  parseDateValue,
  DNI_LENGTH,
  TELEFONO_LENGTH,
  isValidEmail,
  sanitizeDigitsInput,
} from "../utils/empleadoUtils";
import {
  sanitizeNombreProducto,
  sanitizeDescripcionProducto,
  getEstadoProducto,
  MAX_DESCRIPCION,
  MAX_NOMBRE_PRODUCTO,
} from "../utils/productoUtils";
import { PORCENTAJE_CREDITO_MANUAL } from "../pages/Inventario/hooks/useProductos";

/**
 * Limpia y normaliza un número extraído de Excel (maneja formato moneda "L. 18,000.00", strings con comas, espacios, etc.)
 */
export function sanitizeNumberInput(val) {
  if (val == null) return NaN;
  if (typeof val === "number") return val;
  const cleaned = String(val)
    .replace(/[Ll]\.?\s*/g, "") // quita L o L.
    .replace(/,/g, "") // quita comas
    .trim();
  return Number(cleaned);
}

/**
 * Normaliza nombres de encabezados a formato canónico alfanumérico en minúsculas (sin tildes ni signos).
 * Ejemplos:
 *   "P. Contado (L.)" -> "pcontadol"
 *   "Código de Empleado" -> "codigodeempleado"
 *   "Categoría" -> "categoria"
 */
export function normalizeHeaderString(str = "") {
  return String(str)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quita tildes
    .replace(/[^a-z0-9]/g, ""); // conserva solo alfanumérico
}

export const IMPORT_SCHEMAS = {
  empleados: {
    label: "Empleados",
    collectionName: "empleados",
    headersRequired: [
      "Código",
      "DNI",
      "Nombres",
      "Apellidos",
      "Correo",
      "Teléfono",
      "Salario",
      "Fecha Inicio",
      "Estado",
    ],
    headerAliases: {
      "codigo": "codigoEmpleado",
      "codigoempleado": "codigoEmpleado",
      "codigodeempleado": "codigoEmpleado",
      "codempleado": "codigoEmpleado",
      "dni": "dni",
      "identidad": "dni",
      "numeroidentidad": "dni",
      "nombres": "nombres",
      "nombre": "nombres",
      "primernombre": "nombres",
      "apellidos": "apellidos",
      "apellido": "apellidos",
      "primerapellido": "apellidos",
      "correo": "correo",
      "email": "correo",
      "correoelectronico": "correo",
      "telefono": "telefono",
      "celular": "telefono",
      "numtelefono": "telefono",
      "salario": "salario",
      "sueldo": "salario",
      "salariol": "salario",
      "salariolempiras": "salario",
      "fechainicio": "fechaInicio",
      "fechadeinicio": "fechaInicio",
      "estado": "estado",
      "departamento": "departamentoNombre",
      "departamentonombre": "departamentoNombre",
      "area": "departamentoNombre",
    },
    validateRow: (row, rowIndex, refData = {}) => {
      const errors = [];
      const { departamentos = [], empleados = [] } = refData;

      const codigoEmpleado = String(row.codigoEmpleado ?? "").trim();
      const nombres = String(row.nombres ?? "").trim();
      const apellidos = String(row.apellidos ?? "").trim();
      const correo = String(row.correo ?? "").trim().toLowerCase();
      const dni = sanitizeDigitsInput(row.dni, DNI_LENGTH);
      const telefono = sanitizeDigitsInput(row.telefono, TELEFONO_LENGTH);
      const salario = sanitizeNumberInput(row.salario);
      const rawFecha = row.fechaInicio;
      const estado = String(row.estado ?? "Activo").trim();
      const depNombre = String(row.departamentoNombre ?? "").trim();

      if (!codigoEmpleado) {
        errors.push({ campo: "Código", error: "El código de empleado es obligatorio." });
      }

      if (!nombres) {
        errors.push({ campo: "Nombres", error: "El nombre es obligatorio." });
      }

      if (!apellidos) {
        errors.push({ campo: "Apellidos", error: "Los apellidos son obligatorios." });
      }

      if (!correo || !isValidEmail(correo)) {
        errors.push({ campo: "Correo", error: "Correo electrónico no válido." });
      }

      if (dni.length !== DNI_LENGTH) {
        errors.push({
          campo: "DNI",
          error: `El DNI debe tener ${DNI_LENGTH} dígitos numéricos. Se recibieron ${dni.length}.`,
        });
      }

      if (telefono.length !== TELEFONO_LENGTH) {
        errors.push({
          campo: "Teléfono",
          error: `El teléfono debe tener ${TELEFONO_LENGTH} dígitos numéricos. Se recibieron ${telefono.length}.`,
        });
      }

      if (isNaN(salario) || salario <= 0) {
        errors.push({ campo: "Salario", error: "El salario debe ser un número mayor a 0." });
      }

      const parsedDate = parseDateValue(rawFecha);
      if (!parsedDate || isNaN(parsedDate.getTime())) {
        errors.push({
          campo: "Fecha Inicio",
          error: "Fecha de inicio no válida (use YYYY-MM-DD o formato fecha).",
        });
      }

      // Validar duplicados contra empleados existentes en la base de datos
      if (empleados.length > 0) {
        const codigoExiste = empleados.some(
          (e) => String(e.codigoEmpleado ?? "").trim().toLowerCase() === codigoEmpleado.toLowerCase()
        );
        if (codigoExiste) {
          errors.push({
            campo: "Código",
            error: `Ya existe un empleado con el código '${codigoEmpleado}' en el sistema.`,
          });
        }

        const dniExiste = empleados.some(
          (e) => sanitizeDigitsInput(e.dni, DNI_LENGTH) === dni && dni.length === DNI_LENGTH
        );
        if (dniExiste) {
          errors.push({
            campo: "DNI",
            error: `Ya existe un empleado con el DNI '${dni}' en el sistema.`,
          });
        }

        const correoExiste = empleados.some(
          (e) => String(e.correo ?? "").trim().toLowerCase() === correo && correo !== ""
        );
        if (correoExiste) {
          errors.push({
            campo: "Correo",
            error: `El correo '${correo}' ya está registrado con otro empleado.`,
          });
        }
      }

      let departamentoId = "";
      if (depNombre && departamentos.length > 0) {
        const depFound = departamentos.find(
          (d) =>
            normalizeHeaderString(d.nombre) === normalizeHeaderString(depNombre) ||
            d.id === depNombre
        );
        if (depFound) {
          departamentoId = depFound.id;
        } else {
          errors.push({
            campo: "Departamento",
            error: `El departamento '${depNombre}' no existe en el sistema.`,
          });
        }
      } else if (departamentos.length > 0) {
        departamentoId = departamentos[0]?.id || "";
      }

      const payload = {
        codigoEmpleado,
        nombres,
        apellidos,
        correo,
        dni,
        telefono,
        salario,
        fechaInicio: parsedDate || new Date(),
        estado: ["Activo", "Inactivo"].includes(estado) ? estado : "Activo",
        departamentoId,
        departamentoNombre: depNombre || (departamentos[0]?.nombre ?? "General"),
      };

      return {
        isValid: errors.length === 0,
        errors,
        transformedData: payload,
      };
    },
  },

  productos: {
    label: "Productos",
    collectionName: "productos",
    headersRequired: [
      "Nombre",
      "Descripción",
      "Categoría",
      "Precio Contado (L.)",
      "Stock",
      "Stock Mínimo",
    ],
    headerAliases: {
      "nombre": "nombre",
      "producto": "nombre",
      "nombreproducto": "nombre",
      "nombredelproducto": "nombre",
      "articulo": "nombre",
      "descripcion": "descripcion",
      "categoria": "categoriaNombre",
      "categorianombre": "categoriaNombre",
      "costo": "costo",
      "costol": "costo",
      "preciocontado": "precioContado",
      "preciocontadol": "precioContado",
      "pcontado": "precioContado",
      "pcontadol": "precioContado",
      "preciocredito": "precioCredito",
      "preciocreditol": "precioCredito",
      "pcredito": "precioCredito",
      "pcreditol": "precioCredito",
      "stock": "stock",
      "stockactual": "stock",
      "existencias": "stock",
      "cantidad": "stock",
      "stockminimo": "stockMinimo",
      "stockmin": "stockMinimo",
      "estado": "estado",
      "imagen": "imagenUrl",
      "urlimagen": "imagenUrl",
      "imagenurl": "imagenUrl",
      "foto": "imagenUrl",
    },
    validateRow: (row, rowIndex, refData = {}) => {
      const errors = [];
      const { categorias = [], productos = [], porcentajeAumento = PORCENTAJE_CREDITO_MANUAL } = refData;

      const rawNombre = String(row.nombre ?? "").trim();
      const rawDescripcion = String(row.descripcion ?? "").trim();
      const rawCategoria = String(row.categoriaNombre ?? "").trim();
      
      // Si el Excel tiene precioContado usamos ese, si no y viene 'costo', lo usamos como base
      let precioContado = sanitizeNumberInput(row.precioContado);
      if (isNaN(precioContado) && row.costo != null) {
        precioContado = sanitizeNumberInput(row.costo);
      }

      const stock = sanitizeNumberInput(row.stock);
      const rawStockMin = row.stockMinimo;
      const stockMinimo = rawStockMin != null ? sanitizeNumberInput(rawStockMin) : 0;
      const rawEstado = String(row.estado ?? "Activo").trim();

      const nombreSanitizado = sanitizeNombreProducto(rawNombre).trim();
      const descripcionSanitizada = sanitizeDescripcionProducto(rawDescripcion).trim();

      if (!nombreSanitizado) {
        errors.push({ campo: "Nombre", error: "El nombre del producto es obligatorio." });
      } else if (nombreSanitizado.length > MAX_NOMBRE_PRODUCTO) {
        errors.push({
          campo: "Nombre",
          error: `El nombre no puede superar ${MAX_NOMBRE_PRODUCTO} caracteres.`,
        });
      }

      // Validar si el producto ya existe en la base de datos
      if (productos.length > 0 && nombreSanitizado) {
        const yaExiste = productos.some(
          (p) => normalizeHeaderString(p.nombre) === normalizeHeaderString(nombreSanitizado)
        );
        if (yaExiste) {
          errors.push({
            campo: "Nombre",
            error: `Ya existe un producto registrado con el nombre '${nombreSanitizado}'.`,
          });
        }
      }

      if (!descripcionSanitizada) {
        errors.push({ campo: "Descripción", error: "La descripción es obligatoria." });
      } else if (descripcionSanitizada.length > MAX_DESCRIPCION) {
        errors.push({
          campo: "Descripción",
          error: `La descripción no puede superar ${MAX_DESCRIPCION} caracteres.`,
        });
      }

      if (isNaN(precioContado) || precioContado <= 0) {
        errors.push({ campo: "Precio Contado", error: "El precio contado debe ser mayor a 0." });
      }

      if (isNaN(stock) || !Number.isInteger(stock) || stock < 0) {
        errors.push({ campo: "Stock", error: "El stock debe ser un número entero mayor o igual a 0." });
      }

      if (isNaN(stockMinimo) || !Number.isInteger(stockMinimo) || stockMinimo < 0) {
        errors.push({ campo: "Stock Mínimo", error: "El stock mínimo debe ser un entero ≥ 0." });
      }

      let categoriaId = "";
      let categoriaNombre = rawCategoria;
      if (rawCategoria && categorias.length > 0) {
        const catFound = categorias.find(
          (c) =>
            normalizeHeaderString(c.nombre) === normalizeHeaderString(rawCategoria) ||
            c.id === rawCategoria
        );
        if (catFound) {
          categoriaId = catFound.id;
          categoriaNombre = catFound.nombre;
        } else {
          errors.push({
            campo: "Categoría",
            error: `La categoría '${rawCategoria}' no existe en el sistema.`,
          });
        }
      } else if (categorias.length > 0) {
        categoriaId = categorias[0]?.id || "";
        categoriaNombre = categorias[0]?.nombre || "General";
      } else {
        errors.push({ campo: "Categoría", error: "No hay categorías registradas en el sistema." });
      }

      const estadoFinal = getEstadoProducto(stock, stockMinimo, rawEstado);
      
      // Si el Excel provee precioCredito explícito lo respetamos; si no, calculamos con porcentaje manual
      let precioCredito = sanitizeNumberInput(row.precioCredito);
      if (isNaN(precioCredito) || precioCredito <= 0) {
        precioCredito = Number((precioContado * (1 + Number(porcentajeAumento || 0))).toFixed(2));
      }

      const payload = {
        nombre: nombreSanitizado,
        descripcion: descripcionSanitizada,
        categoriaId,
        categoriaNombre,
        precioContado,
        precioCredito,
        stock,
        stockMinimo,
        estado: estadoFinal,
        imagenUrl: String(row.imagenUrl ?? "").trim(),
      };

      return {
        isValid: errors.length === 0,
        errors,
        transformedData: payload,
      };
    },
  },

  historialCreditos: {
    label: "Historial de Créditos",
    collectionName: "creditos",
    headersRequired: [
      "Empleado",
      "Artículo",
      "Saldo Pendiente",
      "Fecha Autorización",
      "Estado",
    ],
    headerAliases: {
      "empleado": "empleadoCompleto",
      "empleadonombres": "empleadoNombres",
      "nombresempleado": "empleadoNombres",
      "empleadoapellidos": "empleadoApellidos",
      "apellidosempleado": "empleadoApellidos",
      "articulo": "productoNombre",
      "producto": "productoNombre",
      "progreso": "progreso",
      "cuotaspagadas": "cuotasPagadas",
      "plazocuotas": "plazoCuotas",
      "totalcredito": "totalCredito",
      "totalcreditol": "totalCredito",
      "cuotamensual": "cuotaMensual",
      "cuotamensuall": "cuotaMensual",
      "saldopendiente": "saldoPendiente",
      "saldopendientel": "saldoPendiente",
      "saldo": "saldoPendiente",
      "fechaautorizacion": "fechaAutoriza",
      "fechadeautorizacion": "fechaAutoriza",
      "fechaautoriza": "fechaAutoriza",
      "estado": "estadoCredito",
      "estadocredito": "estadoCredito",
    },
    validateRow: (row, rowIndex, refData = {}) => {
      const errors = [];
      const { empleados = [], creditos = [] } = refData;

      let empleadoNombres = String(row.empleadoNombres ?? "").trim();
      let empleadoApellidos = String(row.empleadoApellidos ?? "").trim();
      const empleadoCompleto = String(row.empleadoCompleto ?? "").trim();

      if (!empleadoNombres && !empleadoApellidos && empleadoCompleto) {
        const parts = empleadoCompleto.split(/\s+/);
        if (parts.length >= 2) {
          empleadoNombres = parts.slice(0, Math.ceil(parts.length / 2)).join(" ");
          empleadoApellidos = parts.slice(Math.ceil(parts.length / 2)).join(" ");
        } else {
          empleadoNombres = empleadoCompleto;
          empleadoApellidos = "";
        }
      }

      if (!empleadoNombres) {
        errors.push({ campo: "Empleado", error: "El nombre del empleado es obligatorio." });
      }

      const productoNombre = String(row.productoNombre ?? "").trim();
      if (!productoNombre) {
        errors.push({ campo: "Artículo", error: "El nombre del artículo o producto es obligatorio." });
      }

      // Cuotas y progreso
      let cuotasPagadas = 0;
      let plazoCuotas = 1;
      if (row.progreso) {
        const match = String(row.progreso).match(/(\d+)\s*(?:de|\/)\s*(\d+)/i);
        if (match) {
          cuotasPagadas = parseInt(match[1], 10);
          plazoCuotas = parseInt(match[2], 10);
        }
      }
      if (row.cuotasPagadas != null) {
        const parsedCp = sanitizeNumberInput(row.cuotasPagadas);
        if (!isNaN(parsedCp)) cuotasPagadas = parsedCp;
      }
      if (row.plazoCuotas != null) {
        const parsedPz = sanitizeNumberInput(row.plazoCuotas);
        if (!isNaN(parsedPz)) plazoCuotas = parsedPz;
      }

      if (cuotasPagadas < 0) {
        errors.push({ campo: "Progreso", error: "Las cuotas pagadas no pueden ser negativas." });
      }
      if (plazoCuotas <= 0) {
        errors.push({ campo: "Progreso", error: "El plazo de cuotas debe ser mayor a 0." });
      }

      const saldoPendiente = sanitizeNumberInput(row.saldoPendiente ?? 0);
      if (isNaN(saldoPendiente) || saldoPendiente < 0) {
        errors.push({ campo: "Saldo Pendiente", error: "El saldo pendiente debe ser un número ≥ 0." });
      }

      const rawFecha = row.fechaAutoriza;
      const parsedDate = parseDateValue(rawFecha);
      if (!parsedDate || isNaN(parsedDate.getTime())) {
        errors.push({ campo: "Fecha Autorización", error: "Fecha de autorización inválida." });
      }

      const estadoCredito = String(row.estadoCredito ?? "Activo").trim();
      const estadosValidos = ["Activo", "Pagado", "Cancelado", "Finalizado"];
      const estadoNormalizado = estadosValidos.find(
        (e) => e.toLowerCase() === estadoCredito.toLowerCase()
      ) || "Activo";

      // Búsqueda del empleado en la colección para vincular empleadoId
      let matchedEmpleado = null;
      if (empleados.length > 0) {
        const fullSearch = normalizeHeaderString(`${empleadoNombres} ${empleadoApellidos}`);
        matchedEmpleado = empleados.find((emp) => {
          const empFull = normalizeHeaderString(`${emp.nombres ?? ""} ${emp.apellidos ?? ""}`);
          return empFull === fullSearch || empFull.includes(fullSearch) || fullSearch.includes(empFull);
        });
      }

      // Validar si el crédito ya existe duplicado
      if (creditos.length > 0 && parsedDate) {
        const yaExisteCredito = creditos.some((c) => {
          const cEmp = normalizeHeaderString(`${c.empleadoNombres ?? ""} ${c.empleadoApellidos ?? ""}`);
          const targetEmp = normalizeHeaderString(`${empleadoNombres} ${empleadoApellidos}`);
          const cProd = normalizeHeaderString(c.productoNombre ?? "");
          const targetProd = normalizeHeaderString(productoNombre);
          return cEmp === targetEmp && cProd === targetProd && Math.abs((c.saldoPendiente ?? 0) - saldoPendiente) < 0.01;
        });
        if (yaExisteCredito) {
          errors.push({
            campo: "Crédito",
            error: `Ya existe un crédito registrado para ${empleadoNombres} con el artículo '${productoNombre}' y mismo saldo.`,
          });
        }
      }

      // Estimación del total de crédito y cuota mensual
      let totalCredito = sanitizeNumberInput(row.totalCredito ?? 0);
      let cuotaMensual = sanitizeNumberInput(row.cuotaMensual ?? 0);

      if (!totalCredito || isNaN(totalCredito) || totalCredito <= 0) {
        if (plazoCuotas > 0) {
          if (saldoPendiente === 0 && cuotasPagadas > 0) {
            totalCredito = cuotaMensual > 0 ? cuotaMensual * plazoCuotas : 0;
          } else {
            const cuotasRestantes = Math.max(1, plazoCuotas - cuotasPagadas);
            cuotaMensual = cuotaMensual || Number((saldoPendiente / cuotasRestantes).toFixed(2));
            totalCredito = Number((cuotaMensual * plazoCuotas).toFixed(2));
          }
        }
      }

      if (!cuotaMensual || isNaN(cuotaMensual) || cuotaMensual <= 0) {
        cuotaMensual = plazoCuotas > 0 ? Number((totalCredito / plazoCuotas).toFixed(2)) : saldoPendiente;
      }

      const payload = {
        empleadoId: matchedEmpleado?.id || "",
        empleadoNombres: matchedEmpleado?.nombres || empleadoNombres,
        empleadoApellidos: matchedEmpleado?.apellidos || empleadoApellidos,
        productoNombre,
        estado: "Aprobado",
        estadoCredito: estadoNormalizado,
        saldoPendiente,
        cuotasPagadas,
        fechaAutoriza: parsedDate || new Date(),
        fechaRegistro: parsedDate || new Date(),
        datosFinancierosHistoricos: {
          totalCredito,
          cuotaMensual,
          plazoCuotas,
        },
      };

      return {
        isValid: errors.length === 0,
        errors,
        transformedData: payload,
      };
    },
  },
};
