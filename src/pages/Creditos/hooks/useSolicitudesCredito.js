import { useEffect, useMemo, useState } from "react";
import { db } from "../../../firebase/firebase";
import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { registrarBitacora } from "../../../services/bitacora";



const getEmpleadoKey = (s) => {
  if (!s) return "";
  return String(
    s.empleadoId ??
      s.empleadoUid ??
      s.idEmpleado ??
      `${s.empleadoNombres ?? ""}|${s.empleadoApellidos ?? ""}`,
  )
    .trim()
    .toLowerCase();
};


// este hook maneja toda la lógica relacionada con solicitudes de crédito: carga, filtrado, selección, etc.
export function useSolicitudesCredito({ user, nombreEmpleado, isOpen }) {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);
  const [filtroEstadoSolicitud, setFiltroEstadoSolicitud] = useState("");
  const [historialPrevioSeleccionado, setHistorialPrevioSeleccionado] =
    useState([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);

  const fetchSolicitudes = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "creditos"),
        orderBy("fechaRegistro", "desc"),
      );
      const snap = await getDocs(q);
      setSolicitudes(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Error al cargar solicitudes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSolicitudes();
  }, []);

  const resumenEmpleadoSeleccionado = useMemo(() => {
    if (!solicitudSeleccionada) {
      return { cantidadActivos: 0, cuotaMensualActiva: 0 };
    }

    const empleadoKey = getEmpleadoKey(solicitudSeleccionada);
    const creditosActivos = solicitudes.filter((s) => {
      const mismoEmpleado = getEmpleadoKey(s) === empleadoKey;
      const aprobado = s.estado === "Aprobado";
      const estadoCredito = String(s.estadoCredito ?? "").toLowerCase();
      const sigueActivo = !["pagado", "cancelado", "finalizado"].includes(
        estadoCredito,
      );
      return mismoEmpleado && aprobado && sigueActivo;
    });

    const cuotaMensualActiva = creditosActivos.reduce(
      (acc, s) =>
        acc +
        Number(
          s.datosFinancierosHistoricos?.cuotaMensual ?? s.cuotaMensual ?? 0,
        ),
      0,
    );

    return {
      cantidadActivos: creditosActivos.length,
      cuotaMensualActiva,
    };
  }, [solicitudSeleccionada, solicitudes]);

  useEffect(() => {
    const cargarHistorialPrevio = async () => {
      if (!isOpen || !solicitudSeleccionada) {
        setHistorialPrevioSeleccionado([]);
        return;
      }

      const toMillis = (fecha) => {
        if (!fecha) return 0;
        if (typeof fecha?.toMillis === "function") return fecha.toMillis();
        const parsed = new Date(fecha).getTime();
        return Number.isNaN(parsed) ? 0 : parsed;
      };

      const estadosHistorial = ["Aprobado", "Rechazado"];

      setLoadingHistorial(true);
      try {
        const empleadoId = solicitudSeleccionada.empleadoId;

        if (empleadoId) {
          const q = query(
            collection(db, "creditos"),
            where("empleadoId", "==", empleadoId),
          );
          const snap = await getDocs(q);
          const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

          const historial = docs
            .filter((s) => estadosHistorial.includes(s.estado))
            .sort((a, b) => {
              const fechaB = toMillis(b.fechaAutoriza ?? b.fechaRegistro);
              const fechaA = toMillis(a.fechaAutoriza ?? a.fechaRegistro);
              return fechaB - fechaA;
            });

          const solicitudActualEsHistorial = estadosHistorial.includes(
            solicitudSeleccionada.estado,
          );
          const yaExisteActual = historial.some(
            (s) => s.id === solicitudSeleccionada.id,
          );

          if (solicitudActualEsHistorial && !yaExisteActual) {
            historial.unshift(solicitudSeleccionada);
          }

          setHistorialPrevioSeleccionado(historial);
          return;
        }

        const empleadoKey = getEmpleadoKey(solicitudSeleccionada);
        const historialFallback = solicitudes
          .filter((s) => getEmpleadoKey(s) === empleadoKey)
          .filter((s) => estadosHistorial.includes(s.estado))
          .sort((a, b) => {
            const fechaB = toMillis(b.fechaAutoriza ?? b.fechaRegistro);
            const fechaA = toMillis(a.fechaAutoriza ?? a.fechaRegistro);
            return fechaB - fechaA;
          });

        setHistorialPrevioSeleccionado(historialFallback);
      } catch (error) {
        console.error("Error al cargar historial previo:", error);
        setHistorialPrevioSeleccionado([]);
      } finally {
        setLoadingHistorial(false);
      }
    };

    cargarHistorialPrevio();
  }, [isOpen, solicitudSeleccionada, solicitudes]);

  const handleDecision = async (nuevoEstado) => {
    if (!solicitudSeleccionada) return;
    setProcesando(true);
    try {
      const fechaLocal = Timestamp.now();
      await updateDoc(doc(db, "creditos", solicitudSeleccionada.id), {
        estado: nuevoEstado,
        ...(nuevoEstado !== "Pendiente" && {
          fechaAutoriza: serverTimestamp(),
          empleadoAutoriza: user?.email ?? "desconocido",
        }),
        ...(nuevoEstado === "Aprobado" && {
          cuotasPagadas: 0,
          saldoPendiente:
            solicitudSeleccionada.datosFinancierosHistoricos?.totalCredito ?? 0,
          estadoCredito: "Activo",
        }),
      });

      setSolicitudes((prev) =>
        prev.map((s) =>
          s.id === solicitudSeleccionada.id
            ? {
                ...s,
                estado: nuevoEstado,
                ...(nuevoEstado !== "Pendiente" && {
                  fechaAutoriza: fechaLocal,
                  empleadoAutoriza: user?.email ?? "desconocido",
                }),
                ...(nuevoEstado === "Aprobado" && {
                  cuotasPagadas: 0,
                  saldoPendiente:
                    solicitudSeleccionada.datosFinancierosHistoricos
                      ?.totalCredito ?? 0,
                  estadoCredito: "Activo",
                }),
              }
            : s,
        ),
      );

      setSolicitudSeleccionada((prev) =>
        prev
          ? {
              ...prev,
              estado: nuevoEstado,
              ...(nuevoEstado !== "Pendiente" && {
                fechaAutoriza: fechaLocal,
                empleadoAutoriza: user?.email ?? "desconocido",
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
        docId: solicitudSeleccionada.id,
        metadata: {
          detalle:
            nuevoEstado === "Aprobado"
              ? `Aprobó la solicitud de crédito para ${solicitudSeleccionada.empleadoNombres} ${solicitudSeleccionada.empleadoApellidos} por L. ${Number(solicitudSeleccionada.datosFinancierosHistoricos?.totalCredito ?? 0).toLocaleString("es-HN")}`
              : `Rechazó la solicitud de crédito para ${solicitudSeleccionada.empleadoNombres} ${solicitudSeleccionada.empleadoApellidos} por L. ${Number(solicitudSeleccionada.datosFinancierosHistoricos?.totalCredito ?? 0).toLocaleString("es-HN")}`,
        },
      });

      alert(`Solicitud ${nuevoEstado} con éxito`);
      fetchSolicitudes();
    } catch (err) {
      console.error("Error al procesar:", err);
      alert("Error al procesar la solicitud");
    } finally {
      setProcesando(false);
    }
  };

  const totalPendientes = solicitudes.filter(
    (s) => s.estado === "Pendiente",
  ).length;
  const totalAprobados = solicitudes.filter(
    (s) => s.estado === "Aprobado",
  ).length;
  const montoEnRiesgo = solicitudes
    .filter((s) => s.estado === "Pendiente")
    .reduce(
      (acc, s) => acc + (s.datosFinancierosHistoricos?.totalCredito ?? 0),
      0,
    );
  const totalRechazados = solicitudes.filter(
    (s) => s.estado === "Rechazado",
  ).length;

  const solicitudesFiltradas = useMemo(() => {
    return solicitudes.filter((s) => {
      if (!filtroEstadoSolicitud) return true;

      const estado = String(s.estado ?? "").toLowerCase();
      return estado === filtroEstadoSolicitud;
    });
  }, [solicitudes, filtroEstadoSolicitud]);

  const textoFiltrosPdf = filtroEstadoSolicitud
    ? `Estado: ${filtroEstadoSolicitud}`
    : "Listado Completo";

  return {
    solicitudes,
    loading,
    procesando,
    solicitudSeleccionada,
    setSolicitudSeleccionada,
    filtroEstadoSolicitud,
    setFiltroEstadoSolicitud,
    historialPrevioSeleccionado,
    loadingHistorial,
    resumenEmpleadoSeleccionado,
    solicitudesFiltradas,
    textoFiltrosPdf,
    totalPendientes,
    totalAprobados,
    totalRechazados,
    montoEnRiesgo,
    handleDecision,
    fetchSolicitudes,
  };
}
