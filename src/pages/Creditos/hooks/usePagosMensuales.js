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
import { notify } from "../../../services/notifier";

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
  const [cuotasCobradasParaExport, setCuotasCobradasParaExport] = useState([]);
  const [ultimoCobro, setUltimoCobro] = useState(null);

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
        const nombreCompleto =
          `${emp.nombres ?? ""} ${emp.apellidos ?? ""}`.trim();
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
      const snapCreditos = await getDocs(collection(db, "creditos"));
      const todos = snapCreditos.docs.map((d) => ({ id: d.id, ...d.data() }));

      const snapCuotas = await getDocs(collection(db, "cuotas"));
      const pagosPorCredito = {};

      snapCuotas.docs.forEach((d) => {
        const { creditoId, montoCuota } = d.data();
        if (!creditoId) return;
        if (!pagosPorCredito[creditoId]) {
          pagosPorCredito[creditoId] = { total: 0, count: 0 };
        }
        pagosPorCredito[creditoId].total += Number(montoCuota ?? 0);
        pagosPorCredito[creditoId].count += 1;
      });

      const cobrables = todos
        .map((c) => ({
          ...c,
          _totalPagado: pagosPorCredito[c.id]?.total ?? 0,
          _cuotasPagadasReal: pagosPorCredito[c.id]?.count ?? 0,
        }))
        .filter((c) => {
          if (c.estado !== "Aprobado") return false;

          const estadoCredito = String(c.estadoCredito ?? "").toLowerCase();
          if (ESTADOS_CERRADOS.includes(estadoCredito)) return false;

          if (c.mesCobro === mesActual) return false;

          const totalCredito = Number(
            c.datosFinancierosHistoricos?.totalCredito ?? 0,
          );
          const plazoCuotas = Number(
            c.datosFinancierosHistoricos?.plazoCuotas ?? 0,
          );

          if (c._cuotasPagadasReal >= plazoCuotas && plazoCuotas > 0)
            return false;
          if (c._totalPagado >= totalCredito && totalCredito > 0) return false;

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

      const snapshotParaExport = creditosPendientes.map((credito) => {
        const fin = credito.datosFinancierosHistoricos ?? {};
        const cuotaMensual = Number(fin.cuotaMensual ?? 0);
        const totalCredito = Number(fin.totalCredito ?? 0);
        const totalPagadoReal = credito._totalPagado ?? 0;
        const numeroCuota = (credito._cuotasPagadasReal ?? 0) + 1;
        const saldoTrasPago = Math.max(
          0,
          totalCredito - totalPagadoReal - cuotaMensual,
        );
        return {
          empleado:
            `${credito.empleadoNombres ?? ""} ${credito.empleadoApellidos ?? ""}`.trim(),
          productoNombre: credito.productoNombre ?? "---",
          numeroCuota: `${numeroCuota} de ${fin.plazoCuotas ?? "?"}`,
          montoCuota: cuotaMensual,
          saldoTrasPago,
          mesCobro: mesActual,
        };
      });

      const montoTotalCobrado = snapshotParaExport.reduce(
        (acc, r) => acc + r.montoCuota,
        0,
      );

      for (const credito of creditosPendientes) {
        const fin = credito.datosFinancierosHistoricos ?? {};
        const cuotaMensual = Number(fin.cuotaMensual ?? 0);
        const totalCredito = Number(fin.totalCredito ?? 0);
        const plazoCuotas = Number(fin.plazoCuotas ?? 0);

        const cuotasPagadasReal = credito._cuotasPagadasReal ?? 0;
        const totalPagadoReal = credito._totalPagado ?? 0;

        if (cuotasPagadasReal >= plazoCuotas && plazoCuotas > 0) {
          continue;
        }

        const numeroCuota = cuotasPagadasReal + 1;
        const nuevoTotalPagado = totalPagadoReal + cuotaMensual;
        const saldoPendiente = Math.max(0, totalCredito - nuevoTotalPagado);
        const esUltimaCuota =
          saldoPendiente <= 0 || numeroCuota === plazoCuotas;

        const nombreEmpleado =
          `${credito.empleadoNombres ?? ""} ${credito.empleadoApellidos ?? ""}`.trim();

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
        nombre: registradoPor,
        coleccion: "cuotas",
        accion: "cobro_mensual",
        metadata: {
          mesCobro: mesActual,
          totalCuotasRegistradas: snapshotParaExport.length,
          montoTotalCobrado,
          empleadosAfectados: new Set(
            creditosPendientes.map((c) => c.empleadoId ?? c.empleadoNombres),
          ).size,
        },
      });

      setCuotasCobradasParaExport(snapshotParaExport);
      setUltimoCobro({
        fecha: new Date().toLocaleDateString("es-HN"),
        totalCuotas: snapshotParaExport.length,
        montoTotal: montoTotalCobrado,
      });

      await fetchCreditosPendientes();
      notify.success("Pagos registrados con éxito");
    } catch (err) {
      console.error("Error al procesar pagos:", err);
      notify.error("Error al procesar los pagos. Intente de nuevo.");
    } finally {
      setProcesando(false);
    }
  };

  return {
    creditosPendientes,
    loading,
    procesando,
    registradoPor,
    cuotasCobradasParaExport,
    ultimoCobro,
    totalCuotas,
    montoTotal,
    empleadosUnicos,
    handleRealizarPagos,
    fetchCreditosPendientes,
  };
};
