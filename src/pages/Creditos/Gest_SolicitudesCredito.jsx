import DataTable from "../../components/ui/table/DataTable";
import { useNavigate } from "react-router-dom";
import ExportButtons from "../../layout/Exportbuttons";
import { useAuth } from "../../auth/AuthProvider";
import { useNombreEmpleadoActual } from "../../hooks/useNombreEmpleadoActual";
import { registrarBitacora } from "../../services/bitacora";
import MetricCard from "../../components/common/MetricCard";
import { CheckCircleIcon, CloseIcon, BoxIconLine } from "../../icons";
import { formatDateForFilename } from "../../utils/formatters";
import SolicitudesFiltersDropdown from "../../components/creditos/SolicitudesFiltersDropdown";

import {
  solicitudColumns,
  COLUMNAS_EXPORT_SOLICITUDES,
  lps,
} from "./columns/solicitudColumns";
import { useSolicitudesCredito } from "./hooks/useSolicitudesCredito";

export default function Gest_SolicitudesCredito() {
  const { user } = useAuth();
  const nombreEmpleado = useNombreEmpleadoActual();
  const navigate = useNavigate();

  const {
    solicitudes,
    loading,
    filtroEstadoSolicitud,
    setFiltroEstadoSolicitud,
    solicitudesFiltradas,
    textoFiltrosPdf,
    totalPendientes,
    totalAprobados,
    totalRechazados,
    montoEnRiesgo,
  } = useSolicitudesCredito({ user, nombreEmpleado, isOpen: false });

  const columns = solicitudColumns({
    onVerDetalle: (solicitud) =>
      navigate("/solicitudes-reservas/detalle", {
        state: { solicitud },
      }),
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">
        Solicitudes de Crédito
      </h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 md:gap-6">
        <MetricCard
          title="Pendientes Revisión"
          value={totalPendientes}
          icon={
            <BoxIconLine className="text-gray-800 size-6 dark:text-white/90" />
          }
          iconWrapperClass="bg-gray-100 dark:bg-gray-800"
        />
        <MetricCard
          title="Monto por Aprobar"
          value={lps(montoEnRiesgo)}
          icon={
            <CheckCircleIcon className="text-green-600 size-6 dark:text-green-400" />
          }
          iconWrapperClass="bg-green-50 dark:bg-green-500/10"
        />
        <MetricCard
          title="Aprobados"
          value={totalAprobados}
          icon={
            <CloseIcon className="text-blue-600 size-6 dark:text-blue-400" />
          }
          iconWrapperClass="bg-blue-50 dark:bg-blue-500/10"
        />
        <MetricCard
          title="Rechazados"
          value={totalRechazados}
          icon={<CloseIcon className="text-red-600 size-6 dark:text-red-400" />}
          iconWrapperClass="bg-red-50 dark:bg-red-500/10"
        />
      </div>

      <DataTable
        columns={columns}
        data={solicitudesFiltradas}
        loading={loading}
      >
        <DataTable.Toolbar searchPlaceholder="Buscar por empleado...">
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:ml-auto">
            <SolicitudesFiltersDropdown
              filtroEstadoSolicitud={filtroEstadoSolicitud}
              setFiltroEstadoSolicitud={setFiltroEstadoSolicitud}
            />

            <ExportButtons
              rows={solicitudesFiltradas}
              columns={COLUMNAS_EXPORT_SOLICITUDES}
              filename={"Solicitudes de Crédito " + formatDateForFilename()}
              sheetName="Solicitudes de Crédito"
              meta={{
                empresa: "Comisariato San Jose",
                usuario: nombreEmpleado || "Sistema",
                extra: textoFiltrosPdf,
              }}
              pdfOptions={{
                title: "Solicitudes de Crédito",
                subtitle: formatDateForFilename(),
              }}
              onExport={(formato) =>
                registrarBitacora({
                  usuario: user?.email ?? "desconocido",
                  nombre: nombreEmpleado || user?.email || "desconocido",
                  coleccion: "creditos",
                  accion: "exportar",
                  metadata: {
                    formato,
                    totalRegistros: solicitudesFiltradas.length,
                    filtros: textoFiltrosPdf,
                  },
                })
              }
            />
          </div>
        </DataTable.Toolbar>
        <DataTable.Table />
        <DataTable.Pagination />
      </DataTable>
    </div>
  );
}
