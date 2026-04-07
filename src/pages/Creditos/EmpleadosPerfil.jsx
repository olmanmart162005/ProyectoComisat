import MetricCard from "../../components/common/MetricCard";
import DataTable from "../../components/ui/table/DataTable";
import { useNavigate } from "react-router-dom";
import {
  BoxIconLine,
  CheckCircleIcon,
  GroupIcon,
  CloseIcon,
} from "../../icons";

import {
  empleadoCreditoColumns,
  getEstadoEmpleado,
} from "./columns/empleadoCreditoColumns";
import { useEmpleadosPerfil } from "./hooks/useEmpleadosPerfil";

export default function EmpleadosPerfil() {
  const navigate = useNavigate();
  const {
    empleados,
    departamentos,
    porcentajeLimite,
    loading,
    filtroDepartamento,
    setFiltroDepartamento,
    filtroEstado,
    setFiltroEstado,
    totalActivos,
    totalInactivos,
    empleadosFiltrados,
  } = useEmpleadosPerfil();

  const columns = empleadoCreditoColumns({
    onVerPerfil: (empleado) =>
      navigate("/empleados-perfil/detalle", {
        state: { empleado, porcentajeLimite },
      }),
    getEstadoEmpleado,
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">
        Empleados
      </h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:gap-6">
        <MetricCard
          title="Total Empleados"
          value={empleados.length}
          icon={
            <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />
          }
          iconWrapperClass="bg-gray-100 dark:bg-gray-800"
        />
        <MetricCard
          title="Activos"
          value={totalActivos}
          icon={
            <CheckCircleIcon className="text-green-600 size-6 dark:text-green-400" />
          }
          iconWrapperClass="bg-green-50 dark:bg-green-500/10"
        />
        <MetricCard
          title="Inactivos"
          value={totalInactivos}
          icon={<CloseIcon className="text-red-600 size-6 dark:text-red-400" />}
          iconWrapperClass="bg-red-50 dark:bg-red-500/10"
        />
      </div>

      <DataTable columns={columns} data={empleadosFiltrados} loading={loading}>
        <DataTable.Toolbar searchPlaceholder="Buscar por nombre o apellido...">
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:ml-auto">
            <select
              value={filtroDepartamento}
              onChange={(e) => setFiltroDepartamento(e.target.value)}
              className="w-full sm:w-52 p-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:ring-blue-500 focus:border-blue-500 dark:bg-white/5 dark:border-white/10 dark:text-gray-100"
            >
              <option value="" className="bg-white text-gray-900">
                Departamento
              </option>
              {departamentos.map((dep) => (
                <option
                  key={dep.id}
                  value={dep.id}
                  className="bg-white text-gray-900"
                >
                  {dep.nombre}
                </option>
              ))}
            </select>

            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-full sm:w-40 p-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:ring-blue-500 focus:border-blue-500 dark:bg-white/5 dark:border-white/10 dark:text-gray-100"
            >
              <option value="" className="bg-white text-gray-900">
                Estado
              </option>
              <option value="Activo" className="bg-white text-gray-900">
                Activo
              </option>
              <option value="Inactivo" className="bg-white text-gray-900">
                Inactivo
              </option>
            </select>
          </div>
        </DataTable.Toolbar>
        <DataTable.Table />
        <DataTable.Pagination />
      </DataTable>
    </div>
  );
}
