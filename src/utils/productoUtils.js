import {
  formatMoneyHNL,
  safeFormatDate as safeFormatDateShared,
} from "./formatters";

export const MAX_DESCRIPCION = 300;
export const MAX_NOMBRE_PRODUCTO = 35;
export const MAX_NOMBRE_CATEGORIA = 35;

const REGEX_SIMBOLOS_NO_PERMITIDOS = /[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ.,:;()/%+\-\s]/g;

const normalizarEspacios = (valor = "") =>
  String(valor).replace(/\s+/g, " ").trimStart();

export const sanitizeTextInput = (valor = "") =>
  normalizarEspacios(String(valor).replace(REGEX_SIMBOLOS_NO_PERMITIDOS, ""));

export const sanitizeNombreProducto = (valor = "") =>
  sanitizeTextInput(valor).slice(0, MAX_NOMBRE_PRODUCTO);

export const sanitizeNombreCategoria = (valor = "") =>
  sanitizeTextInput(valor).slice(0, MAX_NOMBRE_CATEGORIA);

export const sanitizeDescripcionProducto = (valor = "") =>
  sanitizeTextInput(valor).slice(0, MAX_DESCRIPCION);

export const formatMoney = formatMoneyHNL;
export const safeFormatDate = safeFormatDateShared;

export const getEstadoProducto = (
  stockValue,
  stockMinimoValue,
  estadoBase = "Activo",
) => {
  if (estadoBase === "Inactivo") return "Inactivo";

  if (stockValue === "" || stockValue == null) return estadoBase;
  if (stockMinimoValue === "" || stockMinimoValue == null) return estadoBase;

  const stock = Number(stockValue);
  const stockMinimo = Number(stockMinimoValue);

  if (Number.isNaN(stock) || Number.isNaN(stockMinimo)) return estadoBase;

  return stock === stockMinimo ? "Agotado" : "Activo";
};

export const getEstadoProductoColor = (estado) => {
  if (estado === "Activo") return "success";
  if (estado === "Agotado") return "warning";
  return "error";
};
