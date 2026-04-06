import { useAuth } from "../../auth/AuthProvider";
import { useNombreEmpleadoActual } from "../../hooks/useNombreEmpleadoActual";
import { useModal } from "../../hooks/useModal";
import { Toaster } from "sileo";
import { CreditPercentIcon, PercentIcon, TrashBinIcon } from "../../icons";

import CuotaModal from "../../components/Gestion/CuotaModal";
import { useParametrosGlobales } from "./hooks/useParametrosGlobales";

export default function Gest_ConfiguracionGlobal() {
  const { user } = useAuth();
  const nombreEmpleado = useNombreEmpleadoActual();
  const { isOpen, openModal, closeModal } = useModal();

  const {
    config,
    tiempoInactividad,
    setTiempoInactividad,
    porcentajeAumento,
    setPorcentajeAumento,
    porcentajeLimite,
    setPorcentajeLimite,
    guardando,
    loadingConfig,
    cuotas,
    loadingCuotas,
    cuotaNumero,
    setCuotaNumero,
    cuotaEstado,
    setCuotaEstado,
    enviandoCuota,
    ultimaModificacionLabel,
    handleGuardar,
    handleToggleCuota,
    handleSubmitCuota,
    handleEliminar,
  } = useParametrosGlobales({ user, nombreEmpleado, closeModal });

  Toaster.position = "top-right";

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5 p-4 md:p-6 max-w-screen-xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            Configuraciones globales
          </h2>
          <p className="text-theme-sm text-gray-500 dark:text-gray-400">
            Configure las reglas de negocio críticas para el sistema de
            comisariato.
          </p>
        </div>
        <button
          onClick={handleGuardar}
          disabled={guardando || loadingConfig}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-semibold text-sm shadow-sm transition-colors shrink-0"
        >
          <span className="text-white font-bold">+</span>
          {guardando ? "Guardando..." : "Guardar Parámetros"}
        </button>
      </div>

      {/* Reglas de negocio */}
      <div className="rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-5">
        <div className="flex items-center justify-between mb-4">
          {ultimaModificacionLabel && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-semibold uppercase tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
              Última actualización: {ultimaModificacionLabel}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Margen */}
          <div className="rounded-lg border border-gray-100 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02] p-4">
            <div className="flex items-start gap-3 mb-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-brand-600 dark:text-blue-400 shrink-0">
                <PercentIcon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                  Margen de Crédito sobre Precios
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  Porcentaje que se suma al precio de contado para ventas a
                  crédito.
                </p>
              </div>
            </div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Incremento en precio
            </p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={porcentajeAumento}
                onChange={(e) => setPorcentajeAumento(e.target.value)}
                disabled={loadingConfig}
                className="w-28 px-3 py-1.5 text-xl font-bold rounded-lg border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] text-gray-800 dark:text-white/90 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:opacity-50 transition-colors"
              />
              <span className="text-xl font-bold text-gray-400">%</span>
            </div>
          </div>

          {/* Límite */}
          <div className="rounded-lg border border-gray-100 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02] p-4">
            <div className="flex items-start gap-3 mb-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-50 dark:bg-green-500/10 text-success-600 dark:text-green-400 shrink-0">
                <CreditPercentIcon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                  Límite de Crédito
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  Porcentaje máximo del salario mensual que un empleado puede
                  usar como crédito.
                </p>
              </div>
            </div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
              % del salario mensual
            </p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={porcentajeLimite}
                onChange={(e) => setPorcentajeLimite(e.target.value)}
                disabled={loadingConfig}
                className="w-28 px-3 py-1.5 text-xl font-bold rounded-lg border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] text-gray-800 dark:text-white/90 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:opacity-50 transition-colors"
              />
              <span className="text-xl font-bold text-gray-400">%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Configuración web */}
      <div className="rounded-lg border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-white/80">
              Configuración web
            </h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              Ajustes generales del comportamiento de la sesión.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-lg border border-gray-100 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02] p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Tiempo de inactividad (minutos)
            </p>
            <input
              type="number"
              min="1"
              max="120"
              value={tiempoInactividad}
              onChange={(e) => setTiempoInactividad(Number(e.target.value))}
              disabled={loadingConfig}
              className="w-40 px-3 py-1.5 text-xl font-bold rounded-lg border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] text-gray-800 dark:text-white/90 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:opacity-50 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Cuotas */}
      <div className="rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-white/80">
              Cuotas habilitadas
            </h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              Configure las cuotas disponibles para los empleados.
            </p>
          </div>
          <button
            onClick={() => {
              setCuotaNumero("");
              setCuotaEstado(true);
              openModal();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-brand-500 text-brand-600 dark:text-brand-400 font-semibold text-sm hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
          >
            <span className="text-brand-600 dark:text-brand-400 font-bold">
              +
            </span>{" "}
            Agregar Cuota
          </button>
        </div>

        <div className="rounded-lg border border-gray-100 dark:border-white/[0.05] overflow-hidden">
          <div className="grid grid-cols-[1fr_100px_60px] px-4 py-2.5 bg-gray-50 dark:bg-white/[0.02] border-b border-gray-100 dark:border-white/[0.05]">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Cuota
            </span>
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">
              Estado
            </span>
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">
              Acción
            </span>
          </div>

          {loadingCuotas ? (
            <p className="py-8 text-center text-theme-sm text-gray-400">
              Cargando...
            </p>
          ) : cuotas.length === 0 ? (
            <p className="py-8 text-center text-theme-sm text-gray-400">
              No hay cuotas configuradas.
            </p>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {cuotas.map((cuota) => (
                <CuotaRow
                  key={cuota.id}
                  cuota={cuota}
                  onToggle={handleToggleCuota}
                  onEliminar={handleEliminar}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <CuotaModal
        isOpen={isOpen}
        onClose={closeModal}
        cuotaNumero={cuotaNumero}
        setCuotaNumero={setCuotaNumero}
        cuotaEstado={cuotaEstado}
        setCuotaEstado={setCuotaEstado}
        enviandoCuota={enviandoCuota}
        onSubmit={handleSubmitCuota}
      />
    </div>
  );
}

// ─── Cuota Row Component ───────────────────────────────────────────────────

const CuotaRow = ({ cuota, onToggle, onEliminar }) => {
  const Toggle = ({ checked, onChange }) => (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${checked ? "bg-brand-500" : "bg-gray-200 dark:bg-gray-700"}`}
    >
      <span
        className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition duration-200 ${checked ? "translate-x-5" : "translate-x-0"}`}
      />
    </button>
  );

  return (
    <div className="grid grid-cols-[1fr_100px_60px] px-4 py-3 items-center hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
      <span className="font-medium text-gray-800 dark:text-white/90 text-theme-sm">
        {cuota.nombre || `${cuota.id}`}
      </span>
      <div className="flex justify-center">
        <Toggle
          checked={cuota.estado ?? true}
          onChange={() => onToggle(cuota)}
        />
      </div>
      <div className="flex justify-center">
        <button
          onClick={() => onEliminar(cuota.id)}
          className="text-gray-400 hover:text-error-500 dark:hover:text-red-400 transition-colors"
          title="Eliminar"
        >
          <TrashBinIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
