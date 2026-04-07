import { useEffect, useMemo, useState } from "react";
import { db } from "../../../firebase/firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { sileo } from "sileo";
import { registrarBitacora } from "../../../services/bitacora";

// Este hook maneja toda la lógica relacionada con productos: carga, filtrado, eliminación, etc.

export function useProductos({ user, nombreEmpleado }) {
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

  const getEstadoVisualProducto = (producto) => {
    if (producto.estado === "Inactivo") return "Inactivo";
    return Number(producto.stock) === Number(producto.stockMinimo)
      ? "Agotado"
      : "Activo";
  };

  const fetchConfig = async () => {
    try {
      const snap = await getDoc(doc(db, "configuracion", "creditoComisariato"));
      if (snap.exists()) {
        const data = snap.data();
        setPorcentajeAumento(Number(data.porcentajeAumento) || 0);
      }
    } catch (error) {
      console.error("Error al cargar configuración:", error);
    }
  };

  const fetchCategorias = async () => {
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
      sileo.error("No se pudieron cargar los productos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
    fetchCategorias();
    fetchProductos();
  }, []);

  const totalProductos = productos.length;
  const productosActivos = productos.filter(
    (p) => getEstadoVisualProducto(p) === "Activo",
  ).length;
  const stockTotal = productos.reduce(
    (acc, p) => acc + (Number(p.stock) || 0),
    0,
  );

  // Lógica de filtrado
  const productosFiltrados = useMemo(() => {
    return productos.filter((p) => {
      const estadoVisual = getEstadoVisualProducto(p);
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
  };
}
