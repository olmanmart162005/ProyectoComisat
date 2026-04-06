import { useState } from "react";

import DataTable from "../../components/ui/table/DataTable";
import ExportButtons from "../../layout/Exportbuttons";
import MetricCard from "../../components/common/MetricCard";
import ProductModal from "../../components/inventario/ProductModal";
import { useModal } from "../../hooks/useModal";
import { useAuth } from "../../auth/AuthProvider";
import { useNombreEmpleadoActual } from "../../hooks/useNombreEmpleadoActual";
import { BoxIconLine, CheckCircleIcon, CloseIcon, PlusIcon } from "../../icons";
import {
  productColumns,
  COLUMNAS_EXPORT_PRODUCTOS,
} from "./columns/productColumns";
import { useProductos } from "./hooks/useProductos";
import { registrarBitacora } from "../../services/bitacora";

export default function Gest_Productos() {
  const { user } = useAuth();
  const nombreEmpleado = useNombreEmpleadoActual();
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
    filtroStockRange,
    setFiltroStockRange,
    fetchProductos,
    handleEliminar,
  } = useProductos({ user, nombreEmpleado });

  const { isOpen, openModal, closeModal } = useModal();
  const [editandoData, setEditandoData] = useState(null);

  const columns = productColumns({
    onEdit: (producto) => {
      setEditandoData(producto);
      openModal();
    },
    onEliminar: handleEliminar,
    categorias,
  });

  return (
    <div className="space-y-6">
      <div className="flex sm:justify-between flex-col sm:flex-row gap-4 items-start sm:items-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">
          Productos
        </h2>
        <button
          onClick={() => {
            setEditandoData(null);
            openModal();
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

      <ProductModal
        isOpen={isOpen}
        onClose={closeModal}
        editandoData={editandoData}
        categorias={categorias}
        porcentajeAumento={porcentajeAumento}
        user={user}
        nombreEmpleado={nombreEmpleado}
        onSuccess={fetchProductos}
      />

      <DataTable columns={columns} data={productosFiltrados} loading={loading}>
        <DataTable.Toolbar searchPlaceholder="Buscar producto...">
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:ml-auto">
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="w-full sm:w-48 p-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:ring-blue-500 focus:border-blue-500 dark:bg-white/5 dark:border-white/10 dark:text-gray-100"
            >
              <option value="" className="bg-white text-gray-900">
                Categoría
              </option>
              {categorias.map((cat) => (
                <option
                  key={cat.id}
                  value={cat.id}
                  className="bg-white text-gray-900"
                >
                  {cat.nombre}
                </option>
              ))}
            </select>
            <DataTable.NumberRangeFilter
              columnId="stock"
              label="Stock:"
              onChange={setFiltroStockRange}
            />
          </div>

          <ExportButtons
            rows={productosFiltrados}
            columns={COLUMNAS_EXPORT_PRODUCTOS}
            filename={
              "Productos Seleccionados " +
              new Date().toLocaleDateString("es-HN")
            }
            meta={{
              empresa: "Comisariato San Jose",
              usuario: nombreEmpleado || "Sistema",
              extra: textoFiltrosPdf,
            }}
            pdfOptions={{
              title: "Productos Seleccionados",
              subtitle: new Date().toLocaleDateString("es-HN"),
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
