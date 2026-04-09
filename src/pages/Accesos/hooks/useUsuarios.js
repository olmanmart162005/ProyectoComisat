import { useCallback, useEffect, useMemo, useState } from "react";
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
import { registrarBitacora } from "../../../services/bitacora";
import { notify } from "../../../services/notifier";
import {
  generarPasswordTemporal,
  enviarCorreoCredenciales,
} from "../../../services/credencialesEmail";

const DOMINIO_CORREO_INSTITUCIONAL = "@comisat.com";

const normalizarTexto = (valor) =>
  String(valor ?? "")
    .trim()
    .toLowerCase();

const esRolEmpleado = (rol) => normalizarTexto(rol?.nombre) === "empleado";

const extraerLocalPartCorreo = (correoCompleto) => {
  const correo = String(correoCompleto ?? "")
    .trim()
    .toLowerCase();
  if (!correo) return "";
  return correo.replace(DOMINIO_CORREO_INSTITUCIONAL, "").replace(/@.*/, "");
};

const normalizarLocalPartCorreo = (valor) =>
  String(valor ?? "")
    .toLowerCase()
    .replace(/@/g, "")
    .replace(/[^a-z0-9._-]/g, "")
    .replace(/\s+/g, "")
    .trim();

const construirCorreoInstitucional = (localPart) =>
  `${normalizarLocalPartCorreo(localPart)}${DOMINIO_CORREO_INSTITUCIONAL}`;

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
    } catch (error) {
      console.error("Error al cargar empleados:", error);
      notify.loadError("los empleados");
    }
  };

  const fetchRoles = async () => {
    try {
      const snap = await getDocs(collection(db, "roles"));
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setRoles(docs);
      const rolPorDefecto = docs.find((r) => !esRolEmpleado(r)) ?? docs[0];
      if (rolPorDefecto) {
        setRolId(rolPorDefecto.id);
        setRolNombre(rolPorDefecto.nombre ?? "");
      }
    } catch (error) {
      console.error("Error al cargar roles:", error);
      notify.loadError("los roles");
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
      notify.loadError("los usuarios");
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

  const rolesAsignables = useMemo(
    () => roles.filter((rol) => !esRolEmpleado(rol)),
    [roles],
  );

  const empleadosDisponibles = useMemo(() => {
    return empleados;
  }, [empleados]);

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

      const correoLocal = normalizarLocalPartCorreo(correo);
      if (!correoLocal) {
        notify.warning("Ingresa el usuario del correo institucional.");
        setEnviando(false);
        return;
      }
      const correoInstitucional = construirCorreoInstitucional(correoLocal);

      await addDoc(collection(db, "usuarios"), {
        empleadoId,
        nombre,
        correoPersonal,
        correo: correoInstitucional,
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
          correo: correoInstitucional,
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
          correoInstitucional,
          passwordGenerada: passwordTemporal,
          correoDestino: correoPersonal,
        });
      } catch (emailErr) {
        console.error("Usuario creado pero falló el correo:", emailErr);
        notify.warning({
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
      notify.success({
        title: "Usuario creado",
        description: "Credenciales enviadas al correo personal del empleado.",
      });
    } catch (error) {
      console.error("Error al guardar", error);
      notify.saveError("el usuario");
    } finally {
      setEnviando(false);
    }
  };

  const handleUpdate = async (e, { onSuccess } = {}) => {
    e.preventDefault();
    setEnviando(true);
    try {
      const usuarioAnterior = usuarios.find((u) => u.id === editandoId);

      const correoLocal = normalizarLocalPartCorreo(correo);
      if (!correoLocal) {
        notify.warning("Ingresa el usuario del correo institucional.");
        setEnviando(false);
        return;
      }
      const correoInstitucional = construirCorreoInstitucional(correoLocal);

      await updateDoc(doc(db, "usuarios", editandoId), {
        empleadoId,
        nombre,
        correoPersonal,
        correo: correoInstitucional,
        rolId,
        rolNombre,
        estado,
        ultimaModificacion: serverTimestamp(),
      });

      await registrarBitacora({
        usuario: user?.email || "Sistema",
        nombre: nombreEmpleado || "Sistema",
        coleccion: "usuarios",
        accion: "actualizacion",
        docId: editandoId,
        metadata: {
          nombre,
          ...(usuarioAnterior?.correo !== correoInstitucional && {
            correoAnterior: usuarioAnterior?.correo,
            correoNuevo: correoInstitucional,
          }),
          ...(usuarioAnterior?.correoPersonal !== correoPersonal && {
            correoPersonalAnterior: usuarioAnterior?.correoPersonal,
            correoPersonalNuevo: correoPersonal,
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
      setTimeout(() => notify.updated("Usuario"), 150);
    } catch (error) {
      console.error("Error al actualizar", error);
      notify.updateError("el usuario");
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
      notify.deleted("Usuario");
      return true;
    } catch (error) {
      console.error("Error al eliminar", error);
      notify.deleteError("el usuario");
      return false;
    }
  };

  const resetFormulario = useCallback(() => {
    setEditandoId(null);
    setEmpleadoId("");
    setNombre("");
    setBusquedaEmpleado("");
    setCorreoPersonal("");
    setCorreo("");

    const rolPorDefecto = rolesAsignables[0] ?? roles[0];
    if (rolPorDefecto) {
      setRolId(rolPorDefecto.id);
      setRolNombre(rolPorDefecto.nombre ?? "");
    } else {
      setRolId("");
      setRolNombre("");
    }
    setEstado("Activo");
  }, [rolesAsignables, roles]);

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
    rolesAsignables,
    loading,
    empleadosDisponibles,
    DOMINIO_CORREO_INSTITUCIONAL,
    extraerLocalPartCorreo,
    normalizarLocalPartCorreo,
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
