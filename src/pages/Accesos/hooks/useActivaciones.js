import { useEffect, useState } from "react";
import { db } from "../../../firebase/firebase";
import {
  collection,
  deleteField,
  getDocs,
  query,
  updateDoc,
  where,
  doc,
} from "firebase/firestore";
import { sileo } from "sileo";

export const useActivaciones = () => {
  const [pendientes, setPendientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmandoId, setConfirmandoId] = useState(null);

  const fetchPendientes = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "usuarios"),
        where("registradoEnAuth", "==", false),
      );
      const snap = await getDocs(q);
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setPendientes(docs);
    } catch (error) {
      console.error("Error al cargar activaciones pendientes:", error);
      sileo.error("No se pudieron cargar las activaciones pendientes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendientes();
  }, []);

  const handleActivar = async (usuarioId) => {
    setConfirmandoId(usuarioId);
    try {
      await updateDoc(doc(db, "usuarios", usuarioId), {
        registradoEnAuth: true,
        passwordTemporal: deleteField(), // se borra por seguridad
      });
      sileo.success({
        title: "Usuario activado",
        description: "Registrado en Firebase Auth correctamente.",
      });
      fetchPendientes();
    } catch (error) {
      console.error("Error al activar usuario:", error);
      sileo.error("No se pudo activar el usuario.");
    } finally {
      setConfirmandoId(null);
    }
  };

  return {
    pendientes,
    loading,
    confirmandoId,
    handleActivar,
    fetchPendientes,
  };
};