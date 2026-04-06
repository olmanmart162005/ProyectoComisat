import { useMemo } from "react";

const COLUMNAS_EXPORT_HISTORIAL = [
  { key: "codigoEmpleado", header: "Código", type: "text" },
  { key: "nombres", header: "Nombres", type: "text" },
  { key: "apellidos", header: "Apellidos", type: "text" },
  { key: "dni", header: "DNI", type: "text" },
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
      { accessorKey: "codigoEmpleado", header: "Código" },
      {
        id: "nombreCompleto",
        header: "Nombre Completo",
        accessorFn: (row) =>
          `${row.nombres ?? ""} ${row.apellidos ?? ""}`.trim(),
        cell: (info) => (
          <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
            {info.getValue()}
          </span>
        ),
      },
      { accessorKey: "dni", header: "DNI" },
      {
        accessorKey: "correo",
        header: "Correo",
        cell: (info) => (
          <span className="block text-xs text-gray-600 dark:text-gray-400">
            {info.getValue() ?? "—"}
          </span>
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
