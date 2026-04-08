export const DEFAULT_LOCALE = "es-HN";

const toValidDate = (value) => {
  if (!value) return null;

  try {
    if (typeof value?.toDate === "function") {
      const date = value.toDate();
      return Number.isNaN(date?.getTime?.()) ? null : date;
    }

    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : value;
    }

    if (typeof value === "number") {
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? null : date;
    }

    if (typeof value === "string") {
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? null : date;
    }

    if (typeof value === "object" && value !== null) {
      const seconds = value.seconds ?? value._seconds;
      if (typeof seconds === "number") {
        const date = new Date(seconds * 1000);
        return Number.isNaN(date.getTime()) ? null : date;
      }
    }
  } catch {
    return null;
  }

  return null;
};

export const formatMoneyHNL = (value, locale = DEFAULT_LOCALE) => {
  const num = Number(value);
  if (Number.isNaN(num)) return "—";
  return `L. ${num.toLocaleString(locale)}`;
};

export const safeFormatDate = (
  value,
  options = {
    day: "2-digit",
    month: "long",
    year: "numeric",
  },
  locale = DEFAULT_LOCALE,
) => {
  const date = toValidDate(value);
  if (!date) return "—";
  return date.toLocaleDateString(locale, options);
};

export const safeFormatDateTime = (
  value,
  locale = DEFAULT_LOCALE,
  options = {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  },
) => {
  const date = toValidDate(value);
  if (!date) return "—";
  return date.toLocaleString(locale, options);
};

export const formatDateForFilename = (value = new Date()) => {
  const date = toValidDate(value) ?? new Date();
  const yyyy = String(date.getFullYear());
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};
