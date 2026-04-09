import DataTable from "../../components/ui/table/DataTable";
import MetricCard from "../../components/common/MetricCard";
import ExportButtons from "../../layout/Exportbuttons";
import { BoxIconLine, TrashBinIcon } from "../../icons";
import { useAuth } from "../../auth/AuthProvider";
import { useNombreEmpleadoActual } from "../../hooks/useNombreEmpleadoActual";
import { registrarBitacora } from "../../services/bitacora";
import { formatDateForFilename } from "../../utils/formatters";
import { useHistorialProductos } from "./hooks/useHistorialProductos";
import {
  COLUMNAS_EXPORT_HISTORIAL_PRODUCTOS,
  historialProductoColumns,
} from "./columns/historialProductoColumns";
const selectClass =
  "p-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:ring-blue-500 focus:border-blue-500 dark:bg-white/5 dark:border-white/10 dark:text-gray-100";
export default function HistorialProductos() {
  const { user } = useAuth();
  const nombreEmpleado = useNombreEmpleadoActual();
  const {
    historial,
    loading,
    filtroCategoria,
    setFiltroCategoria,
    categorias,
    historialFiltrado,
    bajasEsteMes,
  } = useHistorialProductos();
  const columns = historialProductoColumns();
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">
        Historial de Productos
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
        <MetricCard
          title="Total en Historial"
          value={historial.length}
          icon={
            <BoxIconLine className="text-gray-800 size-6 dark:text-white/90" />
          }
          iconWrapperClass="bg-gray-100 dark:bg-gray-800"
        />
        <MetricCard
          title="Bajas Este Mes"
          value={bajasEsteMes}
          icon={
            <TrashBinIcon className="text-red-600 size-6 dark:text-red-400" />
          }
          iconWrapperClass="bg-red-50 dark:bg-red-500/10"
        />
      </div>
      <DataTable columns={columns} data={historialFiltrado} loading={loading}>
        <DataTable.Toolbar searchPlaceholder="Buscar producto...">
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:ml-auto">
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className={`w-full sm:w-48 ${selectClass}`}
            >
              <option value="" className="bg-white text-gray-900">
                Categoría
              </option>
              {categorias.map((cat) => (
                <option
                  key={cat}
                  value={cat}
                  className="bg-white text-gray-900"
                >
                  {cat}
                </option>
              ))}
            </select>
            <ExportButtons
              rows={historialFiltrado}
              columns={COLUMNAS_EXPORT_HISTORIAL_PRODUCTOS}
              filename={"Historial Productos " + formatDateForFilename()}
              sheetName="Historial de Productos"
              meta={{
                empresa: "Comisariato San Jose",
                usuario: nombreEmpleado || "Sistema",
                extra: filtroCategoria
                  ? `Categoría: ${filtroCategoria}`
                  : "Listado completo",
              }}
              pdfOptions={{
                title: "Historial de Productos",
                subtitle: formatDateForFilename(),
              }}
              onExport={(formato) =>
                registrarBitacora({
                  usuario: user?.email,
                  nombre: nombreEmpleado,
                  coleccion: "historialProductos",
                  accion: "exportar",
                  metadata: {
                    formato,
                    totalRegistros: historialFiltrado.length,
                    filtroCategoria: filtroCategoria || "Todas",
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