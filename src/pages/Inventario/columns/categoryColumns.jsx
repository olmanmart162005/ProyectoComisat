import { useState } from "react";

import Badge from "../../../components/ui/badge/Badge";
import { Dropdown } from "../../../components/ui/dropdown/Dropdown";
import { DropdownItem } from "../../../components/ui/dropdown/DropdownItem";
import { MoreDotIcon, PencilIcon, TrashBinIcon } from "../../../icons";

export const COLUMNAS_EXPORT_CATEGORIAS = [
  { key: "nombre", header: "Nombre", type: "text" },
];

export function categoryColumns({ onEdit, onEliminar }) {
  function CategoriaAcciones({ categoria }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="relative flex justify-center">
        <button
          type="button"
          onClick={() => setIsOpen((value) => !value)}
          className="dropdown-toggle inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white"
          aria-label="Abrir acciones"
        >
          <MoreDotIcon className="h-5 w-5" />
        </button>

        <Dropdown
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          className="min-w-40 overflow-hidden"
        >
          <div className="py-1">
            <DropdownItem
              onItemClick={() => {
                setIsOpen(false);
                onEdit(categoria);
              }}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-white/5"
            >
              <PencilIcon className="h-4 w-4" />
              Editar
            </DropdownItem>
            <DropdownItem
              onItemClick={() => {
                setIsOpen(false);
                onEliminar(categoria.id);
              }}
              className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-500/10"
            >
              <TrashBinIcon className="h-4 w-4" />
              Eliminar
            </DropdownItem>
          </div>
        </Dropdown>
      </div>
    );
  }

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
      accessorKey: "cantidadProductos",
      header: "Productos",
      cell: (info) => {
        const cantidad = Number(info.getValue() ?? 0);

        return (
          <Badge size="sm" color={cantidad > 0 ? "info" : "light"}>
            {cantidad}
          </Badge>
        );
      },
    },
    {
      id: "acciones",
      header: "Opciones",
      enableSorting: false,
      cell: ({ row }) => {
        return <CategoriaAcciones categoria={row.original} />;
      },
    },
  ];
}
