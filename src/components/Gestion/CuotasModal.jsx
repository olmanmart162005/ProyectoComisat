import { useMemo } from "react";
import DataTable from "../ui/table/DataTable";
import Badge from "../ui/badge/Badge";
import { Modal } from "../ui/modal";
import { lps, estadoCreditoColor } from "../../pages/Gestion/columns/historialCreditoColumns";

export default function CuotasModal({ isOpen, onClose, credito, cuotas, loading }) {
  if (!credito) return null;

  const fin = credito.datosFinancierosHistoricos ?? {};
  const cuotasPagadas = Number(credito.cuotasPagadas ?? 0);
  const plazoCuotas = Number(fin.plazoCuotas ?? 0);
  const estadoCredito = credito.estadoCredito ?? "Activo";
  const esActivo = String(estadoCredito).toLowerCase() === "activo";

  const columnasCuotas = useMemo(
    () => [
      {
        id: "numeroCuota",
        header: "Nº",
        cell: ({ row }) => (
          <span className="block font-bold text-gray-800 text-theme-sm dark:text-white/90">
            {row.original.numeroCuota ?? "---"}
          </span>
        ),
      },
      {
        accessorKey: "montoCuota",
        header: "Monto",
        cell: (info) => (
          <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
            {lps(info.getValue())}
          </span>
        ),
      },
      {
        accessorKey: "saldoPendiente",
        header: "Saldo Tras Pago",
        cell: (info) => (
          <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
            {lps(info.getValue())}
          </span>
        ),
      },
      {
        accessorKey: "fechaCobro",
        header: "Fecha de Cobro",
        cell: (info) => {
          const val = info.getValue();
          return (
            <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
              {val?.toDate?.()?.toLocaleDateString("es-HN") ?? "---"}
            </span>
          );
        },
      },
      {
        accessorKey: "mesCobro",
        header: "Mes",
        cell: (info) => (
          <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
            {info.getValue() ?? "---"}
          </span>
        ),
      },
      {
        accessorKey: "registradoPor",
        header: "Registrado Por",
        cell: (info) => (
          <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
            {info.getValue() ?? "---"}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-3xl">
      <div className="flex flex-col max-h-[85vh] overflow-hidden rounded-xl">
        <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4 border-b border-gray-200 dark:border-white/10 shrink-0">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
              {esActivo ? "Progreso del Crédito" : "Historial del Crédito"}
            </p>
            <h2 className="text-lg font-bold text-gray-800 dark:text-white/90 mt-0.5 truncate">
              {`${credito.empleadoNombres ?? ""} ${credito.empleadoApellidos ?? ""}`.trim()}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-sm text-gray-500 dark:text-gray-400">{credito.productoNombre ?? "---"}</p>
              <Badge size="sm" color={estadoCreditoColor[estadoCredito] ?? "warning"}>{estadoCredito}</Badge>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-gray-900/50">
            <div className="flex flex-col gap-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Total Crédito</p>
              <p className="text-base font-bold text-gray-800 dark:text-white/90">{lps(fin.totalCredito)}</p>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Cuota Mensual</p>
              <p className="text-base font-bold text-gray-800 dark:text-white/90">{lps(fin.cuotaMensual)}</p>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Saldo Pendiente</p>
              <p className="text-base font-bold text-gray-800 dark:text-white/90">{lps(credito.saldoPendiente)}</p>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Progreso</p>
              <p className="text-base font-bold text-gray-800 dark:text-white/90">{cuotasPagadas} / {plazoCuotas} cuotas</p>
            </div>
          </div>

          {plazoCuotas > 0 && (
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Avance</span>
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{Math.round((cuotasPagadas / plazoCuotas) * 100)}%</span>
              </div>
              <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                <div className="h-full rounded-full bg-blue-500 dark:bg-blue-400 transition-all" style={{ width: `${Math.min(100, (cuotasPagadas / plazoCuotas) * 100)}%` }} />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Cuotas Cobradas</h3>
            <DataTable columns={columnasCuotas} data={cuotas} loading={loading}>
              <DataTable.Table emptyMessage="Este crédito aún no tiene cuotas cobradas." />
              <DataTable.Pagination />
            </DataTable>
          </div>
        </div>
      </div>
    </Modal>
  );
}
