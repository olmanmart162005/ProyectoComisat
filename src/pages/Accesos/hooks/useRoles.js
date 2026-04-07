import { useEffect, useState } from "react";
import { db } from "../../../firebase/firebase";
import { collection, deleteDoc, doc, getDocs } from "firebase/firestore";
import { sileo } from "sileo";
import { registrarBitacora } from "../../../services/bitacora";

export function useRoles({ user, nombreEmpleado }) {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "roles"));
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setRoles(docs);
    } catch (error) {
      console.error("Error al cargar roles:", error);
      sileo.error("No se pudieron cargar los roles.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleEliminar = async (id) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este rol?")) {
      try {
        const rolAEliminar = roles.find((r) => r.id === id);
        await deleteDoc(doc(db, "roles", id));
        await registrarBitacora({
          usuario: user.email,
          nombre: nombreEmpleado,
          coleccion: "roles",
          accion: "eliminacion",
          docId: id,
          metadata: {
            nombre: rolAEliminar?.nombre,
          },
        });
        fetchRoles();
        sileo.success("Rol eliminado");
      } catch (error) {
        console.error("Error al eliminar", error);
        sileo.error("Error al eliminar");
      }
    }
  };

  return {
    roles,
    loading,
    fetchRoles,
    handleEliminar,
  };
}
