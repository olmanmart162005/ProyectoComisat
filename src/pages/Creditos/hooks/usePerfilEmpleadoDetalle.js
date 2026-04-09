import { useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "../../../firebase/firebase";
const normalizarEmpleado = (empleado) => {
  if (!empleado) return null;
  return {
    ...empleado,
    fechaInicio: empleado.fechaInicio ?? null,
    fechaRegistro: empleado.fechaRegistro ?? empleado.FechaRegistro ?? null,
  };
};
export function usePerfilEmpleadoDetalle({ empleadoId, state }) {
  const [empleado, setEmpleado] = useState(normalizarEmpleado(state?.empleado));
  const [creditos, setCreditos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [porcentajeLimite, setPorcentajeLimite] = useState(
    state?.porcentajeLimite ?? null,
  );
  useEffect(() => {
    let mounted = true;
    const cargarPerfil = async () => {
      setLoading(true);
      try {
        let empleadoActual = normalizarEmpleado(state?.empleado);
        if (!empleadoActual && empleadoId) {
          const empleadoSnap = await getDoc(doc(db, "empleados", empleadoId));
          if (empleadoSnap.exists()) {
            empleadoActual = normalizarEmpleado({
              id: empleadoSnap.id,
              ...empleadoSnap.data(),
            });
          }
        }
        if (!mounted) return;
        setEmpleado(empleadoActual);
        if (porcentajeLimite == null) {
          const snapConfig = await getDoc(
            doc(db, "configuracion", "creditoComisariato"),
          );
          if (mounted && snapConfig.exists()) {
            setPorcentajeLimite(snapConfig.data().porcentajeLimite ?? null);
          }
        }
        if (!empleadoActual) {
          if (mounted) setCreditos([]);
          return;
        }
        const empleadoIdManual = String(
          empleadoActual.empleadoId ?? empleadoActual.codigoEmpleado ?? "",
        ).trim();
        if (!empleadoIdManual) {
          if (mounted) setCreditos([]);
          return;
        }
        const snapCreditos = await getDocs(
          query(
            collection(db, "creditos"),
            where("empleadoId", "==", empleadoIdManual),
          ),
        );
        const docs = snapCreditos.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => {
            const fa =
              a.fechaAutoriza?.toMillis?.() ??
              a.fechaRegistro?.toMillis?.() ??
              0;
            const fb =
              b.fechaAutoriza?.toMillis?.() ??
              b.fechaRegistro?.toMillis?.() ??
              0;
            return fb - fa;
          });
        if (mounted) setCreditos(docs);
      } catch (error) {
        console.error("Error al cargar perfil de empleado:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    cargarPerfil();
    return () => {
      mounted = false;
    };
  }, [empleadoId, porcentajeLimite, state?.empleado]);
  const esCreditoActivo = (c) => {
    const aprobado = String(c.estado ?? "").toLowerCase() === "aprobado";
    const estadoCredito = String(c.estadoCredito ?? "").toLowerCase();
    const sigueActivo = !["pagado", "cancelado", "finalizado"].includes(
      estadoCredito,
    );
    return aprobado && sigueActivo;
  };
  const creditosActivos = useMemo(
    () => creditos.filter(esCreditoActivo),
    [creditos],
  );
  const historialCreditos = useMemo(
    () =>
      creditos
        .filter((c) =>
          ["aprobado", "aceptado", "rechazado", "cancelado"].includes(
            String(c.estado ?? "").toLowerCase(),
          ),
        )
        .sort((a, b) => {
          const fa =
            a.fechaAutoriza?.toMillis?.() ?? a.fechaRegistro?.toMillis?.() ?? 0;
          const fb =
            b.fechaAutoriza?.toMillis?.() ?? b.fechaRegistro?.toMillis?.() ?? 0;
          return fb - fa;
        }),
    [creditos],
  );
  const cuotaMensualActiva = creditosActivos.reduce(
    (acc, c) =>
      acc +
      Number(c.datosFinancierosHistoricos?.cuotaMensual ?? c.cuotaMensual ?? 0),
    0,
  );
  const saldoPendienteTotal = creditosActivos.reduce(
    (acc, c) => acc + Number(c.saldoPendiente ?? 0),
    0,
  );
  const limiteCapacidad = (empleado?.salario ?? 0) * (porcentajeLimite ?? 0);
  const disponible = Math.max(0, limiteCapacidad - cuotaMensualActiva);
  const porcentajeUsado =
    limiteCapacidad > 0
      ? Math.min(100, Math.round((cuotaMensualActiva / limiteCapacidad) * 100))
      : 0;
  const excedeLimite = cuotaMensualActiva >= limiteCapacidad;
  return {
    empleado,
    creditos,
    loading,
    porcentajeLimite,
    creditosActivos,
    historialCreditos,
    cuotaMensualActiva,
    saldoPendienteTotal,
    limiteCapacidad,
    disponible,
    porcentajeUsado,
    excedeLimite,
  };
}