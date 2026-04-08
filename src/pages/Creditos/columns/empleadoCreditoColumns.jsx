import Badge from "../../../components/ui/badge/Badge";
import { EyeIcon } from "../../../icons";
import { getEstadoEmpleado } from "../hooks/useEmpleadosPerfil";

const formatFecha = (valor) => {
  if (!valor) return "---";
  if (typeof valor?.toDate === "function") {
    return valor.toDate()?.toLocaleDateString("es-HN") ?? "---";
  }
  if (valor instanceof Date) {
    return valor.toLocaleDateString("es-HN");
  }
  const seconds = valor?.seconds ?? valor?._seconds;
  if (typeof seconds === "number") {
    return new Date(seconds * 1000).toLocaleDateString("es-HN");
  }
  return "---";
};

export const lps = (n) => `L. ${Number(n ?? 0).toLocaleString("es-HN")}`;

export const estadoCreditoColor = {
  Activo: "success",
  Aprobado: "success",
  Aceptado: "success",
  Rechazado: "error",
  Pagado: "info",
  Cancelado: "error",
  Finalizado: "warning",
};

export const estadoEmpleadoColor = {
  Activo: "success",
  Inactivo: "error",
};

export const COLUMNAS_EXPORT_EMPLEADOS_PERFIL = [
  { key: "nombres", header: "Nombres", type: "text" },
  { key: "apellidos", header: "Apellidos", type: "text" },
  { key: "departamentoNombre", header: "Departamento", type: "text" },
  { key: "salario", header: "Salario", type: "currency" },
  { key: "fechaInicio", header: "Fecha Inicio", type: "date" },
  { key: "estado", header: "Estado", type: "text" },
  { key: "creditoActivo", header: "Crédito", type: "text" },
];

export function empleadoCreditoColumns({
  onVerPerfil,
  getEstadoEmpleado: getEstadoEmpleadoProp,
  getEstadoCreditoEmpleado: getEstadoCreditoEmpleadoProp,
}) {
  const getEstado = getEstadoEmpleadoProp ?? getEstadoEmpleado;

  return [
    {
      accessorFn: (row) => `${row.nombres} ${row.apellidos}`,
      id: "nombreCompleto",
      header: "Nombre",
      cell: (info) => (
        <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
          {info.getValue()}
        </span>
      ),
    },
    {
      accessorKey: "departamentoNombre",
      header: "Departamento",
      cell: (info) => (
        <span className="block text-gray-700 text-theme-sm dark:text-gray-300">
          {info.getValue() ?? "---"}
        </span>
      ),
    },
    {
      accessorKey: "salario",
      header: "Salario",
      cell: (info) => (
        <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
          {lps(info.getValue())}
        </span>
      ),
    },
    {
      accessorKey: "fechaInicio",
      header: "Fecha Inicio",
      cell: ({ row, getValue }) => {
        const val = getValue();
        return (
          <span className="block text-gray-700 text-theme-sm dark:text-gray-300">
            {formatFecha(val)}
          </span>
        );
      },
    },
    {
      id: "estado",
      header: "Estado",
      cell: ({ row }) => {
        const estado = getEstado(row.original);
        return (
          <Badge size="sm" color={estadoEmpleadoColor[estado] ?? "warning"}>
            {estado}
          </Badge>
        );
      },
    },
    {
      id: "credito",
      header: "Crédito",
      cell: ({ row }) => {
        const estadoCreditoEmpleado =
          getEstadoCreditoEmpleadoProp?.(row.original) ?? "No";

        return (
          <Badge
            size="sm"
            color={estadoCreditoEmpleado === "Sí" ? "success" : "warning"}
          >
            {estadoCreditoEmpleado}
          </Badge>
        );
      },
    },
    {
      id: "acciones",
      header: "Acción",
      enableSorting: false,
      cell: ({ row }) => (
        <button
          onClick={() => onVerPerfil(row.original)}
          className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 transition text-theme-sm font-medium"
        >
          <EyeIcon className="w-4 h-4" />
          Ver Perfil
        </button>
      ),
    },
  ];
}

export { getEstadoEmpleado };
