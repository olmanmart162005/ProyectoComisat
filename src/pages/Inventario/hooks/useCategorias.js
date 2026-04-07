import { useEffect, useState } from "react";
import { db } from "../../../firebase/firebase";
import { collection, deleteDoc, doc, getDocs } from "firebase/firestore";
import { sileo } from "sileo";

export function useCategorias() {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCategorias = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "categoria"));
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
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
    if (
      window.confirm("¿Estás seguro de que deseas eliminar esta categoría?")
    ) {
      try {
        await deleteDoc(doc(db, "categoria", id));
        fetchCategorias();
        sileo.success("Categoría eliminada");
      } catch (error) {
        console.error("Error al eliminar", error);
        sileo.error("Error al eliminar");
      }
    }
  };

  return {
    categorias,
    loading,
    fetchCategorias,
    handleEliminar,
  };
}
