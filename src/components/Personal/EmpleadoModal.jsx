import { useEffect, useState } from "react";
import { db } from "../../firebase/firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { sileo } from "sileo";

import { Modal } from "../ui/modal";
import { registrarBitacora } from "../../services/bitacora";
import PhoneInput from "../form/group-input/PhoneInput";

const getRolEmpleadoId = async () => {
  try {
    const q = query(collection(db, "roles"), where("nombre", "==", "Empleado"));
    const snap = await getDocs(q);
    if (!snap.empty) return snap.docs[0].id;
    return "";
  } catch (error) {
    console.error("Error al buscar rol Empleado:", error);
    return "";
  }
};

const syncUsuarioConEmpleado = async ({
  empleadoIdDoc,
  empleadoNombres,
  empleadoApellidos,
  empleadoCorreo,
  empleadoEstado,
}) => {
  const q = query(
    collection(db, "usuarios"),
    where("empleadoId", "==", empleadoIdDoc),
  );
  const snap = await getDocs(q);

  const payloadBase = {
    empleadoId: empleadoIdDoc,
    empleadoNombres,
    empleadoApellidos,
    nombre: `${empleadoNombres} ${empleadoApellidos}`.trim(),
    correo: empleadoCorreo,
    estado: empleadoEstado,
  };

  if (!snap.empty) {
    await Promise.all(
      snap.docs.map((d) =>
        updateDoc(doc(db, "usuarios", d.id), {
          ...payloadBase,
          ultimaModificacion: serverTimestamp(),
        }),
      ),
    );
    return;
  }

  const rolEmpleadoId = await getRolEmpleadoId();

  await addDoc(collection(db, "usuarios"), {
    ...payloadBase,
    rolId: rolEmpleadoId,
    rolNombre: "Empleado",
    fechaRegistro: serverTimestamp(),
  });
};

export default function EmpleadoModal({
  isOpen,
  onClose,
  editandoData,
  departamentos,
  user,
  nombreEmpleado,
  onSuccess,
  codigoNuevo,
  empleados,
}) {
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

  useEffect(() => {
    if (!isOpen) return;

    if (editandoData) {
      setEditandoId(editandoData.id || null);
      setCodigoEmpleado(editandoData.codigoEmpleado || "");
      setNombres(editandoData.nombres || "");
      setApellidos(editandoData.apellidos || "");
      setCorreo(editandoData.correo || "");
      setDni(editandoData.dni || "");
      setTelefono(editandoData.telefono || "");
      setDepartamentoId(editandoData.departamentoId || "");
      setDepartamentoNombre(editandoData.departamentoNombre || "");
      setSalario(String(editandoData.salario || ""));
      setEstado(editandoData.estado || "Activo");
      return;
    }

    resetFormulario();
    setCodigoEmpleado(codigoNuevo);
  }, [editandoData, isOpen, codigoNuevo, departamentos]);

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
      const docRef = await addDoc(collection(db, "empleados"), {
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

      await syncUsuarioConEmpleado({
        empleadoIdDoc: docRef.id,
        empleadoNombres: nombres,
        empleadoApellidos: apellidos,
        empleadoCorreo: correo,
        empleadoEstado: estado,
      });

      await registrarBitacora({
        usuario: user.email,
        nombre: nombreEmpleado,
        coleccion: "empleados",
        accion: "creacion",
        docId: docRef.id,
        metadata: {
          nombreCompleto: `${nombres} ${apellidos}`,
          codigoEmpleado,
          departamentoNombre,
          estado,
        },
      });

      resetFormulario();
      await onSuccess?.();
      sileo.success("Empleado creado con éxito");
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
      const empleadoAnterior = empleados.find((emp) => emp.id === editandoId);

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
        ultimaModificacion: serverTimestamp(),
      });

      await syncUsuarioConEmpleado({
        empleadoIdDoc: editandoId,
        empleadoNombres: nombres,
        empleadoApellidos: apellidos,
        empleadoCorreo: correo,
        empleadoEstado: estado,
      });

      await registrarBitacora({
        usuario: user.email,
        nombre: nombreEmpleado,
        coleccion: "empleados",
        accion: "actualizacion",
        docId: editandoId,
        metadata: {
          nombreCompleto: `${nombres} ${apellidos}`,
          ...(empleadoAnterior?.estado !== estado && {
            estadoAnterior: empleadoAnterior?.estado,
            estadoNuevo: estado,
          }),
          ...(empleadoAnterior?.salario !== parseFloat(salario) && {
            salarioAnterior: empleadoAnterior?.salario,
            salarioNuevo: parseFloat(salario),
          }),
          ...(empleadoAnterior?.departamentoNombre !== departamentoNombre && {
            departamentoAnterior: empleadoAnterior?.departamentoNombre,
            departamentoNuevo: departamentoNombre,
          }),
        },
      });

      resetFormulario();
      await onSuccess?.();
      onClose();
      sileo.success("Empleado actualizado");
    } catch (error) {
      console.error("Error al actualizar", error);
      sileo.error("Error al actualizar");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-3xl">
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
              readOnly
              value={codigoEmpleado}
              placeholder="Generando..."
              className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm bg-gray-100 cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400 font-mono font-bold"
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
              onChange={(e) =>
                setNombres(
                  e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, ""),
                )
              }
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
              onChange={(e) =>
                setApellidos(
                  e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, ""),
                )
              }
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
              <option
                value="Activo"
                className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                Activo
              </option>
              <option
                value="Inactivo"
                className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
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
  );
}
