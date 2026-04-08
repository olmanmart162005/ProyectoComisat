import { useState } from "react";

import DataTable from "../../components/ui/table/DataTable";
import { useModal } from "../../hooks/useModal";
import { Toaster } from "sileo";

import MetricCard from "../../components/common/MetricCard";
import { GroupIcon, CheckCircleIcon, CloseIcon } from "../../icons";
import ExportButtons from "../../layout/Exportbuttons";
import { useAuth } from "../../auth/AuthProvider";
import { useNombreEmpleadoActual } from "../../hooks/useNombreEmpleadoActual";
import { registrarBitacora } from "../../services/bitacora";
import { formatDateForFilename } from "../../utils/formatters";
import EmpleadosFiltersDropdown from "../../components/Personal/EmpleadosFiltersDropdown";

import EmpleadoModal from "../../components/Personal/EmpleadoModal";
import {
  empleadoColumns,
  COLUMNAS_EXPORT_EMPLEADOS,
} from "./columns/empleadoColumns";
import { useEmpleados, generarNuevoCodigo } from "./hooks/useEmpleados";

export default function Gest_Empleados() {
  Toaster.position = "top-right";

  const { user } = useAuth();
  const nombreEmpleado = useNombreEmpleadoActual();
  const {
    empleados,
    historialEmpleados,
    departamentos,
    loading,
    totalEmpleados,
    empleadosActivos,
    empleadosInactivos,
    empleadosFiltrados,
    textoFiltrosPdf,
    filtroDepartamento,
    setFiltroDepartamento,
    filtroEstado,
    setFiltroEstado,
    handleEliminar,
    fetchEmpleados,
  } = useEmpleados({ user, nombreEmpleado });

  const { isOpen, openModal, closeModal } = useModal();
  const [editandoData, setEditandoData] = useState(null);
  const [codigoNuevo, setCodigoNuevo] = useState("");
  const [soloVista, setSoloVista] = useState(false);

  const abrirDetalle = (emp) => {
    setEditandoData(emp);
    setSoloVista(true);
    openModal();
  };

  const abrirEdicion = (emp) => {
    setEditandoData(emp);
    setSoloVista(false);
    openModal();
  };

  const cerrarModalEmpleado = () => {
    setEditandoData(null);
    setSoloVista(false);
    closeModal();
  };

  const columns = empleadoColumns({
    onView: abrirDetalle,
    onEdit: abrirEdicion,
    onEliminar: handleEliminar,
    departamentos,
  });

  return (
    <div className="space-y-6">
      <div className="flex sm:justify-between flex-col sm:flex-row gap-4 items-start sm:items-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">
          Empleados
        </h2>
        <button
          onClick={() => {
            setEditandoData(null);
            setSoloVista(false);
            const nuevoCod = generarNuevoCodigo(empleados, historialEmpleados);
            setCodigoNuevo(nuevoCod);
            openModal();
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-lg shadow-sm transition flex items-center gap-2"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          Nuevo Empleado
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:gap-6">
        <MetricCard
          title="Total Empleados"
          value={totalEmpleados}
          icon={
            <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />
          }
          iconWrapperClass="bg-gray-100 dark:bg-gray-800"
        />
        <MetricCard
          title="Empleados Activos"
          value={empleadosActivos}
          icon={
            <CheckCircleIcon className="text-green-600 size-6 dark:text-green-400" />
          }
          iconWrapperClass="bg-green-50 dark:bg-green-500/10"
        />
        <MetricCard
          title="Empleados Inactivos"
          value={empleadosInactivos}
          icon={<CloseIcon className="text-red-600 size-6 dark:text-red-400" />}
          iconWrapperClass="bg-red-50 dark:bg-red-500/10"
        />
      </div>

      <EmpleadoModal
        isOpen={isOpen}
        onClose={cerrarModalEmpleado}
        editandoData={editandoData}
        departamentos={departamentos}
        user={user}
        nombreEmpleado={nombreEmpleado}
        onSuccess={fetchEmpleados}
        codigoNuevo={codigoNuevo}
        empleados={empleados}
        soloVista={soloVista}
      />

      <DataTable columns={columns} data={empleadosFiltrados} loading={loading}>
        <DataTable.Toolbar searchPlaceholder="Buscar empleado...">
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:ml-auto items-stretch sm:items-center">
            <EmpleadosFiltersDropdown
              departamentos={departamentos}
              filtroDepartamento={filtroDepartamento}
              setFiltroDepartamento={setFiltroDepartamento}
              filtroEstado={filtroEstado}
              setFiltroEstado={setFiltroEstado}
            />
            <ExportButtons
              rows={empleadosFiltrados}
              columns={COLUMNAS_EXPORT_EMPLEADOS}
              filename={"Empleados " + formatDateForFilename()}
              sheetName="Lista de Empleados"
              meta={{
                empresa: "Comisariato San Jose",
                usuario: nombreEmpleado || "Sistema",
                extra: textoFiltrosPdf,
              }}
              pdfOptions={{
                title: "Empleados",
                subtitle: formatDateForFilename(),
              }}
              onExport={(formato) =>
                registrarBitacora({
                  usuario: user.email,
                  nombre: nombreEmpleado,
                  coleccion: "empleados",
                  accion: "exportar",
                  metadata: {
                    formato,
                    totalRegistros: empleadosFiltrados.length,
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
