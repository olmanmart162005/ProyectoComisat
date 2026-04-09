import { useMemo } from "react";

import { useAuth } from "../../auth/AuthProvider";
import { useNombreEmpleadoActual } from "../../hooks/useNombreEmpleadoActual";
import DataTable from "../../components/ui/table/DataTable";
import MetricCard from "../../components/common/MetricCard";
import { useModal } from "../../hooks/useModal";
import { ListIcon, DollarLineIcon, GroupIcon } from "../../icons";
import ExportButtons from "../../layout/Exportbuttons";
import { registrarBitacora } from "../../services/bitacora";

import PagoMensualConfirmModal from "../../components/Creditos/PagoMensualConfirmModal";
import { pagoMensualColumns, lps } from "./columns/pagoMensualColumns";
import { usePagosMensuales } from "./hooks/usePagosMensuales";

const COLUMNAS_EXPORT_CUOTAS = [
  { key: "empleado", header: "Empleado", type: "text" },
  { key: "productoNombre", header: "Artículo", type: "text" },
  { key: "numeroCuota", header: "Cuota", type: "text" },
  { key: "montoCuota", header: "Monto Cobrado (L.)", type: "currency" },
  { key: "saldoTrasPago", header: "Saldo Restante (L.)", type: "currency" },
  { key: "mesCobro", header: "Mes de Cobro", type: "text" },
];

export default function PagosMensuales() {
  const { user } = useAuth();
  const nombreEmpleado = useNombreEmpleadoActual();
  const { isOpen, openModal, closeModal } = useModal();
  const mesActual = new Date().toISOString().slice(0, 7);

  const {
    creditosPendientes,
    loading,
    procesando,
    registradoPor,
    cuotasCobradasParaExport,
    ultimoCobro,
    totalCuotas,
    montoTotal,
    empleadosUnicos,
    handleRealizarPagos,
  } = usePagosMensuales({ user, nombreEmpleado, closeModal });

  const columns = useMemo(() => pagoMensualColumns(), []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            Pagos Mensuales
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Período:{" "}
            {new Date().toLocaleString("es-HN", {
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        <button
          onClick={openModal}
          disabled={procesando || creditosPendientes.length === 0 || loading}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-lg shadow-sm transition flex items-center gap-2 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-400 dark:disabled:text-gray-500 disabled:cursor-not-allowed"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {procesando ? "Procesando..." : "Realizar Pagos"}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:gap-6">
        <MetricCard
          title="Cuotas a Cobrar"
          value={totalCuotas}
          icon={
            <ListIcon className="text-gray-800 size-6 dark:text-white/90" />
          }
          iconWrapperClass="bg-gray-100 dark:bg-gray-800"
        />
        <MetricCard
          title="Monto Total del Mes"
          value={lps(montoTotal)}
          icon={
            <DollarLineIcon className="text-green-600 size-6 dark:text-green-400" />
          }
          iconWrapperClass="bg-green-50 dark:bg-green-500/10"
        />
        <MetricCard
          title="Empleados Involucrados"
          value={empleadosUnicos}
          icon={
            <GroupIcon className="text-blue-600 size-6 dark:text-blue-400" />
          }
          iconWrapperClass="bg-blue-50 dark:bg-blue-500/10"
        />
      </div>

      {!loading && creditosPendientes.length === 0 && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-green-200 dark:border-green-500/30 bg-green-50 dark:bg-green-500/10">
          <svg
            className="w-5 h-5 text-green-600 shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-green-700 dark:text-green-400">
              Cobro completado
            </p>
            <p className="text-xs font-medium text-green-700 dark:text-green-400 mt-0.5">
              Todos los créditos activos ya fueron cobrados este mes o no hay
              créditos pendientes.
            </p>
          </div>
        </div>
      )}

      {cuotasCobradasParaExport.length > 0 && ultimoCobro && (
        <div className="rounded-xl border border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/10 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-blue-700 dark:text-blue-400">
                Reporte listo para descargar
              </p>
              <p className="text-xs font-medium text-blue-700 dark:text-blue-400 mt-0.5">
                {ultimoCobro.totalCuotas} cuotas cobradas ·{" "}
                {lps(ultimoCobro.montoTotal)} · {ultimoCobro.fecha}
              </p>
            </div>

            <ExportButtons
              rows={cuotasCobradasParaExport}
              columns={COLUMNAS_EXPORT_CUOTAS}
              filename={`Cuotas Cobradas ${mesActual}`}
              meta={{
                empresa: "Comisariato San Jose",
                usuario: registradoPor || user?.email || "Sistema",
                extra: `Período: ${mesActual} · Total cobrado: ${lps(ultimoCobro.montoTotal)}`,
              }}
              pdfOptions={{
                title: "Reporte de Cuotas Cobradas",
                subtitle: mesActual,
              }}
              onExport={(formato) =>
                registrarBitacora({
                  usuario: user?.email ?? "desconocido",
                  nombre: registradoPor || user?.email || "desconocido",
                  coleccion: "cuotas",
                  accion: "exportar",
                  metadata: {
                    formato,
                    mesCobro: mesActual,
                    totalRegistros: cuotasCobradasParaExport.length,
                  },
                })
              }
            />
          </div>
        </div>
      )}

      <DataTable columns={columns} data={creditosPendientes} loading={loading}>
        <DataTable.Toolbar searchPlaceholder="Buscar por empleado o artículo..." />
        <DataTable.Table emptyMessage="No hay cuotas pendientes de cobro este mes." />
        <DataTable.Pagination />
      </DataTable>

      <PagoMensualConfirmModal
        isOpen={isOpen}
        onClose={closeModal}
        totalCuotas={totalCuotas}
        montoTotal={montoTotal}
        empleadosUnicos={empleadosUnicos}
        registradoPor={registradoPor}
        onConfirm={handleRealizarPagos}
      />
    </div>
  );
}
