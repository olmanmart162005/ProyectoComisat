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
import { GroupIcon, CheckCircleIcon, CloseIcon, PencilIcon, TrashBinIcon } from "../icons";
import MetricCard from "../components/common/MetricCard";
import PhoneInput from "../components/form/group-input/PhoneInput";
import { sileo, Toaster } from "sileo";

export default function Empleados() {
  Toaster.position = "top-right"; 
  const [empleados, setEmpleados] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editandoId, setEditandoId] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const [codigoEmpleado, setCodigoEmpleado] = useState("");
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [correo, setCorreo] = useState("");
  const [dni, setDni] = useState("");
  const [telefono, setTelefono] = useState("");
  const [departamentoId, setDepartamentoId] = useState("");
  const [departamentoNombre, setDepartamentoNombre] = useState("");
  const [salario, setSalario] = useState("");
  const [estado, setEstado] = useState("Activo");

  const { isOpen, openModal, closeModal } = useModal();

  //contadores de empleados

  const totalEmpleados = empleados.length;
  const empleadosActivos = empleados.filter((e) => e.estado === "Activo").length;
  const empleadosInactivos = empleados.filter((e) => e.estado === "Inactivo").length;

  const fetchDepartamentos = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "departamentos"));
      const docs = querySnapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }));
      setDepartamentos(docs);

      if (docs.length > 0) {
        setDepartamentoId(docs[0].id);
        setDepartamentoNombre(docs[0].nombre || "");
      }
    } catch (error) {
      console.error("Error al cargar departamentos:", error);
      sileo.error("No se pudieron cargar los departamentos.");
    }
  };

  const fetchEmpleados = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "empleados"));
      const docs = querySnapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }));
      setEmpleados(docs);
    } catch (error) {
      console.error("Error al cargar empleados:", error);
      sileo.error("No se pudieron cargar los empleados.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartamentos();
    fetchEmpleados();
  }, []);

  const handleDepartamentoChange = (e) => {
    const selectedId = e.target.value;
    const selectedDep = departamentos.find((d) => d.id === selectedId);
    setDepartamentoId(selectedId);
    setDepartamentoNombre(selectedDep ? selectedDep.nombre || "" : "");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);
    try {
      await addDoc(collection(db, "empleados"), {
        codigoEmpleado,
        nombres,
        apellidos,
        correo,
        dni,
        telefono,
        departamentoId,
        departamentoNombre,
        salario: parseFloat(salario),
        estado,
        fechaRegistro: serverTimestamp(),
      });
      resetFormulario();
      fetchEmpleados();
      sileo.success("Empleado creado con éxito");
      closeModal();
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
      await updateDoc(doc(db, "empleados", editandoId), {
        codigoEmpleado,
        nombres,
        apellidos,
        correo,
        dni,
        telefono,
        departamentoId,
        departamentoNombre,
        salario: parseFloat(salario),
        estado,
        ultima_modificacion: serverTimestamp(),
      });
      resetFormulario();
      fetchEmpleados();
      closeModal();
      sileo.success("Empleado actualizado")
    } catch (error) {
      console.error("Error al actualizar", error);
      sileo.error("Error al actualizar");
    } finally {
      setEnviando(false);
    }
  };

  const handleEliminar = async (id) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este empleado?")) {
      try {
        await deleteDoc(doc(db, "empleados", id));
        fetchEmpleados();
        sileo.success("Empleado eliminado");
      } catch (error) {
        console.error("Error al eliminar", error);
        sileo.error("Error al eliminar");
      }
    }
  };

  const resetFormulario = () => {
    setEditandoId(null);
    setCodigoEmpleado("");
    setNombres("");
    setApellidos("");
    setCorreo("");
    setDni("");
    setTelefono("");
    if (departamentos.length > 0) {
      setDepartamentoId(departamentos[0].id);
      setDepartamentoNombre(departamentos[0].nombre || "");
    }
    setSalario("");
    setEstado("Activo");
  };

  const columns = useMemo(
    () => [
      { accessorKey: "codigoEmpleado", header: "Código" },
      {
        accessorFn: (row) => `${row.nombres} ${row.apellidos}`,
        id: "nombreCompleto",
        header: "Nombre Completo",
        cell: (info) => (
          <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
            {info.getValue()}
          </span>
        ),
      },
      { accessorKey: "correo", header: "Correo" },
      { accessorKey: "dni", header: "DNI" },
      {
        accessorKey: "telefono",
        header: "Teléfono",
        cell: (info) => info.getValue() || "-",
      },
      { accessorKey: "departamentoNombre", header: "Departamento" },
      {
        accessorKey: "salario",
        header: "Salario",
        cell: (info) => `L.${Number(info.getValue()).toLocaleString("es-HN")}`,
      },
      {
        accessorKey: "estado",
        header: "Estado",
        cell: (info) => {
          const val = info.getValue();
          const color =
            val === "Activo"
              ? "success"
              : val === "Inactivo"
                ? "error"
                : "warning";
          return (
            <Badge size="sm" color={color}>
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
                  setCodigoEmpleado(u.codigoEmpleado || "");
                  setNombres(u.nombres || "");
                  setApellidos(u.apellidos || "");
                  setCorreo(u.correo || "");
                  setDni(u.dni || "");
                  setTelefono(u.telefono || "");
                  setDepartamentoId(u.departamentoId || "");
                  setDepartamentoNombre(u.departamentoNombre || "");
                  setSalario(String(u.salario || ""));
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
    [departamentos],
  );

  return (
    <div className="space-y-6">
      <div className="flex sm:justify-between flex-col sm:flex-row gap-4 items-start sm:items-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">
          Empleados
        </h2>
        <button
          onClick={() => {
            resetFormulario();
            openModal();
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-lg shadow-sm transition flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
          Nuevo Empleado
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:gap-6">
        <MetricCard
          title="Total Empleados"
          value={totalEmpleados}
          icon={<GroupIcon className="text-gray-800 size-6 dark:text-white/90" />}
          iconWrapperClass="bg-gray-100 dark:bg-gray-800"
        />
        <MetricCard
          title="Empleados Activos"
          value={empleadosActivos}
          icon={<CheckCircleIcon className="text-green-600 size-6 dark:text-green-400" />}
          iconWrapperClass="bg-green-50 dark:bg-green-500/10"
        />
        <MetricCard
          title="Empleados Inactivos"
          value={empleadosInactivos}
          icon={<CloseIcon className="text-red-600 size-6 dark:text-red-400" />}
          iconWrapperClass="bg-red-50 dark:bg-red-500/10"
        />
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-3xl">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-6 text-gray-800 dark:text-white/90">
            {editandoId ? "Editando Empleado" : "Registrar Nuevo Empleado"}
          </h2>
          <form
            onSubmit={editandoId ? handleUpdate : handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-5"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">
                Código Empleado
              </label>
              <input
                type="text"
                required
                value={codigoEmpleado}
                onChange={(e) => setCodigoEmpleado(e.target.value)}
                placeholder="Ej. 1234"
                className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">
                Nombres
              </label>
              <input
                type="text"
                required
                value={nombres}
                onChange={(e) => setNombres(e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, ""))}
                placeholder="Ej. Sasha Maria"
                className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">
                Apellidos
              </label>
              <input
                type="text"
                required
                value={apellidos}
                onChange={(e) => setApellidos(e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, ""))}
                placeholder="Ej. Sosa Enamorado"
                className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              />
            </div>
            <div>
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
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">
                DNI
              </label>
              <input
                type="text"
                required
                minLength={13}
                maxLength={13}
                value={dni}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  if (val.length <= 13) setDni(val);
                }}
                placeholder="0601200403644"
                className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">
                Teléfono
              </label>
              <div className="mt-1">
                <PhoneInput
                  countries={[{ code: "+504", label: "Honduras" }]}
                  value={telefono}
                  onChange={setTelefono}
                  placeholder="87403621"
                  required
                  minLength={8}
                  maxLength={8}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">
                Departamento
              </label>
              <select
                value={departamentoId}
                onChange={handleDepartamentoChange}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm text-gray-900 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
              >
                {departamentos.length === 0 ? (
                  <option disabled className="bg-white text-gray-900">
                    Cargando departamentos...
                  </option>
                ) : (
                  departamentos.map((dep) => (
                    <option
                      key={dep.id}
                      value={dep.id}
                      className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      {dep.nombre}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">
                Salario
              </label>
              <input
                type="number"
                required
                min="0"
                value={salario}
                onChange={(e) => {
                  if (e.target.value === "" || Number(e.target.value) >= 0) {
                    setSalario(e.target.value);
                  }
                }}
                placeholder="19000"
                className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">
                Estado
              </label>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm text-gray-900 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
              >
                <option value="Activo" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                  Activo
                </option>
                <option value="Inactivo" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                  Inactivo
                </option>
              </select>
            </div>
            <div className="flex gap-3 md:col-span-2 mt-4">
              <button
                type="submit"
                disabled={enviando}
                className={`flex-1 p-2 rounded-md text-white font-bold transition ${enviando ? "bg-gray-400" : editandoId ? "bg-blue-600 hover:bg-blue-700" : "bg-green-600 hover:bg-green-700"}`}
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

      <DataTable
        columns={columns}
        data={empleados}
        loading={loading}
        searchPlaceholder="Buscar empleado..."
      />
    </div>
  );
}
