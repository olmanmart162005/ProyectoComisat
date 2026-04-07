import { useMemo } from "react";

import DataTable from "../../components/ui/table/DataTable";
import Badge from "../../components/ui/badge/Badge";
import { Modal } from "../../components/ui/modal";
import {
  lps,
  estadoColor,
} from "../../pages/Creditos/columns/solicitudColumns";

export default function CreditReviewModal({
  isOpen,
  onClose,
  solicitud,
  onDecision,
  procesando,
  resumenEmpleado,
  historialPrevio,
  loadingHistorial,
}) {
  if (!solicitud) return null;

  const fin = solicitud.datosFinancierosHistoricos ?? {};
  const limite =
    (fin.salarioNetoAlMomento ?? 0) * (fin.porcentajeLimiteAplicado ?? 0);
  const creditoUtilizado = resumenEmpleado?.cuotaMensualActiva ?? 0;
  const disponible = Math.max(0, limite - creditoUtilizado);
  const excedeLimite = (fin.cuotaMensual ?? 0) > disponible;
  const porcentajeUsado =
    limite > 0
      ? Math.min(100, Math.round((creditoUtilizado / limite) * 100))
      : 0;
  const limiteConsumido = creditoUtilizado >= limite;
  const isPendiente = solicitud.estado === "Pendiente";
  const mostrarAuditoria = ["Aprobado", "Rechazado"].includes(solicitud.estado);
  const cantidadSolicitada = solicitud.cantidad ?? "---";

  const historialColumns = useMemo(
    () => [
      {
        accessorKey: "fechaAutoriza",
        header: "Fecha",
        cell: (info) => {
          const fecha = info.getValue();
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
        cell: (info) => (
          <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
            {info.getValue() ?? "---"}
          </span>
        ),
      },
      {
        accessorKey: "estado",
        header: "Estado",
        cell: (info) => {
          const val = info.getValue();
          return (
            <Badge size="sm" color={estadoColor[val] ?? "warning"}>
              {val}
            </Badge>
          );
        },
      },
    ],
    [],
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-4xl">
      <div className="flex h-full max-h-[90vh] overflow-hidden rounded-xl">
        <aside className="hidden md:flex flex-col w-95 shrink-0 border-r border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-gray-900 rounded-l-xl overflow-hidden">
          <div className="px-4 pt-5 pb-3 border-b border-gray-200 dark:border-white/10">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
              Perfil del Empleado
            </p>
            <h3 className="text-sm font-bold text-gray-800 dark:text-white/90 mt-1">
              Historial de Créditos
            </h3>
          </div>
          <div className="flex-1 p-3 overflow-hidden">
            <DataTable
              columns={historialColumns}
              data={historialPrevio}
              loading={loadingHistorial}
            >
              <DataTable.Table emptyMessage="Sin historial previo" />
              <div className="[&>div]:mt-2 [&>div]:gap-2 [&>div>div:first-child]:hidden [&>div>div:last-child>span]:hidden [&_button]:px-2 [&_button]:py-1 [&_button]:text-xs">
                <DataTable.Pagination />
              </div>
            </DataTable>
          </div>
          <div className="px-4 py-3 border-t border-gray-200 dark:border-white/10 flex justify-between items-center">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">
              Préstamos Activos
            </span>
            <span className="text-sm font-bold text-gray-800 dark:text-white/90">
              {resumenEmpleado?.cantidadActivos ?? 0}
            </span>
          </div>
        </aside>

        <div className="flex flex-col flex-1 overflow-hidden rounded-r-xl bg-white dark:bg-gray-800">
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">
              {solicitud.empleadoNombres} {solicitud.empleadoApellidos}
            </h2>

            {mostrarAuditoria && (
              <div className="rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-gray-900/50 px-4 py-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                      Usuario que autorizó
                    </p>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90 mt-1">
                      {solicitud.empleadoAutoriza ?? "Sin registro"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                      Fecha de autorización
                    </p>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90 mt-1">
                      {solicitud.fechaAutoriza
                        ?.toDate?.()
                        ?.toLocaleString("es-HN") ?? "Sin registro"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-5 p-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 shadow-sm">
              <div className="relative w-24 h-24 rounded-xl bg-white p-2 border border-gray-100 dark:border-white/5 flex items-center justify-center shrink-0 shadow-inner">
                {solicitud.productoImgUrl ? (
                  <img
                    src={solicitud.productoImgUrl}
                    alt={solicitud.productoNombre}
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <span className="text-xs text-gray-400 font-medium">N/A</span>
                )}
              </div>

              <div className="flex flex-col justify-center">
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-blue-600 dark:text-blue-400 mb-1">
                  Detalle de Compra
                </span>

                <h3 className="text-lg font-semibold text-gray-900 dark:text-white leading-tight mb-1">
                  {solicitud.productoNombre}
                </h3>

                <p className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1">
                  Cantidad solicitada:{" "}
                  <span className="text-gray-900 dark:text-white">
                    {cantidadSolicitada}
                  </span>
                </p>

                <p className="text-xl font-black text-gray-800 dark:text-gray-100 tracking-tight">
                  <span className="text-sm font-medium mr-1 text-gray-500"></span>
                  {lps(fin.totalCredito)}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
              <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-white/10">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                  Perfil Financiero
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900/50 px-4 py-5 sm:px-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-4">
                  {[
                    {
                      label: "Salario Neto",
                      value: lps(fin.salarioNetoAlMomento),
                      color: "text-gray-800 dark:text-white/90",
                    },
                    {
                      label: `Límite (${Math.round((fin.porcentajeLimiteAplicado ?? 0) * 100)}%)`,
                      value: lps(limite),
                      color: "text-gray-800 dark:text-white/90",
                    },
                    {
                      label: "Crédito Utilizado",
                      value: lps(creditoUtilizado),
                      color: "text-emerald-700 dark:text-emerald-400",
                    },
                    {
                      label: "Disponible",
                      value: lps(disponible),
                      color: excedeLimite
                        ? "text-red-600 dark:text-red-400"
                        : "text-green-700 dark:text-green-400",
                    },
                  ].map((item) => (
                    <div key={item.label} className="flex flex-col gap-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        {item.label}
                      </p>
                      <p
                        className={`text-xl leading-none font-bold tabular-nums whitespace-nowrap ${item.color}`}
                      >
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {isPendiente && excedeLimite && (
              <div className="flex items-start gap-3 p-4 rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10">
                <svg
                  className="w-5 h-5 text-red-500 shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                  />
                </svg>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-red-600 dark:text-red-400">
                    Estado de Alerta
                  </p>
                  <p className="text-xs font-medium text-red-600 dark:text-red-400 mt-0.5">
                    La cuota mensual solicitada excede el disponible mensual del
                    cliente.
                  </p>
                </div>
              </div>
            )}

            <div className="rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
              <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-white/10">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                  Condiciones del Financiamiento
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900/50 px-4 py-5 sm:px-6">
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  <div className="flex flex-col gap-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Plazo Elegido
                    </p>
                    <p className="text-xl leading-none font-bold text-gray-800 dark:text-white/90">
                      {fin.plazoCuotas} Meses
                    </p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Cuota Mensual
                    </p>
                    <p className="text-xl leading-none font-bold text-gray-800 dark:text-white/90">
                      {lps(fin.cuotaMensual)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-200 dark:border-white/10 flex gap-3 bg-white dark:bg-gray-800">
            <button
              onClick={() => onDecision("Aprobado")}
              disabled={
                procesando || !isPendiente || limiteConsumido || excedeLimite
              }
              className="flex-1 flex items-center justify-center gap-2 p-2 rounded-md font-bold text-sm transition bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white disabled:bg-gray-200 dark:disabled:bg-gray-700 disabled:text-gray-400 dark:disabled:text-gray-500 disabled:cursor-not-allowed"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              {procesando ? "Procesando..." : "Aprobar Crédito"}
            </button>
            <button
              onClick={() => onDecision("Rechazado")}
              disabled={procesando || !isPendiente}
              className="flex-1 flex items-center justify-center gap-2 p-2 rounded-md font-bold text-sm transition bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              Rechazar Solicitud
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
