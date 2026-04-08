import DataTable from "../../components/ui/table/DataTable";
import ExportButtons from "../../layout/Exportbuttons";
import MetricCard from "../../components/common/MetricCard";
import { GroupIcon, CloseIcon, CheckCircleIcon } from "../../icons";
import { useAuth } from "../../auth/AuthProvider";
import { useNombreEmpleadoActual } from "../../hooks/useNombreEmpleadoActual";
import { registrarBitacora } from "../../services/bitacora";
import { useHistorialEmpleados } from "./hooks/useHistorialEmpleados";
import { formatDateForFilename } from "../../utils/formatters";
import {
  COLUMNAS_EXPORT_HISTORIAL,
  historialEmpleadoColumns,
} from "./columns/historialEmpleadoColumns";

const selectClass =
  "p-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:ring-blue-500 focus:border-blue-500 dark:bg-white/5 dark:border-white/10 dark:text-gray-100";

export default function HistorialEmpleados() {
  const { user } = useAuth();
  const nombreEmpleado = useNombreEmpleadoActual();
  const {
    historial,
    loading,
    filtroDepartamento,
    setFiltroDepartamento,
    departamentos,
    historialFiltrado,
    bajasEsteMes,
    totalUsuariosEliminados,
  } = useHistorialEmpleados();

  const columns = historialEmpleadoColumns();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">
        Historial de Empleados
      </h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:gap-6">
        <MetricCard
          title="Total en Historial"
          value={historial.length}
          icon={
            <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />
          }
          iconWrapperClass="bg-gray-100 dark:bg-gray-800"
        />
        <MetricCard
          title="Bajas Este Mes"
          value={bajasEsteMes}
          icon={<CloseIcon className="text-red-600 size-6 dark:text-red-400" />}
          iconWrapperClass="bg-red-50 dark:bg-red-500/10"
        />
        <MetricCard
          title="Usuarios Eliminados"
          value={totalUsuariosEliminados}
          icon={
            <CheckCircleIcon className="text-blue-600 size-6 dark:text-blue-400" />
          }
          iconWrapperClass="bg-blue-50 dark:bg-blue-500/10"
        />
      </div>

      <DataTable columns={columns} data={historialFiltrado} loading={loading}>
        <DataTable.Toolbar searchPlaceholder="Buscar empleado...">
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:ml-auto">
            <select
              value={filtroDepartamento}
              onChange={(e) => setFiltroDepartamento(e.target.value)}
              className={`w-full sm:w-52 ${selectClass}`}
            >
              <option value="" className="bg-white text-gray-900">
                Departamento
              </option>
              {departamentos.map((dep) => (
                <option
                  key={dep}
                  value={dep}
                  className="bg-white text-gray-900"
                >
                  {dep}
                </option>
              ))}
            </select>

            <ExportButtons
              rows={historialFiltrado}
              columns={COLUMNAS_EXPORT_HISTORIAL}
              filename={"Historial Empleados " + formatDateForFilename()}
              sheetName="Historial de Empleados"
              meta={{
                empresa: "Comisariato San Jose",
                usuario: nombreEmpleado || "Sistema",
                extra: filtroDepartamento
                  ? `Departamento: ${filtroDepartamento}`
                  : "Listado completo",
              }}
              pdfOptions={{
                title: "Historial de Empleados",
                subtitle: formatDateForFilename(),
              }}
              onExport={(formato) =>
                registrarBitacora({
                  usuario: user.email,
                  nombre: nombreEmpleado,
                  coleccion: "historialEmpleados",
                  accion: "exportar",
                  metadata: {
                    formato,
                    totalRegistros: historialFiltrado.length,
                    filtroDepartamento: filtroDepartamento || "Todos",
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
