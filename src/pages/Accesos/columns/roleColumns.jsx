import { PencilIcon, TrashBinIcon } from "../../../icons";

export const COLUMNAS_EXPORT_ROLES = [
  { key: "nombre", header: "Nombre", type: "text" },
];

export function roleColumns({ onEdit, onEliminar }) {
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
    {
      id: "acciones",
      header: "Acciones",
      enableSorting: false,
      cell: ({ row }) => {
        const rol = row.original;
        return (
          <div className="flex justify-center gap-3">
            <button
              onClick={() => onEdit(rol)}
              className="text-blue-600 hover:text-blue-800 transition"
            >
              <PencilIcon className="w-5 h-5 mx-auto" />
            </button>
            <button
              onClick={() => onEliminar(rol.id)}
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
