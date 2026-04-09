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
import { useAuth } from "../../../auth/AuthProvider";
import { useNombreEmpleadoActual } from "../../../hooks/useNombreEmpleadoActual";
import { registrarBitacora } from "../../../services/bitacora";
import { notify } from "../../../services/notifier";
export const useDepartamentos = ({
  closeModal,
  cargarDepartamentos = true,
}) => {
  const { user } = useAuth();
  const nombreEmpleado = useNombreEmpleadoActual();
  const [departamentos, setDepartamentos] = useState([]);
  const [loading, setLoading] = useState(cargarDepartamentos);
  const [editandoId, setEditandoId] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [nombre, setNombre] = useState("");
  const usuarioBitacora = user?.email ?? "desconocido";
  const nombreBitacora = nombreEmpleado || user?.email || "desconocido";
  const fetchDepartamentos = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "departamentos"));
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setDepartamentos(docs);
    } catch (error) {
      console.error("Error al cargar departamentos:", error);
      notify.loadError("los departamentos");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (cargarDepartamentos) {
      fetchDepartamentos();
    }
  }, []);
  const guardarDepartamento = async ({ nombre, descripcion, onSuccess }) => {
    const nombreLimpio = String(nombre ?? "").trim();
    const descripcionLimpia = String(descripcion ?? "").trim();
    if (!nombreLimpio) {
      notify.error("El nombre del departamento es obligatorio.");
      return false;
    }
    try {
      const nuevoDepartamento = await addDoc(collection(db, "departamentos"), {
        nombre: nombreLimpio,
        descripcion: descripcionLimpia,
        fechaRegistro: serverTimestamp(),
        ultimaModificacion: serverTimestamp(),
      });
      await registrarBitacora({
        usuario: usuarioBitacora,
        nombre: nombreBitacora,
        coleccion: "departamentos",
        accion: "creacion",
        docId: nuevoDepartamento.id,
        metadata: {
          nombre: nombreLimpio,
          descripcion: descripcionLimpia,
        },
      });
      await fetchDepartamentos();
      notify.created("Departamento");
      await onSuccess?.();
      return true;
    } catch (error) {
      console.error("Error al guardar departamento:", error);
      notify.saveError("el departamento");
      return false;
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);
    try {
      await guardarDepartamento({
        nombre,
        descripcion: "",
        onSuccess: closeModal,
      });
      setNombre("");
    } catch (error) {
      console.error("Error al guardar", error);
      notify.saveError("el departamento");
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
      notify.updated("Departamento");
    } catch (error) {
      console.error("Error al actualizar", error);
      notify.updateError("el departamento");
    } finally {
      setEnviando(false);
    }
  };
  const actualizarDepartamento = async ({
    editandoId,
    nombre,
    descripcion,
    nombreAnterior,
    onSuccess,
  }) => {
    const nombreLimpio = String(nombre ?? "").trim();
    const descripcionLimpia = String(descripcion ?? "").trim();
    if (!nombreLimpio) {
      notify.error("El nombre del departamento es obligatorio.");
      return false;
    }
    try {
      await updateDoc(doc(db, "departamentos", editandoId), {
        nombre: nombreLimpio,
        descripcion: descripcionLimpia,
        ultimaModificacion: serverTimestamp(),
      });
      await registrarBitacora({
        usuario: usuarioBitacora,
        nombre: nombreBitacora,
        coleccion: "departamentos",
        accion: "actualizacion",
        docId: editandoId,
        metadata: {
          nombre: nombreLimpio,
          descripcion: descripcionLimpia,
          ...(nombreAnterior !== nombreLimpio && {
            nombreAnterior,
            nombreNuevo: nombreLimpio,
          }),
        },
      });
      await fetchDepartamentos();
      notify.updated("Departamento");
      await onSuccess?.();
      return true;
    } catch (error) {
      console.error("Error al actualizar departamento", error);
      notify.updateError("el departamento");
      return false;
    }
  };
  const handleEliminar = async (id) => {
    try {
      const departamentoAEliminar = departamentos.find((d) => d.id === id);
      await deleteDoc(doc(db, "departamentos", id));
      await registrarBitacora({
        usuario: usuarioBitacora,
        nombre: nombreBitacora,
        coleccion: "departamentos",
        accion: "eliminacion",
        docId: id,
        metadata: {
          nombre: departamentoAEliminar?.nombre,
          descripcion: departamentoAEliminar?.descripcion,
          id,
        },
      });
      await fetchDepartamentos();
      notify.deleted("Departamento");
      return true;
    } catch (error) {
      console.error("Error al eliminar", error);
      notify.deleteError("el departamento");
      return false;
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
    guardarDepartamento,
    actualizarDepartamento,
    handleEliminar,
    fetchDepartamentos,
  };
};