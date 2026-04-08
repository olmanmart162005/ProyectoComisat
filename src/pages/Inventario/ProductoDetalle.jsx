import { useLocation, useNavigate } from "react-router-dom";

import Badge from "../../components/ui/badge/Badge";
import PageShell from "../../components/common/PageShell";
import {
  formatMoney,
  getEstadoProducto,
  getEstadoProductoColor,
  safeFormatDate,
} from "./productoUtils";

const DetailItem = ({ label, value, highlight = false, warning = false }) => (
  <div
    className={`rounded-lg border px-4 py-3 ${
      highlight
        ? "border-blue-100 bg-blue-50 dark:border-blue-500/20 dark:bg-blue-500/10"
        : "border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-gray-900/40"
    }`}
  >
    <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
      {label}
    </p>
    <div className="mt-1 flex items-center gap-2">
      <p
        className={`break-words text-sm font-medium ${
          highlight
            ? "text-blue-700 dark:text-blue-300"
            : "text-gray-800 dark:text-white/90"
        }`}
      >
        {value || "—"}
      </p>
      {warning && (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
          <svg
            className="h-3 w-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
          Stock bajo
        </span>
      )}
    </div>
  </div>
);

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
      breadcrumbCurrent="Detalle"
      homeLabel="Productos"
      homePath="/productos"
    >
      <>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">
                {producto.nombre}
              </h2>
              <Badge size="sm" color={getEstadoProductoColor(estadoVisual)}>
                {estadoVisual}
              </Badge>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:self-auto sm:flex-row">
            <button
              onClick={() =>
                navigate("/productos/comentarios", { state: { producto } })
              }
              className="self-start rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300 dark:hover:bg-blue-500/20"
            >
              Ver comentarios
            </button>

            <button
              onClick={() =>
                navigate("/productos/editar", { state: { producto } })
              }
              className="self-start rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-800 sm:self-auto"
            >
              Editar
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 dark:border-white/10 dark:bg-gray-900/40 lg:col-span-1">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
              Imagen
            </p>
            <div className="mt-2">
              {producto.imagenUrl ? (
                <div className="flex min-h-56 items-center justify-center rounded-lg border border-gray-200 bg-white p-3 dark:border-white/10 dark:bg-white/[0.03]">
                  <img
                    src={producto.imagenUrl}
                    alt={producto.nombre}
                    className="max-h-72 w-auto max-w-full rounded-lg object-contain"
                  />
                </div>
              ) : (
                <div className="flex h-56 w-full items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white text-sm text-gray-400 dark:border-white/10 dark:bg-white/[0.03] dark:text-gray-500">
                  Sin imagen
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-2">
            <DetailItem label="Nombre" value={producto.nombre} />
            <DetailItem
              label="Categoría"
              value={producto.categoriaNombre || "—"}
            />
            <DetailItem label="Descripción" value={producto.descripcion} />
            <DetailItem
              label="Precio Contado"
              value={formatMoney(producto.precioContado)}
              highlight
            />
            <DetailItem
              label="Precio Crédito"
              value={formatMoney(producto.precioCredito)}
              highlight
            />
            <DetailItem
              label="Stock"
              value={String(producto.stock ?? "—")}
              warning={stockBajo}
            />
            <DetailItem label="Stock Mínimo" value={producto.stockMinimo} />
            <DetailItem
              label="Fecha Registro"
              value={safeFormatDate(producto.fechaRegistro)}
            />
          </div>
        </div>
      </>
    </PageShell>
  );
}
