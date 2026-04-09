import { useMemo } from "react";
import DataTable from "../../components/ui/table/DataTable";
import MetricCard from "../../components/common/MetricCard";
import ExportButtons from "../../layout/Exportbuttons";
import { ListIcon, TrashBinIcon, DownloadIcon } from "../../icons";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useAuth } from "../../auth/AuthProvider";
import { useNombreEmpleadoActual } from "../../hooks/useNombreEmpleadoActual";
import { registrarBitacora } from "../../services/bitacora";
import { formatDateForFilename, safeFormatDate } from "../../utils/formatters";
import { useBitacora } from "./hooks/useBitacora";
import {
  bitacoraColumns,
  COLUMNAS_EXPORT_BITACORA,
} from "./columns/bitacoraColumns";
import BitacoraFiltersDropdown from "../../components/Gestion/BitacoraFiltersDropdown";
const selectClass =
  "p-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:ring-blue-500 focus:border-blue-500 dark:bg-white/5 dark:border-white/10 dark:text-gray-100";
export default function Gest_Bitacora() {
  const { user } = useAuth();
  const nombreEmpleado = useNombreEmpleadoActual();
  const {
    registrosFiltrados,
    loading,
    filtroColeccion,
    setFiltroColeccion,
    filtroAccion,
    setFiltroAccion,
    rangoFecha,
    setRangoFecha,
    rangoPersonalizado,
    setRangoPersonalizado,
    coleccionesDinamicas,
    accionesDinamicas,
    totalHoy,
    totalEliminaciones,
    totalExportaciones,
  } = useBitacora();
  const [fechaInicioDP, fechaFinDP] = rangoPersonalizado;
  const columns = useMemo(() => bitacoraColumns(), []);
  const rangoFechaLabel = useMemo(() => {
    switch (rangoFecha) {
      case "hoy":
        return "Hoy";
      case "semana":
        return "Últimos 7 días";
      case "mes":
        return "Este mes";
      case "anio":
        return "Este año";
      case "personalizado": {
        if (fechaInicioDP && fechaFinDP) {
          return `${safeFormatDate(fechaInicioDP)} - ${safeFormatDate(fechaFinDP)}`;
        }
        if (fechaInicioDP) return `Desde ${safeFormatDate(fechaInicioDP)}`;
        if (fechaFinDP) return `Hasta ${safeFormatDate(fechaFinDP)}`;
        return "Rango personalizado";
      }
      default:
        return "Todas";
    }
  }, [rangoFecha, fechaInicioDP, fechaFinDP]);
  const filtrosActivos = useMemo(
    () =>
      `Colección: ${filtroColeccion || "Todas"} · Acción: ${filtroAccion || "Todas"} · Fecha: ${rangoFechaLabel}`,
    [filtroColeccion, filtroAccion, rangoFechaLabel],
  );
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">
        Bitácora de Auditoría
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:gap-6">
        <MetricCard
          title="Registros Hoy"
          value={totalHoy}
          icon={
            <ListIcon className="text-gray-800 size-6 dark:text-white/90" />
          }
          iconWrapperClass="bg-gray-100 dark:bg-gray-800"
        />
        <MetricCard
          title="Eliminaciones"
          value={totalEliminaciones}
          icon={
            <TrashBinIcon className="text-red-600 size-6 dark:text-red-400" />
          }
          iconWrapperClass="bg-red-50 dark:bg-red-500/10"
        />
        <MetricCard
          title="Exportaciones"
          value={totalExportaciones}
          icon={
            <DownloadIcon className="text-blue-600 size-6 dark:text-blue-400" />
          }
          iconWrapperClass="bg-blue-50 dark:bg-blue-500/10"
        />
      </div>
      <DataTable columns={columns} data={registrosFiltrados} loading={loading}>
        <DataTable.Toolbar searchPlaceholder="Buscar por usuario o nombre...">
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:ml-auto items-stretch sm:items-center">
            <BitacoraFiltersDropdown
              coleccionesDinamicas={coleccionesDinamicas}
              accionesDinamicas={accionesDinamicas}
              filtroColeccion={filtroColeccion}
              setFiltroColeccion={setFiltroColeccion}
              filtroAccion={filtroAccion}
              setFiltroAccion={setFiltroAccion}
              rangoFecha={rangoFecha}
              setRangoFecha={setRangoFecha}
              setRangoPersonalizado={setRangoPersonalizado}
              selectClass={selectClass}
              datePickerNode={
                <DatePicker
                  selectsRange
                  startDate={fechaInicioDP}
                  endDate={fechaFinDP}
                  onChange={(rango) => setRangoPersonalizado(rango)}
                  placeholderText="Seleccionar rango"
                  dateFormat="dd/MM/yyyy"
                  locale="es"
                  isClearable
                  className={`w-full sm:w-56 ${selectClass}`}
                  wrapperClassName="w-full sm:w-auto"
                />
              }
            />
            <ExportButtons
              rows={registrosFiltrados}
              columns={COLUMNAS_EXPORT_BITACORA}
              filename={`Bitacora Auditoria ${formatDateForFilename()}`}
              sheetName="Bitácora de Auditoría"
              meta={{
                empresa: "Comisariato San Jose",
                usuario: nombreEmpleado || "Sistema",
                extra: filtrosActivos,
              }}
              pdfOptions={{
                title: "Bitácora de Auditoría",
                subtitle: formatDateForFilename(),
              }}
              onExport={(formato) =>
                registrarBitacora({
                  usuario: user?.email,
                  nombre: nombreEmpleado,
                  coleccion: "bitacora",
                  accion: "exportar",
                  metadata: {
                    formato,
                    totalRegistros: registrosFiltrados.length,
                    filtroColeccion: filtroColeccion || "Todas",
                    filtroAccion: filtroAccion || "Todas",
                    rangoFecha: rangoFechaLabel,
                    detalle: `Exportación de bitácora (${String(formato).toUpperCase()}) · ${filtrosActivos}`,
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