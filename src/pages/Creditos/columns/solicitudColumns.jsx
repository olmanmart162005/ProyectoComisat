import Badge from "../../../components/ui/badge/Badge";
import { EyeIcon } from "../../../icons";

export const estadoColor = {
  Aprobado: "success",
  Activo: "success",
  Rechazado: "error",
  Pendiente: "warning",
};

export const lps = (n) => `L. ${Number(n ?? 0).toLocaleString("es-HN")}`;

export const COLUMNAS_EXPORT_SOLICITUDES = [
  { key: "empleadoNombres", header: "Empleado", type: "text" },
  { key: "empleadoApellidos", header: "Apellidos", type: "text" },
  { key: "productoNombre", header: "Artículo", type: "text" },
  {
    key: "totalCredito",
    header: "Total Crédito (L.)",
    type: "currency",
    getValue: (row) => row.datosFinancierosHistoricos?.totalCredito ?? 0,
  },
  {
    key: "plazoCuotas",
    header: "Plazo (meses)",
    type: "number",
    getValue: (row) => row.datosFinancierosHistoricos?.plazoCuotas ?? 0,
  },
  {
    key: "cuotaMensual",
    header: "Cuota Mensual (L.)",
    type: "currency",
    getValue: (row) => row.datosFinancierosHistoricos?.cuotaMensual ?? 0,
  },
  { key: "estado", header: "Estado", type: "text" },
  { key: "fechaRegistro", header: "Solicitado", type: "date" },
];

export function solicitudColumns({ onVerDetalle }) {
  return [
    {
      accessorKey: "empleadoNombres",
      header: "Empleado",
      cell: ({ row }) => (
        <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
          {row.original.empleadoNombres} {row.original.empleadoApellidos}
        </span>
      ),
    },
    {
      accessorKey: "productoNombre",
      header: "Artículo",
      cell: (info) => (
        <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
          {info.getValue()}
        </span>
      ),
    },
    {
      id: "total",
      header: "Total Crédito",
      accessorFn: (row) =>
        Number(row.datosFinancierosHistoricos?.totalCredito ?? 0),
      cell: ({ row }) => (
        <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
          {lps(row.original.datosFinancierosHistoricos?.totalCredito)}
        </span>
      ),
    },
    {
      id: "plazo",
      header: "Plazo",
      accessorFn: (row) =>
        Number(row.datosFinancierosHistoricos?.plazoCuotas ?? 0),
      cell: ({ row }) => (
        <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
          {row.original.datosFinancierosHistoricos?.plazoCuotas
            ? `${row.original.datosFinancierosHistoricos.plazoCuotas}`
            : "---"}
        </span>
      ),
    },
    {
      id: "cuota",
      header: "Cuota",
      accessorFn: (row) =>
        Number(row.datosFinancierosHistoricos?.cuotaMensual ?? 0),
      cell: ({ row }) => (
        <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
          {lps(row.original.datosFinancierosHistoricos?.cuotaMensual)}
        </span>
      ),
    },
    {
      accessorKey: "fechaRegistro",
      header: "Solicitado",
      cell: (info) => (
        <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
          {info.getValue()?.toDate().toLocaleDateString("es-HN") ?? "---"}
        </span>
      ),
    },
    {
      accessorKey: "estado",
      header: "Estado",
      cell: (info) => {
        const val = info.getValue();
        return (
          <Badge size="sm" color={estadoColor[val] ?? "warning"}>
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
        const estadoSolicitud = String(row.original.estado ?? "").toLowerCase();
        const esPendiente = estadoSolicitud === "pendiente";
        const textoAccion = esPendiente ? "Revisar Solicitud" : "Ver Historial";
        const colorAccion = esPendiente
          ? "text-blue-600 hover:text-blue-800"
          : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200";

        return (
          <button
            onClick={() => onVerDetalle(row.original)}
            className={`inline-flex items-center gap-1.5 transition text-theme-sm font-medium ${colorAccion}`}
          >
            <EyeIcon className="w-4 h-4" />
            {textoAccion}
          </button>
        );
      },
    },
  ];
}
