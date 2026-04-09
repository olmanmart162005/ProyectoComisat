import {
  formatMoneyHNL,
  safeFormatDate as safeFormatDateShared,
} from "../../utils/formatters";

export const safeFormatDate = safeFormatDateShared;
export const formatSalary = formatMoneyHNL;

export const parseDateValue = (dateValue) => {
  if (!dateValue) return null;

  if (typeof dateValue === "string") {
    const match = dateValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) {
      const [, year, month, day] = match;
      const date = new Date(Number(year), Number(month) - 1, Number(day));
      return Number.isNaN(date.getTime()) ? null : date;
    }
  }

  if (dateValue instanceof Date) {
    return Number.isNaN(dateValue.getTime()) ? null : dateValue;
  }

  if (typeof dateValue === "object") {
    if (typeof dateValue.toDate === "function") {
      const date = dateValue.toDate();
      return date instanceof Date && !Number.isNaN(date.getTime())
        ? date
        : null;
    }

    if (typeof dateValue.seconds === "number") {
      const milliseconds =
        dateValue.seconds * 1000 +
        Math.floor((dateValue.nanoseconds || 0) / 1_000_000);
      const date = new Date(milliseconds);
      return Number.isNaN(date.getTime()) ? null : date;
    }
  }

  const date = new Date(dateValue);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatDateForInput = (dateValue) => {
  try {
    const date = parseDateValue(dateValue);
    if (!date) return "";

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
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
