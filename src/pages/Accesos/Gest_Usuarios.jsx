import { useMemo } from "react";

import DataTable from "../../components/ui/table/DataTable";
import ExportButtons from "../../layout/Exportbuttons";
import MetricCard from "../../components/common/MetricCard";
import { useModal } from "../../hooks/useModal";
import { sileo, Toaster } from "sileo";
import { useAuth } from "../../auth/AuthProvider";
import { useNombreEmpleadoActual } from "../../hooks/useNombreEmpleadoActual";
import { registrarBitacora } from "../../services/bitacora";
import { GroupIcon, CheckCircleIcon, CloseIcon } from "../../icons";

import UsuarioModal from "../../components/Acceso/UsuarioModal";
import { useUsuarios } from "./hooks/useUsuarios";
import {
  usuarioColumns,
  COLUMNAS_EXPORT_USUARIOS,
} from "./columns/usuarioColumns";

export default function Gest_Usuarios() {
  Toaster.position = "top-right";

  const { isOpen, openModal, closeModal } = useModal();
  const { user } = useAuth();
  const nombreEmpleado = useNombreEmpleadoActual();

  const {
    empleados,
    roles,
    loading,
    busquedaEmpleado,
    setBusquedaEmpleado,
    mostrarSugerencias,
    setMostrarSugerencias,
    editandoId,
    setEditandoId,
    enviando,
    setEmpleadoId,
    setNombre,
    setCorreoPersonal,
    correo,
    setCorreo,
    rolId,
    estado,
    setEstado,
    filtroEstado,
    setFiltroEstado,
    filtroRol,
    setFiltroRol,
    totalUsuarios,
    usuariosActivos,
    usuariosInactivos,
    usuariosFiltrados,
    textoFiltrosPdf,
    handleRolChange,
    handleSubmit,
    handleUpdate,
    handleEliminar,
    resetFormulario,
  } = useUsuarios({ closeModal });

  const columns = useMemo(
    () =>
      usuarioColumns({
        onEdit: (u) => {
          setEditandoId(u.id);
          setEmpleadoId(u.empleadoId || "");
          setNombre(u.nombre || "");
          setBusquedaEmpleado(u.nombre || "");
          setCorreo(u.correo || "");
          handleRolChange({ target: { value: u.rolId || "" } });
          setEstado(u.estado || "Activo");
          openModal();
        },
        onEliminar: handleEliminar,
      }),
    [
      setEditandoId,
      setEmpleadoId,
      setNombre,
      setBusquedaEmpleado,
      setCorreo,
      handleRolChange,
      setEstado,
      openModal,
      handleEliminar,
    ],
  );

  return (
    <div className="space-y-6">
      <div className="flex sm:justify-between flex-col sm:flex-row gap-4 items-start sm:items-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">Usuarios</h2>
        <button
          onClick={() => {
            resetFormulario();
            openModal();
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-lg shadow-sm transition flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Nuevo Usuario
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:gap-6">
        <MetricCard title="Total Usuarios" value={totalUsuarios} icon={<GroupIcon className="text-gray-800 size-6 dark:text-white/90" />} iconWrapperClass="bg-gray-100 dark:bg-gray-800" />
        <MetricCard title="Usuarios Activos" value={usuariosActivos} icon={<CheckCircleIcon className="text-green-600 size-6 dark:text-green-400" />} iconWrapperClass="bg-green-50 dark:bg-green-500/10" />
        <MetricCard title="Usuarios Inactivos" value={usuariosInactivos} icon={<CloseIcon className="text-red-600 size-6 dark:text-red-400" />} iconWrapperClass="bg-red-50 dark:bg-red-500/10" />
      </div>

      <UsuarioModal
        isOpen={isOpen}
        onClose={closeModal}
        editandoId={editandoId}
        enviando={enviando}
        onSubmit={editandoId ? handleUpdate : handleSubmit}
        busquedaEmpleado={busquedaEmpleado}
        setBusquedaEmpleado={setBusquedaEmpleado}
        mostrarSugerencias={mostrarSugerencias}
        setMostrarSugerencias={setMostrarSugerencias}
        empleados={empleados}
        setEmpleadoId={setEmpleadoId}
        setNombre={setNombre}
        setCorreoPersonal={setCorreoPersonal}
        correo={correo}
        setCorreo={setCorreo}
        rolId={rolId}
        handleRolChange={handleRolChange}
        roles={roles}
        estado={estado}
        setEstado={setEstado}
      />

      <DataTable columns={columns} data={usuariosFiltrados} loading={loading}>
        <DataTable.Toolbar searchPlaceholder="Buscar usuario...">
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:ml-auto">
            <select
              value={filtroRol}
              onChange={(e) => setFiltroRol(e.target.value)}
              className="w-full sm:w-52 p-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:ring-blue-500 focus:border-blue-500 dark:bg-white/5 dark:border-white/10 dark:text-gray-100"
            >
              <option value="" className="bg-white text-gray-900">Rol</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id} className="bg-white text-gray-900">{r.nombre}</option>
              ))}
            </select>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-full sm:w-40 p-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:ring-blue-500 focus:border-blue-500 dark:bg-white/5 dark:border-white/10 dark:text-gray-100"
            >
              <option value="" className="bg-white text-gray-900">Estado</option>
              <option value="Activo" className="bg-white text-gray-900">Activo</option>
              <option value="Inactivo" className="bg-white text-gray-900">Inactivo</option>
            </select>

            <ExportButtons
              rows={usuariosFiltrados}
              columns={COLUMNAS_EXPORT_USUARIOS}
              filename={"Usuarios " + new Date().toLocaleDateString("es-HN")}
              sheetName="Lista de Usuarios"
              meta={{
                empresa: "Comisariato San Jose",
                usuario: nombreEmpleado || "Sistema",
                extra: textoFiltrosPdf || "Listado completo",
              }}
              pdfOptions={{
                title: "Usuarios",
                subtitle: new Date().toLocaleDateString("es-HN"),
              }}
              onExport={(formato) =>
                registrarBitacora({
                  usuario: user.email,
                  nombre: nombreEmpleado,
                  coleccion: "usuarios",
                  accion: "exportar",
                  metadata: {
                    formato,
                    totalRegistros: usuariosFiltrados.length,
                    filtros: textoFiltrosPdf || "Sin filtros",
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
