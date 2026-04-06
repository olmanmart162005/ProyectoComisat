import { useEffect, useMemo, useState } from "react";
import { db } from "../../../firebase/firebase";
import {
  collection,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { registrarBitacora } from "../../../services/bitacora";

const getMesActual = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
};

const ESTADOS_CERRADOS = ["pagado", "cancelado", "finalizado"];

export const usePagosMensuales = ({ user, nombreEmpleado, closeModal }) => {
  const [creditosPendientes, setCreditosPendientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [registradoPor, setRegistradoPor] = useState("");

  const mesActual = getMesActual();

  useEffect(() => {
    const resolverNombre = async () => {
      if (!user?.email) return;
      try {
        const qUsuario = query(
          collection(db, "usuarios"),
          where("correo", "==", user.email),
        );
        const snapUsuario = await getDocs(qUsuario);
        if (snapUsuario.empty) {
          setRegistradoPor(user.email);
          return;
        }

        const datosUsuario = snapUsuario.docs[0].data();
        const empleadoId = datosUsuario.empleadoId;

        if (!empleadoId) {
          setRegistradoPor(datosUsuario.nombre ?? user.email);
          return;
        }

        const qEmpleado = query(
          collection(db, "empleados"),
          where("__name__", "==", empleadoId),
        );
        const snapEmpleado = await getDocs(qEmpleado);
        if (snapEmpleado.empty) {
          setRegistradoPor(datosUsuario.nombre ?? user.email);
          return;
        }

        const emp = snapEmpleado.docs[0].data();
        const nombreCompleto = `${emp.nombres ?? ""} ${emp.apellidos ?? ""}`.trim();
        setRegistradoPor(nombreCompleto || user.email);
      } catch (err) {
        console.error("Error resolviendo nombre del oficial:", err);
        setRegistradoPor(user?.email ?? "desconocido");
      }
    };

    resolverNombre();
  }, [user]);

  const fetchCreditosPendientes = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "creditos"));
      const todos = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      const cobrables = todos.filter((c) => {
        if (c.estado !== "Aprobado") return false;

        const estadoCredito = String(c.estadoCredito ?? "").toLowerCase();
        if (ESTADOS_CERRADOS.includes(estadoCredito)) return false;

        if (c.mesCobro === mesActual) return false;

        return true;
      });

      setCreditosPendientes(cobrables);
    } catch (err) {
      console.error("Error al cargar créditos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCreditosPendientes();
  }, []);

  const { totalCuotas, montoTotal, empleadosUnicos } = useMemo(() => {
    const monto = creditosPendientes.reduce(
      (acc, c) => acc + Number(c.datosFinancierosHistoricos?.cuotaMensual ?? 0),
      0,
    );
    const empleados = new Set(
      creditosPendientes.map((c) => c.empleadoId ?? c.empleadoNombres),
    );
    return {
      totalCuotas: creditosPendientes.length,
      montoTotal: monto,
      empleadosUnicos: empleados.size,
    };
  }, [creditosPendientes]);

  const handleRealizarPagos = async () => {
    if (creditosPendientes.length === 0) return;
    setProcesando(true);
    closeModal();

    try {
      const batch = writeBatch(db);
      const fechaCobro = serverTimestamp();

      for (const credito of creditosPendientes) {
        const fin = credito.datosFinancierosHistoricos ?? {};
        const cuotasPagadas = Number(credito.cuotasPagadas ?? 0);
        const plazoCuotas = Number(fin.plazoCuotas ?? 0);
        const cuotaMensual = Number(fin.cuotaMensual ?? 0);
        const totalCredito = Number(fin.totalCredito ?? 0);
        const numeroCuota = cuotasPagadas + 1;
        const saldoPendiente = Math.max(0, totalCredito - cuotaMensual * numeroCuota);
        const esUltimaCuota = numeroCuota >= plazoCuotas;

        const nombreEmpleado = `${credito.empleadoNombres ?? ""} ${credito.empleadoApellidos ?? ""}`.trim();

        const cuotaRef = doc(collection(db, "cuotas"));
        batch.set(cuotaRef, {
          creditoId: credito.id,
          empleadoId: credito.empleadoId ?? "",
          empleadoNombre: nombreEmpleado,
          productoNombre: credito.productoNombre ?? "",
          numeroCuota,
          totalCuotas: plazoCuotas,
          montoCuota: cuotaMensual,
          saldoPendiente,
          mesCobro: mesActual,
          fechaCobro,
          registradoPor,
        });

        const creditoRef = doc(db, "creditos", credito.id);
        batch.update(creditoRef, {
          cuotasPagadas: numeroCuota,
          saldoPendiente,
          mesCobro: mesActual,
          ...(esUltimaCuota && { estadoCredito: "Pagado" }),
        });
      }

      await batch.commit();

      await registrarBitacora({
        usuario: user?.email ?? "desconocido",
        nombre: nombreEmpleado,
        coleccion: "cuotas",
        accion: "creacion",
        metadata: {
          mesCobro: mesActual,
          totalCuotasProcesadas: creditosPendientes.length,
          montoTotalProcesado: montoTotal,
          empleadosAfectados: empleadosUnicos,
        },
      });

      await fetchCreditosPendientes();
      alert("Pagos registrados con éxito");
    } catch (err) {
      console.error("Error al procesar pagos:", err);
      alert("Error al procesar los pagos. Intente de nuevo.");
    } finally {
      setProcesando(false);
    }
  };

  return {
    creditosPendientes,
    loading,
    procesando,
    registradoPor,
    totalCuotas,
    montoTotal,
    empleadosUnicos,
    handleRealizarPagos,
    fetchCreditosPendientes,
  };
};
