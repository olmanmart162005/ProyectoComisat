import { useMemo } from "react";

import { useAuth } from "../../auth/AuthProvider";
import { useNombreEmpleadoActual } from "../../hooks/useNombreEmpleadoActual";
import DataTable from "../../components/ui/table/DataTable";
import MetricCard from "../../components/common/MetricCard";
import { useModal } from "../../hooks/useModal";
import { CheckCircleIcon, BoxIconLine, GroupIcon } from "../../icons";

import PagoMensualConfirmModal from "../../components/Creditos/PagoMensualConfirmModal";
import { pagoMensualColumns, lps } from "./columns/pagoMensualColumns";
import { usePagosMensuales } from "./hooks/usePagosMensuales";

export default function PagosMensuales() {
  const { user } = useAuth();
  const nombreEmpleado = useNombreEmpleadoActual();
  const { isOpen, openModal, closeModal } = useModal();

  const {
    creditosPendientes,
    loading,
    procesando,
    registradoPor,
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
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">Pagos Mensuales</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Período: {" "}
            {new Date().toLocaleString("es-HN", { month: "long", year: "numeric" })}
          </p>
        </div>

        <button
          onClick={openModal}
          disabled={procesando || creditosPendientes.length === 0 || loading}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-lg shadow-sm transition flex items-center gap-2 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-400 dark:disabled:text-gray-500 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {procesando ? "Procesando..." : "Realizar Pagos"}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:gap-6">
        <MetricCard
          title="Cuotas a Cobrar"
          value={totalCuotas}
          icon={<BoxIconLine className="text-gray-800 size-6 dark:text-white/90" />}
          iconWrapperClass="bg-gray-100 dark:bg-gray-800"
        />
        <MetricCard
          title="Monto Total del Mes"
          value={lps(montoTotal)}
          icon={<CheckCircleIcon className="text-green-600 size-6 dark:text-green-400" />}
          iconWrapperClass="bg-green-50 dark:bg-green-500/10"
        />
        <MetricCard
          title="Empleados Involucrados"
          value={empleadosUnicos}
          icon={<GroupIcon className="text-blue-600 size-6 dark:text-blue-400" />}
          iconWrapperClass="bg-blue-50 dark:bg-blue-500/10"
        />
      </div>

      {!loading && creditosPendientes.length === 0 && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-green-200 dark:border-green-500/30 bg-green-50 dark:bg-green-500/10">
          <svg className="w-5 h-5 text-green-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-green-700 dark:text-green-400">Cobro completado</p>
            <p className="text-xs font-medium text-green-700 dark:text-green-400 mt-0.5">
              Todos los créditos activos ya fueron cobrados este mes o no hay créditos pendientes.
            </p>
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
