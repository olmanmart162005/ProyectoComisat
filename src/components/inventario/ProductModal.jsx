import { useEffect, useState } from "react";
import { db, storage } from "../../firebase/firebase";
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { sileo } from "sileo";

import { Modal } from "../ui/modal";
import { registrarBitacora } from "../../services/bitacora";

export default function ProductModal({
  isOpen,
  onClose,
  editandoData,
  categorias,
  porcentajeAumento,
  user,
  nombreEmpleado,
  onSuccess,
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

  const getEstadoProducto = (
    stockValue,
    stockMinimoValue,
    estadoBase = "Activo",
  ) => {
    if (estadoBase === "Inactivo") return "Inactivo";
    return Number(stockValue) <= Number(stockMinimoValue)
      ? "Agotado"
      : "Activo";
  };

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
      setPrecioCredito("");
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

  const handleImagenChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setArchivoImagen(file);
    setPreviewImagen(URL.createObjectURL(file));
  };

  const subirImagen = async (archivo) => {
    const storageRef = ref(storage, `productos/${Date.now()}_${archivo.name}`);
    await uploadBytes(storageRef, archivo);
    return await getDownloadURL(storageRef);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);
    try {
      const stockMinimoNumero = parseInt(stockMinimo, 10);
      if (Number.isNaN(stockMinimoNumero) || stockMinimoNumero < 0) {
        sileo.error("Stock mínimo no puede ser menor que 0");
        return;
      }

      const contado = parseFloat(precioContado) || 0;
      const creditoCalculado = contado * (1 + porcentajeAumento);
      const estadoFinal = getEstadoProducto(stock, stockMinimo, estado);

      let imagenUrl = "";
      if (archivoImagen) {
        imagenUrl = await subirImagen(archivoImagen);
      }

      const nuevoDoc = await addDoc(collection(db, "productos"), {
        nombre,
        descripcion,
        precioContado: contado,
        precioCredito: parseFloat(creditoCalculado.toFixed(2)),
        stock: parseInt(stock),
        stockMinimo: stockMinimoNumero,
        categoriaId,
        categoriaNombre,
        estado: estadoFinal,
        imagenUrl,
        fechaRegistro: serverTimestamp(),
      });

      await registrarBitacora({
        usuario: user.email,
        nombre: nombreEmpleado,
        coleccion: "productos",
        accion: "creacion",
        docId: nuevoDoc.id,
        metadata: {
          nombre,
          categoriaNombre,
          stock: parseInt(stock),
          stockMinimo: stockMinimoNumero,
          estado: estadoFinal,
        },
      });

      await onSuccess?.();
      resetFormulario();
      sileo.success("Producto creado con éxito");
      onClose();
    } catch (error) {
      console.error("Error al guardar", error);
      sileo.error("Error al guardar");
    } finally {
      setEnviando(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setEnviando(true);
    try {
      const stockMinimoNumero = parseInt(stockMinimo, 10);
      if (Number.isNaN(stockMinimoNumero) || stockMinimoNumero < 0) {
        sileo.error("Stock mínimo no puede ser menor que 0");
        return;
      }

      const contado = parseFloat(precioContado) || 0;
      const creditoCalculado = contado * (1 + porcentajeAumento);
      const estadoFinal = getEstadoProducto(stock, stockMinimo, estado);

      let imagenUrl = imagenUrlActual;
      if (archivoImagen) {
        imagenUrl = await subirImagen(archivoImagen);
      }

      const productoAnterior = editandoData;

      await updateDoc(doc(db, "productos", editandoId), {
        nombre,
        descripcion,
        precioContado: contado,
        precioCredito: parseFloat(creditoCalculado.toFixed(2)),
        stock: parseInt(stock),
        stockMinimo: stockMinimoNumero,
        categoriaId,
        categoriaNombre,
        estado: estadoFinal,
        imagenUrl,
        ultimaModificacion: serverTimestamp(),
      });

      await registrarBitacora({
        usuario: user.email,
        nombre: nombreEmpleado,
        coleccion: "productos",
        accion: "actualizacion",
        docId: editandoId,
        metadata: {
          nombre,
          ...(productoAnterior?.stock !== parseInt(stock) && {
            stockAnterior: productoAnterior?.stock,
            stockNuevo: parseInt(stock),
          }),
          ...(productoAnterior?.stockMinimo !== parseInt(stockMinimo) && {
            stockMinimoAnterior: productoAnterior?.stockMinimo,
            stockMinimoNuevo: stockMinimoNumero,
          }),
          ...(productoAnterior?.estado !== estado && {
            estadoAnterior: productoAnterior?.estado,
            estadoNuevo: estadoFinal,
          }),
          ...(archivoImagen && {
            imagenActualizada: true,
          }),
        },
      });

      await onSuccess?.();
      resetFormulario();
      sileo.success({
        title: "Producto actualizado",
        description: "Los cambios se guardaron correctamente.",
      });
      onClose();
    } catch (error) {
      console.error("Error al actualizar", error);
      sileo.error("Error al actualizar");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-3xl">
      <div className="p-6">
        <h2 className="text-xl font-bold mb-6 text-gray-800 dark:text-white/90">
          {editandoId ? "Editando Producto" : "Registrar Nuevo Producto"}
        </h2>
        <form
          onSubmit={editandoId ? handleUpdate : handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-5"
        >
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

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">
              Descripción
            </label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              maxLength={150}
              placeholder="Ej. Cafetera Oster de 8 tazas"
              rows={2}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white resize-none"
            />
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
                if (e.target.value === "" || Number(e.target.value) >= 0)
                  setPrecioContado(e.target.value);
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
              type="number"
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

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">
              Estado
            </label>
            <select
              value={estado}
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
                value="Agotado"
                className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                Agotado
              </option>
              <option
                value="Inactivo"
                className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                Inactivo
              </option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">
              Imagen del Producto
            </label>
            <div className="mt-1 flex items-center gap-4">
              {previewImagen ? (
                <img
                  src={previewImagen}
                  alt="Preview"
                  className="w-16 h-16 rounded-lg object-cover border border-gray-200 dark:border-white/10 flex-shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-gray-100 dark:bg-white/5 border border-dashed border-gray-300 dark:border-white/10 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-6 h-6 text-gray-400"
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
                </div>
              )}
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImagenChange}
                  className="block w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100 dark:text-gray-400 dark:file:bg-blue-500/10 dark:file:text-blue-400"
                />
                {editandoId && !archivoImagen && (
                  <p className="text-xs text-gray-400 mt-1">
                    Deja vacío para conservar la imagen actual.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3 md:col-span-2 mt-2">
            <button
              type="submit"
              disabled={enviando}
              className={`flex-1 p-2 rounded-md text-white font-bold transition ${
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
