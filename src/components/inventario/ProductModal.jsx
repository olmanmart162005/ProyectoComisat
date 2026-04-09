import { useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Modal } from "../ui/modal";
import {
  MAX_DESCRIPCION,
  MAX_NOMBRE_PRODUCTO,
} from "../../utils/productoUtils";

const formatMoney = (value) => {
  const num = Number(value);
  if (Number.isNaN(num)) return "—";
  return `L. ${num.toLocaleString("es-HN")}`;
};

const formatDateDisplay = (value) => {
  if (!value) return "—";
  try {
    const date = value.toDate ? value.toDate() : new Date(value);
    return date.toLocaleDateString("es-HN");
  } catch {
    return "—";
  }
};

const DetailItem = ({ label, value }) => (
  <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 dark:border-white/10 dark:bg-gray-900/40">
    <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
      {label}
    </p>
    <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90 break-words">
      {value || "—"}
    </p>
  </div>
);

export default function ProductModal({
  isOpen,
  onClose,
  editandoData,
  categorias,
  porcentajeAumento,
  user,
  nombreEmpleado,
  onSuccess,
  guardarProducto,
  actualizarProducto,
  soloVista = false,
}) {
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
  const [estado, setEstado] = useState("Activo");
  const [archivoImagen, setArchivoImagen] = useState(null);
  const [previewImagen, setPreviewImagen] = useState(null);
  const [imagenUrlActual, setImagenUrlActual] = useState("");

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

  const getEstadoProducto = (
    stockValue,
    stockMinimoValue,
    estadoBase = "Activo",
  ) => {
    if (estadoBase === "Inactivo") return "Inactivo";
    return Number(stockValue) === Number(stockMinimoValue)
      ? "Agotado"
      : "Activo";
  };

  const categoriaActual =
    categorias.find((cat) => cat.id === categoriaId)?.nombre ||
    categoriaNombre ||
    "—";

  const estadoVisual = getEstadoProducto(stock, stockMinimo, estado);

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
    if (categorias.length > 0) {
      setCategoriaId(categorias[0].id);
      setCategoriaNombre(categorias[0].nombre || "");
    } else {
      setCategoriaId("");
      setCategoriaNombre("");
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    if (editandoData) {
      setEditandoId(editandoData.id || null);
      setNombre(editandoData.nombre || "");
      setDescripcion(editandoData.descripcion || "");
      setPrecioContado(String(editandoData.precioContado || ""));
      setPrecioCredito(String(editandoData.precioCredito || ""));
      setStock(String(editandoData.stock || ""));
      setStockMinimo(String(editandoData.stockMinimo || ""));
      setCategoriaId(editandoData.categoriaId || "");
      setCategoriaNombre(editandoData.categoriaNombre || "");
      setEstado(editandoData.estado || "Activo");
      setImagenUrlActual(editandoData.imagenUrl || "");
      setPreviewImagen(editandoData.imagenUrl || null);
      setArchivoImagen(null);
      return;
    }

    resetFormulario();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editandoData, isOpen, categorias]);

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
  }, [stock, stockMinimo]);

  const handleCategoriaChange = (e) => {
    const selectedId = e.target.value;
    const selectedCat = categorias.find((c) => c.id === selectedId);
    setCategoriaId(selectedId);
    setCategoriaNombre(selectedCat ? selectedCat.nombre || "" : "");
  };

  const handleNombreChange = (e) => {
    setNombre((e.target.value || "").slice(0, MAX_NOMBRE_PRODUCTO));
  };

  const handleImagenChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setArchivoImagen(file);
    setPreviewImagen(URL.createObjectURL(file));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);
    try {
      if ((descripcion || "").length > MAX_DESCRIPCION) return;
      await guardarProducto?.({
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
        onSuccess,
        resetFormulario,
        onClose,
      });
    } finally {
      setEnviando(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setEnviando(true);
    try {
      if ((descripcion || "").length > MAX_DESCRIPCION) return;
      await actualizarProducto?.({
        editandoId,
        editandoData,
        nombre,
        descripcion,
        precioContado,
        stock,
        stockMinimo,
        categoriaId,
        categoriaNombre,
        estado,
        archivoImagen,
        imagenUrlActual,
        porcentajeAumento,
        onSuccess,
        resetFormulario,
        onClose,
      });
    } finally {
      setEnviando(false);
    }
  };

  if (soloVista) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} className="max-w-3xl">
        <div className="p-6">
          <div className="mb-6 pr-12">
            <div className="flex flex-col items-start gap-2">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">
                Detalle del Producto
              </h2>
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                  estadoVisual === "Activo"
                    ? "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500"
                    : estadoVisual === "Agotado"
                      ? "bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-orange-400"
                      : "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500"
                }`}
              >
                {estadoVisual}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Información general y comercial del producto.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="lg:col-span-1 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 dark:border-white/10 dark:bg-gray-900/40">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                Imagen
              </p>
              <div className="mt-2">
                {previewImagen ? (
                  <div className="flex min-h-56 items-center justify-center rounded-lg border border-gray-200 bg-white p-3 dark:border-white/10 dark:bg-white/[0.03]">
                    <img
                      src={previewImagen}
                      alt={nombre}
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

            <div className="lg:col-span-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DetailItem label="Nombre" value={nombre} />
              <DetailItem label="Categoría" value={categoriaActual} />
              <DetailItem label="Descripción" value={descripcion} />
              <DetailItem
                label="Precio Contado"
                value={formatMoney(
                  editandoData?.precioContado ?? precioContado,
                )}
              />
              <DetailItem
                label="Precio Crédito"
                value={formatMoney(
                  editandoData?.precioCredito ?? precioCredito,
                )}
              />
              <DetailItem label="Stock" value={stock} />
              <DetailItem label="Stock Mínimo" value={stockMinimo} />
              <DetailItem
                label="Fecha Registro"
                value={formatDateDisplay(editandoData?.fechaRegistro)}
              />
            </div>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-3xl">
      <div className="p-6">
        <h2 className="text-xl font-bold mb-6 text-gray-800 dark:text-white/90">
          {editandoId ? "Editando Producto" : "Registrar Nuevo Producto"}
        </h2>
        <form
          onSubmit={editandoId ? handleUpdate : handleSubmit}
          className="space-y-4"
        >
          {/* Fila 1: Imagen + Campos (Nombre, Categoría, Precios, Stock) */}
          <div className="grid grid-cols-3 gap-4">
            {/* Imagen y Descripción - Columna izquierda */}
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">
                Imagen del Producto
              </label>
              <div
                {...getRootProps()}
                className={`rounded-lg border-2 border-dashed transition cursor-pointer p-4 ${
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
                      alt="Preview"
                      className="max-h-64 w-auto max-w-full rounded-lg object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6">
                    <svg
                      className="w-10 h-10 text-gray-400 mb-2"
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
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      PNG, JPG, WebP
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Campos - Columna derecha */}
            <div className="col-span-2 grid grid-cols-2 gap-4">
              <div>
                <div className="mb-1 flex items-end justify-between gap-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Nombre
                  </label>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {nombre.length}/{MAX_NOMBRE_PRODUCTO}
                  </span>
                </div>
                <input
                  type="text"
                  required
                  value={nombre}
                  maxLength={MAX_NOMBRE_PRODUCTO}
                  onChange={handleNombreChange}
                  placeholder="Ej. Cafetera"
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Categoría
                </label>
                <select
                  value={categoriaId}
                  onChange={handleCategoriaChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm text-gray-900 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                >
                  {categorias.length === 0 ? (
                    <option disabled>Cargando categorías...</option>
                  ) : (
                    categorias.map((cat) => (
                      <option
                        key={cat.id}
                        value={cat.id}
                        className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      >
                        {cat.nombre}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Precio Contado (L.)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  required
                  min="0"
                  value={precioContado}
                  onChange={(e) => {
                    const valor = e.target.value.replace(",", ".");
                    if (/^\d*(?:\.\d{0,2})?$/.test(valor))
                      setPrecioContado(valor);
                  }}
                  placeholder="3500"
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Precio Crédito (L.)
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
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 cursor-not-allowed opacity-70 dark:border-gray-700"
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
                    if (e.target.value === "" || Number(e.target.value) >= 0)
                      setStock(e.target.value);
                  }}
                  placeholder="10"
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
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
                    if (e.target.value === "" || Number(e.target.value) >= 0)
                      setStockMinimo(e.target.value);
                  }}
                  placeholder="5"
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Fila 2: Descripción (Ancho completo) */}
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
              className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white resize-none h-24"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 text-right">
              {descripcion.length}/{MAX_DESCRIPCION}
            </p>
          </div>

          {/* Fila 3: Estado y Botón */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">
                Estado
              </label>
              <select
                value={estado === "Agotado" ? "Activo" : estado}
                onChange={(e) => setEstado(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm text-gray-900 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
              >
                <option
                  value="Activo"
                  className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  Activo
                </option>
                <option
                  value="Inactivo"
                  className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  Inactivo
                </option>
              </select>
            </div>

            <div></div>

            <button
              type="submit"
              disabled={enviando}
              className={`mt-6 p-2 rounded-md text-white font-bold transition ${
                enviando
                  ? "bg-gray-400"
                  : editandoId
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {enviando
                ? "Procesando..."
                : editandoId
                  ? "Actualizar"
                  : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
