import { useMemo } from "react";
import Badge from "../../../components/ui/badge/Badge";
import { EyeIcon } from "../../../icons";
const lps = (n) => `L. ${Number(n ?? 0).toLocaleString("es-HN")}`;
const COLUMNAS_EXPORT_HISTORIAL_CREDITOS = [
  {
    key: "empleado",
    header: "Empleado",
    type: "text",
    getValue: (row) =>
      `${row.empleadoNombres ?? ""} ${row.empleadoApellidos ?? ""}`.trim() ||
      "---",
  },
  { key: "productoNombre", header: "Artículo", type: "text" },
  {
    key: "progreso",
    header: "Progreso",
    type: "text",
    getValue: (row) => {
      const pagadas = Number(row.cuotasPagadas ?? 0);
      const total = Number(row.datosFinancierosHistoricos?.plazoCuotas ?? 0);
      return `${pagadas} de ${total} cuotas`;
    },
  },
  { key: "saldoPendiente", header: "Saldo Pendiente", type: "currency" },
  { key: "fechaAutoriza", header: "Fecha Autorización", type: "date" },
  { key: "estadoCredito", header: "Estado", type: "text" },
];
const estadoCreditoColor = {
  Activo: "success",
  Pagado: "info",
  Cancelado: "error",
  Finalizado: "warning",
};
export function historialCreditoColumns({ onVerCuotas }) {
  return useMemo(
    () => [
      {
        id: "empleado",
        header: "Empleado",
        accessorFn: (row) =>
          `${row.empleadoNombres ?? ""} ${row.empleadoApellidos ?? ""}`.trim(),
        cell: ({ row }) => (
          <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
            {`${row.original.empleadoNombres ?? ""} ${row.original.empleadoApellidos ?? ""}`.trim()}
          </span>
        ),
      },
      {
        accessorKey: "productoNombre",
        header: "Artículo",
        cell: (info) => (
          <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
            {info.getValue() ?? "---"}
          </span>
        ),
      },
      {
        id: "progreso",
        header: "Progreso",
        cell: ({ row }) => {
          const pagadas = Number(row.original.cuotasPagadas ?? 0);
          const total = Number(
            row.original.datosFinancierosHistoricos?.plazoCuotas ?? 0,
          );
          return (
            <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
              {pagadas} de {total} cuotas
            </span>
          );
        },
      },
      {
        id: "saldo",
        header: "Saldo Pendiente",
        accessorFn: (row) => String(row.saldoPendiente ?? 0),
        cell: ({ row }) => (
          <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
            {lps(row.original.saldoPendiente)}
          </span>
        ),
      },
      {
        accessorKey: "fechaAutoriza",
        header: "Fecha Autorización",
        cell: (info) => {
          const val = info.getValue();
          return (
            <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
              {val?.toDate?.()?.toLocaleDateString("es-HN") ?? "---"}
            </span>
          );
        },
      },
      {
        accessorKey: "estadoCredito",
        header: "Estado",
        cell: (info) => {
          const val = info.getValue() ?? "Activo";
          return (
            <Badge size="sm" color={estadoCreditoColor[val] ?? "warning"}>
              {val}
            </Badge>
          );
        },
      },
      {
        id: "acciones",
        header: "Acción",
        enableSorting: false,
        cell: ({ row }) => {
          const estadoCredito = String(
            row.original.estadoCredito ?? "activo",
          ).toLowerCase();
          const esActivo = estadoCredito === "activo";
          return (
            <button
              onClick={() => onVerCuotas(row.original)}
              className={`inline-flex items-center gap-1.5 transition text-theme-sm font-medium ${esActivo ? "text-blue-600 hover:text-blue-800" : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"}`}
            >
              <EyeIcon className="w-4 h-4" />
              {esActivo ? "Ver Progreso" : "Ver Historial"}
            </button>
          );
        },
      },
    ],
    [onVerCuotas],
  );
}
export { lps, estadoCreditoColor, COLUMNAS_EXPORT_HISTORIAL_CREDITOS };
