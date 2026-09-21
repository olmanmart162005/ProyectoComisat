import MetricCard from "../../components/common/MetricCard";
import DataTable from "../../components/ui/table/DataTable";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import { useNombreEmpleadoActual } from "../../hooks/useNombreEmpleadoActual";
import { EmpleadosPerfilFiltersDropdown } from "../../components/Creditos/EmpleadosPerfilFiltersDropdown";
import ExportButtons from "../../layout/Exportbuttons";
import { registrarBitacora } from "../../services/bitacora";
import { formatDateForFilename } from "../../utils/formatters";
import { CheckCircleIcon, GroupIcon, CreditPercentIcon } from "../../icons";
import {
  empleadoCreditoColumns,
  COLUMNAS_EXPORT_EMPLEADOS_PERFIL,
  getEstadoEmpleado,
} from "./columns/empleadoCreditoColumns";
import { useEmpleadosPerfil } from "./hooks/useEmpleadosPerfil";
export default function EmpleadosPerfil() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const nombreEmpleado = useNombreEmpleadoActual();
  const {
    empleados,
    departamentos,
    porcentajeLimite,
    loading,
    filtroDepartamento,
    setFiltroDepartamento,
    filtroEstado,
    setFiltroEstado,
    filtroCreditoActivo,
    setFiltroCreditoActivo,
    totalActivos,
    totalConCreditoActivo,
    empleadosFiltrados,
    textoFiltrosPdf,
    getEstadoCreditoEmpleado,
  } = useEmpleadosPerfil();
  const columns = empleadoCreditoColumns({
    onVerPerfil: (empleado) =>
      navigate("/empleados-perfil/detalle", {
        state: { empleado, porcentajeLimite },
      }),
    getEstadoEmpleado,
    getEstadoCreditoEmpleado,
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
          title="Con Crédito Activo"
          value={totalConCreditoActivo}
          icon={
            <CreditPercentIcon className="text-blue-600 size-6 dark:text-blue-400" />
          }
          iconWrapperClass="bg-blue-50 dark:bg-blue-500/10"
        />
      </div>
      <DataTable columns={columns} data={empleadosFiltrados} loading={loading}>
        <DataTable.Toolbar searchPlaceholder="Buscar por nombre o apellido...">
          <EmpleadosPerfilFiltersDropdown
            departamentos={departamentos}
            filtroDepartamento={filtroDepartamento}
            setFiltroDepartamento={setFiltroDepartamento}
            filtroEstado={filtroEstado}
            setFiltroEstado={setFiltroEstado}
            filtroCreditoActivo={filtroCreditoActivo}
            setFiltroCreditoActivo={setFiltroCreditoActivo}
          />
          <ExportButtons
            rows={empleadosFiltrados}
            columns={COLUMNAS_EXPORT_EMPLEADOS_PERFIL}
            filename={"Empleados Perfil " + formatDateForFilename()}
            sheetName="Empleados Perfil"
            meta={{
              empresa: "Comisariato San Jose",
              usuario: nombreEmpleado || user?.email || "Sistema",
              extra: textoFiltrosPdf,
            }}
            pdfOptions={{
              title: "Empleados Perfil",
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
                  totalRegistros: empleadosFiltrados.length,
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