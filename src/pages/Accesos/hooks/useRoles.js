import { useEffect, useState } from "react";
import { db } from "../../../firebase/firebase";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { sileo } from "sileo";
import { registrarBitacora } from "../../../services/bitacora";

export function useRoles({ user, nombreEmpleado, cargarRoles = true }) {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(cargarRoles);

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
    if (cargarRoles) {
      fetchRoles();
    }
  }, []);

  const guardarRol = async ({ nombre, descripcion, onSuccess }) => {
    try {
      await addDoc(collection(db, "roles"), {
        nombre,
        descripcion,
        fechaRegistro: serverTimestamp(),
      });
      await registrarBitacora({
        usuario: user.email,
        nombre: nombreEmpleado,
        coleccion: "roles",
        accion: "creacion",
        metadata: {
          nombre,
          descripcion,
        },
      });
      await fetchRoles();
      sileo.success("Rol creado con éxito");
      onSuccess?.();
    } catch (error) {
      console.error("Error al guardar rol", error);
      sileo.error("Error al guardar el rol");
      throw error;
    }
  };

  const actualizarRol = async ({
    editandoId,
    nombre,
    descripcion,
    nombreAnterior,
    onSuccess,
  }) => {
    try {
      await updateDoc(doc(db, "roles", editandoId), {
        nombre,
        descripcion,
        ultimaModificacion: serverTimestamp(),
      });
      await registrarBitacora({
        usuario: user.email,
        nombre: nombreEmpleado,
        coleccion: "roles",
        accion: "actualizacion",
        docId: editandoId,
        metadata: {
          nombre,
          descripcion,
          ...(nombreAnterior !== nombre && {
            nombreAnterior,
            nombreNuevo: nombre,
          }),
        },
      });
      await fetchRoles();
      sileo.success("Rol actualizado con éxito");
      onSuccess?.();
    } catch (error) {
      console.error("Error al actualizar rol", error);
      sileo.error("Error al actualizar el rol");
      throw error;
    }
  };

  const handleEliminar = async (id) => {
    try {
      const rolAEliminar = roles.find((r) => r.id === id);
      await deleteDoc(doc(db, "roles", id));
      await registrarBitacora({
        usuario: user?.email ?? "desconocido",
        nombre: nombreEmpleado || user?.email || "desconocido",
        coleccion: "roles",
        accion: "eliminacion",
        docId: id,
        metadata: {
          nombre: rolAEliminar?.nombre,
          descripcion: rolAEliminar?.descripcion,
        },
      });
      fetchRoles();
      sileo.success("Rol eliminado");
      return true;
    } catch (error) {
      console.error("Error al eliminar", error);
      sileo.error("Error al eliminar");
      return false;
    }
  };

  return {
    roles,
    loading,
    fetchRoles,
    guardarRol,
    actualizarRol,
    handleEliminar,
  };
}
