import { useEffect, useMemo, useState } from "react";
import { db } from "../../../firebase/firebase";
import {
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  orderBy,
} from "firebase/firestore";

export const getEstadoEmpleado = (empleado) => {
  if (empleado.estado === "Inactivo") return "Inactivo";
  return "Activo";
};

const normalizarEmpleado = (empleado) => ({
  ...empleado,
  fechaRegistro: empleado?.fechaRegistro ?? empleado?.FechaRegistro ?? null,
});

export function useEmpleadosPerfil() {
  const [empleados, setEmpleados] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [porcentajeLimite, setPorcentajeLimite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filtroDepartamento, setFiltroDepartamento] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");

  const fetchDatos = async () => {
    setLoading(true);
    try {
      const [snapEmpleados, snapDeps, snapConfig] = await Promise.all([
        getDocs(query(collection(db, "empleados"), orderBy("nombres", "asc"))),
        getDocs(collection(db, "departamentos")),
        getDoc(doc(db, "configuracion", "creditoComisariato")),
      ]);
      setEmpleados(
        snapEmpleados.docs.map((d) =>
          normalizarEmpleado({ id: d.id, ...d.data() }),
        ),
      );
      setDepartamentos(snapDeps.docs.map((d) => ({ id: d.id, ...d.data() })));
      if (snapConfig.exists()) {
        setPorcentajeLimite(snapConfig.data().porcentajeLimite ?? null);
      }
    } catch (err) {
      console.error("Error al cargar empleados:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatos();
  }, []);

  const { totalActivos, totalInactivos, totalDepartamentos } = useMemo(() => {
    return {
      totalActivos: empleados.filter((e) => getEstadoEmpleado(e) === "Activo")
        .length,
      totalInactivos: empleados.filter(
        (e) => getEstadoEmpleado(e) === "Inactivo",
      ).length,
      totalDepartamentos: new Set(empleados.map((e) => e.departamentoId)).size,
    };
  }, [empleados]);

  const empleadosFiltrados = useMemo(() => {
    return empleados.filter((e) => {
      const porDep = filtroDepartamento
        ? e.departamentoId === filtroDepartamento
        : true;
      const porEstado = filtroEstado
        ? getEstadoEmpleado(e) === filtroEstado
        : true;
      return porDep && porEstado;
    });
  }, [empleados, filtroDepartamento, filtroEstado]);

  return {
    empleados,
    departamentos,
    porcentajeLimite,
    loading,
    filtroDepartamento,
    setFiltroDepartamento,
    filtroEstado,
    setFiltroEstado,
    totalActivos,
    totalInactivos,
    totalDepartamentos,
    empleadosFiltrados,
    getEstadoEmpleado,
  };
}
