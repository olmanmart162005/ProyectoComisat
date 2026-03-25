import { useEffect, useMemo, useState } from "react";
import { db, storage } from "../firebase/firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

import DataTable from "../components/ui/table/DataTable";
import Badge from "../components/ui/badge/Badge";
import { useModal } from "../hooks/useModal";
import { Modal } from "../components/ui/modal";
import {
  BoxIconLine,
  CheckCircleIcon,
  CloseIcon,
  PencilIcon,
  TrashBinIcon,
} from "../icons";
import MetricCard from "../components/common/MetricCard";

export default function Productos() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editandoId, setEditandoId] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precioContado, setPrecioContado] = useState("");
  const [precioCredito, setPrecioCredito] = useState("");
  const [stock, setStock] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [categoriaNombre, setCategoriaNombre] = useState("");
  const [estado, setEstado] = useState("Activo");

  const [archivoImagen, setArchivoImagen] = useState(null);
  const [previewImagen, setPreviewImagen] = useState(null);
  const [imagenUrlActual, setImagenUrlActual] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("");
  const [stockFiltro, setStockFiltro] = useState("");

  const { isOpen, openModal, closeModal } = useModal();

  //contandores
  const totalProductos = productos.length;
  const productosActivos = productos.filter(
    (p) => p.estado === "Activo",
  ).length;
  const stockTotal = productos.reduce(
    (acc, p) => acc + (Number(p.stock) || 0),
    0,
  );

  // Filtrar productos
  const productosFiltrados = useMemo(() => {
    return productos.filter((p) => {
      const cumpleCategoria =
        !categoriaFiltro || p.categoriaId === categoriaFiltro;
      const cumpleStock =
        stockFiltro === ""
          ? true
          : stockFiltro === "bajo"
            ? Number(p.stock) <= 5
            : stockFiltro === "medio"
              ? Number(p.stock) > 5 && Number(p.stock) <= 15
              : stockFiltro === "alto"
                ? Number(p.stock) > 15
                : true;

      return cumpleCategoria && cumpleStock;
    });
  }, [productos, categoriaFiltro, stockFiltro]);

  const fetchCategorias = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "categoria"));
      const docs = querySnapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }));
      setCategorias(docs);
      if (docs.length > 0) {
        setCategoriaId(docs[0].id);
        setCategoriaNombre(docs[0].nombre || "");
      }
    } catch (error) {
      console.error("Error al cargar categorías:", error);
      alert("No se pudieron cargar las categorías.");
    }
  };

  const fetchProductos = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "productos"));
      const docs = querySnapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }));
      setProductos(docs);
    } catch (error) {
      console.error("Error al cargar productos:", error);
      alert("No se pudieron cargar los productos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategorias();
    fetchProductos();
  }, []);

  const handleCategoriaChange = (e) => {
    const selectedId = e.target.value;
    const selectedCat = categorias.find((c) => c.id === selectedId);
    setCategoriaId(selectedId);
    setCategoriaNombre(selectedCat ? selectedCat.nombre || "" : "");
  };

  // Maneja la selección de imagen y genera preview
  const handleImagenChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setArchivoImagen(file);
    setPreviewImagen(URL.createObjectURL(file));
  };

  // Sube la imagen a Firebase Storage y devuelve la URL pública
  const subirImagen = async (archivo) => {
    const storageRef = ref(storage, `productos/${Date.now()}_${archivo.name}`);
    await uploadBytes(storageRef, archivo);
    return await getDownloadURL(storageRef);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);
    try {
      let imagenUrl = "";
      if (archivoImagen) {
        imagenUrl = await subirImagen(archivoImagen);
      }

      await addDoc(collection(db, "productos"), {
        nombre,
        descripcion,
        precioContado: parseFloat(precioContado),
        precioCredito: parseFloat(precioCredito),
        stock: parseInt(stock),
        categoriaId,
        categoriaNombre,
        estado,
        imagenUrl,
        fechaRegistro: serverTimestamp(),
      });
      resetFormulario();
      fetchProductos();
      alert("Producto creado con éxito");
      closeModal();
    } catch (error) {
      console.error("Error al guardar", error);
      alert("Error al guardar");
    } finally {
      setEnviando(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setEnviando(true);
    try {
      // Si subió una imagen nueva, la sube; si no, conserva la anterior
      let imagenUrl = imagenUrlActual;
      if (archivoImagen) {
        imagenUrl = await subirImagen(archivoImagen);
      }

      await updateDoc(doc(db, "productos", editandoId), {
        nombre,
        descripcion,
        precioContado: parseFloat(precioContado),
        precioCredito: parseFloat(precioCredito),
        stock: parseInt(stock),
        categoriaId,
        categoriaNombre,
        estado,
        imagenUrl,
        ultima_modificacion: serverTimestamp(),
      });
      resetFormulario();
      fetchProductos();
      alert("Producto actualizado");
      closeModal();
    } catch (error) {
      console.error("Error al actualizar", error);
      alert("Error al actualizar");
    } finally {
      setEnviando(false);
    }
  };

  const handleEliminar = async (id) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este producto?")) {
      try {
        await deleteDoc(doc(db, "productos", id));
        fetchProductos();
        alert("Producto eliminado");
      } catch (error) {
        console.error("Error al eliminar", error);
        alert("Error al eliminar");
      }
    }
  };

  const resetFormulario = () => {
    setEditandoId(null);
    setNombre("");
    setDescripcion("");
    setPrecioContado("");
    setPrecioCredito("");
    setStock("");
    setEstado("Activo");
    setArchivoImagen(null);
    setPreviewImagen(null);
    setImagenUrlActual("");
    if (categorias.length > 0) {
      setCategoriaId(categorias[0].id);
      setCategoriaNombre(categorias[0].nombre || "");
    }
  };

  // ── Columnas ──────────────────────────────────────────────────────
  const columns = useMemo(
    () => [
      {
        id: "imagen",
        header: "Imagen",
        enableSorting: false,
        cell: ({ row }) => {
          const url = row.original.imagenUrl;
          return url ? (
            <img
              src={url}
              alt={row.original.nombre}
              className="w-10 h-10 rounded-lg object-cover border border-gray-200 dark:border-white/10"
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center">
              <span className="text-gray-400 text-xs">N/A</span>
            </div>
          );
        },
      },
      {
        accessorKey: "nombre",
        header: "Nombre",
        cell: (info) => (
          <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
            {info.getValue()}
          </span>
        ),
      },
      { accessorKey: "descripcion", header: "Descripción" },
      { accessorKey: "categoriaNombre", header: "Categoría" },
      {
        accessorKey: "precioContado",
        header: "P. Contado",
        cell: (info) => `L. ${Number(info.getValue()).toLocaleString("es-HN")}`,
      },
      {
        accessorKey: "precioCredito",
        header: "P. Crédito",
        cell: (info) => `L. ${Number(info.getValue()).toLocaleString("es-HN")}`,
      },
      {
        accessorKey: "stock",
        header: "Stock",
        cell: (info) => {
          const val = Number(info.getValue());
          return (
            <span className={val <= 5 ? "text-red-500 font-semibold" : ""}>
              {val}
            </span>
          );
        },
      },
      {
        accessorKey: "estado",
        header: "Estado",
        cell: (info) => {
          const val = info.getValue();
          return (
            <Badge size="sm" color={val === "Activo" ? "success" : "error"}>
              {val}
            </Badge>
          );
        },
      },
      {
        id: "acciones",
        header: "Acciones",
        enableSorting: false,
        cell: ({ row }) => {
          const p = row.original;
          return (
            <div className="flex justify-center gap-3">
              <button
                onClick={() => {
                  setEditandoId(p.id);
                  setNombre(p.nombre || "");
                  setDescripcion(p.descripcion || "");
                  setPrecioContado(String(p.precioContado || ""));
                  setPrecioCredito(String(p.precioCredito || ""));
                  setStock(String(p.stock || ""));
                  setCategoriaId(p.categoriaId || "");
                  setCategoriaNombre(p.categoriaNombre || "");
                  setEstado(p.estado || "Activo");
                  setImagenUrlActual(p.imagenUrl || "");
                  setPreviewImagen(p.imagenUrl || null);
                  setArchivoImagen(null);
                  openModal();
                }}
                className="text-blue-600 hover:text-blue-800 transition"
              >
                <PencilIcon className="w-5 h-5 mx-auto" />
              </button>
              <button
                onClick={() => handleEliminar(p.id)}
                className="text-red-500 hover:text-red-700 transition"
              >
                <TrashBinIcon className="w-5 h-5 mx-auto" />
              </button>
            </div>
          );
        },
      },
    ],
    [categorias],
  );
  // ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ── Encabezado ── */}
      <div className="flex sm:justify-between flex-col sm:flex-row gap-4 items-start sm:items-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">
          Productos
        </h2>
        <button
          onClick={() => {
            resetFormulario();
            openModal();
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-lg shadow-sm transition flex items-center gap-2"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          Nuevo Producto
        </button>
      </div>

      {/* ── Métricas ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:gap-6">
        <MetricCard
          title="Total Productos"
          value={totalProductos}
          icon={
            <BoxIconLine className="text-gray-800 size-6 dark:text-white/90" />
          }
          iconWrapperClass="bg-gray-100 dark:bg-gray-800"
        />
        <MetricCard
          title="Productos Activos"
          value={productosActivos}
          icon={
            <CheckCircleIcon className="text-green-600 size-6 dark:text-green-400" />
          }
          iconWrapperClass="bg-green-50 dark:bg-green-500/10"
        />
        <MetricCard
          title="Stock Total"
          value={stockTotal}
          icon={
            <CloseIcon className="text-blue-600 size-6 dark:text-blue-400" />
          }
          iconWrapperClass="bg-blue-50 dark:bg-blue-500/10"
        />
      </div>

      {/* ── Modal Crear / Editar ── */}
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-3xl">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-6 text-gray-800 dark:text-white/90">
            {editandoId ? "Editando Producto" : "Registrar Nuevo Producto"}
          </h2>
          <form
            onSubmit={editandoId ? handleUpdate : handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-5"
          >
            {/* Nombre */}
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

            {/* Categoría */}
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

            {/* Descripción — ocupa 2 columnas */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">
                Descripción
              </label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Ej. Cafetera Oster de 8 tazas"
                rows={2}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white resize-none"
              />
            </div>

            {/* Precio Contado */}
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

            {/* Precio Crédito */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">
                Precio Crédito (L.)
              </label>
              <input
                type="number"
                required
                min="0"
                value={precioCredito}
                onChange={(e) => {
                  if (e.target.value === "" || Number(e.target.value) >= 0)
                    setPrecioCredito(e.target.value);
                }}
                placeholder="3600"
                className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              />
            </div>

            {/* Stock */}
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

            {/* Estado */}
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
                  value="Inactivo"
                  className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  Inactivo
                </option>
              </select>
            </div>

            {/* Imagen — ocupa 2 columnas */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">
                Imagen del Producto
              </label>
              <div className="mt-1 flex items-center gap-4">
                {/* Preview */}
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

            {/* Botón submit */}
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

      {/* ── Tabla con Filtros ── */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <select
            value={categoriaFiltro}
            onChange={(e) => setCategoriaFiltro(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-900 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
          >
            <option value="">Categorías</option>
            {categorias.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.nombre}
              </option>
            ))}
          </select>

          <select
            value={stockFiltro}
            onChange={(e) => setStockFiltro(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-900 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
          >
            <option value="">Stock</option>
            <option value="bajo">Bajo (≤ 5)</option>
            <option value="medio">Medio (6 - 15)</option>
            <option value="alto">Alto ({`> 15`})</option>
          </select>

          {(categoriaFiltro || stockFiltro) && (
            <button
              onClick={() => {
                setCategoriaFiltro("");
                setStockFiltro("");
              }}
              className="px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.06] transition"
            >
              Limpiar
            </button>
          )}
        </div>

        <DataTable
          columns={columns}
          data={productosFiltrados}
          loading={loading}
          searchPlaceholder="Buscar producto..."
        />
      </div>
    </div>
  );
}
