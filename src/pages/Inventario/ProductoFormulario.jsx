import { useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useLocation, useNavigate } from "react-router-dom";

import Badge from "../../components/ui/badge/Badge";
import PageShell from "../../components/common/PageShell";
import { useAuth } from "../../auth/AuthProvider";
import { useNombreEmpleadoActual } from "../../hooks/useNombreEmpleadoActual";
import { useProductos } from "./hooks/useProductos";
import {
  MAX_DESCRIPCION,
  getEstadoProducto,
  getEstadoProductoColor,
} from "./productoUtils";

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
    if (categorias.length > 0) {
      setCategoriaId(categorias[0].id);
      setCategoriaNombre(categorias[0].nombre || "");
      setBusquedaCategoria(categorias[0].nombre || "");
    } else {
      setCategoriaId("");
      setCategoriaNombre("");
    }
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

  useEffect(() => {
    if (modoEdicion || categorias.length === 0 || categoriaId) return;
    setCategoriaId(categorias[0].id);
    setCategoriaNombre(categorias[0].nombre || "");
    setBusquedaCategoria(categorias[0].nombre || "");
  }, [categorias, categoriaId, modoEdicion]);

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

  const estadoVisual = getEstadoProducto(stock, stockMinimo, estado);

  return (
    <PageShell
      breadcrumbCurrent={modoEdicion ? "Editar" : "Nuevo"}
      homeLabel="Productos"
      homePath="/productos"
    >
      <div className="space-y-6">
        {modoEdicion && (
          <div className="flex justify-end">
            <Badge size="sm" color={getEstadoProductoColor(estadoVisual)}>
              {estadoVisual}
            </Badge>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Imagen del Producto
              </label>
              <div
                {...getRootProps()}
                className={`cursor-pointer rounded-lg border-2 border-dashed p-4 transition ${
                  isDragActive
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10"
                    : "border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/40"
                }`}
              >
                <input {...getInputProps()} />
                {previewImagen ? (
                  <div className="flex items-center justify-center rounded-lg p-2">
                    <img
                      src={previewImagen}
                      alt={nombre || "Preview"}
                      className="max-h-64 w-auto max-w-full rounded-lg object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6">
                    <svg
                      className="mb-2 h-10 w-10 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-400">
                      {isDragActive
                        ? "Suelta la imagen aquí"
                        : "Arrastra la imagen o haz clic"}
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                      PNG, JPG, WebP
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Nombre
                </label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Cafetera"
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">
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
                      setMostrarSugerenciasCategoria(true);
                      if (!valor) {
                        setCategoriaId("");
                        setCategoriaNombre("");
                      }
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
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  />

                  {mostrarSugerenciasCategoria &&
                    busquedaCategoria.length > 0 && (
                      <ul className="absolute z-50 mt-1 max-h-52 w-full overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                        {categoriasFiltradas.length > 0 ? (
                          categoriasFiltradas.map((cat) => (
                            <li
                              key={cat.id}
                              onMouseDown={() => seleccionarCategoria(cat)}
                              className="cursor-pointer px-4 py-2 hover:bg-blue-50 dark:hover:bg-gray-700"
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Precio Contado (L.)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={precioContado}
                  onChange={(e) => {
                    if (e.target.value === "" || Number(e.target.value) >= 0) {
                      setPrecioContado(e.target.value);
                    }
                  }}
                  placeholder="3500"
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Precio Crédito (L.)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={precioCredito}
                  readOnly
                  disabled
                  placeholder="Calculado automáticamente"
                  className="mt-1 block w-full cursor-not-allowed rounded-md border border-gray-300 bg-gray-50 p-2 text-gray-700 opacity-70 shadow-sm dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Stock
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
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Stock Mínimo
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
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Estado
                </label>
                <select
                  value={estado === "Agotado" ? "Activo" : estado}
                  onChange={(e) => setEstado(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                >
                  <option
                    value="Activo"
                    className="bg-white text-gray-900 dark:bg-gray-800 dark:text-white"
                  >
                    Activo
                  </option>
                  <option
                    value="Inactivo"
                    className="bg-white text-gray-900 dark:bg-gray-800 dark:text-white"
                  >
                    Inactivo
                  </option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">
              Descripción
            </label>
            <textarea
              value={descripcion}
              onChange={(e) =>
                setDescripcion((e.target.value || "").slice(0, MAX_DESCRIPCION))
              }
              maxLength={MAX_DESCRIPCION}
              placeholder="Ej. Cafetera Oster de 8 tazas"
              rows={3}
              className="mt-1 block h-24 w-full resize-none rounded-md border border-gray-300 p-3 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            <p className="mt-1 text-right text-xs text-gray-500 dark:text-gray-400">
              {descripcion.length}/{MAX_DESCRIPCION}
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={enviando}
              className={`flex-1 rounded-md px-4 py-2 font-bold text-white transition ${
                enviando
                  ? "bg-gray-400"
                  : modoEdicion
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {enviando
                ? "Procesando..."
                : modoEdicion
                  ? "Actualizar"
                  : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </PageShell>
  );
}
