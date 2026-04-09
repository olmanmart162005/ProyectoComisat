import { useState } from "react";

import { Dropdown } from "../../../components/ui/dropdown/Dropdown";
import { DropdownItem } from "../../../components/ui/dropdown/DropdownItem";
import { MoreDotIcon, PencilIcon, TrashBinIcon } from "../../../icons";

const COLUMNAS_EXPORT_DEPARTAMENTOS = [
  { key: "nombre", header: "Nombre", type: "text" },
  { key: "descripcion", header: "Descripción", type: "text" },
];

export function departamentoColumns({ onEdit, onEliminar }) {
  function DepartamentoAcciones({ departamento }) {
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
                onEdit(departamento);
              }}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-white/5"
            >
              <PencilIcon className="h-4 w-4" />
              Editar
            </DropdownItem>
            <DropdownItem
              onItemClick={() => {
                setIsOpen(false);
                onEliminar(departamento.id);
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
      accessorKey: "nombre",
      header: "Nombre",
      cell: (info) => (
        <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
          {info.getValue()}
        </span>
      ),
    },
    {
      accessorKey: "descripcion",
      header: "Descripción",
      cell: (info) => {
        const valor = info.getValue();
        return (
          <span
            title={valor}
            className="block max-w-xs truncate text-sm text-gray-600 dark:text-gray-400"
          >
            {valor || "—"}
          </span>
        );
      },
    },
    {
      id: "acciones",
      header: "Acciones",
      enableSorting: false,
      cell: ({ row }) => <DepartamentoAcciones departamento={row.original} />,
    },
  ];
}

export { COLUMNAS_EXPORT_DEPARTAMENTOS };
