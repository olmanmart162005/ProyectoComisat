import { useEffect, useMemo, useState } from "react";
import { db } from "../firebase/firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import DataTable from "../components/ui/table/DataTable";
import { useModal } from "../hooks/useModal";
import { Modal } from "../components/ui/modal";
import { PencilIcon, TrashBinIcon } from "../icons";
import { sileo, Toaster } from "sileo";

export default function Departamentos() {
  Toaster.position = "top-right";

  const [departamentos, setDepartamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editandoId, setEditandoId] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [nombre, setNombre] = useState("");
  const { isOpen, openModal, closeModal } = useModal();

  // ── Fetchers ─────────────────────────────────────────────
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

  // ── CRUD ─────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);
    try {
      await addDoc(collection(db, "departamentos"), {
        nombre,
        fechaRegistro: serverTimestamp(),
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
        fetchDepartamentos();
        sileo.success("Departamento eliminado");
      } catch (error) {
        console.error("Error al eliminar", error);
        sileo.error("Error al eliminar");
      }
    }
  };

  // ── Columnas ─────────────────────────────────────────────
  const columns = useMemo(
    () => [
      {
        accessorKey: "nombre",
        header: "Nombre",
        cell: (info) => (
          <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
            {info.getValue()}
          </span>
        ),
      },
      {
        id: "acciones",
        header: "Acciones",
        enableSorting: false,
        cell: ({ row }) => {
          const dep = row.original;
          return (
            <div className="flex justify-center gap-3">
              <button
                onClick={() => {
                  setEditandoId(dep.id);
                  setNombre(dep.nombre || "");
                  openModal();
                }}
                className="text-blue-600 hover:text-blue-800 transition"
              >
                <PencilIcon className="w-5 h-5 mx-auto" />
              </button>
              <button
                onClick={() => handleEliminar(dep.id)}
                className="text-red-500 hover:text-red-700 transition"
              >
                <TrashBinIcon className="w-5 h-5 mx-auto" />
              </button>
            </div>
          );
        },
      },
    ],
    [],
  );

  // ── JSX ──────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex sm:justify-between flex-col sm:flex-row gap-4 items-start sm:items-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">
          Departamentos
        </h2>
        <button
          onClick={() => {
            setEditandoId(null);
            setNombre("");
            openModal();
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-lg shadow-sm transition flex items-center gap-2"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          Nuevo Departamento
        </button>
      </div>

      {/* Modal */}
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-xl">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-6 text-gray-800 dark:text-white/90">
            {editandoId
              ? "Editando Departamento"
              : "Registrar Nuevo Departamento"}
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
                placeholder="Nombre del departamento"
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

      {/* Tabla */}
      <DataTable columns={columns} data={departamentos} loading={loading}>
        <DataTable.Toolbar searchPlaceholder="Buscar departamento..." />
        <DataTable.Table />
        <DataTable.Pagination />
      </DataTable>
    </div>
  );
}
