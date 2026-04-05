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
import ExportButtons from "../layout/Exportbuttons";
import { useAuth } from "../auth/AuthProvider";
import { useNombreEmpleadoActual } from "../hooks/useNombreEmpleadoActual";
import { useModal } from "../hooks/useModal";
import { Modal } from "../components/ui/modal";
import { sileo, Toaster } from "sileo";
import { PencilIcon, TrashBinIcon } from "../icons";
import { registrarBitacora } from "../services/bitacora";

export default function Roles() {
  Toaster.position = "top-right";

  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editandoId, setEditandoId] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [nombre, setNombre] = useState("");
  const { isOpen, openModal, closeModal } = useModal();
  const { user } = useAuth();
  const nombreEmpleado = useNombreEmpleadoActual();

  const COLUMNAS_EXPORT_ROLES = [
    { key: "nombre", header: "Nombre", type: "text" },
  ];

  // ── Fetchers ─────────────────────────────────────────────
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

  // ── CRUD ─────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);
    try {
      await addDoc(collection(db, "roles"), {
        nombre,
        fechaRegistro: serverTimestamp(),
      });
      setNombre("");
      fetchRoles();
      closeModal();
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
      });
      setEditandoId(null);
      setNombre("");
      fetchRoles();
      closeModal();
      sileo.success("Rol actualizado con éxito");
    } catch (error) {
      console.error("Error al actualizar", error);
      sileo.error("Error al actualizar");
    } finally {
      setEnviando(false);
    }
  };

  const handleEliminar = async (id) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este rol?")) {
      try {
        await deleteDoc(doc(db, "roles", id));
        fetchRoles();
        sileo.success("Rol eliminado");
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
          const rol = row.original;
          return (
            <div className="flex justify-center gap-3">
              <button
                onClick={() => {
                  setEditandoId(rol.id);
                  setNombre(rol.nombre || "");
                  openModal();
                }}
                className="text-blue-600 hover:text-blue-800 transition"
              >
                <PencilIcon className="w-5 h-5 mx-auto" />
              </button>
              <button
                onClick={() => handleEliminar(rol.id)}
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
          Roles
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
          Nuevo Rol
        </button>
      </div>

      {/* Modal */}
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-xl">
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

      {/* Tabla */}
      <DataTable columns={columns} data={roles} loading={loading}>
        <DataTable.Toolbar searchPlaceholder="Buscar rol...">
          <ExportButtons
            rows={roles}
            columns={COLUMNAS_EXPORT_ROLES}
            filename={"Roles " + new Date().toLocaleDateString("es-HN")}
            sheetName="Lista de Roles"
            meta={{ empresa: "Comisariato San Jose", usuario: "Sistema" }}
            pdfOptions={{
              title: "Roles",
              subtitle: new Date().toLocaleDateString("es-HN"),
            }}
            onExport={(formato) =>
              registrarBitacora({
                usuario: user.email,
                nombre: nombreEmpleado,
                coleccion: "roles",
                accion: "exportar",
                metadata: {
                  formato,
                  totalRegistros: roles.length,
                },
              })
            }
          />
        </DataTable.Toolbar>
        <DataTable.Table />
        <DataTable.Pagination />
      </DataTable>
    </div>
  );
}
