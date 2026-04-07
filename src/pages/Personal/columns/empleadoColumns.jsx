import Badge from "../../../components/ui/badge/Badge";
import { PencilIcon, TrashBinIcon } from "../../../icons";

export const COLUMNAS_EXPORT_EMPLEADOS = [
  { key: "codigoEmpleado", header: "Código", type: "text" },
  { key: "dni", header: "DNI", type: "text" },
  { key: "nombres", header: "Nombres", type: "text" },
  { key: "apellidos", header: "Apellidos", type: "text" },
  { key: "correo", header: "Correo", type: "text" },
  { key: "telefono", header: "Teléfono", type: "text" },
  { key: "salario", header: "Salario", type: "currency" },
  { key: "fechaInicio", header: "Fecha Inicio", type: "date" },
  { key: "estado", header: "Estado", type: "text" },
];

export function empleadoColumns({ onEdit, onEliminar, departamentos }) {
  void departamentos;

  return [
    {
      accessorFn: (row) => `${row.nombres} ${row.apellidos}`,
      id: "nombreCompleto",
      header: "Empleado",
      cell: (info) => (
        <div className="flex flex-col gap-1">
          <span
            title={info.getValue()}
            className="block max-w-[220px] truncate font-medium text-gray-800 text-theme-sm dark:text-white/90"
          >
            {info.getValue()}
          </span>
          <span className="block whitespace-nowrap text-xs text-gray-500 dark:text-gray-400 font-mono">
            {info.row.original.codigoEmpleado}
          </span>
        </div>
      ),
    },
    { accessorKey: "correo", header: "Correo" },
    { accessorKey: "dni", header: "DNI" },
    {
      accessorKey: "telefono",
      header: "Teléfono",
      cell: (info) => info.getValue() || "-",
    },
    { accessorKey: "departamentoNombre", header: "Departamento" },
    {
      accessorKey: "salario",
      header: "Salario",
      cell: (info) => `L.${Number(info.getValue()).toLocaleString("es-HN")}`,
    },
    {
      accessorKey: "fechaInicio",
      header: "Fecha Inicio",
      cell: (info) => {
        const fecha = info.getValue();
        if (!fecha) return "-";
        try {
          const date = fecha.toDate ? fecha.toDate() : new Date(fecha);
          return date.toLocaleDateString("es-HN");
        } catch {
          return "-";
        }
      },
    },
    {
      accessorKey: "estado",
      header: "Estado",
      cell: (info) => {
        const val = info.getValue();
        const color =
          val === "Activo"
            ? "success"
            : val === "Inactivo"
              ? "error"
              : "warning";
        return (
          <Badge size="sm" color={color}>
            {val}
          </Badge>
        );
      },
    },
    {
      id: "acciones",
      header: "Acciones",
      enableSorting: false,
      cell: ({ row }) => {
        const u = row.original;
        return (
          <div className="flex justify-center gap-3">
            <button
              onClick={() => onEdit(u)}
              className="text-blue-600 hover:text-blue-800 transition"
            >
              <PencilIcon className="w-5 h-5 mx-auto" />
            </button>
            <button
              onClick={() => onEliminar(u.id)}
              className="text-red-500 hover:text-red-700 transition"
            >
              <TrashBinIcon className="w-5 h-5 mx-auto" />
            </button>
          </div>
        );
      },
    },
  ];
}
