import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import PageShell from "../../components/common/PageShell";
import { useAuth } from "../../auth/AuthProvider";
import { useNombreEmpleadoActual } from "../../hooks/useNombreEmpleadoActual";
import { useDepartamentos } from "./hooks/useDepartamentos";
import {
  MAX_NOMBRE_DEPARTAMENTO,
  MAX_DESCRIPCION_DEPARTAMENTO,
} from "../../utils/formLimits";

export default function DepartamentoFormulario() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const nombreEmpleado = useNombreEmpleadoActual();
  const departamento = location.state?.departamento ?? null;
  const modoEdicion = Boolean(departamento);

  const { actualizarDepartamento } = useDepartamentos({
    closeModal: () => navigate("/departamentos"),
    cargarDepartamentos: false,
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
    if (modoEdicion && departamento) {
      setEditandoId(departamento.id || null);
      setNombre(departamento.nombre || "");
      setDescripcion(departamento.descripcion || "");
      setNombreAnterior(departamento.nombre || "");
      return;
    }

    resetFormulario();
  }, [modoEdicion, departamento]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);
    try {
      if (modoEdicion) {
        await actualizarDepartamento?.({
          editandoId,
          nombre,
          descripcion,
          nombreAnterior,
          onSuccess: () => navigate("/departamentos"),
        });
      }
    } finally {
      setEnviando(false);
    }
  };

  if (location.pathname.endsWith("/editar") && !departamento) {
    return (
      <PageShell
        breadcrumbCurrent="Editar"
        homeLabel="Departamentos"
        homePath="/departamentos"
        pageTitle="Editar Departamento"
        title="Editar Departamento"
      >
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          No se encontró el departamento para editar.
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      breadcrumbCurrent="Editar"
      homeLabel="Departamentos"
      homePath="/departamentos"
      contentClassName="rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="max-w-2xl space-y-6">
          {/* Nombre del Departamento */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                Nombre del Departamento
              </label>
              <span className="text-[9px] font-bold uppercase text-gray-400 dark:text-gray-500">
                {nombre.length} / {MAX_NOMBRE_DEPARTAMENTO}
              </span>
            </div>
            <input
              type="text"
              required
              maxLength={MAX_NOMBRE_DEPARTAMENTO}
              value={nombre}
              onChange={(e) =>
                setNombre(e.target.value.slice(0, MAX_NOMBRE_DEPARTAMENTO))
              }
              placeholder="Ej: Recursos Humanos, Inventario"
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
                {descripcion.length} / {MAX_DESCRIPCION_DEPARTAMENTO}
              </span>
            </div>
            <textarea
              value={descripcion}
              onChange={(e) =>
                setDescripcion(
                  e.target.value.slice(0, MAX_DESCRIPCION_DEPARTAMENTO),
                )
              }
              placeholder="Describe las responsabilidades y funciones de este departamento..."
              rows={4}
              disabled={enviando}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 text-gray-900 dark:text-white/90 placeholder-gray-500 dark:placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 resize-none transition-colors"
            />
          </div>
        </section>

        <div className="border-t border-gray-200 dark:border-white/10 pt-6 flex gap-3 justify-end">
          <button
            type="button"
            onClick={() => navigate("/departamentos")}
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
                Actualizando...
              </>
            ) : (
              "Actualizar Departamento"
            )}
          </button>
        </div>
      </form>
    </PageShell>
  );
}
