import DataTable from "../../components/ui/table/DataTable";
import MetricCard from "../../components/common/MetricCard";
import ExportButtons from "../../layout/Exportbuttons";
import { useModal } from "../../hooks/useModal";
import CuotasModal from "../../components/Gestion/CuotasModal";
import { BoxIconLine, CheckCircleIcon, GroupIcon } from "../../icons";
import { useAuth } from "../../auth/AuthProvider";
import { useNombreEmpleadoActual } from "../../hooks/useNombreEmpleadoActual";
import { registrarBitacora } from "../../services/bitacora";
import { formatDateForFilename } from "../../utils/formatters";
import {
  COLUMNAS_EXPORT_HISTORIAL_CREDITOS,
  historialCreditoColumns,
  lps,
} from "./columns/historialCreditoColumns";
import { MESES, useHistorialCreditos } from "./hooks/useHistorialCreditos";

export default function HistorialCreditos() {
  const { user } = useAuth();
  const nombreEmpleado = useNombreEmpleadoActual();
  const { isOpen, openModal, closeModal } = useModal();
  const {
    creditos,
    loading,
    anioFiltro,
    setAnioFiltro,
    mesFiltro,
    setMesFiltro,
    anios,
    creditoSeleccionado,
    cuotasDelCredito,
    loadingCuotas,
    totalCuotas,
    montoTotal,
    empleadosUnicos,
    creditosPagados,
    handleVerCuotas,
  } = useHistorialCreditos({ openModal });

  const columnasCreditos = historialCreditoColumns({
    onVerCuotas: handleVerCuotas,
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">
        Historial de Créditos
      </h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 md:gap-6">
        <MetricCard
          title="Cuotas Cobradas"
          value={totalCuotas}
          icon={
            <BoxIconLine className="text-gray-800 size-6 dark:text-white/90" />
          }
          iconWrapperClass="bg-gray-100 dark:bg-gray-800"
        />
        <MetricCard
          title="Monto Cobrado"
          value={lps(montoTotal)}
          icon={
            <CheckCircleIcon className="text-green-600 size-6 dark:text-green-400" />
          }
          iconWrapperClass="bg-green-50 dark:bg-green-500/10"
        />
        <MetricCard
          title="Empleados"
          value={empleadosUnicos}
          icon={
            <GroupIcon className="text-blue-600 size-6 dark:text-blue-400" />
          }
          iconWrapperClass="bg-blue-50 dark:bg-blue-500/10"
        />
        <MetricCard
          title="Créditos Liquidados"
          value={creditosPagados}
          icon={
            <CheckCircleIcon className="text-emerald-600 size-6 dark:text-emerald-400" />
          }
          iconWrapperClass="bg-emerald-50 dark:bg-emerald-500/10"
        />
      </div>

      <div className="space-y-3">
        {creditos.length > 0 && (
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
              Créditos del Período
            </h3>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
              {creditos.length}
            </span>
          </div>
        )}
        <DataTable columns={columnasCreditos} data={creditos} loading={loading}>
          <DataTable.Toolbar searchPlaceholder="Buscar crédito por empleado, artículo o saldo...">
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:ml-auto">
              <select
                value={mesFiltro}
                onChange={(e) => setMesFiltro(e.target.value)}
                className="w-full sm:w-36 p-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:ring-blue-500 focus:border-blue-500 dark:bg-white/5 dark:border-white/10 dark:text-gray-100"
              >
                {MESES.map((m) => (
                  <option
                    key={m.valor}
                    value={m.valor}
                    className="bg-white text-gray-900"
                  >
                    {m.etiqueta}
                  </option>
                ))}
              </select>
              <select
                value={anioFiltro}
                onChange={(e) => setAnioFiltro(e.target.value)}
                className="w-full sm:w-28 p-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:ring-blue-500 focus:border-blue-500 dark:bg-white/5 dark:border-white/10 dark:text-gray-100"
              >
                {anios.map((a) => (
                  <option key={a} value={a} className="bg-white text-gray-900">
                    {a}
                  </option>
                ))}
              </select>

              <ExportButtons
                rows={creditos}
                columns={COLUMNAS_EXPORT_HISTORIAL_CREDITOS}
                filename={"Historial Creditos " + formatDateForFilename()}
                sheetName="Historial de Créditos"
                meta={{
                  empresa: "Comisariato San Jose",
                  usuario: nombreEmpleado || "Sistema",
                  extra: `Mes: ${mesFiltro} | Año: ${anioFiltro}`,
                }}
                pdfOptions={{
                  title: "Historial de Créditos",
                  subtitle: formatDateForFilename(),
                }}
                onExport={(formato) =>
                  registrarBitacora({
                    usuario: user?.email,
                    nombre: nombreEmpleado,
                    coleccion: "creditos",
                    accion: "exportar",
                    metadata: {
                      formato,
                      totalRegistros: creditos.length,
                      mesFiltro,
                      anioFiltro,
                    },
                  })
                }
              />
            </div>
          </DataTable.Toolbar>
          <DataTable.Table emptyMessage="Sin créditos para el período seleccionado." />
          <DataTable.Pagination />
        </DataTable>
      </div>

      <CuotasModal
        isOpen={isOpen}
        onClose={closeModal}
        credito={creditoSeleccionado}
        cuotas={cuotasDelCredito}
        loading={loadingCuotas}
      />
    </div>
  );
}
