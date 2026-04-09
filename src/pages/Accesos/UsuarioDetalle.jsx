import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import Badge from "../../components/ui/badge/Badge";
import PageShell from "../../components/common/PageShell";
import { ChevronLeftIcon } from "../../icons";
import { safeFormatDate } from "../../utils/formatters";
import { db } from "../../firebase/firebase";
export default function UsuarioDetalle() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const usuario = state?.usuario ?? null;
  const [correoPersonalFallback, setCorreoPersonalFallback] = useState("");
  useEffect(() => {
    const cargarCorreoPersonal = async () => {
      if (!usuario?.empleadoId || usuario?.correoPersonal) return;
      try {
        const empleadoSnap = await getDoc(
          doc(db, "empleados", usuario.empleadoId),
        );
        if (empleadoSnap.exists()) {
          setCorreoPersonalFallback(empleadoSnap.data()?.correo ?? "");
        }
      } catch (error) {
        console.error("Error al cargar correo personal del empleado:", error);
      }
    };
    cargarCorreoPersonal();
  }, [usuario]);
  if (!usuario) {
    return (
      <PageShell
        breadcrumbCurrent="Detalle"
        homeLabel="Usuarios"
        homePath="/usuarios"
      >
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          No se encontró información del usuario.
        </div>
      </PageShell>
    );
  }
  const nombreCompleto = usuario.nombre || "Usuario";
  const correoPersonalMostrado =
    usuario.correoPersonal || correoPersonalFallback || "—";
  return (
    <PageShell
      breadcrumbItems={["Detalle", nombreCompleto]}
      homeLabel="Usuarios"
      homePath="/usuarios"
    >
      <main className="py-3 sm:py-4">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <button
            type="button"
            onClick={() => navigate("/usuarios")}
            className="inline-flex items-center gap-2 self-start text-sm font-medium text-gray-500 transition hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            Regresar a usuarios
          </button>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() =>
                navigate("/usuarios/editar", { state: { usuario } })
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
                  {(nombreCompleto || "U").charAt(0).toUpperCase()}
                </div>
                <p className="mt-5 text-sm font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                  Rol
                </p>
                <p className="mt-1 text-2xl font-extrabold tracking-tight text-blue-700 dark:text-blue-300">
                  {usuario.rolNombre || "—"}
                </p>
              </div>
              <div className="pointer-events-none absolute left-4 top-4 flex flex-col gap-2">
                <Badge
                  size="sm"
                  color={usuario.estado === "Activo" ? "success" : "error"}
                >
                  {usuario.estado || "—"}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex flex-col lg:col-span-7">
            <div className="space-y-6">
              <h2 className="text-4xl font-extrabold leading-tight tracking-tight text-gray-900 dark:text-white/90 sm:text-5xl xl:text-6xl">
                {nombreCompleto}
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
                    Datos de acceso
                  </h3>
                </div>
                <div className="space-y-6">
                  <div className="flex flex-col">
                    <span className="mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                      Correo institucional
                    </span>
                    <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                      {usuario.correo || "—"}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                      Correo personal
                    </span>
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {correoPersonalMostrado}
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
                    Datos generales
                  </h3>
                </div>
                <div className="space-y-6">
                  <div className="flex flex-col">
                    <span className="mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                      Estado
                    </span>
                    <span className="text-3xl font-bold text-gray-900 dark:text-white/90">
                      {usuario.estado || "—"}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                      Fecha de registro
                    </span>
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {safeFormatDate(usuario.fechaRegistro)}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                      Última modificación
                    </span>
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {safeFormatDate(usuario.ultimaModificacion)}
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