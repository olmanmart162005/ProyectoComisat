import { useMemo } from "react";

export function historialProductoColumns() {
  return useMemo(
    () => [
      {
        accessorKey: "nombre",
        header: "Nombre",
        cell: (info) => (
          <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">{info.getValue() ?? "—"}</span>
        ),
      },
      { accessorKey: "descripcion", header: "Descripción", cell: (info) => info.getValue() ?? "—" },
      { accessorKey: "categoriaNombre", header: "Categoría", cell: (info) => info.getValue() ?? "—" },
      {
        accessorKey: "precioContado",
        header: "P. Contado",
        cell: (info) => `L. ${Number(info.getValue() ?? 0).toLocaleString("es-HN")}`,
      },
      {
        accessorKey: "precioCredito",
        header: "P. Crédito",
        cell: (info) => `L. ${Number(info.getValue() ?? 0).toLocaleString("es-HN")}`,
      },
      {
        accessorKey: "fechaRegistro",
        header: "Fecha Registro",
        cell: (info) => <span className="block text-xs text-gray-500 dark:text-gray-400">{info.getValue()?.toDate?.()?.toLocaleDateString("es-HN") ?? "—"}</span>,
      },
      {
        accessorKey: "fechaBaja",
        header: "Fecha de Baja",
        cell: (info) => <span className="block text-xs text-gray-500 dark:text-gray-400">{info.getValue()?.toDate?.()?.toLocaleDateString("es-HN") ?? "—"}</span>,
      },
      {
        accessorKey: "nombreBajadoPor",
        header: "Dado de baja por",
        cell: (info) => <span className="block text-xs text-gray-600 dark:text-gray-400">{info.getValue() ?? "—"}</span>,
      },
    ],
    [],
  );
}
