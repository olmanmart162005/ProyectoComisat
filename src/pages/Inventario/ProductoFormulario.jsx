import { useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useLocation, useNavigate } from "react-router-dom";

import PageShell from "../../components/common/PageShell";
import { useAuth } from "../../auth/AuthProvider";
import { useNombreEmpleadoActual } from "../../hooks/useNombreEmpleadoActual";
import { useProductos } from "./hooks/useProductos";
import {
  MAX_DESCRIPCION,
  MAX_NOMBRE_PRODUCTO,
  getEstadoProducto,
} from "../../utils/productoUtils";

export default function ProductoFormulario() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const nombreEmpleado = useNombreEmpleadoActual();
  const producto = location.state?.producto ?? null;
  const modoEdicion = Boolean(producto);

  const { categorias, porcentajeAumento, guardarProducto, actualizarProducto } =
    useProductos({ user, nombreEmpleado, cargarProductos: false });

  const [editandoId, setEditandoId] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precioContado, setPrecioContado] = useState("");
  const [precioCredito, setPrecioCredito] = useState("");
  const [stock, setStock] = useState("");
  const [stockMinimo, setStockMinimo] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [categoriaNombre, setCategoriaNombre] = useState("");
  const [busquedaCategoria, setBusquedaCategoria] = useState("");
  const [mostrarSugerenciasCategoria, setMostrarSugerenciasCategoria] =
    useState(false);
  const [estado, setEstado] = useState("Activo");
  const [archivoImagen, setArchivoImagen] = useState(null);
  const [previewImagen, setPreviewImagen] = useState(null);
  const [imagenUrlActual, setImagenUrlActual] = useState("");

  const resetFormulario = () => {
    setEditandoId(null);
    setNombre("");
    setDescripcion("");
    setPrecioContado("");
    setPrecioCredito("");
    setStock("");
    setStockMinimo("");
    setEstado("Activo");
    setArchivoImagen(null);
    setPreviewImagen(null);
    setImagenUrlActual("");
    setBusquedaCategoria("");
    setMostrarSugerenciasCategoria(false);
    setCategoriaId("");
    setCategoriaNombre("");
  };

  useEffect(() => {
    if (modoEdicion && producto) {
      setEditandoId(producto.id || null);
      setNombre(producto.nombre || "");
      setDescripcion(producto.descripcion || "");
      setPrecioContado(String(producto.precioContado || ""));
      setPrecioCredito(String(producto.precioCredito || ""));
      setStock(String(producto.stock || ""));
      setStockMinimo(String(producto.stockMinimo || ""));
      setCategoriaId(producto.categoriaId || "");
      setCategoriaNombre(producto.categoriaNombre || "");
      setBusquedaCategoria(producto.categoriaNombre || "");
      setMostrarSugerenciasCategoria(false);
      setEstado(producto.estado || "Activo");
      setImagenUrlActual(producto.imagenUrl || "");
      setPreviewImagen(producto.imagenUrl || null);
      setArchivoImagen(null);
      return;
    }

    resetFormulario();
  }, [modoEdicion, producto, categorias]);

  useEffect(() => {
    if (precioContado === "") {
      setPrecioCredito("");
      return;
    }

    const contado = Number(precioContado);
    if (Number.isNaN(contado)) return;
    const credito = contado * (1 + porcentajeAumento);
    setPrecioCredito(credito.toFixed(2));
  }, [precioContado, porcentajeAumento]);

  useEffect(() => {
    if (estado === "Inactivo") return;
    if (stock === "" || stockMinimo === "") return;

    const siguienteEstado = getEstadoProducto(stock, stockMinimo, estado);
    if (siguienteEstado !== estado) {
      setEstado(siguienteEstado);
    }
  }, [estado, stock, stockMinimo]);

  const categoriasFiltradas = categorias.filter((cat) =>
    `${cat.nombre ?? ""}`
      .toLowerCase()
      .includes(busquedaCategoria.toLowerCase()),
  );

  const seleccionarCategoria = (cat) => {
    setCategoriaId(cat.id);
    setCategoriaNombre(cat.nombre || "");
    setBusquedaCategoria(cat.nombre || "");
    setMostrarSugerenciasCategoria(false);
  };

  const handleImagenChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setArchivoImagen(file);
    setPreviewImagen(URL.createObjectURL(file));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        handleImagenChange({ target: { files: acceptedFiles } });
      }
    },
    accept: {
      "image/png": [],
      "image/jpeg": [],
      "image/webp": [],
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!categoriaId) {
      setMostrarSugerenciasCategoria(true);
      return;
    }
    setEnviando(true);
    try {
      const payload = {
        nombre,
        descripcion,
        precioContado,
        stock,
        stockMinimo,
        categoriaId,
        categoriaNombre,
        estado,
        archivoImagen,
        porcentajeAumento,
        onSuccess: () => navigate("/productos"),
      };

      if (modoEdicion) {
        await actualizarProducto?.({
          ...payload,
          editandoId,
          editandoData: producto,
          imagenUrlActual,
        });
      } else {
        await guardarProducto?.(payload);
      }
    } finally {
      setEnviando(false);
    }
  };

  if (location.pathname.endsWith("/editar") && !producto) {
    return (
      <PageShell
        breadcrumbCurrent="Editar"
        homeLabel="Productos"
        homePath="/productos"
        pageTitle="Editar Producto"
        title="Editar Producto"
      >
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          No se encontró el producto para editar.
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      breadcrumbCurrent={modoEdicion ? "Editar" : "Nuevo"}
      homeLabel="Productos"
      homePath="/productos"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
          <div className="lg:col-span-5 space-y-2.5">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
              Imagen del Producto
            </label>
            <div
              {...getRootProps()}
              className={`group relative flex aspect-square cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed p-1.5 transition-all ${
                isDragActive
                  ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-500/10"
                  : "border-gray-200 bg-gray-50 hover:border-blue-300 dark:border-white/10 dark:bg-gray-900/40 dark:hover:border-blue-500/40"
              }`}
            >
              <input {...getInputProps()} />
              {previewImagen ? (
                <img
                  src={previewImagen}
                  alt={nombre || "Preview"}
                  className="h-full w-full rounded-lg object-cover opacity-100 transition-opacity group-hover:opacity-95"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-white/60 to-transparent dark:from-gray-900/70 dark:via-gray-900/45" />
              )}

              {(!previewImagen || isDragActive) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition-transform group-hover:scale-105 dark:bg-blue-500/10 dark:text-blue-400">
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.8}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    {isDragActive
                      ? "Suelta la imagen aquí"
                      : "Haz clic o arrastra la imagen"}
                  </p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                    PNG, JPG o WebP
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-7 flex flex-col gap-5 self-stretch">
            <div>
              <div className="mb-1.5 ml-1 flex items-end justify-between gap-3">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                  Nombre del Producto
                </label>
                <span className="text-[9px] font-bold uppercase text-gray-400 dark:text-gray-500">
                  {nombre.length} / {MAX_NOMBRE_PRODUCTO}
                </span>
              </div>
              <input
                type="text"
                required
                value={nombre}
                maxLength={MAX_NOMBRE_PRODUCTO}
                onChange={(e) =>
                  setNombre(
                    (e.target.value || "").slice(0, MAX_NOMBRE_PRODUCTO),
                  )
                }
                placeholder="Ej. Cafetera"
                className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 dark:border-white/10 dark:bg-white/[0.02] dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 ml-1 block text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                  Categoría
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={busquedaCategoria}
                    onChange={(e) => {
                      const valor = e.target.value;
                      setBusquedaCategoria(valor);
                      setCategoriaId("");
                      setCategoriaNombre("");
                      setMostrarSugerenciasCategoria(true);
                    }}
                    onKeyDown={(e) => {
                      if (e.key !== "Enter") return;
                      if (categoriasFiltradas.length === 0) return;

                      e.preventDefault();
                      seleccionarCategoria(categoriasFiltradas[0]);
                    }}
                    onFocus={() => setMostrarSugerenciasCategoria(true)}
                    onBlur={() =>
                      setTimeout(
                        () => setMostrarSugerenciasCategoria(false),
                        150,
                      )
                    }
                    placeholder="Buscar categoría..."
                    className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 dark:border-white/10 dark:bg-white/[0.02] dark:text-white"
                  />

                  {mostrarSugerenciasCategoria &&
                    busquedaCategoria.length > 0 && (
                      <ul className="absolute z-50 mt-1 max-h-52 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-white/10 dark:bg-gray-800">
                        {categoriasFiltradas.length > 0 ? (
                          categoriasFiltradas.map((cat) => (
                            <li
                              key={cat.id}
                              onMouseDown={() => seleccionarCategoria(cat)}
                              className="cursor-pointer px-4 py-2 hover:bg-blue-50 dark:hover:bg-white/5"
                            >
                              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                {cat.nombre}
                              </p>
                            </li>
                          ))
                        ) : (
                          <li className="px-4 py-3 text-center text-sm text-gray-400 dark:text-gray-500">
                            Sin resultados para "{busquedaCategoria}"
                          </li>
                        )}
                      </ul>
                    )}
                </div>
              </div>

              <div>
                <label className="mb-1.5 ml-1 block text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                  Estado del producto
                </label>
                <div className="flex h-[42px] items-center rounded-lg border border-gray-200 bg-white px-3.5 dark:border-white/10 dark:bg-white/[0.02]">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={estado !== "Inactivo"}
                      onClick={() =>
                        setEstado((prev) =>
                          prev === "Inactivo" ? "Activo" : "Inactivo",
                        )
                      }
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        estado !== "Inactivo"
                          ? "bg-blue-600"
                          : "bg-gray-300 dark:bg-gray-600"
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                          estado !== "Inactivo"
                            ? "translate-x-5"
                            : "translate-x-1"
                        }`}
                      />
                    </button>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      {estado !== "Inactivo" ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1">
              <div className="mb-1.5 ml-1 flex items-end justify-between">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                  Descripción del Producto
                </label>
                <span className="text-[9px] font-bold uppercase text-gray-400 dark:text-gray-500">
                  {descripcion.length} / {MAX_DESCRIPCION}
                </span>
              </div>
              <textarea
                value={descripcion}
                onChange={(e) =>
                  setDescripcion(
                    (e.target.value || "").slice(0, MAX_DESCRIPCION),
                  )
                }
                maxLength={MAX_DESCRIPCION}
                placeholder="Escribe los detalles destacados del producto..."
                rows={6}
                className="min-h-[180px] w-full resize-none rounded-lg border border-gray-200 bg-white px-3.5 py-3 text-sm text-gray-900 outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 dark:border-white/10 dark:bg-white/[0.02] dark:text-white"
              />
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 border-t border-gray-100 pt-2 md:grid-cols-2 dark:border-white/10">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 border-b border-gray-100 pb-1.5 dark:border-white/10">
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
              <h3 className="text-base font-bold text-gray-900 dark:text-white/90">
                Precios
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 ml-1 block text-[10px] font-bold uppercase text-gray-400 dark:text-gray-500">
                  Costo
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  required
                  min="0"
                  value={precioContado}
                  onChange={(e) => {
                    const valor = e.target.value.replace(",", ".");
                    if (/^\d*(?:\.\d{0,2})?$/.test(valor)) {
                      setPrecioContado(valor);
                    }
                  }}
                  placeholder="3500"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 dark:border-white/10 dark:bg-white/[0.02] dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1.5 ml-1 block text-[10px] font-bold uppercase text-gray-400 dark:text-gray-500">
                  Venta
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  required
                  min="0"
                  value={precioCredito}
                  readOnly
                  disabled
                  placeholder="Calculado automáticamente"
                  className="w-full cursor-not-allowed rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-2.5 text-sm font-semibold text-blue-700 opacity-90 outline-none dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2.5 border-b border-gray-100 pb-1.5 dark:border-white/10">
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
              <h3 className="text-base font-bold text-gray-900 dark:text-white/90">
                Inventario
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 ml-1 block text-[10px] font-bold uppercase text-gray-400 dark:text-gray-500">
                  Stock Actual
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={stock}
                  onChange={(e) => {
                    if (e.target.value === "" || Number(e.target.value) >= 0) {
                      setStock(e.target.value);
                    }
                  }}
                  placeholder="10"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 dark:border-white/10 dark:bg-white/[0.02] dark:text-white"
                />
              </div>

              <div>
                <label className="mb-1.5 ml-1 block text-[10px] font-bold uppercase text-gray-400 dark:text-gray-500">
                  Mínimo Stock
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={stockMinimo}
                  onChange={(e) => {
                    if (e.target.value === "" || Number(e.target.value) >= 0) {
                      setStockMinimo(e.target.value);
                    }
                  }}
                  placeholder="5"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 dark:border-white/10 dark:bg-white/[0.02] dark:text-white"
                />
              </div>
            </div>
          </div>
        </section>

        <footer className="sticky bottom-0 z-10 -mx-5 border-t border-gray-100 bg-white px-5 py-4 dark:border-white/10 dark:bg-gray-950/80 sm:-mx-6 sm:px-6">
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate("/productos")}
              className="rounded-lg border border-gray-300 bg-white px-8 py-3 text-xs font-bold text-gray-700 transition-all hover:bg-gray-50 dark:border-white/10 dark:bg-white/[0.02] dark:text-gray-200 dark:hover:bg-white/5"
            >
              Volver
            </button>
            <button
              type="submit"
              disabled={enviando}
              className={`rounded-lg px-10 py-3 text-xs font-bold text-white shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98] ${
                enviando
                  ? "bg-gray-400"
                  : modoEdicion
                    ? "bg-blue-700 hover:bg-blue-800"
                    : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {enviando
                ? "Procesando..."
                : modoEdicion
                  ? "Actualizar"
                  : "Guardar"}
            </button>
          </div>
        </footer>
      </form>
    </PageShell>
  );
}
