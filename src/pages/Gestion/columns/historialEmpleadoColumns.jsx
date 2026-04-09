import { useMemo } from "react";
import {
  formatDniDisplay,
  formatTelefonoDisplay,
} from "../../../utils/empleadoUtils";

const obtenerIniciales = (nombreCompleto) => {
  const limpio = String(nombreCompleto ?? "").trim();
  if (!limpio) return "--";

  const partes = limpio.split(/\s+/).filter(Boolean);
  const primeras = partes.slice(0, 2).map((p) => p.charAt(0).toUpperCase());
  return primeras.join("");
};

const COLUMNAS_EXPORT_HISTORIAL = [
  { key: "codigoEmpleado", header: "Código", type: "text" },
  { key: "nombres", header: "Nombres", type: "text" },
  { key: "apellidos", header: "Apellidos", type: "text" },
  {
    key: "dni",
    header: "DNI",
    type: "text",
    getValue: (row) => formatDniDisplay(row.dni),
  },
  {
    key: "telefono",
    header: "Teléfono",
    type: "text",
    getValue: (row) => formatTelefonoDisplay(row.telefono),
  },
  { key: "correo", header: "Correo", type: "text" },
  { key: "departamentoNombre", header: "Departamento", type: "text" },
  { key: "salario", header: "Salario", type: "currency" },
  { key: "fechaRegistro", header: "Fecha Ingreso", type: "date" },
  { key: "fechaBaja", header: "Fecha Baja", type: "date" },
  { key: "nombreBajadoPor", header: "Dado de baja por", type: "text" },
];

export function historialEmpleadoColumns() {
  return useMemo(
    () => [
      {
        id: "empleado",
        header: "Empleado",
        accessorFn: (row) =>
          `${row.codigoEmpleado ?? ""} ${row.nombres ?? ""} ${row.apellidos ?? ""}`.trim(),
        cell: (info) => {
          const nombreCompleto =
            `${info.row.original.nombres ?? ""} ${info.row.original.apellidos ?? ""}`.trim() ||
            "Sin nombre";
          return (
            <div className="flex items-center gap-3">
              <div
                title={nombreCompleto}
                aria-label={nombreCompleto}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-[11px] font-semibold text-blue-700 dark:bg-blue-500/15 dark:text-blue-300 flex-shrink-0"
              >
                {obtenerIniciales(nombreCompleto)}
              </div>
              <div className="flex flex-col">
                <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                  {nombreCompleto}
                </span>
                <span className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                  {info.row.original.codigoEmpleado ?? "—"}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "dni",
        header: "DNI",
        cell: (info) => (
          <span className="block text-xs text-gray-600 dark:text-gray-400">
            {formatDniDisplay(info.getValue())}
          </span>
        ),
      },
      {
        id: "contacto",
        header: "Contacto",
        accessorFn: (row) => `${row.telefono ?? ""} ${row.correo ?? ""}`.trim(),
        cell: (info) => (
          <div className="flex flex-col gap-1">
            <span className="block text-xs text-gray-600 dark:text-gray-400">
              {formatTelefonoDisplay(info.row.original.telefono) ?? "—"}
            </span>
            <span className="block text-xs text-gray-500 dark:text-gray-400 break-all">
              {info.row.original.correo ?? "—"}
            </span>
          </div>
        ),
      },
      { accessorKey: "departamentoNombre", header: "Departamento" },
      {
        accessorKey: "salario",
        header: "Salario",
        cell: (info) =>
          `L. ${Number(info.getValue() ?? 0).toLocaleString("es-HN")}`,
      },
      {
        accessorKey: "fechaRegistro",
        header: "Fecha Ingreso",
        cell: (info) => (
          <span className="block text-xs text-gray-500 dark:text-gray-400">
            {info.getValue()?.toDate?.()?.toLocaleDateString("es-HN") ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "fechaBaja",
        header: "Fecha de Baja",
        cell: (info) => (
          <span className="block text-xs text-gray-500 dark:text-gray-400">
            {info.getValue()?.toDate?.()?.toLocaleDateString("es-HN") ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "nombreBajadoPor",
        header: "Dado de baja por",
        cell: (info) => (
          <span className="block text-xs text-gray-600 dark:text-gray-400">
            {info.getValue() ?? "—"}
          </span>
        ),
      },
    ],
    [],
  );
}

export { COLUMNAS_EXPORT_HISTORIAL };
