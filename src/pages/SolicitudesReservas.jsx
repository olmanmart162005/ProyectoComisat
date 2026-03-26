import { useEffect, useMemo, useState } from "react";
import { db } from "../firebase/firebase";
import {
  collection,
  doc,
  getDocs,
  updateDoc,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";

import DataTable from "../components/ui/table/DataTable";
import Badge from "../components/ui/badge/Badge";
import { useModal } from "../hooks/useModal";
import { Modal } from "../components/ui/modal";
import MetricCard from "../components/common/MetricCard";
import { 
  CheckCircleIcon, 
  CloseIcon, 
  BoxIconLine 
} from "../icons";

export default function SolicitudesCredito() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);

  const { isOpen, openModal, closeModal } = useModal();

  // ── Métricas ──────────────────────────────────────────────────────
  const totalPendientes = solicitudes.filter(s => s.estado === "Pendiente").length;
  const totalAprobados = solicitudes.filter(s => s.estado === "Aprobado").length;
  const montoEnRiesgo = solicitudes
    .filter(s => s.estado === "Pendiente")
    .reduce((acc, s) => acc + (s.datosFinancierosHistoricos?.totalCredito || 0), 0);

  const fetchSolicitudes = async () => {
    setLoading(true);
    try {
      // Ordenamos por fechaRegistro para ver las más antiguas primero (Prioridad)
      const q = query(collection(db, "creditos"), orderBy("fechaRegistro", "desc"));
      const querySnapshot = await getDocs(q);
      const docs = querySnapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }));
      setSolicitudes(docs);
    } catch (error) {
      console.error("Error al cargar solicitudes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSolicitudes();
  }, []);

  // ── Acciones de Decisión ──────────────────────────────────────────
  const handleDecision = async (nuevoEstado) => {
    if (!solicitudSeleccionada) return;
    
    setProcesando(true);
    try {
      const refDoc = doc(db, "creditos", solicitudSeleccionada.id);
      const updateData = {
        estado: nuevoEstado,
        // Si aprueba, grabamos quién y cuándo (Juliana Lopez por ahora como ejemplo)
        ...(nuevoEstado === "Aprobado" && {
          fechaAutoriza: serverTimestamp(),
          empleadoAutoriza: "Juliana Lopez", 
        })
      };

      await updateDoc(refDoc, updateData);
      alert(`Solicitud ${nuevoEstado} con éxito`);
      fetchSolicitudes();
      closeModal();
    } catch (error) {
      console.error("Error al procesar:", error);
      alert("Error al procesar la solicitud");
    } finally {
      setProcesando(false);
    }
  };

  // ── Columnas de la Tabla ──────────────────────────────────────────
  const columns = useMemo(() => [
    {
      accessorKey: "empleadoNombres",
      header: "Empleado",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-bold text-gray-800 dark:text-white/90 text-theme-sm">
            {row.original.empleadoNombres} {row.original.empleadoApellidos}
          </span>
         
        </div>
      ),
    },
    { 
      accessorKey: "productoNombre", 
      header: "Articulo",
      cell: (info) => <span className="font-medium">{info.getValue()}</span>
    },
    {
      id: "cuota",
      header: "Cuota",
      cell: ({ row }) => {
        const cuota = row.original.datosFinancierosHistoricos?.cuotaMensual || 0;
        return <span className="font-black text-blue-600">L. {cuota.toLocaleString("es-HN")}</span>;
      }
    },
    {
      id: "total",
      header: "Total Crédito",
      cell: ({ row }) => {
        const total = row.original.datosFinancierosHistoricos?.totalCredito || 0;
        return <span className="font-bold">L. {total.toLocaleString("es-HN")}</span>;
      }
    },
    {
      accessorKey: "fechaRegistro",
      header: "Registro",
      cell: (info) => info.getValue()?.toDate().toLocaleDateString() || "---"
    },
    {
      accessorKey: "estado",
      header: "Estado",
      cell: (info) => {
        const val = info.getValue();
        let color = "warning";
        if (val === "Aprobado") color = "success";
        if (val === "Rechazado") color = "error";
        return <Badge size="sm" color={color}>{val}</Badge>;
      },
    },
    {
      id: "acciones",
      header: "Detalle",
      enableSorting: false,
      cell: ({ row }) => (
        <button
          onClick={() => {
            setSolicitudSeleccionada(row.original);
            openModal();
          }}
          className="text-blue-600 hover:underline font-bold text-xs uppercase"
        >
          Ver Detalle
        </button>
      ),
    },
  ], []);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">Solicitudes de Crédito</h2>

      {/* ── Métricas ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:gap-6">
        <MetricCard
          title="Pendientes Revisión"
          value={totalPendientes}
          icon={<BoxIconLine className="text-gray-800 size-6 dark:text-white/90" />}
          iconWrapperClass="bg-gray-100 dark:bg-gray-800"
        />
        <MetricCard
          title="Monto por Aprobar"
          value={`L. ${montoEnRiesgo.toLocaleString()}`}
          icon={<CheckCircleIcon className="text-green-600 size-6" />}
          iconWrapperClass="bg-green-50 dark:bg-green-500/10"
        />
        <MetricCard
          title="Aprobados Hoy"
          value={totalAprobados}
          icon={<CloseIcon className="text-blue-600 size-6" />}
          iconWrapperClass="bg-blue-50 dark:bg-blue-500/10"
        />
      </div>

      {/* ── DataTable ── */}
      <DataTable columns={columns} data={solicitudes} loading={loading}>
        <DataTable.Toolbar searchPlaceholder="Buscar por empleado..." />
        <DataTable.Table />
        <DataTable.Pagination />
      </DataTable>

      {/* ── Modal de Detalle (Basado en tu código de diseño) ── */}
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-4xl">
        {solicitudSeleccionada && (
          <div className="p-8 grid grid-cols-1 md:grid-cols-12 gap-8 bg-white dark:bg-gray-900 rounded-xl overflow-hidden">
            
            {/* Panel Izquierdo: Perfil */}
            <div className="md:col-span-7 space-y-6">
               <div className="flex items-center gap-4 border-b border-gray-100 dark:border-white/5 pb-6">
                  <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center font-black text-blue-600 text-xl">
                    {solicitudSeleccionada.empleadoNombres[0]}
                  </div>
                  <div>
                    <h3 className="text-xl font-black">{solicitudSeleccionada.empleadoNombres} {solicitudSeleccionada.empleadoApellidos}</h3>
               
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Salario Neto</p>
                    <p className="text-lg font-black text-blue-600">
                      L. {solicitudSeleccionada.datosFinancierosHistoricos?.salarioNetoAlMomento.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Límite Aplicado</p>
                    <p className="text-lg font-black">
                      L. {(solicitudSeleccionada.datosFinancierosHistoricos?.salarioNetoAlMomento * solicitudSeleccionada.datosFinancierosHistoricos?.porcentajeLimiteAplicado).toLocaleString()}
                    </p>
                  </div>
               </div>

               <div className="bg-gray-50 dark:bg-white/5 p-6 rounded-xl border border-dashed border-gray-200 dark:border-white/10">
                  <h4 className="font-bold text-sm mb-4">Condiciones de Financiamiento</h4>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase">Plazo Elegido</p>
                      <p className="text-xl font-black">{solicitudSeleccionada.datosFinancierosHistoricos?.plazoCuotas} Meses</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-gray-500 uppercase">Cuota Mensual</p>
                      <p className="text-2xl font-black text-green-600">L. {solicitudSeleccionada.datosFinancierosHistoricos?.cuotaMensual.toLocaleString()}</p>
                    </div>
                  </div>
               </div>
            </div>

            {/* Panel Derecho: Producto y Acciones */}
            <div className="md:col-span-5 flex flex-col justify-between">
              <div className="bg-gray-100 dark:bg-white/5 p-4 rounded-xl space-y-4">
                <p className="text-[10px] font-black text-gray-400 uppercase">Artículo Solicitado</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded border border-gray-200 flex items-center justify-center font-bold text-gray-400">
                    IMG
                  </div>
                  <div>
                    <p className="font-bold leading-tight">{solicitudSeleccionada.productoNombre}</p>
                    <p className="text-xs text-blue-500 font-bold">L. {solicitudSeleccionada.datosFinancierosHistoricos?.totalCredito.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mt-8">
                <button
                  disabled={procesando || solicitudSeleccionada.estado !== "Pendiente"}
                  onClick={() => handleDecision("Aprobado")}
                  className="w-full py-4 bg-blue-600 text-white rounded-lg font-black uppercase text-xs tracking-widest hover:bg-blue-700 disabled:bg-gray-300 transition-all"
                >
                  {procesando ? "Procesando..." : "Aprobar Crédito"}
                </button>
                <button
                  disabled={procesando || solicitudSeleccionada.estado !== "Pendiente"}
                  onClick={() => handleDecision("Rechazado")}
                  className="w-full py-4 bg-red-50 text-red-600 border border-red-100 rounded-lg font-black uppercase text-xs tracking-widest hover:bg-red-100 disabled:opacity-50"
                >
                  Rechazar Solicitud
                </button>
              </div>
            </div>

          </div>
        )}
      </Modal>
    </div>
  );
}