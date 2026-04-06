import { useEffect, useState } from "react";
import { db, storage } from "../../firebase/firebase";
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { sileo } from "sileo";

import { Modal } from "../ui/modal";
import { registrarBitacora } from "../../services/bitacora";

export default function CategoryModal({
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
  const [archivoImagen, setArchivoImagen] = useState(null);
  const [previewImagen, setPreviewImagen] = useState(null);
  const [imagenUrlActual, setImagenUrlActual] = useState("");

  const resetFormulario = () => {
    setEditandoId(null);
    setNombre("");
    setNombreAnterior("");
    setArchivoImagen(null);
    setPreviewImagen(null);
    setImagenUrlActual("");
  };

  useEffect(() => {
    if (!isOpen) return;

    if (editandoData) {
      setEditandoId(editandoData.id || null);
      setNombre(editandoData.nombre || "");
      setNombreAnterior(editandoData.nombre || "");
      setImagenUrlActual(editandoData.imagenUrl || "");
      setPreviewImagen(editandoData.imagenUrl || null);
      setArchivoImagen(null);
      return;
    }

    resetFormulario();
  }, [editandoData, isOpen]);

  const handleImagenChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setArchivoImagen(file);
      setPreviewImagen(URL.createObjectURL(file));
    }
  };

  const subirImagen = async (archivo) => {
    const storageRef = ref(storage, `categorias/${Date.now()}_${archivo.name}`);
    await uploadBytes(storageRef, archivo);
    return await getDownloadURL(storageRef);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);
    try {
      if (!archivoImagen) {
        sileo.error("La imagen es obligatoria");
        setEnviando(false);
        return;
      }

      const imagenUrl = await subirImagen(archivoImagen);

      await addDoc(collection(db, "categoria"), {
        nombre,
        imagenUrl,
        fechaRegistro: serverTimestamp(),
      });
      await onSuccess?.();
      resetFormulario();
      sileo.success("Categoría creada con éxito");
      onClose();
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
      let imagenUrl = imagenUrlActual;
      if (archivoImagen) {
        imagenUrl = await subirImagen(archivoImagen);
      }

      await updateDoc(doc(db, "categoria", editandoId), {
        nombre,
        imagenUrl,
        ultimaModificacion: serverTimestamp(),
      });

      await registrarBitacora({
        usuario: user.email,
        nombre: nombreEmpleado,
        coleccion: "categoria",
        accion: "actualizacion",
        docId: editandoId,
        metadata: {
          nombre,
          ...(nombreAnterior !== nombre && {
            nombreAnterior,
            nombreNuevo: nombre,
          }),
          ...(archivoImagen && {
            imagenActualizada: true,
          }),
        },
      });

      await onSuccess?.();
      resetFormulario();
      sileo.success("Categoría actualizada con éxito");
      onClose();
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
          {editandoId ? "Editando Categoría" : "Registrar Nueva Categoría"}
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
              placeholder="Nombre de la categoría"
              className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">
              Imagen de la Categoría{" "}
              {!editandoId && <span className="text-red-500">*</span>}
            </label>
            <div className="mt-1 flex items-center gap-4">
              {previewImagen ? (
                <img
                  src={previewImagen}
                  alt="Preview"
                  className="w-16 h-16 rounded-lg object-cover border border-gray-200 dark:border-white/10 flex-shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-gray-100 dark:bg-white/5 border border-dashed border-gray-300 dark:border-white/10 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-6 h-6 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              )}
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  required={!editandoId}
                  onChange={handleImagenChange}
                  className="block w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100 dark:text-gray-400 dark:file:bg-blue-500/10 dark:file:text-blue-400"
                />
                {editandoId && !archivoImagen && (
                  <p className="text-xs text-gray-400 mt-1">
                    Deja vacío para conservar la imagen actual.
                  </p>
                )}
              </div>
            </div>
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
