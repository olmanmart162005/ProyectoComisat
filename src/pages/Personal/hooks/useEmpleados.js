import { useEffect, useMemo, useState } from "react";
import { db } from "../../../firebase/firebase";
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
import { registrarBitacora } from "../../../services/bitacora";
import { notify } from "../../../services/notifier";
import {
  generarPasswordTemporal,
  enviarCorreoCredenciales,
} from "../../../services/credencialesEmail";
import { parseDateValue } from "../../../utils/empleadoUtils";

export const generarNuevoCodigo = (listaEmpleados, listaHistorial = []) => {
  const anioActual = new Date().getFullYear().toString();

  const todosLosCodigos = [
    ...listaEmpleados.map((e) => e.codigoEmpleado),
    ...listaHistorial.map((h) => h.codigoEmpleado),
  ]
    .filter((cod) => cod && cod.toString().startsWith(anioActual))
    .map((cod) => cod.toString());

  if (todosLosCodigos.length === 0) {
    return `${anioActual}001`;
  }

  const ultimosNumeros = todosLosCodigos.map((cod) => parseInt(cod.slice(4)));
  const maxActual = Math.max(...ultimosNumeros);

  return `${anioActual}${(maxActual + 1).toString().padStart(3, "0")}`;
};

export function useEmpleados({ user, nombreEmpleado }) {
  const [empleados, setEmpleados] = useState([]);
  const [historialEmpleados, setHistorialEmpleados] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroDepartamento, setFiltroDepartamento] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");

  const fetchDepartamentos = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "departamentos"));
      const docs = querySnapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }));
      setDepartamentos(docs);
    } catch (error) {
      console.error("Error al cargar departamentos:", error);
      notify.loadError("los departamentos");
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
      notify.loadError("los empleados");
    } finally {
      setLoading(false);
    }
  };

  const fetchHistorialEmpleados = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "historialEmpleados"));
      const docs = querySnapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }));
      setHistorialEmpleados(docs);
    } catch (error) {
      console.error("Error al cargar historial de empleados:", error);
    }
  };

  useEffect(() => {
    fetchDepartamentos();
    fetchEmpleados();
    fetchHistorialEmpleados();
  }, []);

  const totalEmpleados = empleados.length;
  const empleadosActivos = empleados.filter(
    (e) => e.estado === "Activo",
  ).length;
  const empleadosInactivos = empleados.filter(
    (e) => e.estado === "Inactivo",
  ).length;

  const empleadosFiltrados = useMemo(() => {
    return empleados.filter((e) => {
      const coincideDepartamento = filtroDepartamento
        ? e.departamentoId === filtroDepartamento
        : true;

      const coincideEstado = filtroEstado ? e.estado === filtroEstado : true;

      return coincideDepartamento && coincideEstado;
    });
  }, [empleados, filtroDepartamento, filtroEstado]);

  const textoFiltrosPdf = useMemo(() => {
    const partes = [];

    if (filtroDepartamento) {
      const dep = departamentos.find((d) => d.id === filtroDepartamento);
      partes.push(`Departamento: ${dep ? dep.nombre : filtroDepartamento}`);
    }

    if (filtroEstado) {
      partes.push(`Estado: ${filtroEstado}`);
    }

    return partes.length > 0
      ? `Filtros activos: ${partes.join(" | ")}`
      : "Listado Completo";
  }, [filtroDepartamento, filtroEstado, departamentos]);

  const handleEliminar = async (id) => {
    try {
      const empleadoAEliminar = empleados.find((e) => e.id === id);

      // ── Paso 1: eliminar todos los usuarios vinculados al empleado ──
      const qUsuarios = query(
        collection(db, "usuarios"),
        where("empleadoId", "==", id),
      );
      const snapUsuarios = await getDocs(qUsuarios);

      await Promise.all(
        snapUsuarios.docs.map((d) => deleteDoc(doc(db, "usuarios", d.id))),
      );

      // ── Paso 2: mover el empleado a historialEmpleados ──
      if (empleadoAEliminar) {
        await addDoc(collection(db, "historialEmpleados"), {
          codigoEmpleado: empleadoAEliminar.codigoEmpleado,
          nombres: empleadoAEliminar.nombres,
          apellidos: empleadoAEliminar.apellidos,
          correo: empleadoAEliminar.correo,
          dni: empleadoAEliminar.dni,
          telefono: empleadoAEliminar.telefono,
          departamentoId: empleadoAEliminar.departamentoId,
          departamentoNombre: empleadoAEliminar.departamentoNombre,
          salario: empleadoAEliminar.salario,
          fechaInicio: empleadoAEliminar.fechaInicio,
          fechaRegistro: empleadoAEliminar.fechaRegistro,
          empleadoId: id,
          fechaBaja: serverTimestamp(),
          bajadoPor: user?.email ?? "desconocido",
          nombreBajadoPor: nombreEmpleado || user?.email || "desconocido",
          usuariosEliminados: snapUsuarios.docs.length,
        });
      }

      // ── Paso 3: eliminar el empleado ──
      await deleteDoc(doc(db, "empleados", id));

      // ── Paso 4: bitácora ──
      await registrarBitacora({
        usuario: user?.email ?? "desconocido",
        nombre: nombreEmpleado || user?.email || "desconocido",
        coleccion: "empleados",
        accion: "eliminacion",
        docId: id,
        metadata: {
          nombreCompleto: `${empleadoAEliminar?.nombres} ${empleadoAEliminar?.apellidos}`,
          codigoEmpleado: empleadoAEliminar?.codigoEmpleado,
          departamentoNombre: empleadoAEliminar?.departamentoNombre,
          usuariosEliminados: snapUsuarios.docs.length,
        },
      });

      fetchEmpleados();
      notify.deleted("Empleado");
      return true;
    } catch (error) {
      console.error("Error al eliminar", error);
      notify.deleteError("el empleado");
      return false;
    }
  };

  const getRolEmpleadoId = async () => {
    try {
      const q = query(
        collection(db, "roles"),
        where("nombre", "==", "Empleado"),
      );
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
    empleadoDni,
  }) => {
    const q = query(
      collection(db, "usuarios"),
      where("empleadoId", "==", empleadoIdDoc),
    );
    const snap = await getDocs(q);

    const payloadBase = {
      empleadoId: empleadoIdDoc,
      nombre: `${empleadoNombres} ${empleadoApellidos}`.trim(),
      correo: empleadoCorreo,
      correoPersonal: empleadoCorreo,
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
    const password = generarPasswordTemporal(empleadoApellidos, empleadoDni);

    await addDoc(collection(db, "usuarios"), {
      ...payloadBase,
      rolId: rolEmpleadoId,
      rolNombre: "Empleado",
      primerLoginHecho: false,
      passwordTemporal: password,
      fechaRegistro: serverTimestamp(),
    });

    try {
      await enviarCorreoCredenciales({
        nombre: `${empleadoNombres} ${empleadoApellidos}`.trim(),
        correoInstitucional: empleadoCorreo,
        passwordGenerada: password,
        correoDestino: empleadoCorreo,
      });
    } catch (emailErr) {
      console.error("Usuario creado pero falló el correo:", emailErr);
      notify.warning({
        title: "Empleado creado",
        description:
          "El usuario se generó, pero no se pudo enviar el correo de credenciales.",
      });
    }
  };

  const guardarEmpleado = async ({
    codigoEmpleado,
    nombres,
    apellidos,
    correo,
    dni,
    telefono,
    departamentoId,
    departamentoNombre,
    salario,
    fechaInicio,
    estado,
    onSuccess,
  }) => {
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
        fechaInicio: parseDateValue(fechaInicio) || new Date(),
        estado,
        fechaRegistro: serverTimestamp(),
      });

      await syncUsuarioConEmpleado({
        empleadoIdDoc: docRef.id,
        empleadoNombres: nombres,
        empleadoApellidos: apellidos,
        empleadoCorreo: correo,
        empleadoEstado: estado,
        empleadoDni: dni,
      });

      await registrarBitacora({
        usuario: user?.email ?? "desconocido",
        nombre: nombreEmpleado || user?.email || "desconocido",
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

      await fetchEmpleados();
      await fetchHistorialEmpleados();
      notify.created("Empleado");
      await onSuccess?.();
      return true;
    } catch (error) {
      console.error("Error al guardar", error);
      notify.saveError("el empleado");
      return false;
    }
  };

  const actualizarEmpleado = async ({
    editandoId,
    codigoEmpleado,
    nombres,
    apellidos,
    correo,
    dni,
    telefono,
    departamentoId,
    departamentoNombre,
    salario,
    fechaInicio,
    estado,
    onSuccess,
  }) => {
    if (!editandoId) return false;

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
        fechaInicio: parseDateValue(fechaInicio) || new Date(),
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

      const fechaAnterior = (() => {
        if (!empleadoAnterior?.fechaInicio) return "";
        try {
          const date = empleadoAnterior.fechaInicio.toDate
            ? empleadoAnterior.fechaInicio.toDate()
            : new Date(empleadoAnterior.fechaInicio);
          return date.toISOString().split("T")[0];
        } catch {
          return "";
        }
      })();

      await registrarBitacora({
        usuario: user?.email ?? "desconocido",
        nombre: nombreEmpleado || user?.email || "desconocido",
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
          ...(fechaAnterior !== fechaInicio && {
            fechaInicioAnterior: fechaAnterior || "Sin registro",
            fechaInicioNueva: fechaInicio,
          }),
        },
      });

      await fetchEmpleados();
      notify.updated("Empleado");
      await onSuccess?.();
      return true;
    } catch (error) {
      console.error("Error al actualizar", error);
      notify.updateError("el empleado");
      return false;
    }
  };

  return {
    empleados,
    historialEmpleados,
    departamentos,
    loading,
    totalEmpleados,
    empleadosActivos,
    empleadosInactivos,
    empleadosFiltrados,
    textoFiltrosPdf,
    filtroDepartamento,
    setFiltroDepartamento,
    filtroEstado,
    setFiltroEstado,
    guardarEmpleado,
    actualizarEmpleado,
    handleEliminar,
    fetchEmpleados,
  };
}
