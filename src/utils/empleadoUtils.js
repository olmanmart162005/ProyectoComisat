import {
  formatMoneyHNL,
  safeFormatDate as safeFormatDateShared,
} from "./formatters";

export const DNI_LENGTH = 13;
export const TELEFONO_LENGTH = 8;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const safeFormatDate = safeFormatDateShared;
export const formatSalary = formatMoneyHNL;

export const sanitizeDigitsInput = (value, maxLength) =>
  String(value ?? "")
    .replace(/\D/g, "")
    .slice(0, maxLength);

export const isValidEmail = (value) =>
  EMAIL_REGEX.test(String(value ?? "").trim());

export const formatTelefonoDisplay = (value) => {
  const digits = sanitizeDigitsInput(value, TELEFONO_LENGTH);
  if (digits.length !== TELEFONO_LENGTH)
    return digits ? `+504 ${digits}` : "---";
  return `+504 ${digits.slice(0, 4)}-${digits.slice(4, 8)}`;
};

export const formatDniDisplay = (value) => {
  const digits = sanitizeDigitsInput(value, DNI_LENGTH);
  if (!digits) return "---";
  if (digits.length <= 4) return digits;
  if (digits.length <= 8) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8)}`;
};

export const validarEmpleadoPayload = ({
  nombres,
  apellidos,
  correo,
  dni,
  telefono,
  departamentoId,
  salario,
  fechaInicio,
}) => {
  const nombresLimpios = String(nombres ?? "").trim();
  const apellidosLimpios = String(apellidos ?? "").trim();
  const correoLimpio = String(correo ?? "").trim();
  const dniLimpio = sanitizeDigitsInput(dni, DNI_LENGTH);
  const telefonoLimpio = sanitizeDigitsInput(telefono, TELEFONO_LENGTH);
  const salarioLimpio = String(salario ?? "").trim();
  const fechaInicioLimpia = String(fechaInicio ?? "").trim();

  if (!nombresLimpios)
    return { ok: false, message: "Los nombres son obligatorios." };
  if (!apellidosLimpios)
    return { ok: false, message: "Los apellidos son obligatorios." };
  if (!isValidEmail(correoLimpio))
    return { ok: false, message: "El formato del correo es inválido." };
  if (dniLimpio.length !== DNI_LENGTH)
    return {
      ok: false,
      message: `El DNI debe tener exactamente ${DNI_LENGTH} dígitos numéricos.`,
    };
  if (telefonoLimpio.length !== TELEFONO_LENGTH)
    return {
      ok: false,
      message: `El teléfono debe tener exactamente ${TELEFONO_LENGTH} dígitos numéricos.`,
    };
  if (!departamentoId)
    return { ok: false, message: "El departamento es obligatorio." };
  if (salarioLimpio === "")
    return { ok: false, message: "El salario es obligatorio." };

  const salarioNum = Number(salarioLimpio);
  if (!Number.isFinite(salarioNum) || salarioNum <= 0) {
    return { ok: false, message: "El salario debe ser mayor que 0." };
  }

  if (!fechaInicioLimpia)
    return { ok: false, message: "La fecha de inicio es obligatoria." };

  return {
    ok: true,
    data: {
      nombres: nombresLimpios,
      apellidos: apellidosLimpios,
      correo: correoLimpio.toLowerCase(),
      dni: dniLimpio,
      telefono: telefonoLimpio,
      departamentoId,
      salario: salarioNum,
      fechaInicio: fechaInicioLimpia,
    },
  };
};

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
