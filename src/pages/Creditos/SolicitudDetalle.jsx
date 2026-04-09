import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PageShell from "../../components/common/PageShell";
import DataTable from "../../components/ui/table/DataTable";
import SolicitudDecisionConfirmModal from "../../components/Creditos/SolicitudDecisionConfirmModal";
import { useAuth } from "../../auth/AuthProvider";
import { useNombreEmpleadoActual } from "../../hooks/useNombreEmpleadoActual";
import { safeFormatDateTime } from "../../utils/formatters";
import { lps } from "./columns/solicitudColumns";
import { historialColumns } from "./columns/perfilDetalleColumns";
import { useSolicitudDetalle } from "./hooks/useSolicitudDetalle";
export default function SolicitudDetalle() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const solicitudId = state?.solicitud?.id;
  const { user } = useAuth();
  const nombreEmpleado = useNombreEmpleadoActual();
  const [decisionPendiente, setDecisionPendiente] = useState(null);
  const {
    solicitud,
    loading,
    procesando,
    historialPrevio,
    loadingHistorial,
    resumenEmpleado,
    fin,
    limite,
    creditoUtilizado,
    disponible,
    excedeLimite,
    limiteConsumido,
    isPendiente,
    mostrarAuditoria,
    cantidadSolicitada,
    handleDecision,
  } = useSolicitudDetalle({
    solicitudId,
    initialState: state,
    user,
    nombreEmpleado,
  });
  const historialCols = useMemo(() => historialColumns(), []);
  const abrirConfirmacion = (estado) => setDecisionPendiente(estado);
  const cerrarConfirmacion = () => setDecisionPendiente(null);
  const confirmarDecision = async () => {
    if (!decisionPendiente) return;
    await handleDecision(decisionPendiente);
    cerrarConfirmacion();
  };
  return (
    <PageShell
      breadcrumbCurrent="Detalle"
      contentClassName="space-y-4"
      homeLabel="Solicitudes"
      homePath="/solicitudes-reservas"
    >
      <button
        type="button"
        onClick={() => navigate("/solicitudes-reservas")}
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
      >
        &lt; Regresar a solicitudes
      </button>
      {!solicitud && !loading && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          No se encontró la solicitud.
        </div>
      )}
      {solicitud && (
        <div className="space-y-5 border border-gray-200 dark:border-white/10 rounded-xl p-4 sm:p-6 bg-white dark:bg-gray-800">
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
                    {solicitud.nombreAutoriza ??
                      solicitud.empleadoAutoriza ??
                      "Sin registro"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                    Fecha de autorización
                  </p>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90 mt-1">
                    {safeFormatDateTime(solicitud.fechaAutoriza)}
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
                {lps(fin.totalCredito)}
              </p>
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-white/10">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                  <p className="font-medium text-gray-600 dark:text-gray-300">
                    <span className="text-gray-500 dark:text-gray-400">
                      Plazo:
                    </span>{" "}
                    <span className="font-bold text-gray-900 dark:text-white/90">
                      {Number(fin.plazoCuotas ?? solicitud.plazoCuotas ?? 0)}{" "}
                      meses
                    </span>
                  </p>
                  <p className="font-medium text-gray-600 dark:text-gray-300">
                    <span className="text-gray-500 dark:text-gray-400">
                      Cuota mensual:
                    </span>{" "}
                    <span className="font-bold text-blue-700 dark:text-blue-400">
                      {lps(fin.cuotaMensual ?? solicitud.cuotaMensual ?? 0)}
                    </span>
                  </p>
                </div>
              </div>
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
          <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-gray-900 overflow-hidden">
            <div className="px-4 pt-5 pb-3 border-b border-gray-200 dark:border-white/10 flex justify-between items-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                Historial de Créditos
              </p>
              <span className="text-sm font-bold text-gray-800 dark:text-white/90">
                Activos: {resumenEmpleado?.cantidadActivos ?? 0}
              </span>
            </div>
            <div className="p-3">
              <DataTable
                columns={historialCols}
                data={historialPrevio}
                loading={loadingHistorial}
              >
                <DataTable.Table emptyMessage="Sin historial previo" />
                <DataTable.Pagination />
              </DataTable>
            </div>
          </div>
          <div className="pt-2 border-t border-gray-200 dark:border-white/10 flex gap-3">
            <button
              onClick={() => abrirConfirmacion("Aprobado")}
              disabled={
                procesando || !isPendiente || limiteConsumido || excedeLimite
              }
              className="flex-1 flex items-center justify-center gap-2 p-2 rounded-md font-bold text-sm transition bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white disabled:bg-gray-200 dark:disabled:bg-gray-700 disabled:text-gray-400 dark:disabled:text-gray-500 disabled:cursor-not-allowed"
            >
              {procesando ? "Procesando..." : "Aprobar Crédito"}
            </button>
            <button
              onClick={() => abrirConfirmacion("Rechazado")}
              disabled={procesando || !isPendiente}
              className="flex-1 flex items-center justify-center gap-2 p-2 rounded-md font-bold text-sm transition bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Rechazar Solicitud
            </button>
          </div>
          <SolicitudDecisionConfirmModal
            isOpen={Boolean(decisionPendiente)}
            onClose={cerrarConfirmacion}
            onConfirm={confirmarDecision}
            procesando={procesando}
            decision={decisionPendiente}
            solicitud={solicitud}
            montoTexto={lps(fin.totalCredito)}
          />
        </div>
      )}
    </PageShell>
  );
}