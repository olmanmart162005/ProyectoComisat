import { useLocation, useNavigate } from "react-router-dom";

import Badge from "../../components/ui/badge/Badge";
import PageShell from "../../components/common/PageShell";
import { ChevronLeftIcon } from "../../icons";
import {
  formatMoney,
  getEstadoProducto,
  getEstadoProductoColor,
  safeFormatDate,
} from "../../utils/productoUtils";

export default function ProductoDetalle() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const producto = state?.producto ?? null;

  if (!producto) {
    return (
      <PageShell
        breadcrumbCurrent="Detalle"
        homeLabel="Productos"
        homePath="/productos"
      >
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          No se encontró información del producto.
        </div>
      </PageShell>
    );
  }

  const estadoVisual = getEstadoProducto(
    producto.stock,
    producto.stockMinimo,
    producto.estado,
  );

  const stockBajo =
    Number(producto.stock) > 0 &&
    Number(producto.stock) <= Number(producto.stockMinimo);

  return (
    <PageShell
      breadcrumbItems={["Detalle", producto.nombre]}
      homeLabel="Productos"
      homePath="/productos"
    >
      <main className="py-3 sm:py-4">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <button
            type="button"
            onClick={() => navigate("/productos")}
            className="inline-flex items-center gap-2 self-start text-sm font-medium text-gray-500 transition hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            Regresar a productos
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() =>
                navigate("/productos/comentarios", { state: { producto } })
              }
              className="rounded-lg border border-gray-300 bg-white px-8 py-3 text-xs font-bold text-gray-700 transition-all hover:bg-gray-50 dark:border-white/10 dark:bg-white/[0.02] dark:text-gray-200 dark:hover:bg-white/5"
            >
              Ver comentarios
            </button>
            <button
              onClick={() =>
                navigate("/productos/editar", { state: { producto } })
              }
              className="rounded-lg bg-blue-700 px-10 py-3 text-xs font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-800 active:scale-[0.98]"
            >
              Editar
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-5 w-full">
            <div className="group relative aspect-square overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 shadow-sm dark:border-white/10 dark:bg-gray-900/40">
              {producto.imagenUrl ? (
                <img
                  src={producto.imagenUrl}
                  alt={producto.nombre}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-gray-400 dark:text-gray-500">
                  Sin imagen
                </div>
              )}

              <div className="pointer-events-none absolute left-4 top-4 flex flex-col gap-2">
                <span className="rounded-md border border-blue-200 bg-white/90 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest text-blue-600 backdrop-blur dark:border-blue-500/20 dark:bg-gray-900/80 dark:text-blue-300">
                  {producto.categoriaNombre || "Sin categoría"}
                </span>
                <Badge size="sm" color={getEstadoProductoColor(estadoVisual)}>
                  {estadoVisual}
                </Badge>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 flex flex-col">
            <div className="space-y-6">
              <h2 className="text-4xl font-extrabold leading-tight tracking-tight text-gray-900 dark:text-white/90 sm:text-5xl xl:text-6xl">
                {producto.nombre}
              </h2>

              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                  Descripción
                </h3>
                <p className="max-w-2xl text-base leading-relaxed text-gray-600 dark:text-gray-300 lg:text-lg">
                  {producto.descripcion || "Sin descripción"}
                </p>
              </div>
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
                      d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3 1.343 3 3-1.343 3-3 3m0-12V5m0 14v-2m0-12h3m-3 0H9"
                    />
                  </svg>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900 dark:text-white/90">
                    Estructura de precios
                  </h3>
                </div>

                <div className="space-y-6">
                  <div className="flex flex-col">
                    <span className="mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                      Precio Contado
                    </span>
                    <span className="text-3xl font-bold text-gray-900 dark:text-white/90">
                      {formatMoney(producto.precioContado)}
                    </span>
                  </div>

                  <div className="flex flex-col">
                    <span className="mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                      Precio Crédito
                    </span>
                    <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {formatMoney(producto.precioCredito)}
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
                      d="M20 13V7a2 2 0 00-2-2H6a2 2 0 00-2 2v6m16 0v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6m16 0H4m8-8v16"
                    />
                  </svg>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900 dark:text-white/90">
                    Estado de inventario
                  </h3>
                </div>

                <div className="space-y-6">
                  <div className="flex flex-col">
                    <span className="mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                      Stock actual
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-3xl font-bold text-gray-900 dark:text-white/90">
                        {String(producto.stock ?? "—")}
                      </span>
                      {stockBajo && (
                        <span className="rounded-md border border-amber-200 bg-amber-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/15 dark:text-amber-400">
                          Stock crítico
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <span className="mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                      Stock mínimo
                    </span>
                    <span className="text-3xl font-bold text-gray-900 dark:text-white/90">
                      {producto.stockMinimo ?? "—"}
                    </span>
                  </div>

                  <div className="flex flex-col">
                    <span className="mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                      Fecha de registro
                    </span>
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {safeFormatDate(producto.fechaRegistro)}
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
