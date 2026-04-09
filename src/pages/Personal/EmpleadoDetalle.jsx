import { useLocation, useNavigate } from "react-router-dom";

import Badge from "../../components/ui/badge/Badge";
import PageShell from "../../components/common/PageShell";
import { ChevronLeftIcon } from "../../icons";
import {
  formatDateDisplay,
  formatSalary,
  getEstadoEmpleadoColor,
} from "../../utils/empleadoUtils";

export default function EmpleadoDetalle() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const empleado = state?.empleado ?? null;

  if (!empleado) {
    return (
      <PageShell
        breadcrumbCurrent="Detalle"
        homeLabel="Empleados"
        homePath="/empleados"
      >
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          No se encontró información del empleado.
        </div>
      </PageShell>
    );
  }

  const nombreCompleto =
    `${empleado.nombres ?? ""} ${empleado.apellidos ?? ""}`.trim();

  return (
    <PageShell
      breadcrumbItems={["Detalle", nombreCompleto || "Empleado"]}
      homeLabel="Empleados"
      homePath="/empleados"
    >
      <main className="py-3 sm:py-4">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <button
            type="button"
            onClick={() => navigate("/empleados")}
            className="inline-flex items-center gap-2 self-start text-sm font-medium text-gray-500 transition hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            Regresar a empleados
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() =>
                navigate("/empleados/editar", {
                  state: { empleado },
                })
              }
              className="rounded-lg bg-blue-700 px-10 py-3 text-xs font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-800 active:scale-[0.98]"
            >
              Editar
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-12">
          <div className="w-full lg:col-span-5">
            <div className="group relative aspect-square overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 shadow-sm dark:border-white/10 dark:bg-gray-900/40">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-gray-50 dark:from-blue-500/10 dark:via-gray-900 dark:to-gray-950" />

              <div className="relative flex h-full flex-col items-center justify-center px-6 text-center">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-blue-600 text-3xl font-extrabold text-white shadow-lg shadow-blue-600/25">
                  {(empleado.nombres || "E").charAt(0).toUpperCase()}
                </div>

                <p className="mt-5 text-sm font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                  Código de empleado
                </p>
                <p className="mt-1 text-2xl font-extrabold tracking-tight text-blue-700 dark:text-blue-300">
                  {empleado.codigoEmpleado || "—"}
                </p>
              </div>

              <div className="pointer-events-none absolute left-4 top-4 flex flex-col gap-2">
                <span className="rounded-md border border-blue-200 bg-white/90 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest text-blue-600 backdrop-blur dark:border-blue-500/20 dark:bg-gray-900/80 dark:text-blue-300">
                  {empleado.departamentoNombre || "Sin departamento"}
                </span>
                <Badge
                  size="sm"
                  color={getEstadoEmpleadoColor(empleado.estado)}
                >
                  {empleado.estado || "—"}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:col-span-7">
            <div className="space-y-6">
              <h2 className="text-4xl font-extrabold leading-tight tracking-tight text-gray-900 dark:text-white/90 sm:text-5xl xl:text-6xl">
                {nombreCompleto || "Empleado"}
              </h2>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-8 border-t border-gray-200 pt-8 dark:border-white/10 md:grid-cols-2 md:gap-12">
              <div className="space-y-6">
                <div className="flex items-center gap-2.5">
                  <svg
                    className="h-5 w-5 text-blue-600 dark:text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7.5 8.25h9m-9 3h9m-9 3h4.5M3 5.25A2.25 2.25 0 0 1 5.25 3h13.5A2.25 2.25 0 0 1 21 5.25v13.5A2.25 2.25 0 0 1 18.75 21H5.25A2.25 2.25 0 0 1 3 18.75V5.25Z"
                    />
                  </svg>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900 dark:text-white/90">
                    Datos personales
                  </h3>
                </div>

                <div className="space-y-6">
                  <div className="flex flex-col">
                    <span className="mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                      DNI
                    </span>
                    <span className="text-2xl font-bold text-gray-900 dark:text-white/90">
                      {empleado.dni || "—"}
                    </span>
                  </div>

                  <div className="flex flex-col">
                    <span className="mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                      Teléfono
                    </span>
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {empleado.telefono || "—"}
                    </span>
                  </div>

                  <div className="flex flex-col">
                    <span className="mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                      Correo
                    </span>
                    <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                      {empleado.correo || "—"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-6 border-l border-gray-200 pl-8 dark:border-white/10">
                <div className="flex items-center gap-2.5">
                  <svg
                    className="h-5 w-5 text-blue-600 dark:text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3 1.343 3 3-1.343 3-3 3m0-12V5m0 14v-2m0-12h3m-3 0H9"
                    />
                  </svg>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900 dark:text-white/90">
                    Datos laborales
                  </h3>
                </div>

                <div className="space-y-6">
                  <div className="flex flex-col">
                    <span className="mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                      Salario
                    </span>
                    <span className="text-3xl font-bold text-gray-900 dark:text-white/90">
                      {formatSalary(empleado.salario)}
                    </span>
                  </div>

                  <div className="flex flex-col">
                    <span className="mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                      Fecha de inicio
                    </span>
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {formatDateDisplay(empleado.fechaInicio)}
                    </span>
                  </div>

                  <div className="flex flex-col">
                    <span className="mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                      Fecha de registro
                    </span>
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {formatDateDisplay(empleado.fechaRegistro)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </PageShell>
  );
}
