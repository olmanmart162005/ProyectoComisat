import { useState } from "react";
import Badge from "../../../components/ui/badge/Badge";
import { Dropdown } from "../../../components/ui/dropdown/Dropdown";
import { DropdownItem } from "../../../components/ui/dropdown/DropdownItem";
import { EyeIcon, MoreDotIcon, PencilIcon, TrashBinIcon } from "../../../icons";
import { getEstadoProducto } from "../../../utils/productoUtils";
function ProductoAcciones({ producto, onView, onEdit, onEliminar }) {
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
              onView(producto);
            }}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-white/5"
          >
            <EyeIcon className="h-4 w-4" />
            Ver
          </DropdownItem>
          <DropdownItem
            onItemClick={() => {
              setIsOpen(false);
              onEdit(producto);
            }}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-white/5"
          >
            <PencilIcon className="h-4 w-4" />
            Editar
          </DropdownItem>
          <DropdownItem
            onItemClick={() => {
              setIsOpen(false);
              onEliminar(producto.id);
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
export function productColumns({ onView, onEdit, onEliminar }) {
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
    { accessorKey: "categoriaNombre", header: "Categoría" },
    {
      accessorKey: "precioContado",
      header: "P. Contado",
      cell: (info) => `L. ${Number(info.getValue()).toLocaleString("es-HN")}`,
    },
    {
      accessorKey: "precioCredito",
      header: "P. Crédito",
      cell: (info) => `L. ${Number(info.getValue()).toLocaleString("es-HN")}`,
    },
    {
      accessorKey: "stock",
      header: "Stock",
      filterFn: "inNumberRange",
      cell: (info) => Number(info.getValue()),
    },
    {
      accessorKey: "stockMinimo",
      header: "Stock Mínimo",
      cell: (info) => {
        const val = Number(info.getValue());
        return <span>{Number.isNaN(val) ? "---" : val}</span>;
      },
    },
    {
      accessorKey: "estado",
      header: "Estado",
      cell: (info) => {
        const row = info.row.original;
        const val = getEstadoProducto(row.stock, row.stockMinimo, row.estado);
        const color =
          val === "Activo"
            ? "success"
            : val === "Agotado"
              ? "warning"
              : "error";
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
      cell: ({ row }) => (
        <ProductoAcciones
          producto={row.original}
          onView={onView}
          onEdit={onEdit}
          onEliminar={onEliminar}
        />
      ),
    },
  ];
}
export const COLUMNAS_EXPORT_PRODUCTOS = [
  { key: "nombre", header: "Nombre", type: "text" },
  { key: "descripcion", header: "Descripción", type: "text" },
  { key: "categoriaNombre", header: "Categoría", type: "text" },
  { key: "precioContado", header: "Precio Contado (L.)", type: "currency" },
  { key: "precioCredito", header: "Precio Crédito (L.)", type: "currency" },
  { key: "stock", header: "Stock", type: "number" },
  { key: "stockMinimo", header: "Stock Mínimo", type: "number" },
  { key: "estado", header: "Estado", type: "text" },
];