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
import { sileo } from "sileo";
import { registrarBitacora } from "../../../services/bitacora";
import { MAX_DESCRIPCION, getEstadoProducto } from "../productoUtils";

// Este hook maneja toda la lógica relacionada con productos: carga, filtrado, eliminación, etc.

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
      sileo.error("No se pudieron cargar las categorías.");
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
      sileo.error("No se pudieron cargar los productos.");
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
  const stockTotal = productos.reduce(
    (acc, p) => acc + (Number(p.stock) || 0),
    0,
  );

  // Lógica de filtrado
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
  // ------------------------------------------------------------
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
    if (!archivoImagen) {
      sileo.error("La imagen del producto es obligatoria.");
      return;
    }

    if ((descripcion || "").length > MAX_DESCRIPCION) {
      sileo.error(
        `La descripción no puede superar ${MAX_DESCRIPCION} caracteres.`,
      );
      return;
    }

    const imagenUrl = await subirImagen(archivoImagen);
    const precioContadoNum = Number(precioContado) || 0;
    const precioCreditoNum = Number(
      (precioContadoNum * (1 + Number(porcentajeAumentoForm || 0))).toFixed(2),
    );
    const estadoFinal = getEstadoProducto(stock, stockMinimo, estado);

    const docRef = await addDoc(collection(db, "productos"), {
      nombre: nombre.trim(),
      descripcion: (descripcion || "").slice(0, MAX_DESCRIPCION),
      precioContado: precioContadoNum,
      precioCredito: precioCreditoNum,
      stock: Number(stock) || 0,
      stockMinimo: Number(stockMinimo) || 0,
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
        nombre: nombre.trim(),
        categoriaNombre,
        precioContado: precioContadoNum,
        precioCredito: precioCreditoNum,
        stock: Number(stock) || 0,
        stockMinimo: Number(stockMinimo) || 0,
        estado: estadoFinal,
      },
    });

    sileo.success("Producto creado con éxito");
    await onSuccess?.();
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

    if ((descripcion || "").length > MAX_DESCRIPCION) {
      sileo.error(
        `La descripción no puede superar ${MAX_DESCRIPCION} caracteres.`,
      );
      return;
    }

    let imagenUrl = imagenUrlActual || "";
    if (archivoImagen) {
      imagenUrl = await subirImagen(archivoImagen);
    }

    const precioContadoNum = Number(precioContado) || 0;
    const precioCreditoNum = Number(
      (precioContadoNum * (1 + Number(porcentajeAumentoForm || 0))).toFixed(2),
    );
    const estadoFinal = getEstadoProducto(stock, stockMinimo, estado);

    const datosActualizados = {
      nombre: nombre.trim(),
      descripcion: (descripcion || "").slice(0, MAX_DESCRIPCION),
      precioContado: precioContadoNum,
      precioCredito: precioCreditoNum,
      stock: Number(stock) || 0,
      stockMinimo: Number(stockMinimo) || 0,
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

    sileo.success("Producto actualizado con éxito");
    await onSuccess?.();
  };

  const handleEliminar = async (id) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este producto?")) {
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
          usuario: user?.email,
          nombre: nombreEmpleado,
          coleccion: "productos",
          accion: "eliminacion",
          docId: id,
          metadata: {
            nombre: productoAEliminar?.nombre,
            categoriaNombre: productoAEliminar?.categoriaNombre,
            precioContado: productoAEliminar?.precioContado,
          },
        });

        fetchProductos();
        sileo.info("Producto eliminado y movido al historial");
      } catch (error) {
        console.error("Error al eliminar", error);
        sileo.error("Error al eliminar");
      }
    }
  };

  return {
    productos,
    categorias,
    loading,
    porcentajeAumento,
    totalProductos,
    productosActivos,
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
