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
import { sileo } from "sileo";
import { registrarBitacora } from "../../../services/bitacora";

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
    if (window.confirm("¿Estás seguro de que deseas eliminar este empleado?")) {
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
            fechaRegistro: empleadoAEliminar.fechaRegistro,
            empleadoId: id,
            fechaBaja: serverTimestamp(),
            bajadoPor: user.email,
            nombreBajadoPor: nombreEmpleado,
            usuariosEliminados: snapUsuarios.docs.length,
          });
        }

        // ── Paso 3: eliminar el empleado ──
        await deleteDoc(doc(db, "empleados", id));

        // ── Paso 4: bitácora ──
        await registrarBitacora({
          usuario: user.email,
          nombre: nombreEmpleado,
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
        sileo.success("Empleado eliminado correctamente");
      } catch (error) {
        console.error("Error al eliminar", error);
        sileo.error("Error al eliminar");
      }
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
    handleEliminar,
    fetchEmpleados,
  };
}
