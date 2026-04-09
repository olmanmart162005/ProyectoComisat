import { useState } from "react";
import Badge from "../../../components/ui/badge/Badge";
import { Dropdown } from "../../../components/ui/dropdown/Dropdown";
import { DropdownItem } from "../../../components/ui/dropdown/DropdownItem";
import { EyeIcon, MoreDotIcon, PencilIcon, TrashBinIcon } from "../../../icons";
const COLUMNAS_EXPORT_USUARIOS = [
  { key: "nombre", header: "Nombre", type: "text" },
  { key: "correo", header: "Correo", type: "text" },
  { key: "rolNombre", header: "Rol", type: "text" },
  { key: "estado", header: "Estado", type: "text" },
];
function UsuarioAcciones({ usuario, onView, onEdit, onEliminar }) {
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
              onView(usuario);
            }}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-white/5"
          >
            <EyeIcon className="h-4 w-4" />
            Ver
          </DropdownItem>
          <DropdownItem
            onItemClick={() => {
              setIsOpen(false);
              onEdit(usuario);
            }}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-white/5"
          >
            <PencilIcon className="h-4 w-4" />
            Editar
          </DropdownItem>
          <DropdownItem
            onItemClick={() => {
              setIsOpen(false);
              onEliminar(usuario.id);
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
export function usuarioColumns({ onView, onEdit, onEliminar }) {
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
      cell: ({ row }) => (
        <UsuarioAcciones
          usuario={row.original}
          onView={onView}
          onEdit={onEdit}
          onEliminar={onEliminar}
        />
      ),
    },
  ];
}
export { COLUMNAS_EXPORT_USUARIOS };