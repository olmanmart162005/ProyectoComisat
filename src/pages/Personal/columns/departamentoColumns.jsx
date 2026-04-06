import { PencilIcon, TrashBinIcon } from "../../../icons";

const COLUMNAS_EXPORT_DEPARTAMENTOS = [
  { key: "nombre", header: "Nombre", type: "text" },
];

export function departamentoColumns({ onEdit, onEliminar }) {
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
        const dep = row.original;
        return (
          <div className="flex justify-center gap-3">
            <button
              onClick={() => onEdit(dep)}
              className="text-blue-600 hover:text-blue-800 transition"
            >
              <PencilIcon className="w-5 h-5 mx-auto" />
            </button>
            <button
              onClick={() => onEliminar(dep.id)}
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

export { COLUMNAS_EXPORT_DEPARTAMENTOS };
