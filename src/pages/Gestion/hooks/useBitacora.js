import { useEffect, useMemo, useState } from "react";
import { db } from "../../../firebase/firebase";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";

export function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function resumirMetadata(accion, metadata = {}) {
  if (!metadata || Object.keys(metadata).length === 0) return "—";
  if (metadata.detalle) return metadata.detalle;
  switch (accion) {
    case "creacion":
      return metadata.nombre ?? metadata.nombreCompleto ?? "—";
    case "actualizacion": {
      const partes = [];
      const base = metadata.nombre ?? metadata.nombreCompleto;
      if (base) partes.push(base);
      if (metadata.stockAnterior !== undefined)
        partes.push(`Stock: ${metadata.stockAnterior} → ${metadata.stockNuevo}`);
      if (metadata.estadoAnterior !== undefined)
        partes.push(`Estado: ${metadata.estadoAnterior} → ${metadata.estadoNuevo}`);
      if (metadata.salarioAnterior !== undefined)
        partes.push(`Salario: L.${metadata.salarioAnterior} → L.${metadata.salarioNuevo}`);
      if (metadata.departamentoAnterior !== undefined)
        partes.push(
          `Depto: ${metadata.departamentoAnterior} → ${metadata.departamentoNuevo}`,
        );
      return partes.join(" · ") || "—";
    }
    case "eliminacion":
      return metadata.nombre ?? metadata.nombreCompleto ?? "—";
    case "exportar":
      return `${(metadata.formato ?? "—").toUpperCase()} · ${metadata.totalRegistros ?? 0} registros`;
    case "aprobacion":
    case "rechazo":
      return metadata.empleado
        ? `${metadata.empleado}${metadata.producto ? " — " + metadata.producto : ""}`
        : "—";
    default:
      return "—";
  }
}

export function useBitacora() {
  const [registros, setRegistros] = useState([]);
  const [todosLosRegistros, setTodosLosRegistros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroColeccion, setFiltroColeccion] = useState("");
  const [filtroAccion, setFiltroAccion] = useState("");
  const [rangoFecha, setRangoFecha] = useState("");
  const [rangoPersonalizado, setRangoPersonalizado] = useState([null, null]);

  const [fechaInicioDP, fechaFinDP] = rangoPersonalizado;

  const coleccionesDinamicas = useMemo(() => {
    const set = new Set();
    todosLosRegistros.forEach((r) => {
      if (r.coleccion) set.add(r.coleccion);
    });
    return Array.from(set).map((val) => ({
      value: val,
      label: capitalize(val),
    }));
  }, [todosLosRegistros]);

  const accionesDinamicas = useMemo(() => {
    const set = new Set();
    todosLosRegistros.forEach((r) => {
      if (r.accion) set.add(r.accion.toLowerCase());
      if (r.accion) set.add(capitalize(r.accion));
    });

    const unique = Array.from(set).reduce((acc, val) => {
      if (!acc.some((v) => v.toLowerCase() === val.toLowerCase())) acc.push(val);
      return acc;
    }, []);

    return unique.map((val) => ({ value: val, label: capitalize(val) }));
  }, [todosLosRegistros]);

  const fetchBitacora = async () => {
    setLoading(true);
    try {
      const qCompleta = query(collection(db, "bitacora"), orderBy("fecha", "desc"));
      const snapCompleta = await getDocs(qCompleta);
      const todos = snapCompleta.docs.map((d) => ({ id: d.id, ...d.data() }));
      setTodosLosRegistros(todos);

      let q;
      const filtroAccionLower = filtroAccion ? filtroAccion.toLowerCase() : "";
      const filtroAccionCap = filtroAccion ? capitalize(filtroAccionLower) : "";

      if (filtroColeccion && filtroAccion) {
        q = query(
          collection(db, "bitacora"),
          where("coleccion", "==", filtroColeccion),
          where("accion", "in", [filtroAccionLower, filtroAccionCap]),
          orderBy("fecha", "desc"),
        );
      } else if (filtroColeccion) {
        q = query(
          collection(db, "bitacora"),
          where("coleccion", "==", filtroColeccion),
          orderBy("fecha", "desc"),
        );
      } else if (filtroAccion) {
        q = query(
          collection(db, "bitacora"),
          where("accion", "in", [filtroAccionLower, filtroAccionCap]),
          orderBy("fecha", "desc"),
        );
      } else {
        setRegistros(todos);
        return;
      }

      const snap = await getDocs(q);
      setRegistros(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error("Error al cargar bitácora:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBitacora();
  }, [filtroColeccion, filtroAccion]);

  const limitesFecha = useMemo(() => {
    const hoy = new Date();
    switch (rangoFecha) {
      case "hoy": {
        const inicio = new Date(hoy);
        inicio.setHours(0, 0, 0, 0);
        const fin = new Date(hoy);
        fin.setHours(23, 59, 59, 999);
        return { inicio, fin };
      }
      case "semana": {
        const inicio = new Date(hoy);
        inicio.setDate(hoy.getDate() - 6);
        inicio.setHours(0, 0, 0, 0);
        const fin = new Date(hoy);
        fin.setHours(23, 59, 59, 999);
        return { inicio, fin };
      }
      case "mes": {
        const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        inicio.setHours(0, 0, 0, 0);
        const fin = new Date(hoy);
        fin.setHours(23, 59, 59, 999);
        return { inicio, fin };
      }
      case "anio": {
        const inicio = new Date(hoy.getFullYear(), 0, 1);
        inicio.setHours(0, 0, 0, 0);
        const fin = new Date(hoy);
        fin.setHours(23, 59, 59, 999);
        return { inicio, fin };
      }
      case "personalizado": {
        const inicio = fechaInicioDP ? new Date(fechaInicioDP) : null;
        if (inicio) inicio.setHours(0, 0, 0, 0);
        const fin = fechaFinDP ? new Date(fechaFinDP) : null;
        if (fin) fin.setHours(23, 59, 59, 999);
        return { inicio, fin };
      }
      default:
        return { inicio: null, fin: null };
    }
  }, [rangoFecha, fechaInicioDP, fechaFinDP]);

  const registrosFiltrados = useMemo(() => {
    const { inicio, fin } = limitesFecha;
    if (!inicio && !fin) return registros;

    return registros.filter((r) => {
      const fecha = r.fecha?.toDate?.();
      if (!fecha) return false;
      if (inicio && fecha < inicio) return false;
      if (fin && fecha > fin) return false;
      return true;
    });
  }, [registros, limitesFecha]);

  const hoyInicio = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const totalHoy = useMemo(
    () =>
      todosLosRegistros.filter((r) => {
        const f = r.fecha?.toDate?.();
        return f && f >= hoyInicio;
      }).length,
    [todosLosRegistros, hoyInicio],
  );

  const totalEliminaciones = useMemo(() => {
    return todosLosRegistros.filter((r) => r.accion === "eliminacion").length;
  }, [todosLosRegistros]);

  const totalExportaciones = useMemo(() => {
    return todosLosRegistros.filter((r) => r.accion === "exportar").length;
  }, [todosLosRegistros]);

  return {
    registros,
    registrosFiltrados,
    loading,
    filtroColeccion,
    setFiltroColeccion,
    filtroAccion,
    setFiltroAccion,
    rangoFecha,
    setRangoFecha,
    rangoPersonalizado,
    setRangoPersonalizado,
    coleccionesDinamicas,
    accionesDinamicas,
    totalHoy,
    totalEliminaciones,
    totalExportaciones,
  };
}
