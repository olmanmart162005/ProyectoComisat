import { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "../../../firebase/firebase";
import { registrarBitacora } from "../../../services/bitacora";

const estadosHistorial = ["aprobado", "aceptado", "rechazado", "cancelado"];

const toMillis = (fecha) => {
  if (!fecha) return 0;
  if (typeof fecha?.toMillis === "function") return fecha.toMillis();
  const seconds = fecha?.seconds ?? fecha?._seconds;
  if (typeof seconds === "number") return seconds * 1000;
  if (fecha instanceof Date) return fecha.getTime();
  const parsed = new Date(fecha).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
};

export function useSolicitudDetalle({
  solicitudId,
  initialState,
  user,
  nombreEmpleado,
}) {
  const [solicitud, setSolicitud] = useState(initialState?.solicitud ?? null);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [historialPrevio, setHistorialPrevio] = useState([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [resumenEmpleado, setResumenEmpleado] = useState({
    cantidadActivos: 0,
    cuotaMensualActiva: 0,
  });

  useEffect(() => {
    let mounted = true;

    const cargarSolicitud = async () => {
      setLoading(true);
      try {
        let actual = initialState?.solicitud ?? null;
        if (!actual && solicitudId) {
          const snap = await getDoc(doc(db, "creditos", solicitudId));
          if (snap.exists()) {
            actual = { id: snap.id, ...snap.data() };
          }
        }
        if (mounted) setSolicitud(actual);
      } catch (error) {
        console.error("Error al cargar solicitud:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    cargarSolicitud();
    return () => {
      mounted = false;
    };
  }, [solicitudId, initialState?.solicitud]);

  useEffect(() => {
    let mounted = true;

    const cargarResumenEHistorial = async () => {
      if (!solicitud?.empleadoId) {
        setHistorialPrevio([]);
        setResumenEmpleado({ cantidadActivos: 0, cuotaMensualActiva: 0 });
        return;
      }

      setLoadingHistorial(true);
      try {
        const snap = await getDocs(
          query(
            collection(db, "creditos"),
            where("empleadoId", "==", solicitud.empleadoId),
          ),
        );
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

        const historial = docs
          .filter((s) =>
            estadosHistorial.includes(String(s.estado ?? "").toLowerCase()),
          )
          .sort(
            (a, b) =>
              toMillis(b.fechaAutoriza ?? b.fechaRegistro) -
              toMillis(a.fechaAutoriza ?? a.fechaRegistro),
          );

        const solicitudActualEsHistorial = estadosHistorial.includes(
          String(solicitud.estado ?? "").toLowerCase(),
        );
        const yaExisteActual = historial.some((s) => s.id === solicitud.id);
        if (solicitudActualEsHistorial && !yaExisteActual) {
          historial.unshift(solicitud);
        }

        const activos = docs.filter((s) => {
          const aprobado = s.estado === "Aprobado";
          const estadoCredito = String(s.estadoCredito ?? "").toLowerCase();
          const sigueActivo = !["pagado", "cancelado", "finalizado"].includes(
            estadoCredito,
          );
          return aprobado && sigueActivo;
        });

        const cuotaMensualActiva = activos.reduce(
          (acc, s) =>
            acc +
            Number(
              s.datosFinancierosHistoricos?.cuotaMensual ?? s.cuotaMensual ?? 0,
            ),
          0,
        );

        if (mounted) {
          setHistorialPrevio(historial);
          setResumenEmpleado({
            cantidadActivos: activos.length,
            cuotaMensualActiva,
          });
        }
      } catch (error) {
        console.error("Error al cargar historial/resumen:", error);
        if (mounted) {
          setHistorialPrevio([]);
          setResumenEmpleado({ cantidadActivos: 0, cuotaMensualActiva: 0 });
        }
      } finally {
        if (mounted) setLoadingHistorial(false);
      }
    };

    cargarResumenEHistorial();
    return () => {
      mounted = false;
    };
  }, [solicitud]);

  const fin = solicitud?.datosFinancierosHistoricos ?? {};
  const limite =
    (fin.salarioNetoAlMomento ?? 0) * (fin.porcentajeLimiteAplicado ?? 0);
  const creditoUtilizado = resumenEmpleado.cuotaMensualActiva ?? 0;
  const disponible = Math.max(0, limite - creditoUtilizado);
  const excedeLimite = (fin.cuotaMensual ?? 0) > disponible;
  const limiteConsumido = creditoUtilizado >= limite;
  const isPendiente = solicitud?.estado === "Pendiente";
  const mostrarAuditoria = ["Aprobado", "Rechazado"].includes(
    solicitud?.estado,
  );
  const cantidadSolicitada = solicitud?.cantidad ?? "---";

  const handleDecision = async (nuevoEstado) => {
    if (!solicitud) return;
    setProcesando(true);
    try {
      const nombreAutoriza = nombreEmpleado || user?.email || "desconocido";
      const fechaLocal = Timestamp.now();
      await updateDoc(doc(db, "creditos", solicitud.id), {
        estado: nuevoEstado,
        ...(nuevoEstado !== "Pendiente" && {
          fechaAutoriza: serverTimestamp(),
          empleadoAutoriza: user?.email ?? "desconocido",
          nombreAutoriza,
        }),
        ...(nuevoEstado === "Aprobado" && {
          cuotasPagadas: 0,
          saldoPendiente: fin.totalCredito ?? 0,
          estadoCredito: "Activo",
        }),
      });

      setSolicitud((prev) =>
        prev
          ? {
              ...prev,
              estado: nuevoEstado,
              ...(nuevoEstado !== "Pendiente" && {
                fechaAutoriza: fechaLocal,
                empleadoAutoriza: user?.email ?? "desconocido",
                nombreAutoriza,
              }),
              ...(nuevoEstado === "Aprobado" && {
                cuotasPagadas: 0,
                saldoPendiente:
                  prev.datosFinancierosHistoricos?.totalCredito ?? 0,
                estadoCredito: "Activo",
              }),
            }
          : prev,
      );

      await registrarBitacora({
        usuario: user?.email ?? "desconocido",
        nombre: nombreEmpleado || user?.email || "desconocido",
        coleccion: "creditos",
        accion: nuevoEstado === "Aprobado" ? "Aprobación" : "Rechazo",
        docId: solicitud.id,
        metadata: {
          detalle:
            nuevoEstado === "Aprobado"
              ? `Aprobó la solicitud de crédito para ${solicitud.empleadoNombres} ${solicitud.empleadoApellidos} por L. ${Number(solicitud.datosFinancierosHistoricos?.totalCredito ?? 0).toLocaleString("es-HN")}`
              : `Rechazó la solicitud de crédito para ${solicitud.empleadoNombres} ${solicitud.empleadoApellidos} por L. ${Number(solicitud.datosFinancierosHistoricos?.totalCredito ?? 0).toLocaleString("es-HN")}`,
        },
      });

      alert(`Solicitud ${nuevoEstado} con éxito`);
    } catch (err) {
      console.error("Error al procesar:", err);
      alert("Error al procesar la solicitud");
    } finally {
      setProcesando(false);
    }
  };

  return {
    solicitud,
    loading,
    procesando,
    historialPrevio,
    loadingHistorial,
    resumenEmpleado,
    fin,
    limite,
    creditoUtilizado,
    disponible,
    excedeLimite,
    limiteConsumido,
    isPendiente,
    mostrarAuditoria,
    cantidadSolicitada,
    handleDecision,
  };
}
