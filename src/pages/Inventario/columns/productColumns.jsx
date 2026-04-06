import Badge from "../../../components/ui/badge/Badge";
import { PencilIcon, TrashBinIcon } from "../../../icons";

export function productColumns({ onEdit, onEliminar, categorias }) {
  void categorias;

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
    { accessorKey: "descripcion", header: "Descripción" },
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
        const val =
          row.estado === "Inactivo"
            ? "Inactivo"
            : Number(row.stock) === Number(row.stockMinimo)
              ? "Agotado"
              : info.getValue();
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
      cell: ({ row }) => {
        const p = row.original;
        return (
          <div className="flex justify-center gap-3">
            <button
              onClick={() => onEdit(p)}
              className="text-blue-600 hover:text-blue-800 transition"
            >
              <PencilIcon className="w-5 h-5 mx-auto" />
            </button>
            <button
              onClick={() => onEliminar(p.id)}
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
