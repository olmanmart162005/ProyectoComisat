import { useEffect, useMemo, useState } from "react";
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
import { registrarBitacora } from "../../../services/bitacora";
import {
  generarPasswordTemporal,
  enviarCorreoCredenciales,
} from "../../../services/credencialesEmail";

export const useUsuarios = ({ closeModal, user, nombreEmpleado }) => {
  const [usuarios, setUsuarios] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busquedaEmpleado, setBusquedaEmpleado] = useState("");
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);

  const [editandoId, setEditandoId] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const [empleadoId, setEmpleadoId] = useState("");
  const [nombre, setNombre] = useState("");
  const [correoPersonal, setCorreoPersonal] = useState("");
  const [correo, setCorreo] = useState("");
  const [rolId, setRolId] = useState("");
  const [rolNombre, setRolNombre] = useState("");
  const [estado, setEstado] = useState("Activo");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroRol, setFiltroRol] = useState("");

  const totalUsuarios = usuarios.length;
  const usuariosActivos = usuarios.filter((u) => u.estado === "Activo").length;
  const usuariosInactivos = usuarios.filter(
    (u) => u.estado === "Inactivo",
  ).length;

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

  // Reemplaza handleSubmit completo
  const handleSubmit = async (e, { onSuccess } = {}) => {
    e.preventDefault();
    setEnviando(true);
    try {
      // Obtener DNI del empleado seleccionado
      const empSeleccionado = empleados.find((em) => em.id === empleadoId);
      const apellidosEmpleado = empSeleccionado?.apellidos ?? "";
      const dniEmpleado = empSeleccionado?.dni ?? "";

      const passwordTemporal = generarPasswordTemporal(
        apellidosEmpleado,
        dniEmpleado,
      );

      await addDoc(collection(db, "usuarios"), {
        empleadoId,
        nombre,
        correoPersonal,
        correo,
        rolId,
        rolNombre,
        estado,
        primerLoginHecho: false,
        passwordTemporal, // para que el DB manager la use al registrar en Firebase Auth
        fechaRegistro: serverTimestamp(),
      });

      await registrarBitacora({
        usuario: user?.email || "Sistema",
        nombre: nombreEmpleado || "Sistema",
        coleccion: "usuarios",
        accion: "creacion",
        metadata: {
          nombre,
          correo,
          correoPersonal,
          rolNombre,
          estado,
          empleadoId,
        },
      });

      // Enviar correo con credenciales al correo personal del empleado
      try {
        await enviarCorreoCredenciales({
          nombre,
          correoInstitucional: correo,
          passwordGenerada: passwordTemporal,
          correoDestino: correoPersonal,
        });
      } catch (emailErr) {
        console.error("Usuario creado pero falló el correo:", emailErr);
        sileo.warning({
          title: "Usuario creado",
          description:
            "El usuario se registró, pero no se pudo enviar el correo de credenciales.",
        });
        resetFormulario();
        fetchUsuarios();
        closeModal?.();
        return;
      }

      resetFormulario();
      fetchUsuarios();
      closeModal?.();
      onSuccess?.();
      sileo.success({
        title: "Usuario creado",
        description: "Credenciales enviadas al correo personal del empleado.",
      });
    } catch (error) {
      console.error("Error al guardar", error);
      sileo.error("Error al guardar");
    } finally {
      setEnviando(false);
    }
  };

  const handleUpdate = async (e, { onSuccess } = {}) => {
    e.preventDefault();
    setEnviando(true);
    try {
      const usuarioAnterior = usuarios.find((u) => u.id === editandoId);

      await updateDoc(doc(db, "usuarios", editandoId), {
        empleadoId,
        nombre,
        correo,
        rolId,
        rolNombre,
        estado,
        ultima_modificacion: serverTimestamp(),
      });

      await registrarBitacora({
        usuario: user?.email || "Sistema",
        nombre: nombreEmpleado || "Sistema",
        coleccion: "usuarios",
        accion: "actualizacion",
        docId: editandoId,
        metadata: {
          nombre,
          ...(usuarioAnterior?.correo !== correo && {
            correoAnterior: usuarioAnterior?.correo,
            correoNuevo: correo,
          }),
          ...(usuarioAnterior?.rolNombre !== rolNombre && {
            rolAnterior: usuarioAnterior?.rolNombre,
            rolNuevo: rolNombre,
          }),
          ...(usuarioAnterior?.estado !== estado && {
            estadoAnterior: usuarioAnterior?.estado,
            estadoNuevo: estado,
          }),
        },
      });

      resetFormulario();
      fetchUsuarios();
      closeModal?.();
      onSuccess?.();
      setTimeout(() => sileo.success("Usuario actualizado"), 150);
    } catch (error) {
      console.error("Error al actualizar", error);
      sileo.error("Error al actualizar");
    } finally {
      setEnviando(false);
    }
  };

  const handleEliminar = async (id) => {
    try {
      const usuarioAEliminar = usuarios.find((u) => u.id === id);
      await deleteDoc(doc(db, "usuarios", id));

      await registrarBitacora({
        usuario: user?.email || "Sistema",
        nombre: nombreEmpleado || "Sistema",
        coleccion: "usuarios",
        accion: "eliminacion",
        docId: id,
        metadata: {
          nombre: usuarioAEliminar?.nombre,
          correo: usuarioAEliminar?.correo,
          rolNombre: usuarioAEliminar?.rolNombre,
          estado: usuarioAEliminar?.estado,
        },
      });

      fetchUsuarios();
      sileo.success("Usuario eliminado");
      return true;
    } catch (error) {
      console.error("Error al eliminar", error);
      sileo.error("Error al eliminar");
      return false;
    }
  };

  const resetFormulario = () => {
    setEditandoId(null);
    if (empleados.length > 0) {
      setEmpleadoId(empleados[0].id);
      setNombre(
        `${empleados[0].nombres ?? ""} ${empleados[0].apellidos ?? ""}`.trim(),
      );
      setBusquedaEmpleado("");
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

  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((u) => {
      const coincideRol = filtroRol ? u.rolId === filtroRol : true;
      const coincideEstado = filtroEstado ? u.estado === filtroEstado : true;
      return coincideRol && coincideEstado;
    });
  }, [usuarios, filtroRol, filtroEstado]);

  const textoFiltrosPdf = [
    filtroRol
      ? `Rol: ${roles.find((r) => r.id === filtroRol)?.nombre ?? filtroRol}`
      : null,
    filtroEstado ? `Estado: ${filtroEstado}` : null,
  ]
    .filter(Boolean)
    .join(" | ");

  return {
    usuarios,
    empleados,
    roles,
    loading,
    busquedaEmpleado,
    setBusquedaEmpleado,
    mostrarSugerencias,
    setMostrarSugerencias,
    editandoId,
    setEditandoId,
    enviando,
    empleadoId,
    setEmpleadoId,
    nombre,
    setNombre,
    correoPersonal,
    setCorreoPersonal,
    correo,
    setCorreo,
    rolId,
    setRolId,
    rolNombre,
    setRolNombre,
    estado,
    setEstado,
    filtroEstado,
    setFiltroEstado,
    filtroRol,
    setFiltroRol,
    totalUsuarios,
    usuariosActivos,
    usuariosInactivos,
    usuariosFiltrados,
    textoFiltrosPdf,
    handleEmpleadoChange,
    handleRolChange,
    handleSubmit,
    handleUpdate,
    handleEliminar,
    resetFormulario,
    fetchUsuarios,
  };
};
