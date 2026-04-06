import { useMemo } from "react";

import DataTable from "../../components/ui/table/DataTable";
import Badge from "../../components/ui/badge/Badge";
import { Modal } from "../../components/ui/modal";
import {
  lps,
  estadoCreditoColor,
  estadoEmpleadoColor,
} from "../../pages/Creditos/columns/empleadoCreditoColumns";
import { getEstadoEmpleado } from "../../pages/Creditos/hooks/useEmpleadosCredito";

export default function PerfilEmpleadoModal({
  isOpen,
  onClose,
  empleado,
  creditos,
  loading,
  porcentajeLimite,
}) {
  if (!empleado) return null;

  const esCreditoActivo = (c) => {
    const aprobado = String(c.estado ?? "").toLowerCase() === "aprobado";
    const estadoCredito = String(c.estadoCredito ?? "").toLowerCase();
    const sigueActivo = !["pagado", "cancelado", "finalizado"].includes(
      estadoCredito,
    );
    return aprobado && sigueActivo;
  };

  const creditosActivos = creditos.filter(esCreditoActivo);

  const historialCreditos = creditos
    .filter((c) =>
      ["aprobado", "aceptado", "rechazado", "cancelado"].includes(
        String(c.estado ?? "").toLowerCase(),
      ),
    )
    .sort((a, b) => {
      const fa =
        a.fechaAutoriza?.toMillis?.() ?? a.fechaRegistro?.toMillis?.() ?? 0;
      const fb =
        b.fechaAutoriza?.toMillis?.() ?? b.fechaRegistro?.toMillis?.() ?? 0;
      return fb - fa;
    });

  const cuotaMensualActiva = creditosActivos.reduce(
    (acc, c) =>
      acc +
      Number(c.datosFinancierosHistoricos?.cuotaMensual ?? c.cuotaMensual ?? 0),
    0,
  );
  const saldoPendienteTotal = creditosActivos.reduce(
    (acc, c) => acc + Number(c.saldoPendiente ?? 0),
    0,
  );

  const limiteCapacidad = (empleado.salario ?? 0) * (porcentajeLimite ?? 0);
  const disponible = Math.max(0, limiteCapacidad - cuotaMensualActiva);
  const porcentajeUsado =
    limiteCapacidad > 0
      ? Math.min(100, Math.round((cuotaMensualActiva / limiteCapacidad) * 100))
      : 0;
  const excedeLimite = cuotaMensualActiva >= limiteCapacidad;

  const historialColumns = useMemo(
    () => [
      {
        id: "fecha",
        header: "Fecha",
        cell: ({ row }) => {
          const fecha =
            row.original.fechaAutoriza ?? row.original.fechaRegistro;
          return (
            <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
              {fecha?.toDate?.()?.toLocaleDateString("es-HN") ?? "---"}
            </span>
          );
        },
      },
      {
        accessorKey: "productoNombre",
        header: "Producto",
        cell: (info) => (
          <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
            {info.getValue() ?? "---"}
          </span>
        ),
      },
      {
        accessorKey: "estado",
        header: "Estado",
        cell: (info) => {
          const val = info.getValue();
          return (
            <Badge size="sm" color={estadoCreditoColor[val] ?? "warning"}>
              {val}
            </Badge>
          );
        },
      },
      {
        accessorKey: "estadoCredito",
        header: "Estado Crédito",
        cell: (info) => {
          const val = info.getValue() ?? "---";
          return (
            <Badge size="sm" color={estadoCreditoColor[val] ?? "warning"}>
              {val}
            </Badge>
          );
        },
      },
    ],
    [],
  );

  const columnasCreditosDetalle = useMemo(
    () => [
      {
        accessorKey: "productoNombre",
        header: "Artículo",
        cell: (info) => (
          <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
            {info.getValue() ?? "---"}
          </span>
        ),
      },
      {
        id: "cuota",
        header: "Cuota/mes",
        cell: ({ row }) => (
          <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
            {lps(row.original.datosFinancierosHistoricos?.cuotaMensual)}
          </span>
        ),
      },
      {
        id: "progreso",
        header: "Progreso",
        cell: ({ row }) => {
          const pagadas = Number(row.original.cuotasPagadas ?? 0);
          const total = Number(
            row.original.datosFinancierosHistoricos?.plazoCuotas ?? 0,
          );
          return (
            <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
              {pagadas} / {total}
            </span>
          );
        },
      },
      {
        accessorKey: "saldoPendiente",
        header: "Saldo",
        cell: (info) => (
          <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
            {lps(info.getValue())}
          </span>
        ),
      },
      {
        accessorKey: "estadoCredito",
        header: "Estado",
        cell: (info) => {
          const val = info.getValue() ?? "Activo";
          return (
            <Badge size="sm" color={estadoCreditoColor[val] ?? "warning"}>
              {val}
            </Badge>
          );
        },
      },
    ],
    [],
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-6xl">
      <div className="flex h-full max-h-[90vh] overflow-hidden rounded-xl">
        <aside className="hidden md:flex flex-col w-[450px] shrink-0 border-r border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-gray-900 rounded-l-xl overflow-hidden">
          <div className="px-4 pt-5 pb-3 border-b border-gray-200 dark:border-white/10">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
              Perfil del Empleado
            </p>
            <h3 className="text-sm font-bold text-gray-800 dark:text-white/90 mt-1">
              Historial de Créditos
            </h3>
          </div>

          <div className="flex-1 p-3 overflow-auto">
            <DataTable
              columns={historialColumns}
              data={historialCreditos}
              loading={loading}
            >
              <DataTable.Table emptyMessage="Sin historial de créditos" />
              <div className="[&>div]:mt-2 [&>div]:gap-2 [&>div>div:first-child]:hidden [&>div>div:last-child>span]:hidden [&_button]:px-2 [&_button]:py-1 [&_button]:text-xs">
                <DataTable.Pagination />
              </div>
            </DataTable>
          </div>

          <div className="px-4 py-3 border-t border-gray-200 dark:border-white/10 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">
                Préstamos Activos
              </span>
              <span className="text-sm font-bold text-gray-800 dark:text-white/90">
                {creditosActivos.length}
              </span>
            </div>
          </div>
        </aside>

        <div className="flex flex-col flex-1 overflow-hidden rounded-r-xl bg-white dark:bg-gray-800">
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white/90 mt-0.5">
                {empleado.nombres} {empleado.apellidos}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  size="sm"
                  color={
                    estadoEmpleadoColor[getEstadoEmpleado(empleado)] ??
                    "warning"
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
                      value:
                        empleado.fechaRegistro
                          ?.toDate?.()
                          ?.toLocaleDateString("es-HN") ?? "---",
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
                <svg
                  className="w-5 h-5 text-red-500 shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                  />
                </svg>
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
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  Créditos Activos
                </h3>
                <DataTable
                  columns={columnasCreditosDetalle}
                  data={creditosActivos}
                  loading={loading}
                >
                  <DataTable.Table emptyMessage="Sin créditos activos." />
                  <DataTable.Pagination />
                </DataTable>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
