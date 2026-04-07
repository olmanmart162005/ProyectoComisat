import { useLocation } from "react-router-dom";

import PageShell from "../../components/common/PageShell";
import DataTable from "../../components/ui/table/DataTable";
import Badge from "../../components/ui/badge/Badge";
import { lps, estadoEmpleadoColor } from "./columns/empleadoCreditoColumns";
import {
  historialColumns,
  columnasCreditosDetalle,
} from "./columns/perfilDetalleColumns";
import { getEstadoEmpleado } from "./hooks/useEmpleadosPerfil";
import { usePerfilEmpleadoDetalle } from "./hooks/usePerfilEmpleadoDetalle";

const formatFecha = (valor) => {
  if (!valor) return "---";
  if (typeof valor?.toDate === "function") {
    return valor.toDate()?.toLocaleDateString("es-HN") ?? "---";
  }
  if (valor instanceof Date) {
    return valor.toLocaleDateString("es-HN");
  }
  const seconds = valor?.seconds ?? valor?._seconds;
  if (typeof seconds === "number") {
    return new Date(seconds * 1000).toLocaleDateString("es-HN");
  }
  return "---";
};

export default function PerfilEmpleadoDetalle() {
  const { state } = useLocation();
  const empleadoId = state?.empleado?.id;

  const {
    empleado,
    loading,
    porcentajeLimite,
    creditosActivos,
    historialCreditos,
    cuotaMensualActiva,
    saldoPendienteTotal,
    limiteCapacidad,
    disponible,
    porcentajeUsado,
    excedeLimite,
  } = usePerfilEmpleadoDetalle({ empleadoId, state });

  const historialCols = historialColumns();
  const columnasDetalle = columnasCreditosDetalle();

  return (
    <PageShell
      breadcrumbCurrent="Perfil del Empleado"
      contentClassName="space-y-4"
      homeLabel="Empleados"
      homePath="/empleados-perfil"
    >
      {!empleado && !loading && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          No se encontró información del empleado.
        </div>
      )}

      {empleado && (
        <div className="space-y-5 border border-gray-200 dark:border-white/10 rounded-xl p-4 sm:p-6 bg-white dark:bg-gray-800">
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">
              {empleado.nombres} {empleado.apellidos}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge
                size="sm"
                color={
                  estadoEmpleadoColor[getEstadoEmpleado(empleado)] ?? "warning"
                }
              >
                {getEstadoEmpleado(empleado)}
              </Badge>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
            <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-white/10">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                Datos del Empleado
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900/50 px-4 py-4">
              <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                {[
                  {
                    label: "Departamento",
                    value: empleado.departamentoNombre ?? "---",
                  },
                  { label: "Salario", value: lps(empleado.salario) },
                  { label: "DNI", value: empleado.dni ?? "---" },
                  { label: "Teléfono", value: empleado.telefono ?? "---" },
                  { label: "Correo", value: empleado.correo ?? "---" },
                  {
                    label: "Fecha Registro",
                    value: formatFecha(
                      empleado.fechaRegistro ?? empleado.FechaRegistro,
                    ),
                  },
                ].map((item) => (
                  <div key={item.label} className="flex flex-col gap-0.5">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                      {item.label}
                    </p>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
            <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-white/10">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                Perfil Financiero
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900/50 px-4 py-5 sm:px-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-4">
                {[
                  {
                    label: "Salario Neto",
                    value: lps(empleado.salario),
                    color: "text-gray-800 dark:text-white/90",
                  },
                  {
                    label: `Límite (${Math.round((porcentajeLimite ?? 0) * 100)}%)`,
                    value: lps(limiteCapacidad),
                    color: "text-gray-800 dark:text-white/90",
                  },
                  {
                    label: "Crédito Utilizado",
                    value: lps(cuotaMensualActiva),
                    color: "text-emerald-700 dark:text-emerald-400",
                  },
                  {
                    label: "Disponible",
                    value: lps(disponible),
                    color: excedeLimite
                      ? "text-red-600 dark:text-red-400"
                      : "text-green-700 dark:text-green-400",
                  },
                ].map((item) => (
                  <div key={item.label} className="flex flex-col gap-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      {item.label}
                    </p>
                    <p
                      className={`text-xl leading-none font-bold tabular-nums whitespace-nowrap ${item.color}`}
                    >
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-4 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Capacidad utilizada
                  </span>
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    {porcentajeUsado}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      excedeLimite
                        ? "bg-red-500 dark:bg-red-400"
                        : porcentajeUsado >= 75
                          ? "bg-yellow-500 dark:bg-yellow-400"
                          : "bg-blue-500 dark:bg-blue-400"
                    }`}
                    style={{ width: `${porcentajeUsado}%` }}
                  />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-200 dark:border-white/10 flex justify-between items-center">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Saldo Total Pendiente
                </span>
                <span className="text-base font-bold text-gray-800 dark:text-white/90">
                  {lps(saldoPendienteTotal)}
                </span>
              </div>
            </div>
          </div>

          {excedeLimite && (
            <div className="flex items-start gap-3 p-4 rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-red-600 dark:text-red-400">
                  Límite de Crédito Alcanzado
                </p>
                <p className="text-xs font-medium text-red-600 dark:text-red-400 mt-0.5">
                  Este empleado ha consumido el 100% de su capacidad de
                  endeudamiento mensual.
                </p>
              </div>
            </div>
          )}

          {creditosActivos.length > 0 && (
            <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-gray-900 overflow-hidden">
              <div className="px-4 pt-5 pb-3 border-b border-gray-200 dark:border-white/10">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                  Créditos Activos
                </p>
              </div>

              <div className="p-3">
                <DataTable
                  columns={columnasDetalle}
                  data={creditosActivos}
                  loading={loading}
                >
                  <DataTable.Table emptyMessage="Sin créditos activos." />
                  <DataTable.Pagination />
                </DataTable>
              </div>
            </div>
          )}

          <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-gray-900 overflow-hidden">
            <div className="px-4 pt-5 pb-3 border-b border-gray-200 dark:border-white/10">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                Historial de Créditos
              </p>
            </div>

            <div className="p-3">
              <DataTable
                columns={historialCols}
                data={historialCreditos}
                loading={loading}
              >
                <DataTable.Table emptyMessage="Sin historial de créditos" />
                <DataTable.Pagination />
              </DataTable>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
