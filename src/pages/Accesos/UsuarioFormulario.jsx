import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import PageShell from "../../components/common/PageShell";
import { useAuth } from "../../auth/AuthProvider";
import { useNombreEmpleadoActual } from "../../hooks/useNombreEmpleadoActual";
import { useUsuarios } from "./hooks/useUsuarios";

export default function UsuarioFormulario() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const nombreEmpleado = useNombreEmpleadoActual();
  const usuario = location.state?.usuario ?? null;
  const modoEdicion = Boolean(usuario);

  const {
    empleados,
    roles,
    editandoId,
    setEditandoId,
    enviando,
    busquedaEmpleado,
    setBusquedaEmpleado,
    mostrarSugerencias,
    setMostrarSugerencias,
    empleadoId,
    setEmpleadoId,
    nombre,
    setNombre,
    correoPersonal,
    setCorreoPersonal,
    correo,
    setCorreo,
    rolId,
    estado,
    setEstado,
    setRolId,
    setRolNombre,
    handleRolChange,
    handleSubmit,
    handleUpdate,
    resetFormulario,
  } = useUsuarios({ user, nombreEmpleado });

  useEffect(() => {
    if (!roles.length || !empleados.length) return;

    if (modoEdicion && usuario) {
      const empleadoRelacionado =
        empleados.find((emp) => emp.id === usuario.empleadoId) ?? null;

      setEditandoId(usuario.id || null);
      setEmpleadoId(usuario.empleadoId || empleadoRelacionado?.id || "");
      setBusquedaEmpleado(
        usuario.nombre ||
          `${empleadoRelacionado?.nombres ?? ""} ${empleadoRelacionado?.apellidos ?? ""}`.trim(),
      );
      setNombre(
        usuario.nombre ||
          `${empleadoRelacionado?.nombres ?? ""} ${empleadoRelacionado?.apellidos ?? ""}`.trim(),
      );
      setCorreoPersonal(
        usuario.correoPersonal || empleadoRelacionado?.correo || "",
      );
      setCorreo(usuario.correo || "");
      setEstado(usuario.estado || "Activo");
      const rolRelacionado = roles.find((r) => r.id === usuario.rolId) ?? null;
      setRolId(usuario.rolId || "");
      setRolNombre(usuario.rolNombre || rolRelacionado?.nombre || "");
      return;
    }

    resetFormulario();
    setBusquedaEmpleado("");
  }, [
    modoEdicion,
    usuario,
    empleados,
    roles,
    setBusquedaEmpleado,
    setEditandoId,
    setEmpleadoId,
    setNombre,
    setCorreoPersonal,
    setCorreo,
    setEstado,
    setRolId,
    setRolNombre,
    resetFormulario,
  ]);

  const handleEmpleadoSeleccionado = (emp) => {
    const nombreCompleto = `${emp.nombres ?? ""} ${emp.apellidos ?? ""}`.trim();
    setEmpleadoId(emp.id);
    setNombre(nombreCompleto);
    setCorreoPersonal(emp.correo ?? "");
    setBusquedaEmpleado(nombreCompleto);
    setMostrarSugerencias(false);
  };

  const handleGuardar = async (e) => {
    if (modoEdicion) {
      await handleUpdate(e, {
        onSuccess: () => navigate("/usuarios"),
      });
      return;
    }

    await handleSubmit(e, {
      onSuccess: () => navigate("/usuarios"),
    });
  };

  if (location.pathname.endsWith("/editar") && !usuario) {
    return (
      <PageShell
        breadcrumbCurrent="Editar"
        homeLabel="Usuarios"
        homePath="/usuarios"
      >
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          No se encontró el usuario para editar.
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      breadcrumbCurrent={modoEdicion ? "Editar" : "Nuevo"}
      homeLabel="Usuarios"
      homePath="/usuarios"
    >
      <form onSubmit={handleGuardar} className="space-y-6">
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
          <div className="lg:col-span-5 space-y-3">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 dark:border-white/10 dark:bg-gray-900/40">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                Usuario
              </p>
              <p className="mt-2 text-2xl font-extrabold text-blue-700 dark:text-blue-300">
                {nombre || "Generando..."}
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Asignación de acceso y credenciales.
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.02]">
              <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                Estado del usuario
              </h3>
              <div className="mt-4 flex items-center gap-3">
                <button
                  type="button"
                  role="switch"
                  aria-checked={estado !== "Inactivo"}
                  onClick={() =>
                    setEstado((prev) =>
                      prev === "Inactivo" ? "Activo" : "Inactivo",
                    )
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    estado !== "Inactivo"
                      ? "bg-blue-600"
                      : "bg-gray-300 dark:bg-gray-600"
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                      estado !== "Inactivo" ? "translate-x-5" : "translate-x-1"
                    }`}
                  />
                </button>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  {estado !== "Inactivo" ? "Activo" : "Inactivo"}
                </span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 flex flex-col gap-5 self-stretch">
            <div className="relative">
              <label className="mb-1.5 ml-1 block text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                Empleado
              </label>
              <input
                type="text"
                value={busquedaEmpleado}
                onChange={(e) => {
                  setBusquedaEmpleado(e.target.value);
                  setMostrarSugerencias(true);
                  if (!e.target.value) {
                    setEmpleadoId("");
                    setNombre("");
                    setCorreoPersonal("");
                  }
                }}
                onFocus={() => setMostrarSugerencias(true)}
                onBlur={() =>
                  setTimeout(() => setMostrarSugerencias(false), 150)
                }
                placeholder="Buscar empleado..."
                className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 dark:border-white/10 dark:bg-white/[0.02] dark:text-white"
              />

              {mostrarSugerencias && busquedaEmpleado.length > 0 && (
                <ul className="absolute z-50 mt-1 max-h-52 w-full overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                  {empleados
                    .filter((emp) =>
                      `${emp.nombres ?? ""} ${emp.apellidos ?? ""}`
                        .toLowerCase()
                        .includes(busquedaEmpleado.toLowerCase()),
                    )
                    .map((emp) => {
                      const nombreCompleto =
                        `${emp.nombres ?? ""} ${emp.apellidos ?? ""}`.trim();
                      return (
                        <li
                          key={emp.id}
                          onMouseDown={() => handleEmpleadoSeleccionado(emp)}
                          className="cursor-pointer px-4 py-2 hover:bg-blue-50 dark:hover:bg-gray-700"
                        >
                          <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                            {nombreCompleto}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {emp.correo ?? "Sin correo"}
                          </p>
                        </li>
                      );
                    })}

                  {empleados.filter((emp) =>
                    `${emp.nombres ?? ""} ${emp.apellidos ?? ""}`
                      .toLowerCase()
                      .includes(busquedaEmpleado.toLowerCase()),
                  ).length === 0 && (
                    <li className="px-4 py-3 text-center text-sm text-gray-400 dark:text-gray-500">
                      Sin resultados para "{busquedaEmpleado}"
                    </li>
                  )}
                </ul>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 ml-1 block text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                  Correo Personal
                </label>
                <input
                  type="email"
                  required
                  value={correoPersonal}
                  onChange={(e) => setCorreoPersonal(e.target.value)}
                  placeholder="correo personal"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 dark:border-white/10 dark:bg-white/[0.02] dark:text-white"
                />
              </div>

              <div>
                <label className="mb-1.5 ml-1 block text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                  Correo Institucional
                </label>
                <input
                  type="email"
                  required
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  placeholder="correo@empresa.com"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 dark:border-white/10 dark:bg-white/[0.02] dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 ml-1 block text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                  Rol
                </label>
                <select
                  value={rolId}
                  onChange={(e) => handleRolChange(e)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 dark:border-white/10 dark:bg-white/[0.02] dark:text-white"
                >
                  {roles.length === 0 ? (
                    <option disabled>Cargando roles...</option>
                  ) : (
                    roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.nombre}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>
          </div>
        </section>

        <footer className="sticky bottom-0 z-10 -mx-5 border-t border-gray-100 bg-white px-5 py-4 dark:border-white/10 dark:bg-gray-950/80 sm:-mx-6 sm:px-6">
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate("/usuarios")}
              className="rounded-lg border border-gray-300 bg-white px-8 py-3 text-xs font-bold text-gray-700 transition-all hover:bg-gray-50 dark:border-white/10 dark:bg-white/[0.02] dark:text-gray-200 dark:hover:bg-white/5"
            >
              Volver
            </button>
            <button
              type="submit"
              disabled={enviando}
              className={`rounded-lg px-10 py-3 text-xs font-bold text-white shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98] ${
                enviando
                  ? "bg-gray-400"
                  : modoEdicion
                    ? "bg-blue-700 hover:bg-blue-800"
                    : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {enviando
                ? "Procesando..."
                : modoEdicion
                  ? "Actualizar"
                  : "Guardar"}
            </button>
          </div>
        </footer>
      </form>
    </PageShell>
  );
}
