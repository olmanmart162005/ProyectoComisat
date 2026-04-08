import Badge from "../../../components/ui/badge/Badge";
import { lps, estadoCreditoColor } from "./empleadoCreditoColumns";

export function historialColumns() {
  return [
    {
      accessorFn: (row) =>
        row.fechaAutoriza?.toMillis?.() ?? row.fechaRegistro?.toMillis?.() ?? 0,
      id: "fecha",
      header: "Fecha",
      cell: ({ row }) => {
        const fecha = row.original.fechaAutoriza ?? row.original.fechaRegistro;
        return (
          <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
            {fecha?.toDate?.()?.toLocaleDateString("es-HN") ?? "---"}
          </span>
        );
      },
    },
    {
      accessorKey: "productoNombre",
      header: "Producto",
    },
    {
      accessorKey: "estado",
      header: "Estado",
      cell: (info) => {
        const val = info.getValue();
        return (
          <Badge size="sm" color={estadoCreditoColor[val] ?? "warning"}>
            {val}
          </Badge>
        );
      },
    },
    {
      accessorKey: "estadoCredito",
      header: "Estado Crédito",
      cell: (info) => {
        const val = info.getValue() ?? "---";
        return (
          <Badge size="sm" color={estadoCreditoColor[val] ?? "warning"}>
            {val}
          </Badge>
        );
      },
    },
  ];
}

export function columnasCreditosDetalle() {
  return [
    {
      accessorKey: "productoNombre",
      header: "Artículo",
    },
    {
      id: "cuota",
      header: "Cuota/mes",
      cell: ({ row }) =>
        lps(row.original.datosFinancierosHistoricos?.cuotaMensual),
    },
    {
      id: "progreso",
      header: "Progreso",
      cell: ({ row }) => {
        const pagadas = Number(row.original.cuotasPagadas ?? 0);
        const total = Number(
          row.original.datosFinancierosHistoricos?.plazoCuotas ?? 0,
        );
        return `${pagadas} / ${total}`;
      },
    },
    {
      accessorKey: "saldoPendiente",
      header: "Saldo",
      cell: (info) => lps(info.getValue()),
    },
  ];
}
