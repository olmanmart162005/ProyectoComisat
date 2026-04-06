import { useEffect, useMemo, useState } from "react";
import { db } from "../../../firebase/firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";

export function useHistorialEmpleados() {
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroDepartamento, setFiltroDepartamento] = useState("");

  const fetchHistorial = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "historialEmpleados"), orderBy("fechaBaja", "desc"));
      const snap = await getDocs(q);
      setHistorial(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error("Error al cargar historial de empleados:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistorial();
  }, []);

  const departamentos = useMemo(() => {
    const deps = new Set(historial.map((h) => h.departamentoNombre).filter(Boolean));
    return Array.from(deps).sort();
  }, [historial]);

  const historialFiltrado = useMemo(() => {
    if (!filtroDepartamento) return historial;
    return historial.filter((h) => h.departamentoNombre === filtroDepartamento);
  }, [historial, filtroDepartamento]);

  const mesActual = new Date();
  mesActual.setDate(1);
  mesActual.setHours(0, 0, 0, 0);

  const bajasEsteMes = historial.filter((h) => {
    const f = h.fechaBaja?.toDate?.();
    return f && f >= mesActual;
  }).length;

  const totalUsuariosEliminados = historial.reduce((acc, h) => acc + (Number(h.usuariosEliminados) || 0), 0);

  return {
    historial,
    loading,
    filtroDepartamento,
    setFiltroDepartamento,
    departamentos,
    historialFiltrado,
    bajasEsteMes,
    totalUsuariosEliminados,
  };
}
