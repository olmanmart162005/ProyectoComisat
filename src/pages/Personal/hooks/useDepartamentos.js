import { useEffect, useState } from "react";
import { db } from "../../../firebase/firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { sileo } from "sileo";
import { useAuth } from "../../../auth/AuthProvider";
import { useNombreEmpleadoActual } from "../../../hooks/useNombreEmpleadoActual";
import { registrarBitacora } from "../../../services/bitacora";

export const useDepartamentos = ({ closeModal }) => {
  const { user } = useAuth();
  const nombreEmpleado = useNombreEmpleadoActual();
  const [departamentos, setDepartamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editandoId, setEditandoId] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [nombre, setNombre] = useState("");

  const fetchDepartamentos = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "departamentos"));
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setDepartamentos(docs);
    } catch (error) {
      console.error("Error al cargar departamentos:", error);
      sileo.error("No se pudieron cargar los departamentos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartamentos();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);
    try {
      const nuevoDepartamento = await addDoc(collection(db, "departamentos"), {
        nombre,
        fechaRegistro: serverTimestamp(),
      });

      await registrarBitacora({
        usuario: user?.email ?? "desconocido",
        nombre: nombreEmpleado,
        coleccion: "departamentos",
        accion: "creacion",
        docId: nuevoDepartamento.id,
        metadata: {
          nombre,
        },
      });

      setNombre("");
      fetchDepartamentos();
      closeModal();
      sileo.success("Departamento creado con éxito");
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
      await updateDoc(doc(db, "departamentos", editandoId), {
        nombre,
      });

      await registrarBitacora({
        usuario: user?.email ?? "desconocido",
        nombre: nombreEmpleado,
        coleccion: "departamentos",
        accion: "actualizacion",
        docId: editandoId,
        metadata: {
          nombre,
        },
      });

      setEditandoId(null);
      setNombre("");
      fetchDepartamentos();
      closeModal();
      sileo.success("Departamento actualizado con éxito");
    } catch (error) {
      console.error("Error al actualizar", error);
      sileo.error("Error al actualizar");
    } finally {
      setEnviando(false);
    }
  };

  const handleEliminar = async (id) => {
    if (
      window.confirm("¿Estás seguro de que deseas eliminar este departamento?")
    ) {
      try {
        await deleteDoc(doc(db, "departamentos", id));

        await registrarBitacora({
          usuario: user?.email ?? "desconocido",
          nombre: nombreEmpleado,
          coleccion: "departamentos",
          accion: "eliminacion",
          docId: id,
          metadata: {
            id,
          },
        });

        fetchDepartamentos();
        sileo.success("Departamento eliminado");
      } catch (error) {
        console.error("Error al eliminar", error);
        sileo.error("Error al eliminar");
      }
    }
  };

  return {
    departamentos,
    loading,
    editandoId,
    setEditandoId,
    enviando,
    nombre,
    setNombre,
    handleSubmit,
    handleUpdate,
    handleEliminar,
    fetchDepartamentos,
  };
};
