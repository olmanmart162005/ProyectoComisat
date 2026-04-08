import { useLocation, useNavigate } from "react-router-dom";

import PageShell from "../../components/common/PageShell";
import Badge from "../../components/ui/badge/Badge";
import MetricCard from "../../components/common/MetricCard";
import { useAuth } from "../../auth/AuthProvider";
import { useNombreEmpleadoActual } from "../../hooks/useNombreEmpleadoActual";
import {
  ChatIcon,
  ChevronLeftIcon,
  EyeCloseIcon,
  EyeIcon,
  ShootingStarIcon,
} from "../../icons";
import { safeFormatDateTime } from "../../utils/formatters";
import { useComentariosProducto } from "./hooks/useComentariosProducto";

const renderEstrellas = (cantidad) => {
  const total = Math.max(0, Math.min(5, Number(cantidad) || 0));
  return Array.from({ length: 5 }, (_, index) => (
    <span
      key={index}
      className={
        index < total ? "text-amber-400" : "text-gray-200 dark:text-gray-700"
      }
    >
      ★
    </span>
  ));
};

const ComentarioCard = ({ comentario, onToggle, procesando }) => {
  const esVisible = comentario.visible !== false;
  const autor = [comentario.empleadoNombres, comentario.empleadoApellidos]
    .filter(Boolean)
    .join(" ")
    .trim();

  const contenido =
    comentario.comentario ||
    comentario.texto ||
    comentario.contenido ||
    "Sin contenido";

  return (
    <div
      className={`rounded-2xl border p-5 transition ${
        esVisible
          ? "border-gray-200 bg-white dark:border-white/10 dark:bg-white/[0.03]"
          : "border-dashed border-gray-200 bg-gray-50 opacity-80 dark:border-white/10 dark:bg-gray-900/30"
      }`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
            {(comentario.empleadoNombres || "U").charAt(0).toUpperCase()}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-gray-900 dark:text-white/90">
                {autor || "Empleado sin registrar"}
              </p>
              <Badge size="sm" color={esVisible ? "success" : "error"}>
                {esVisible ? "Visible" : "Oculto"}
              </Badge>
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-0.5 text-sm">
                {renderEstrellas(comentario.estrellas)}
              </div>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {safeFormatDateTime(
                  comentario["fechaReseña"] ??
                    comentario.fechaResena ??
                    comentario.fecha,
                )}
              </span>
            </div>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-600 dark:text-gray-300">
              {contenido}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onToggle(comentario)}
          disabled={procesando === comentario.id}
          className={`inline-flex items-center gap-2 self-start rounded-lg border px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
            esVisible
              ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300"
              : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
          }`}
        >
          {procesando === comentario.id ? (
            <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
          ) : esVisible ? (
            <EyeCloseIcon className="h-4 w-4" />
          ) : (
            <EyeIcon className="h-4 w-4" />
          )}
          {esVisible ? "Ocultar" : "Restaurar"}
        </button>
      </div>
    </div>
  );
};

export default function Gest_ComentariosProducto() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const nombreEmpleado = useNombreEmpleadoActual();

  const productoState = state?.producto ?? null;
  const productoId = productoState?.id ?? state?.productoId ?? "";

  const {
    producto,
    comentarios,
    loading,
    procesando,
    estadisticas,
    toggleVisibilidad,
  } = useComentariosProducto({ productoId, user, nombreEmpleado });

  const productoMostrado = producto ?? productoState;

  if (!productoId) {
    return (
      <PageShell
        breadcrumbCurrent="Comentarios"
        homeLabel="Productos"
        homePath="/productos"
      >
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          No se encontró el producto para mostrar comentarios.
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      breadcrumbCurrent="Comentarios"
      homeLabel="Productos"
      homePath="/productos"
      contentClassName="space-y-6"
    >
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={() =>
            navigate("/productos/detalle", {
              state: { producto: productoMostrado },
            })
          }
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          Regresar al detalle
        </button>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.03] sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 dark:border-white/10 dark:bg-gray-900/40">
              {productoMostrado?.imagenUrl ? (
                <img
                  src={productoMostrado.imagenUrl}
                  alt={productoMostrado.nombre}
                  className="h-full w-full object-contain p-1"
                />
              ) : (
                <ChatIcon className="h-6 w-6 text-gray-300" />
              )}
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">
                Reseñas del producto
              </p>
              <h2 className="mt-1 text-xl font-bold text-gray-900 dark:text-white/90">
                {productoMostrado?.nombre ?? "Producto"}
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {productoMostrado?.categoriaNombre || "Sin categoría"}
                {productoMostrado?.id ? ` · ${productoMostrado.id}` : ""}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MetricCard
              title="Total"
              value={estadisticas.total}
              icon={
                <ChatIcon className="size-6 text-gray-800 dark:text-white/90" />
              }
              iconWrapperClass="bg-gray-100 dark:bg-gray-800"
            />
            <MetricCard
              title="Visibles"
              value={estadisticas.visibles}
              icon={
                <EyeIcon className="size-6 text-emerald-600 dark:text-emerald-400" />
              }
              iconWrapperClass="bg-emerald-50 dark:bg-emerald-500/10"
            />
            <MetricCard
              title="Ocultos"
              value={estadisticas.ocultos}
              icon={
                <EyeCloseIcon className="size-6 text-red-600 dark:text-red-400" />
              }
              iconWrapperClass="bg-red-50 dark:bg-red-500/10"
            />
            <MetricCard
              title="Promedio"
              value={estadisticas.promedio.toFixed(1)}
              icon={
                <ShootingStarIcon className="size-6 text-amber-500 dark:text-amber-400" />
              }
              iconWrapperClass="bg-amber-50 dark:bg-amber-500/10"
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.03] sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
              Gestión de reseñas
            </p>
            <h3 className="mt-1 text-lg font-semibold text-gray-900 dark:text-white/90">
              Comentarios del producto
            </h3>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {loading ? "Cargando..." : `${comentarios.length} comentario(s)`}
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-16 text-center dark:border-white/10 dark:bg-gray-900/20">
            <span className="inline-flex h-10 w-10 animate-spin rounded-full border-2 border-blue-600 border-r-transparent dark:border-blue-400 dark:border-r-transparent" />
            <p className="mt-4 text-sm font-medium uppercase tracking-widest text-gray-400 dark:text-gray-500">
              Cargando comentarios...
            </p>
          </div>
        ) : comentarios.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-16 text-center dark:border-white/10 dark:bg-gray-900/20">
            <ChatIcon className="h-10 w-10 text-gray-300 dark:text-gray-600" />
            <p className="mt-4 text-sm font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
              Sin reseñas aún
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Cuando existan comentarios del producto, aparecerán aquí.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {comentarios.map((comentario) => (
              <ComentarioCard
                key={comentario.id}
                comentario={comentario}
                onToggle={toggleVisibilidad}
                procesando={procesando}
              />
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
