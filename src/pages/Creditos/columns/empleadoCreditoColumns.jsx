import Badge from "../../../components/ui/badge/Badge";
import { EyeIcon } from "../../../icons";
import { getEstadoEmpleado } from "../hooks/useEmpleadosCredito";

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

export function empleadoCreditoColumns({
  onVerPerfil,
  getEstadoEmpleado: getEstadoEmpleadoProp,
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
      accessorKey: "fechaRegistro",
      header: "Fecha Registro",
      cell: (info) => {
        const val = info.getValue();
        return (
          <span className="block text-gray-700 text-theme-sm dark:text-gray-300">
            {val?.toDate?.()?.toLocaleDateString("es-HN") ?? "---"}
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
