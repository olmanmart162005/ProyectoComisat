import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import PageShell from "../../components/common/PageShell";
import { useAuth } from "../../auth/AuthProvider";
import { useNombreEmpleadoActual } from "../../hooks/useNombreEmpleadoActual";
import { useRoles } from "./hooks/useRoles";
import { MAX_NOMBRE_ROL, MAX_DESCRIPCION_ROL } from "../../utils/formLimits";

export default function RolesFormulario() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const nombreEmpleado = useNombreEmpleadoActual();
  const rol = location.state?.rol ?? null;
  const modoEdicion = Boolean(rol);

  const { guardarRol, actualizarRol } = useRoles({
    user,
    nombreEmpleado,
    cargarRoles: false,
  });

  const [editandoId, setEditandoId] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [nombreAnterior, setNombreAnterior] = useState("");

  const resetFormulario = () => {
    setEditandoId(null);
    setNombre("");
    setDescripcion("");
    setNombreAnterior("");
  };

  useEffect(() => {
    if (modoEdicion && rol) {
      setEditandoId(rol.id || null);
      setNombre(rol.nombre || "");
      setDescripcion(rol.descripcion || "");
      setNombreAnterior(rol.nombre || "");
      return;
    }

    resetFormulario();
  }, [modoEdicion, rol]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);
    try {
      if (modoEdicion) {
        await actualizarRol?.({
          editandoId,
          nombre,
          descripcion,
          nombreAnterior,
          onSuccess: () => navigate("/roles"),
        });
      } else {
        await guardarRol?.({
          nombre,
          descripcion,
          onSuccess: () => navigate("/roles"),
        });
      }
    } finally {
      setEnviando(false);
    }
  };

  if (location.pathname.endsWith("/editar") && !rol) {
    return (
      <PageShell
        breadcrumbCurrent="Editar"
        homeLabel="Roles"
        homePath="/roles"
        pageTitle="Editar Rol"
        title="Editar Rol"
      >
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          No se encontró el rol para editar.
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      breadcrumbCurrent={modoEdicion ? "Editar" : "Nuevo"}
      homeLabel="Roles"
      homePath="/roles"
      contentClassName="rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="max-w-2xl space-y-6">
          {/* Nombre del Rol */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                Nombre del Rol
              </label>
              <span className="text-[9px] font-bold uppercase text-gray-400 dark:text-gray-500">
                {nombre.length} / {MAX_NOMBRE_ROL}
              </span>
            </div>
            <input
              type="text"
              required
              maxLength={MAX_NOMBRE_ROL}
              value={nombre}
              onChange={(e) =>
                setNombre(e.target.value.slice(0, MAX_NOMBRE_ROL))
              }
              placeholder="Ej: Administrador, Usuario, Moderador"
              disabled={enviando}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 text-gray-900 dark:text-white/90 placeholder-gray-500 dark:placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 transition-colors"
            />
          </div>

          {/* Descripción */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                Descripción
              </label>
              <span className="text-[9px] font-bold uppercase text-gray-400 dark:text-gray-500">
                {descripcion.length} / {MAX_DESCRIPCION_ROL}
              </span>
            </div>
            <textarea
              value={descripcion}
              onChange={(e) =>
                setDescripcion(e.target.value.slice(0, MAX_DESCRIPCION_ROL))
              }
              placeholder="Describe los permisos y responsabilidades de este rol..."
              rows={4}
              disabled={enviando}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 text-gray-900 dark:text-white/90 placeholder-gray-500 dark:placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 resize-none transition-colors"
            />
          </div>
        </section>

        <div className="border-t border-gray-200 dark:border-white/10 pt-6 flex gap-3 justify-end">
          <button
            type="button"
            onClick={() => navigate("/roles")}
            disabled={enviando}
            className="px-6 py-3 rounded-lg border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 font-semibold text-sm hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={enviando || !nombre.trim()}
            className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {enviando ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {modoEdicion ? "Actualizando..." : "Creando..."}
              </>
            ) : modoEdicion ? (
              "Actualizar Rol"
            ) : (
              "Crear Rol"
            )}
          </button>
        </div>
      </form>
    </PageShell>
  );
}
