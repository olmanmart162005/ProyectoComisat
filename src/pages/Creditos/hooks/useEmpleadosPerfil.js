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
const normalizarTexto = (valor) =>
  String(valor ?? "")
    .trim()
    .toLowerCase();
const getKeysEmpleado = (empleado) =>
  [empleado?.id, empleado?.empleadoId, empleado?.codigoEmpleado]
    .map(normalizarTexto)
    .filter(Boolean);
const getKeyCredito = (credito) =>
  normalizarTexto(
    credito?.empleadoId ?? credito?.empleadoUid ?? credito?.idEmpleado,
  );
const esCreditoActivo = (credito) => {
  const aprobado = normalizarTexto(credito?.estado) === "aprobado";
  const estadoCredito = normalizarTexto(credito?.estadoCredito);
  const sigueActivo = !["pagado", "cancelado", "finalizado"].includes(
    estadoCredito,
  );
  return aprobado && sigueActivo;
};
const tieneCreditoActivoEmpleado = (empleado, creditos) => {
  const keysEmpleado = getKeysEmpleado(empleado);
  return creditos.some(
    (credito) =>
      esCreditoActivo(credito) && keysEmpleado.includes(getKeyCredito(credito)),
  );
};
export function useEmpleadosPerfil() {
  const [empleados, setEmpleados] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [creditos, setCreditos] = useState([]);
  const [porcentajeLimite, setPorcentajeLimite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filtroDepartamento, setFiltroDepartamento] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroCreditoActivo, setFiltroCreditoActivo] = useState("");
  const fetchDatos = async () => {
    setLoading(true);
    try {
      const [snapEmpleados, snapDeps, snapConfig, snapCreditos] =
        await Promise.all([
          getDocs(
            query(collection(db, "empleados"), orderBy("nombres", "asc")),
          ),
          getDocs(collection(db, "departamentos")),
          getDoc(doc(db, "configuracion", "creditoComisariato")),
          getDocs(collection(db, "creditos")),
        ]);
      setEmpleados(
        snapEmpleados.docs.map((d) =>
          normalizarEmpleado({ id: d.id, ...d.data() }),
        ),
      );
      setDepartamentos(snapDeps.docs.map((d) => ({ id: d.id, ...d.data() })));
      setCreditos(snapCreditos.docs.map((d) => ({ id: d.id, ...d.data() })));
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
  const empleadosConEstadoCredito = useMemo(() => {
    return empleados.map((e) => {
      const tieneCreditoActivo = tieneCreditoActivoEmpleado(e, creditos);
      return {
        ...e,
        creditoActivo: tieneCreditoActivo ? "Sí" : "No",
        estadoCredito: tieneCreditoActivo ? "Activo" : "Sin crédito activo",
      };
    });
  }, [empleados, creditos]);
  const empleadosFiltrados = useMemo(() => {
    return empleadosConEstadoCredito.filter((e) => {
      const porDep = filtroDepartamento
        ? e.departamentoId === filtroDepartamento
        : true;
      const porEstado = filtroEstado
        ? getEstadoEmpleado(e) === filtroEstado
        : true;
      const porCredito = filtroCreditoActivo
        ? filtroCreditoActivo === "activo"
          ? e.creditoActivo === "Sí"
          : e.creditoActivo === "No"
        : true;
      return porDep && porEstado && porCredito;
    });
  }, [
    empleadosConEstadoCredito,
    filtroDepartamento,
    filtroEstado,
    filtroCreditoActivo,
  ]);
  const getEstadoCreditoEmpleado = (empleado) => {
    return empleado?.creditoActivo === "Sí" ? "Sí" : "No";
  };
  const totalConCreditoActivo = useMemo(
    () =>
      empleadosConEstadoCredito.filter((e) => e.creditoActivo === "Sí").length,
    [empleadosConEstadoCredito],
  );
  const textoFiltrosPdf = useMemo(() => {
    const partes = [];
    if (filtroDepartamento) {
      const dep = departamentos.find((d) => d.id === filtroDepartamento);
      partes.push(`Departamento: ${dep?.nombre ?? filtroDepartamento}`);
    }
    if (filtroEstado) {
      partes.push(`Estado: ${filtroEstado}`);
    }
    if (filtroCreditoActivo) {
      partes.push(
        `Crédito: ${filtroCreditoActivo === "activo" ? "Con crédito activo" : "Sin crédito activo"}`,
      );
    }
    return partes.length > 0
      ? `Filtros activos: ${partes.join(" | ")}`
      : "Listado Completo";
  }, [departamentos, filtroCreditoActivo, filtroDepartamento, filtroEstado]);
  return {
    empleados,
    departamentos,
    porcentajeLimite,
    loading,
    filtroDepartamento,
    setFiltroDepartamento,
    filtroEstado,
    setFiltroEstado,
    filtroCreditoActivo,
    setFiltroCreditoActivo,
    totalActivos,
    totalInactivos,
    totalDepartamentos,
    totalConCreditoActivo,
    empleadosFiltrados,
    empleadosConEstadoCredito,
    textoFiltrosPdf,
    getEstadoEmpleado,
    getEstadoCreditoEmpleado,
  };
}