import { useEffect, useMemo, useState } from "react";
import { db } from "../../../firebase/firebase";
import { collection, getDocs } from "firebase/firestore";

export const estadoCreditoColor = {
  Activo: "success",
  Pagado: "info",
  Cancelado: "error",
  Finalizado: "warning",
};

export const ESTADOS_CREDITO = ["Activo", "Pagado", "Cancelado", "Finalizado"];

export function useHistorialCreditos() {
  const [todasCuotas, setTodasCuotas] = useState([]);
  const [todosCreditos, setTodosCreditos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [rangoFecha, setRangoFecha] = useState("mes");
  const [rangoPersonalizado, setRangoPersonalizado] = useState([null, null]);
  const [filtroEstado, setFiltroEstado] = useState("");

  const fetchDatos = async () => {
    setLoading(true);
    try {
      const [snapCuotas, snapCreditos] = await Promise.all([
        getDocs(collection(db, "cuotas")),
        getDocs(collection(db, "creditos")),
      ]);
      setTodasCuotas(snapCuotas.docs.map((d) => ({ id: d.id, ...d.data() })));
      setTodosCreditos(snapCreditos.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Error al cargar historial:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatos();
  }, []);

  const fechaInicioDP = rangoPersonalizado[0];
  const fechaFinDP = rangoPersonalizado[1];

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

  const extractDate = (val) => {
    if (!val) return null;
    if (typeof val.toDate === "function") return val.toDate();
    if (val instanceof Date) return val;
    const seconds = val.seconds ?? val._seconds;
    if (typeof seconds === "number") return new Date(seconds * 1000);
    return null;
  };

  const creditosFiltradosPorEstado = useMemo(() => {
    if (!filtroEstado) return todosCreditos;
    return todosCreditos.filter((c) => {
      const estado = c.estadoCredito || "Activo";
      return estado.toLowerCase() === filtroEstado.toLowerCase();
    });
  }, [todosCreditos, filtroEstado]);

  const creditosIdSet = useMemo(() => {
    return new Set(creditosFiltradosPorEstado.map(c => c.id));
  }, [creditosFiltradosPorEstado]);

  const creditos = useMemo(() => {
    const { inicio, fin } = limitesFecha;
    if (!inicio && !fin) return creditosFiltradosPorEstado;
    return creditosFiltradosPorEstado.filter((r) => {
      const fecha = extractDate(r.fechaAutoriza);
      if (!fecha) return false;
      if (inicio && fecha < inicio) return false;
      if (fin && fecha > fin) return false;
      return true;
    });
  }, [creditosFiltradosPorEstado, limitesFecha]);

  const cuotas = useMemo(() => {
    const { inicio, fin } = limitesFecha;
    
    // Primero filtramos la cuota por estado de credito si se seleccionó uno
    let cuotasBase = todasCuotas;
    if (filtroEstado) {
       cuotasBase = todasCuotas.filter(c => creditosIdSet.has(c.creditoId));
    }

    if (!inicio && !fin) return cuotasBase;
    
    return cuotasBase.filter((c) => {
      const fecha = extractDate(c.fechaCobro);
      if (!fecha) return false;
      if (inicio && fecha < inicio) return false;
      if (fin && fecha > fin) return false;
      return true;
    });
  }, [todasCuotas, limitesFecha, filtroEstado, creditosIdSet]);

  const { totalCuotas, montoTotal, empleadosUnicos, creditosPagados } =
    useMemo(() => {
      const monto = cuotas.reduce(
        (acc, c) => acc + Number(c.montoCuota ?? 0),
        0,
      );
      const empleados = new Set(cuotas.map((c) => c.empleadoId).filter(Boolean));
      const pagados = creditos.filter(
        (c) => String(c.estadoCredito ?? "").toLowerCase() === "pagado",
      ).length;
      return {
        totalCuotas: cuotas.length,
        montoTotal: monto,
        empleadosUnicos: empleados.size,
        creditosPagados: pagados,
      };
    }, [cuotas, creditos]);

  return {
    cuotas,
    creditos,
    loading,
    rangoFecha,
    setRangoFecha,
    rangoPersonalizado,
    setRangoPersonalizado,
    filtroEstado,
    setFiltroEstado,
    totalCuotas,
    montoTotal,
    empleadosUnicos,
    creditosPagados,
  };
}