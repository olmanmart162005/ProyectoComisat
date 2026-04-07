import { useEffect, useState } from "react";
import { db } from "../../firebase/firebase";
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { sileo } from "sileo";

import { Modal } from "../ui/modal";
import { registrarBitacora } from "../../services/bitacora";

export default function RoleModal({
  isOpen,
  onClose,
  editandoData,
  user,
  nombreEmpleado,
  onSuccess,
}) {
  const [editandoId, setEditandoId] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [nombre, setNombre] = useState("");
  const [nombreAnterior, setNombreAnterior] = useState("");

  const resetFormulario = () => {
    setEditandoId(null);
    setNombre("");
  };

  useEffect(() => {
    if (!isOpen) return;

    if (editandoData) {
      setEditandoId(editandoData.id || null);
      setNombre(editandoData.nombre || "");
      setNombreAnterior(editandoData.nombre || "");
      return;
    }

    resetFormulario();
  }, [editandoData, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);
    try {
      await addDoc(collection(db, "roles"), {
        nombre,
        fechaRegistro: serverTimestamp(),
      });
      await registrarBitacora({
        usuario: user.email,
        nombre: nombreEmpleado,
        coleccion: "roles",
        accion: "creacion",
        metadata: {
          nombre,
        },
      });
      resetFormulario();
      await onSuccess?.();
      onClose();
      sileo.success("Rol creado con éxito");
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
      await updateDoc(doc(db, "roles", editandoId), {
        nombre,
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
          ...(nombreAnterior !== nombre && {
            nombreAnterior,
            nombreNuevo: nombre,
          }),
        },
      });
      resetFormulario();
      await onSuccess?.();
      onClose();
      sileo.success("Rol actualizado con éxito");
    } catch (error) {
      console.error("Error al actualizar", error);
      sileo.error("Error al actualizar");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-xl">
      <div className="p-6">
        <h2 className="text-xl font-bold mb-6 text-gray-800 dark:text-white/90">
          {editandoId ? "Editando Rol" : "Registrar Nuevo Rol"}
        </h2>
        <form
          onSubmit={editandoId ? handleUpdate : handleSubmit}
          className="grid grid-cols-1 gap-5"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">
              Nombre
            </label>
            <input
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre del rol"
              className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            />
          </div>
          <div className="flex gap-3 mt-4">
            <button
              type="submit"
              disabled={enviando}
              className={`flex-1 p-2 rounded-md text-white font-bold transition ${
                enviando
                  ? "bg-gray-400"
                  : editandoId
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {enviando
                ? "Procesando..."
                : editandoId
                  ? "Actualizar"
                  : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
