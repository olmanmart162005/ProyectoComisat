import { useCallback, useEffect, useMemo, useState } from "react";
import { db, storage } from "../../../firebase/firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { registrarBitacora } from "../../../services/bitacora";
import { notify } from "../../../services/notifier";
import {
  MAX_DESCRIPCION,
  getEstadoProducto,
  sanitizeDescripcionProducto,
  sanitizeNombreProducto,
} from "../../../utils/productoUtils";
export function useProductos({ user, nombreEmpleado, cargarProductos = true }) {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [porcentajeAumento, setPorcentajeAumento] = useState(0);
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroEstadoProducto, setFiltroEstadoProducto] = useState("");
  const [filtroStockRange, setFiltroStockRange] = useState([
    undefined,
    undefined,
  ]);
  const fetchConfig = useCallback(async () => {
    try {
      const snap = await getDoc(doc(db, "configuracion", "creditoComisariato"));
      if (snap.exists()) {
        const data = snap.data();
        setPorcentajeAumento(Number(data.porcentajeAumento) || 0);
      }
    } catch (error) {
      console.error("Error al cargar configuración:", error);
    }
  }, []);
  const fetchCategorias = useCallback(async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "categoria"));
      const docs = querySnapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }));
      setCategorias(docs);
    } catch (error) {
      console.error("Error al cargar categorías:", error);
      notify.loadError("las categorías");
    }
  }, []);
  const fetchProductos = useCallback(async () => {
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
      notify.loadError("los productos");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    fetchConfig();
    fetchCategorias();
    if (cargarProductos) {
      fetchProductos();
    }
  }, [cargarProductos, fetchConfig, fetchCategorias, fetchProductos]);
  const totalProductos = productos.length;
  const productosActivos = productos.filter(
    (p) => getEstadoProducto(p.stock, p.stockMinimo, p.estado) === "Activo",
  ).length;
  const productosAgotados = productos.filter(
    (p) => getEstadoProducto(p.stock, p.stockMinimo, p.estado) === "Agotado",
  ).length;
  const stockTotal = productos.reduce(
    (acc, p) => acc + (Number(p.stock) || 0),
    0,
  );
  const productosFiltrados = useMemo(() => {
    return productos.filter((p) => {
      const estadoVisual = getEstadoProducto(p.stock, p.stockMinimo, p.estado);
      const coincideEstado = filtroEstadoProducto
        ? estadoVisual === filtroEstadoProducto
        : true;
      const coincideCategoria = filtroCategoria
        ? p.categoriaId === filtroCategoria
        : true;
      const stockNum = Number(p.stock) || 0;
      const [stockMin, stockMax] = filtroStockRange;
      const coincideStockMin =
        stockMin === undefined ? true : stockNum >= stockMin;
      const coincideStockMax =
        stockMax === undefined ? true : stockNum <= stockMax;
      return (
        coincideEstado &&
        coincideCategoria &&
        coincideStockMin &&
        coincideStockMax
      );
    });
  }, [productos, filtroCategoria, filtroEstadoProducto, filtroStockRange]);
  const textoFiltrosPdf = useMemo(() => {
    const partes = [];
    if (filtroCategoria) {
      const cat = categorias.find((c) => c.id === filtroCategoria);
      partes.push(`Categoría: ${cat ? cat.nombre : filtroCategoria}`);
    }
    if (filtroEstadoProducto) {
      partes.push(`Estado: ${filtroEstadoProducto}`);
    }
    const [stockMin, stockMax] = filtroStockRange;
    if (stockMin !== undefined || stockMax !== undefined) {
      const minLabel = stockMin !== undefined ? stockMin : "-";
      const maxLabel = stockMax !== undefined ? stockMax : "-";
      partes.push(`Stock: ${minLabel} a ${maxLabel}`);
    }
    return partes.length > 0
      ? `Filtros activos: ${partes.join(" | ")}`
      : "Catálogo Completo";
  }, [filtroCategoria, categorias, filtroEstadoProducto, filtroStockRange]);
  const validarPayloadProducto = ({
    nombre,
    descripcion,
    precioContado,
    stock,
    stockMinimo,
    categoriaId,
    archivoImagen,
    imagenUrlActual,
  }) => {
    const nombreSanitizado = sanitizeNombreProducto(nombre);
    const descripcionSanitizada = sanitizeDescripcionProducto(descripcion);
    const stockTexto = String(stock ?? "").trim();
    const stockMinimoTexto = String(stockMinimo ?? "").trim();
    if (!nombreSanitizado.trim()) {
      notify.error("El nombre del producto es obligatorio.");
      return false;
    }
    if (!descripcionSanitizada.trim()) {
      notify.error("La descripción del producto es obligatoria.");
      return false;
    }
    if (descripcionSanitizada.length > MAX_DESCRIPCION) {
      notify.error(
        `La descripción no puede superar ${MAX_DESCRIPCION} caracteres.`,
      );
      return false;
    }
    if (!categoriaId) {
      notify.error("Selecciona una categoría válida.");
      return false;
    }
    const precioContadoNum = Number(precioContado);
    if (!Number.isFinite(precioContadoNum) || precioContadoNum <= 0) {
      notify.error("El costo debe ser un número mayor que 0.");
      return false;
    }
    if (stockTexto === "") {
      notify.error("El stock actual es obligatorio.");
      return false;
    }
    if (stockMinimoTexto === "") {
      notify.error("El stock mínimo es obligatorio.");
      return false;
    }
    const stockNum = Number(stockTexto);
    const stockMinimoNum = Number(stockMinimoTexto);
    if (!Number.isInteger(stockNum) || stockNum <= 0) {
      notify.error("El stock actual debe ser un número entero mayor que 0.");
      return false;
    }
    if (!Number.isInteger(stockMinimoNum) || stockMinimoNum < 0) {
      notify.error(
        "El stock mínimo debe ser un número entero mayor o igual a 0.",
      );
      return false;
    }
    if (!archivoImagen && !imagenUrlActual) {
      notify.error("La imagen del producto es obligatoria.");
      return false;
    }
    return true;
  };
  const subirImagen = async (archivo) => {
    const imagenRef = ref(storage, `productos/${Date.now()}_${archivo.name}`);
    await uploadBytes(imagenRef, archivo);
    return getDownloadURL(imagenRef);
  };
  const guardarProducto = async ({
    nombre,
    descripcion,
    precioContado,
    stock,
    stockMinimo,
    categoriaId,
    categoriaNombre,
    estado,
    archivoImagen,
    porcentajeAumento: porcentajeAumentoForm = porcentajeAumento,
    onSuccess,
  }) => {
    if (
      !validarPayloadProducto({
        nombre,
        descripcion,
        precioContado,
        stock,
        stockMinimo,
        categoriaId,
        archivoImagen,
      })
    ) {
      return;
    }
    try {
      const nombreSanitizado = sanitizeNombreProducto(nombre).trim();
      const descripcionSanitizada =
        sanitizeDescripcionProducto(descripcion).trim();
      const imagenUrl = await subirImagen(archivoImagen);
      const precioContadoNum = Number(precioContado);
      const stockNum = Number(String(stock ?? "").trim());
      const stockMinimoNum = Number(String(stockMinimo ?? "").trim());
      const precioCreditoNum = Number(
        (precioContadoNum * (1 + Number(porcentajeAumentoForm || 0))).toFixed(
          2,
        ),
      );
      const estadoFinal = getEstadoProducto(stockNum, stockMinimoNum, estado);
      const docRef = await addDoc(collection(db, "productos"), {
        nombre: nombreSanitizado,
        descripcion: descripcionSanitizada,
        precioContado: precioContadoNum,
        precioCredito: precioCreditoNum,
        stock: stockNum,
        stockMinimo: stockMinimoNum,
        categoriaId,
        categoriaNombre,
        estado: estadoFinal,
        imagenUrl,
        fechaRegistro: serverTimestamp(),
        ultimaModificacion: serverTimestamp(),
      });
      await registrarBitacora({
        usuario: user?.email ?? "desconocido",
        nombre: nombreEmpleado || user?.email || "desconocido",
        coleccion: "productos",
        accion: "creacion",
        docId: docRef.id,
        metadata: {
          nombre: nombreSanitizado,
          categoriaNombre,
          precioContado: precioContadoNum,
          precioCredito: precioCreditoNum,
          stock: stockNum,
          stockMinimo: stockMinimoNum,
          estado: estadoFinal,
        },
      });
      notify.created("Producto");
      await onSuccess?.();
    } catch (error) {
      console.error("Error al guardar producto:", error);
      notify.saveError("el producto");
    }
  };
  const actualizarProducto = async ({
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
    porcentajeAumento: porcentajeAumentoForm = porcentajeAumento,
    onSuccess,
  }) => {
    if (!editandoId) return;
    if (
      !validarPayloadProducto({
        nombre,
        descripcion,
        precioContado,
        stock,
        stockMinimo,
        categoriaId,
        archivoImagen,
        imagenUrlActual,
      })
    ) {
      return;
    }
    try {
      let imagenUrl = imagenUrlActual || "";
      if (archivoImagen) {
        imagenUrl = await subirImagen(archivoImagen);
      }
      const precioContadoNum = Number(precioContado);
      const stockNum = Number(String(stock ?? "").trim());
      const stockMinimoNum = Number(String(stockMinimo ?? "").trim());
      const precioCreditoNum = Number(
        (precioContadoNum * (1 + Number(porcentajeAumentoForm || 0))).toFixed(
          2,
        ),
      );
      const estadoFinal = getEstadoProducto(stockNum, stockMinimoNum, estado);
      const datosActualizados = {
        nombre: sanitizeNombreProducto(nombre).trim(),
        descripcion: sanitizeDescripcionProducto(descripcion).trim(),
        precioContado: precioContadoNum,
        precioCredito: precioCreditoNum,
        stock: stockNum,
        stockMinimo: stockMinimoNum,
        categoriaId,
        categoriaNombre,
        estado: estadoFinal,
        imagenUrl,
        ultimaModificacion: serverTimestamp(),
      };
      await updateDoc(doc(db, "productos", editandoId), datosActualizados);
      await registrarBitacora({
        usuario: user?.email ?? "desconocido",
        nombre: nombreEmpleado || user?.email || "desconocido",
        coleccion: "productos",
        accion: "actualizacion",
        docId: editandoId,
        metadata: {
          nombreAnterior: editandoData?.nombre,
          nombreNuevo: datosActualizados.nombre,
          categoriaAnterior: editandoData?.categoriaNombre,
          categoriaNueva: datosActualizados.categoriaNombre,
          precioContadoAnterior: editandoData?.precioContado,
          precioContadoNuevo: datosActualizados.precioContado,
          precioCreditoAnterior: editandoData?.precioCredito,
          precioCreditoNuevo: datosActualizados.precioCredito,
          stockAnterior: editandoData?.stock,
          stockNuevo: datosActualizados.stock,
          stockMinimoAnterior: editandoData?.stockMinimo,
          stockMinimoNuevo: datosActualizados.stockMinimo,
          estadoAnterior: editandoData?.estado,
          estadoNuevo: datosActualizados.estado,
          imagenActualizada: Boolean(archivoImagen),
        },
      });
      notify.updated("Producto");
      await onSuccess?.();
    } catch (error) {
      console.error("Error al actualizar producto:", error);
      notify.updateError("el producto");
    }
  };
  const handleEliminar = async (id) => {
    try {
      const productoAEliminar = productos.find((p) => p.id === id);
      if (productoAEliminar) {
        await addDoc(collection(db, "historialProductos"), {
          nombre: productoAEliminar.nombre,
          descripcion: productoAEliminar.descripcion,
          categoriaId: productoAEliminar.categoriaId,
          categoriaNombre: productoAEliminar.categoriaNombre,
          precioContado: productoAEliminar.precioContado,
          precioCredito: productoAEliminar.precioCredito,
          stockMinimo: productoAEliminar.stockMinimo,
          fechaRegistro: productoAEliminar.fechaRegistro,
          productoId: id,
          fechaBaja: serverTimestamp(),
          bajadoPor: user?.email,
          nombreBajadoPor: nombreEmpleado,
        });
      }
      await deleteDoc(doc(db, "productos", id));
      await registrarBitacora({
        usuario: user?.email ?? "desconocido",
        nombre: nombreEmpleado || user?.email || "desconocido",
        coleccion: "productos",
        accion: "eliminacion",
        docId: id,
        metadata: {
          nombre: productoAEliminar?.nombre,
          categoriaNombre: productoAEliminar?.categoriaNombre,
          precioContado: productoAEliminar?.precioContado,
        },
      });
      await fetchProductos();
      notify.info("Producto eliminado y movido al historial.");
      return true;
    } catch (error) {
      console.error("Error al eliminar", error);
      notify.deleteError("el producto");
      return false;
    }
  };
  return {
    productos,
    categorias,
    loading,
    porcentajeAumento,
    totalProductos,
    productosActivos,
    productosAgotados,
    stockTotal,
    productosFiltrados,
    textoFiltrosPdf,
    filtroCategoria,
    setFiltroCategoria,
    filtroEstadoProducto,
    setFiltroEstadoProducto,
    filtroStockRange,
    setFiltroStockRange,
    fetchProductos,
    handleEliminar,
    guardarProducto,
    actualizarProducto,
    getEstadoProducto,
  };
}