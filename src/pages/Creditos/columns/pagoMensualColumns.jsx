import Badge from "../../../components/ui/badge/Badge";

const lps = (n) => `L. ${Number(n ?? 0).toLocaleString("es-HN")}`;

export function pagoMensualColumns() {
  return [
    {
      id: "empleado",
      header: "Empleado",
      cell: ({ row }) => (
        <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
          {row.original.empleadoNombres} {row.original.empleadoApellidos}
        </span>
      ),
    },
    {
      accessorKey: "productoNombre",
      header: "Artículo",
      cell: (info) => (
        <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
          {info.getValue() ?? "---"}
        </span>
      ),
    },
    {
      id: "cuota",
      header: "Cuota Mensual",
      cell: ({ row }) => (
        <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
          {lps(row.original.datosFinancierosHistoricos?.cuotaMensual)}
        </span>
      ),
    },
    {
      id: "progreso",
      header: "Progreso",
      cell: ({ row }) => {
        const pagadas = Number(row.original._cuotasPagadasReal ?? 0);
        const total = Number(
          row.original.datosFinancierosHistoricos?.plazoCuotas ?? 0,
        );
        const siguiente = pagadas + 1;
        return (
          <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
            Cuota {siguiente} de {total}
          </span>
        );
      },
    },
    {
      id: "saldo",
      header: "Saldo Tras Pago",
      cell: ({ row }) => {
        const fin = row.original.datosFinancierosHistoricos ?? {};
        const cuota = Number(fin.cuotaMensual ?? 0);
        const total = Number(fin.totalCredito ?? 0);
        const totalPagadoReal = Number(row.original._totalPagado ?? 0);
        const saldo = Math.max(0, total - totalPagadoReal - cuota);
        return (
          <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
            {lps(saldo)}
          </span>
        );
      },
    },
    {
      id: "esUltima",
      header: "Estado",
      cell: ({ row }) => {
        const fin = row.original.datosFinancierosHistoricos ?? {};
        const cuota = Number(fin.cuotaMensual ?? 0);
        const total = Number(fin.totalCredito ?? 0);
        const totalPagadoReal = Number(row.original._totalPagado ?? 0);
        const esUltima = totalPagadoReal + cuota >= total;
        return (
          <Badge size="sm" color={esUltima ? "success" : "warning"}>
            {esUltima ? "Última cuota" : "Al corriente"}
          </Badge>
        );
      },
    },
  ];
}

export { lps };
