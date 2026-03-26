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
import Badge from "../components/ui/badge/Badge";
import { useModal } from "../hooks/useModal";
import { Modal } from "../components/ui/modal";
import {
  GroupIcon,
  CheckCircleIcon,
  CloseIcon,
  PencilIcon,
  TrashBinIcon,
} from "../icons";
import MetricCard from "../components/common/MetricCard";
import { sileo, Toaster } from "sileo";

export default function Usuarios() {
  Toaster.position = "top-right";

  const [usuarios, setUsuarios] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editandoId, setEditandoId] = useState(null);
  const [enviando, setEnviando] = useState(false);

  // Campos del formulario
  const [empleadoId, setEmpleadoId] = useState("");
  const [nombre, setNombre] = useState("");
  const [correoPersonal, setCorreoPersonal] = useState("");
  const [correo, setCorreo] = useState("");
  const [rolId, setRolId] = useState("");
  const [rolNombre, setRolNombre] = useState("");
  const [estado, setEstado] = useState("Activo");
  const [filtroEstado, setFiltroEstado] = useState("");

  const { isOpen, openModal, closeModal } = useModal();

  // Contadores
  const totalUsuarios = usuarios.length;
  const usuariosActivos = usuarios.filter((u) => u.estado === "Activo").length;
  const usuariosInactivos = usuarios.filter(
    (u) => u.estado === "Inactivo",
  ).length;

  // ── Fetchers ─────────────────────────────────────────────
  const fetchEmpleados = async () => {
    try {
      const snap = await getDocs(collection(db, "empleados"));
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setEmpleados(docs);
      if (docs.length > 0) {
        setEmpleadoId(docs[0].id);
        setNombre(`${docs[0].nombres ?? ""} ${docs[0].apellidos ?? ""}`.trim());
        setCorreo(docs[0].correo ?? "");
      }
    } catch (error) {
      console.error("Error al cargar empleados:", error);
      sileo.error("No se pudieron cargar los empleados.");
    }
  };

  const fetchRoles = async () => {
    try {
      const snap = await getDocs(collection(db, "roles"));
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setRoles(docs);
      if (docs.length > 0) {
        setRolId(docs[0].id);
        setRolNombre(docs[0].nombre ?? "");
      }
    } catch (error) {
      console.error("Error al cargar roles:", error);
      sileo.error("No se pudieron cargar los roles.");
    }
  };

  const fetchUsuarios = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "usuarios"));
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setUsuarios(docs);
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
      sileo.error("No se pudieron cargar los usuarios.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmpleados();
    fetchRoles();
    fetchUsuarios();
  }, []);

  // ── Handlers de selects ──────────────────────────────────
  const handleEmpleadoChange = (e) => {
    const selectedId = e.target.value;
    const emp = empleados.find((em) => em.id === selectedId);
    setEmpleadoId(selectedId);
    if (emp) {
      setNombre(`${emp.nombres ?? ""} ${emp.apellidos ?? ""}`.trim());
      setCorreoPersonal(emp.correo ?? "");
    }
  };

  const handleRolChange = (e) => {
    const selectedId = e.target.value;
    const rol = roles.find((r) => r.id === selectedId);
    setRolId(selectedId);
    setRolNombre(rol ? (rol.nombre ?? "") : "");
  };

  // ── CRUD ─────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);
    try {
      await addDoc(collection(db, "usuarios"), {
        empleadoId,
        nombre,
        correoPersonal,
        correo,
        rolId,
        rolNombre,
        estado,
        fechaRegistro: serverTimestamp(),
      });
      resetFormulario();
      fetchUsuarios();
      closeModal();
      setTimeout(() => sileo.success("Usuario creado con éxito"), 150);
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
      await updateDoc(doc(db, "usuarios", editandoId), {
        empleadoId,
        nombre,
        correo,
        rolId,
        rolNombre,
        estado,
        ultima_modificacion: serverTimestamp(),
      });
      resetFormulario();
      fetchUsuarios();
      closeModal();
      setTimeout(() => sileo.success("Usuario actualizado"), 150);
    } catch (error) {
      console.error("Error al actualizar", error);
      sileo.error("Error al actualizar");
    } finally {
      setEnviando(false);
    }
  };

  const handleEliminar = async (id) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este usuario?")) {
      try {
        await deleteDoc(doc(db, "usuarios", id));
        fetchUsuarios();
        sileo.success("Usuario eliminado");
      } catch (error) {
        console.error("Error al eliminar", error);
        sileo.error("Error al eliminar");
      }
    }
  };

  const resetFormulario = () => {
    setEditandoId(null);
    if (empleados.length > 0) {
      setEmpleadoId(empleados[0].id);
      setNombre(
        `${empleados[0].nombres ?? ""} ${empleados[0].apellidos ?? ""}`.trim(),
      );
      setCorreoPersonal(empleados[0]?.correo ?? "");
      setCorreo("");
    } else {
      setEmpleadoId("");
      setNombre("");
      setCorreo("");
    }
    if (roles.length > 0) {
      setRolId(roles[0].id);
      setRolNombre(roles[0].nombre ?? "");
    } else {
      setRolId("");
      setRolNombre("");
    }
    setEstado("Activo");
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
      { accessorKey: "correo", header: "Correo" },
      { accessorKey: "rolNombre", header: "Rol" },
      {
        accessorKey: "estado",
        header: "Estado",
        cell: (info) => {
          const val = info.getValue();
          return (
            <Badge size="sm" color={val === "Activo" ? "success" : "error"}>
              {val}
            </Badge>
          );
        },
      },
      {
        id: "acciones",
        header: "Acciones",
        enableSorting: false,
        cell: ({ row }) => {
          const u = row.original;
          return (
            <div className="flex justify-center gap-3">
              <button
                onClick={() => {
                  setEditandoId(u.id);
                  setEmpleadoId(u.empleadoId || "");
                  setNombre(u.nombre || "");
                  setCorreo(u.correo || "");
                  setRolId(u.rolId || "");
                  setRolNombre(u.rolNombre || "");
                  setEstado(u.estado || "Activo");
                  openModal();
                }}
                className="text-blue-600 hover:text-blue-800 transition"
              >
                <PencilIcon className="w-5 h-5 mx-auto" />
              </button>
              <button
                onClick={() => handleEliminar(u.id)}
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

  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((u) => {
      return filtroEstado ? u.estado === filtroEstado : true;
    });
  }, [usuarios, filtroEstado]);

  // ── JSX ──────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex sm:justify-between flex-col sm:flex-row gap-4 items-start sm:items-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">
          Usuarios
        </h2>
        <button
          onClick={() => {
            resetFormulario();
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
          Nuevo Usuario
        </button>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:gap-6">
        <MetricCard
          title="Total Usuarios"
          value={totalUsuarios}
          icon={
            <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />
          }
          iconWrapperClass="bg-gray-100 dark:bg-gray-800"
        />
        <MetricCard
          title="Usuarios Activos"
          value={usuariosActivos}
          icon={
            <CheckCircleIcon className="text-green-600 size-6 dark:text-green-400" />
          }
          iconWrapperClass="bg-green-50 dark:bg-green-500/10"
        />
        <MetricCard
          title="Usuarios Inactivos"
          value={usuariosInactivos}
          icon={<CloseIcon className="text-red-600 size-6 dark:text-red-400" />}
          iconWrapperClass="bg-red-50 dark:bg-red-500/10"
        />
      </div>

      {/* Modal */}
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-xl">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-6 text-gray-800 dark:text-white/90">
            {editandoId ? "Editando Usuario" : "Registrar Nuevo Usuario"}
          </h2>
          <form
            onSubmit={editandoId ? handleUpdate : handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-5"
          >
            {/* Empleado */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">
                Empleado
              </label>
              <select
                value={empleadoId}
                onChange={handleEmpleadoChange}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm text-gray-900 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 disabled:opacity-60"
              >
                {empleados.length === 0 ? (
                  <option disabled>Cargando empleados...</option>
                ) : (
                  empleados.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {`${emp.nombres ?? ""} ${emp.apellidos ?? ""}`.trim()}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Correo (autocompletado, editable) */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">
                Correo Electrónico
              </label>
              <input
                type="email"
                required
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="correo@ejemplo.com"
                className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              />
            </div>

            {/* Rol */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">
                Rol
              </label>
              <select
                value={rolId}
                onChange={handleRolChange}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm text-gray-900 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
              >
                {roles.length === 0 ? (
                  <option disabled>Cargando roles...</option>
                ) : (
                  roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nombre}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Estado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">
                Estado
              </label>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm text-gray-900 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
              >
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
              </select>
            </div>

            {/* Botón */}
            <div className="flex gap-3 md:col-span-2 mt-4">
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
      <DataTable columns={columns} data={usuariosFiltrados} loading={loading}>
        <DataTable.Toolbar searchPlaceholder="Buscar usuario...">
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:ml-auto">
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-full sm:w-40 p-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:ring-blue-500 focus:border-blue-500 dark:bg-white/5 dark:border-white/10 dark:text-gray-100"
            >
              <option value="" className="bg-white text-gray-900">
                Estado
              </option>
              <option value="Activo" className="bg-white text-gray-900">
                Activo
              </option>
              <option value="Inactivo" className="bg-white text-gray-900">
                Inactivo
              </option>
            </select>
          </div>
        </DataTable.Toolbar>
        <DataTable.Table />
        <DataTable.Pagination />
      </DataTable>
    </div>
  );
}
