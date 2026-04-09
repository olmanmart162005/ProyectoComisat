import { useState } from "react";
import { Toaster } from "sileo";
import MetricCard from "../../components/common/MetricCard";
import { GroupIcon } from "../../icons";
import { useActivaciones } from "./hooks/useActivaciones";

export default function Gest_Activaciones() {
  Toaster.position = "top-right";

  const { pendientes, loading, confirmandoId, handleActivar } =
    useActivaciones();

  const [visiblePassword, setVisiblePassword] = useState({});

  const togglePassword = (id) => {
    setVisiblePassword((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6">
      <div className="flex sm:justify-between flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            Activaciones Pendientes
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Usuarios creados que aún no han sido registrados en Firebase Auth.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:gap-6">
        <MetricCard
          title="Pendientes de activar"
          value={pendientes.length}
          icon={
            <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />
          }
          iconWrapperClass="bg-yellow-50 dark:bg-yellow-500/10"
        />
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-white/10 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            Cargando pendientes...
          </div>
        ) : pendientes.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            No hay activaciones pendientes. ✅
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">Nombre</th>
                  <th className="px-6 py-3">Correo institucional</th>
                  <th className="px-6 py-3">Rol</th>
                  <th className="px-6 py-3">Contraseña temporal</th>
                  <th className="px-6 py-3">Fecha registro</th>
                  <th className="px-6 py-3 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/10">
                {pendientes.map((u) => {
                  const fecha = u.fechaRegistro?.toDate
                    ? u.fechaRegistro.toDate().toLocaleDateString("es-HN")
                    : "—";

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-gray-50 dark:hover:bg-white/5 transition"
                    >
                      <td className="px-6 py-4 font-medium text-gray-800 dark:text-white/90">
                        {u.nombre || "—"}
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300 font-mono">
                        {u.correo || "—"}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
                          {u.rolNombre || "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-gray-800 dark:text-white/80 tracking-wide">
                            {visiblePassword[u.id]
                              ? u.passwordTemporal || "—"
                              : "••••••••••"}
                          </span>
                          <button
                            type="button"
                            onClick={() => togglePassword(u.id)}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
                            title={
                              visiblePassword[u.id]
                                ? "Ocultar contraseña"
                                : "Ver contraseña"
                            }
                          >
                            {visiblePassword[u.id] ? (
                              // ojo cerrado
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
                              </svg>
                            ) : (
                              // ojo abierto
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                        {fecha}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleActivar(u.id)}
                          disabled={confirmandoId === u.id}
                          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white transition"
                        >
                          {confirmandoId === u.id ? (
                            "Activando..."
                          ) : (
                            <>
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Confirmar activación
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}