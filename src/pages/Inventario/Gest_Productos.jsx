import { useNavigate } from "react-router-dom";

import DataTable from "../../components/ui/table/DataTable";
import ExportButtons from "../../layout/Exportbuttons";
import MetricCard from "../../components/common/MetricCard";
import { useAuth } from "../../auth/AuthProvider";
import { useNombreEmpleadoActual } from "../../hooks/useNombreEmpleadoActual";
import { BoxIconLine, CheckCircleIcon, CloseIcon, PlusIcon } from "../../icons";
import {
  productColumns,
  COLUMNAS_EXPORT_PRODUCTOS,
} from "./columns/productColumns";
import { useProductos } from "./hooks/useProductos";
import { registrarBitacora } from "../../services/bitacora";
import ProductosFiltersDropdown from "../../components/inventario/ProductosFiltersDropdown";
import { formatDateForFilename } from "../../utils/formatters";

export default function Gest_Productos() {
  const { user } = useAuth();
  const nombreEmpleado = useNombreEmpleadoActual();
  const navigate = useNavigate();
  const {
    productos,
    categorias,
    loading,
    porcentajeAumento,
    totalProductos,
    productosActivos,
    stockTotal,
    productosFiltrados,
    textoFiltrosPdf,
    filtroCategoria,
    setFiltroCategoria,
    filtroEstadoProducto,
    setFiltroEstadoProducto,
    filtroStockRange,
    setFiltroStockRange,
    handleEliminar,
  } = useProductos({ user, nombreEmpleado });

  const columns = productColumns({
    onView: (producto) =>
      navigate("/productos/detalle", {
        state: { producto },
      }),
    onEdit: (producto) =>
      navigate("/productos/editar", {
        state: { producto },
      }),
    onEliminar: handleEliminar,
  });

  return (
    <div className="space-y-6">
      <div className="flex sm:justify-between flex-col sm:flex-row gap-4 items-start sm:items-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">
          Productos
        </h2>
        <button
          onClick={() => {
            navigate("/productos/nuevo");
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-lg shadow-sm transition flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          Nuevo Producto
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:gap-6">
        <MetricCard
          title="Total Productos"
          value={totalProductos}
          icon={
            <BoxIconLine className="text-gray-800 size-6 dark:text-white/90" />
          }
          iconWrapperClass="bg-gray-100 dark:bg-gray-800"
        />
        <MetricCard
          title="Productos Activos"
          value={productosActivos}
          icon={
            <CheckCircleIcon className="text-green-600 size-6 dark:text-green-400" />
          }
          iconWrapperClass="bg-green-50 dark:bg-green-500/10"
        />
        <MetricCard
          title="Stock Total"
          value={stockTotal}
          icon={
            <CloseIcon className="text-blue-600 size-6 dark:text-blue-400" />
          }
          iconWrapperClass="bg-blue-50 dark:bg-blue-500/10"
        />
      </div>

      <DataTable columns={columns} data={productosFiltrados} loading={loading}>
        <DataTable.Toolbar searchPlaceholder="Buscar producto...">
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:ml-auto items-stretch sm:items-center">
            <ProductosFiltersDropdown
              categorias={categorias}
              filtroCategoria={filtroCategoria}
              setFiltroCategoria={setFiltroCategoria}
              filtroEstadoProducto={filtroEstadoProducto}
              setFiltroEstadoProducto={setFiltroEstadoProducto}
              filtroStockRange={filtroStockRange}
              setFiltroStockRange={setFiltroStockRange}
            />
          </div>

          <ExportButtons
            rows={productosFiltrados}
            columns={COLUMNAS_EXPORT_PRODUCTOS}
            filename={"Productos Seleccionados " + formatDateForFilename()}
            meta={{
              empresa: "Comisariato San Jose",
              usuario: nombreEmpleado || "Sistema",
              extra: textoFiltrosPdf,
            }}
            pdfOptions={{
              title: "Productos Seleccionados",
              subtitle: formatDateForFilename(),
            }}
            onExport={(formato) =>
              registrarBitacora({
                usuario: user.email,
                nombre: nombreEmpleado,
                coleccion: "productos",
                accion: "exportar",
                metadata: {
                  formato,
                  totalRegistros: productosFiltrados.length,
                  filtros: textoFiltrosPdf,
                },
              })
            }
          />
        </DataTable.Toolbar>

        <DataTable.Table />
        <DataTable.Pagination />
      </DataTable>
    </div>
  );
}
