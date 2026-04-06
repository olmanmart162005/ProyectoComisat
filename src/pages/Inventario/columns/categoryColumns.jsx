import { PencilIcon, TrashBinIcon } from "../../../icons";

export const COLUMNAS_EXPORT_CATEGORIAS = [
  { key: "nombre", header: "Nombre", type: "text" },
];

export function categoryColumns({ onEdit, onEliminar }) {
  return [
    {
      id: "imagen",
      header: "Imagen",
      enableSorting: false,
      cell: ({ row }) => {
        const url = row.original.imagenUrl;
        return url ? (
          <img
            src={url}
            alt={row.original.nombre}
            className="w-10 h-10 rounded-lg object-cover border border-gray-200 dark:border-white/10"
          />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center">
            <span className="text-gray-400 text-xs">N/A</span>
          </div>
        );
      },
    },
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
        const cat = row.original;
        return (
          <div className="flex justify-center gap-3">
            <button
              onClick={() => onEdit(cat)}
              className="text-blue-600 hover:text-blue-800 transition"
            >
              <PencilIcon className="w-5 h-5 mx-auto" />
            </button>
            <button
              onClick={() => onEliminar(cat.id)}
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
