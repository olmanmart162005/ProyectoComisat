import { useEffect, useState } from "react";
import { useAuth } from "../../../auth/AuthProvider";
import { db } from "../../../firebase/firebase";
import { collection, deleteDoc, doc, getDocs } from "firebase/firestore";
import { sileo } from "sileo";
import { registrarBitacora } from "../../../services/bitacora";
import { useNombreEmpleadoActual } from "../../../hooks/useNombreEmpleadoActual";

// Este hook maneja toda la lógica relacionada con categorías: carga, eliminación, etc.

export function useCategorias({ user, nombreEmpleado } = {}) {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user: authUser } = useAuth();
  const nombreEmpleadoActual = useNombreEmpleadoActual();
  const usuarioActual = user ?? authUser;
  const empleadoActual = nombreEmpleado ?? nombreEmpleadoActual;

  const fetchCategorias = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "categoria"));

      let cantidadPorCategoria = {};
      try {
        const productosSnap = await getDocs(collection(db, "productos"));
        cantidadPorCategoria = productosSnap.docs.reduce((acc, productoDoc) => {
          const producto = productoDoc.data();
          const categoriaId = producto.categoriaId;

          if (categoriaId) {
            acc[categoriaId] = (acc[categoriaId] ?? 0) + 1;
          }

          return acc;
        }, {});
      } catch (error) {
        console.error("Error al cargar productos asociados:", error);
      }

      const docs = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        cantidadProductos: cantidadPorCategoria[d.id] ?? 0,
      }));
      setCategorias(docs);
    } catch (error) {
      console.error("Error al cargar categorías:", error);
      sileo.error("No se pudieron cargar las categorías.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategorias();
  }, []);

  const handleEliminar = async (id) => {
    try {
      const categoriaAEliminar = categorias.find((c) => c.id === id);

      await deleteDoc(doc(db, "categoria", id));

      await registrarBitacora({
        usuario: usuarioActual?.email ?? "desconocido",
        nombre: empleadoActual || usuarioActual?.email || "desconocido",
        coleccion: "categoria",
        accion: "eliminacion",
        docId: id,
        metadata: {
          nombre: categoriaAEliminar?.nombre,
        },
      });

      fetchCategorias();
      sileo.success("Categoría eliminada");
      return true;
    } catch (error) {
      console.error("Error al eliminar", error);
      sileo.error("Error al eliminar");
      return false;
    }
  };

  return {
    categorias,
    loading,
    fetchCategorias,
    handleEliminar,
  };
}
