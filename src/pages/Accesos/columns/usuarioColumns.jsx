import Badge from "../../../components/ui/badge/Badge";
import { PencilIcon, TrashBinIcon } from "../../../icons";

const COLUMNAS_EXPORT_USUARIOS = [
  { key: "nombre", header: "Nombre", type: "text" },
  { key: "correo", header: "Correo", type: "text" },
  { key: "rolNombre", header: "Rol", type: "text" },
  { key: "estado", header: "Estado", type: "text" },
];

export function usuarioColumns({ onEdit, onEliminar }) {
  return [
    {
      accessorKey: "nombre",
      header: "Nombre",
      cell: (info) => (
        <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
          {info.getValue()}
        </span>
      ),
    },
    { accessorKey: "correo", header: "Correo" },
    { accessorKey: "rolNombre", header: "Rol" },
    {
      accessorKey: "estado",
      header: "Estado",
      cell: (info) => {
        const val = info.getValue();
        return (
          <Badge size="sm" color={val === "Activo" ? "success" : "error"}>
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

export { COLUMNAS_EXPORT_USUARIOS };
