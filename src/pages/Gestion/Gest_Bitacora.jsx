import { useMemo } from "react";

import DataTable from "../../components/ui/table/DataTable";
import MetricCard from "../../components/common/MetricCard";
import { ListIcon, CheckCircleIcon, CloseIcon } from "../../icons";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import { useBitacora } from "./hooks/useBitacora";
import { bitacoraColumns } from "./columns/bitacoraColumns";
import BitacoraFiltersDropdown from "../../components/Gestion/BitacoraFiltersDropdown";

const selectClass =
  "p-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:ring-blue-500 focus:border-blue-500 dark:bg-white/5 dark:border-white/10 dark:text-gray-100";

export default function Gest_Bitacora() {
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

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">
        Bitácora de Auditoría
      </h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:gap-6">
        <MetricCard
          title="Registros Hoy"
          value={totalHoy}
          icon={<ListIcon className="text-gray-800 size-6 dark:text-white/90" />}
          iconWrapperClass="bg-gray-100 dark:bg-gray-800"
        />
        <MetricCard
          title="Eliminaciones"
          value={totalEliminaciones}
          icon={<CloseIcon className="text-red-600 size-6 dark:text-red-400" />}
          iconWrapperClass="bg-red-50 dark:bg-red-500/10"
        />
        <MetricCard
          title="Exportaciones"
          value={totalExportaciones}
          icon={
            <CheckCircleIcon className="text-blue-600 size-6 dark:text-blue-400" />
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
          </div>
        </DataTable.Toolbar>
        <DataTable.Table />
        <DataTable.Pagination />
      </DataTable>
    </div>
  );
}
