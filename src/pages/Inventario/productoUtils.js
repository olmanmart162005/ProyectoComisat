import {
  formatMoneyHNL,
  safeFormatDate as safeFormatDateShared,
} from "../../utils/formatters";

export const MAX_DESCRIPCION = 150;

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
