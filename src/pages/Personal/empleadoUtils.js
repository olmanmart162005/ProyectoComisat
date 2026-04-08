import {
  formatMoneyHNL,
  safeFormatDate as safeFormatDateShared,
} from "../../utils/formatters";

export const safeFormatDate = safeFormatDateShared;
export const formatSalary = formatMoneyHNL;

export const formatDateForInput = (dateValue) => {
  if (!dateValue) return "";

  try {
    const date = dateValue.toDate ? dateValue.toDate() : new Date(dateValue);
    return date.toISOString().split("T")[0];
  } catch {
    return "";
  }
};

export const formatDateDisplay = (dateValue) => {
  return safeFormatDate(
    dateValue,
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    },
    "es-HN",
  );
};

export const getEstadoEmpleadoColor = (estado) => {
  if (estado === "Activo") return "success";
  if (estado === "Inactivo") return "error";
  return "warning";
};
