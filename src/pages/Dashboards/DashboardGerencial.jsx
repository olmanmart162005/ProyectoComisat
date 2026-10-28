import { createElement, useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, Banknote, PackageSearch, ReceiptText, X } from "lucide-react";
import { db } from "../../firebase/firebase";

const PERIODS = [
  { value: "hoy", label: "Hoy" },
  { value: "7dias", label: "Últimos 7 días" },
  { value: "mes", label: "Este mes" },
  { value: "30dias", label: "Últimos 30 días" },
  { value: "6meses", label: "Últimos 6 meses" },
  { value: "rango", label: "Rango personalizado" },
];

function asDate(value) {
  if (!value) return null;
  if (typeof value.toDate === "function") return value.toDate();
  if (value instanceof Date) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function dateFor(record, fields) {
  for (const field of fields) {
    const date = asDate(record[field]);
    if (date) return date;
  }
  return null;
}

function cuotaMonth(record) {
  const date = dateFor(record, ["fechaCobro", "fechaPago", "fecha", "fechaRegistro"]);
  return String(record.mesCobro || (date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}` : "Sin fecha"));
}

function cuotaDateLabel(record) {
  return dateFor(record, ["fechaCobro", "fechaPago", "fecha", "fechaRegistro"])?.toLocaleDateString("es-HN") || "-";
}

function getStart(period, now) {
  const start = new Date(now);
  if (period === "hoy") start.setHours(0, 0, 0, 0);
  else if (period === "7dias") start.setDate(start.getDate() - 7);
  else if (period === "30dias") start.setDate(start.getDate() - 30);
  else if (period === "6meses") {
    start.setDate(1);
    start.setMonth(start.getMonth() - 5);
  }
  else start.setDate(1);
  return start;
}

function money(value) {
  return new Intl.NumberFormat("es-HN", { style: "currency", currency: "HNL", maximumFractionDigits: 2 }).format(value);
}

function Card({ title, value, detail, icon: Icon, onClick }) {
  return (
    <button type="button" onClick={onClick} className="w-full rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600 dark:border-slate-800 dark:bg-slate-900">
      <span className="flex items-center justify-between text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">{title}{createElement(Icon, { size: 17, className: "text-emerald-700 dark:text-emerald-400" })}</span>
      <strong className="mt-3 block text-2xl text-slate-950 dark:text-white">{value}</strong>
      <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">{detail}</span>
    </button>
  );
}

function DetailsModal({ detail, onClose }) {
  if (!detail) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="dashboard-detail-title" className="max-h-[85vh] w-full max-w-4xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800"><div><h2 id="dashboard-detail-title" className="font-semibold text-slate-900 dark:text-white">{detail.title}</h2><p className="mt-1 text-xs text-slate-500">{detail.note || `${detail.rows.length} registros`}</p></div><button type="button" onClick={onClose} aria-label="Cerrar detalle" className="rounded-md p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={18} /></button></header>
        <div className="max-h-[65vh] overflow-auto p-5">
          {detail.rows.length ? <table className="w-full text-left text-sm"><thead className="sticky top-0 bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800"><tr>{detail.columns.map((column) => <th key={column.key} className="px-3 py-2">{column.label}</th>)}</tr></thead><tbody>{detail.rows.map((row, index) => <tr key={row.id || index} className="border-b border-slate-100 dark:border-slate-800">{detail.columns.map((column) => <td key={column.key} className="px-3 py-2 text-slate-700 dark:text-slate-200">{column.render ? column.render(row) : row[column.key] ?? "-"}</td>)}</tr>)}</tbody></table> : <p className="py-12 text-center text-sm text-slate-500">No hay registros para mostrar en esta colección.</p>}
        </div>
      </section>
    </div>
  );
}

export default function DashboardGerencial() {
  const [data, setData] = useState({ productos: [], creditos: [], cuotas: [] });
  const [period, setPeriod] = useState("6meses");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all(["productos", "creditos", "cuotas"].map((name) => getDocs(collection(db, name))))
      .then((snaps) => {
        if (!active) return;
        setData(Object.fromEntries(["productos", "creditos", "cuotas"].map((name, index) => [name, snaps[index].docs.map((item) => ({ id: item.id, ...item.data() }))])));
      })
      .catch((loadError) => {
        console.error("No se pudo cargar el dashboard gerencial:", loadError);
        if (active) setError("No se pudieron leer los datos del dashboard. Revisa las reglas de Firestore y la conexión.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const now = new Date();
  const start = period === "rango" && customStart ? new Date(`${customStart}T00:00:00`) : getStart(period, now);
  const end = period === "rango" && customEnd ? new Date(`${customEnd}T23:59:59.999`) : now;
  const productosBajoMinimo = data.productos.filter((product) => {
    const minimum = Number(product.stockMinimo);
    return product.estado !== "Inactivo" && Number.isFinite(minimum) && Number(product.stock || 0) <= minimum;
  });
  const solicitudesReserva = data.creditos.filter((record) => {
    const date = dateFor(record, ["fechaRegistro", "fecha", "createdAt"]);
    return date && date >= start && date <= end;
  });
  const pendingReservations = solicitudesReserva.filter((record) => String(record.estado || "").toLowerCase() === "pendiente");
  const completedReservations = solicitudesReserva.filter((record) => ["aprobado", "rechazado"].includes(String(record.estado || "").toLowerCase()));
  const solicitudesOrdenadas = [...solicitudesReserva].sort((first, second) =>
    (dateFor(second, ["fechaRegistro", "fecha", "createdAt"])?.getTime() || 0) -
    (dateFor(first, ["fechaRegistro", "fecha", "createdAt"])?.getTime() || 0),
  );
  const cuotas = data.cuotas.filter((record) => {
    const date = dateFor(record, ["fechaCobro", "fechaPago", "fecha", "fechaRegistro"]);
    const monthKey = String(record.mesCobro || "");
    const monthDate = /^\d{4}-\d{2}$/.test(monthKey) ? new Date(`${monthKey}-01T00:00:00`) : null;
    const effectiveDate = date || monthDate;
    return effectiveDate && effectiveDate >= start && effectiveDate <= end;
  });
  const collectedAmount = cuotas.reduce((sum, record) => sum + Number(record.montoCuota || record.monto || 0), 0);
  const activeCredits = data.creditos
    .filter((credit) => String(credit.estado || "").toLowerCase() === "aprobado" && String(credit.estadoCredito || "activo").toLowerCase() === "activo")
    .map((credit) => {
      const initialAmount = Number(credit.datosFinancierosHistoricos?.totalCredito || 0);
      const paidAmount = data.cuotas
        .filter((payment) => payment.creditoId === credit.id)
        .reduce((total, payment) => total + Number(payment.montoCuota || 0), 0);
      const storedBalance = Number(credit.saldoPendiente);
      const hasStoredBalance = credit.saldoPendiente !== undefined && credit.saldoPendiente !== null && Number.isFinite(storedBalance);
      return {
        ...credit,
        _dashboardInitialAmount: initialAmount,
        _dashboardPaidAmount: paidAmount,
        _dashboardBalance: hasStoredBalance ? storedBalance : Math.max(0, initialAmount - paidAmount),
      };
    });
  const collectionsByMonthTotals = cuotas.reduce((totals, record) => {
    const key = cuotaMonth(record);
    totals[key] = (totals[key] || 0) + Number(record.montoCuota || record.monto || 0);
    return totals;
  }, {});
  const collectionsByMonth = Array.from({ length: period === "6meses" ? 6 : 1 }, (_, index) => {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - (period === "6meses" ? 5 - index : 0), 1);
    const key = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}`;
    return { name: key, total: collectionsByMonthTotals[key] || 0 };
  });
  const balanceByEmployee = [...activeCredits.reduce((employees, credit) => {
    const name = `${credit.empleadoNombres || ""} ${credit.empleadoApellidos || ""}`.trim() || "Sin empleado";
    const employeeId = String(credit.empleadoId || credit.empleadoUid || "");
    const key = employeeId || name.toLowerCase();
    const employee = employees.get(key) || { name, employeeId, credits: [], total: 0 };
    employee.credits.push(credit);
    employee.total += credit._dashboardBalance;
    employees.set(key, employee);
    return employees;
  }, new Map()).values()].sort((first, second) => second.total - first.total).slice(0, 10);

  const topProducts = (() => {
    const grouped = new Map();
    const addProduct = (name, quantity, total, row) => {
      if (!name) return;
      const current = grouped.get(name) || { name, quantity: 0, total: 0, rows: [] };
      current.quantity += Number(quantity) || 0;
      current.total += Number(total) || 0;
      current.rows.push(row);
      grouped.set(name, current);
    };
    data.creditos
      .filter((credit) => {
        const statusApproved = String(credit.estado || "").toLowerCase() === "aprobado";
        const date = dateFor(credit, ["fechaAutoriza", "fechaRegistro"]);
        return statusApproved && date && date >= start && date <= end;
      })
      .forEach((credit) => {
        addProduct(credit.productoNombre, credit.cantidad, Number(credit.datosFinancierosHistoricos?.totalCredito || 0), credit);
      });
    return [...grouped.values()].sort((a, b) => b.quantity - a.quantity);
  })();

  const columns = {
    products: [{ key: "nombre", label: "Producto", render: (row) => row.nombre || row.productoNombre || "-" }, { key: "stock", label: "Existencia" }, { key: "stockMinimo", label: "Mínimo" }],
    reservationRequests: [
      { key: "fechaRegistro", label: "Fecha de solicitud", render: (row) => dateFor(row, ["fechaRegistro", "fecha", "createdAt"])?.toLocaleDateString("es-HN") || "-" },
      { key: "empleadoNombres", label: "Solicitante", render: (row) => `${row.empleadoNombres || ""} ${row.empleadoApellidos || ""}`.trim() || "-" },
      { key: "productoNombre", label: "Producto" },
      { key: "estado", label: "Estado" },
      { key: "montoSolicitado", label: "Monto", render: (row) => money(Number(row.datosFinancierosHistoricos?.totalCredito || row.montoSolicitado || 0)) },
    ],
    payments: [
      { key: "fechaCobro", label: "Fecha de cobro", render: cuotaDateLabel },
      { key: "empleadoNombre", label: "Empleado" },
      { key: "productoNombre", label: "Producto" },
      { key: "creditoId", label: "ID de crédito" },
      { key: "numeroCuota", label: "Cuota", render: (row) => row.numeroCuota && row.totalCuotas ? `${row.numeroCuota} de ${row.totalCuotas}` : row.numeroCuota || "-" },
      { key: "mesCobro", label: "Mes" },
      { key: "montoCuota", label: "Abono", render: (row) => money(Number(row.montoCuota || row.monto || 0)) },
      { key: "saldoPendiente", label: "Saldo luego del abono", render: (row) => row.saldoPendiente == null ? "-" : money(Number(row.saldoPendiente)) },
      { key: "registradoPor", label: "Registrado por" },
    ],
    credits: [
      { key: "id", label: "Crédito" },
      { key: "empleadoNombres", label: "Empleado", render: (row) => `${row.empleadoNombres || ""} ${row.empleadoApellidos || ""}`.trim() || "-" },
      { key: "productoNombre", label: "Producto" },
      { key: "_dashboardInitialAmount", label: "Total crédito", render: (row) => money(row._dashboardInitialAmount) },
      { key: "_dashboardPaidAmount", label: "Cuota mensual", render: (row) => money(row._dashboardPaidAmount) },
      { key: "_dashboardBalance", label: "Saldo pendiente", render: (row) => money(row._dashboardBalance) },
      { key: "estadoCredito", label: "Estado" },
    ],
    top: [{ key: "name", label: "Producto" }, { key: "quantity", label: "Unidades aprobadas" }, { key: "total", label: "Monto financiado", render: (row) => money(row.total) }],
  };
  const openDetail = (title, rows, key, note) => {
    const paymentTotal = rows.reduce((total, row) => total + Number(row.montoCuota || row.monto || 0), 0);
    const detailNote = note || (key === "payments"
      ? `${rows.length} abonos · total ${money(paymentTotal)}`
      : `${rows.length} registros`);
    setDetail({ title, rows, columns: columns[key], note: detailNote });
  };

  if (loading) return <div className="flex h-72 items-center justify-center text-sm text-slate-500">Cargando cifras del negocio...</div>;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">Resumen del negocio</p><h1 className="mt-1 text-2xl font-semibold text-slate-950 dark:text-white">Dashboard gerencial</h1></div>
        <div className="flex flex-wrap gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">Período<select value={period} onChange={(event) => setPeriod(event.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">{PERIODS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
          {period === "rango" && <div className="flex flex-wrap gap-2"><label className="sr-only" htmlFor="gerencial-start">Desde</label><input id="gerencial-start" type="date" value={customStart} onChange={(event) => setCustomStart(event.target.value)} className="rounded-md border border-slate-300 bg-white px-2 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" /><label className="sr-only" htmlFor="gerencial-end">Hasta</label><input id="gerencial-end" type="date" value={customEnd} onChange={(event) => setCustomEnd(event.target.value)} className="rounded-md border border-slate-300 bg-white px-2 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" /></div>}
        </div>
      </header>

      {error && <div role="alert" className="rounded-md border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card title="Productos bajo mínimo" value={productosBajoMinimo.length} detail="Inventario actual" icon={AlertTriangle} onClick={() => openDetail("Productos por reabastecer", productosBajoMinimo, "products")} />
        <Card title="Reservas · pendientes / completadas" value={`${pendingReservations.length} / ${completedReservations.length}`} detail="Solicitudes pendientes / aprobadas o rechazadas" icon={ReceiptText} onClick={() => openDetail("Reservas · solicitudes del período", solicitudesOrdenadas, "reservationRequests")} />
        <Card title="Monto cobrado" value={money(collectedAmount)} detail="Abonos registrados en el período" icon={Banknote} onClick={() => openDetail("Detalle de abonos", cuotas, "payments")} />
        <Card title="Producto con más créditos" value={topProducts[0]?.name || "Sin datos"} detail={`${topProducts[0]?.quantity || 0} unidades aprobadas en el período`} icon={PackageSearch} onClick={() => openDetail("Productos con créditos aprobados", topProducts, "top")} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"><div className="mb-4"><h2 className="text-sm font-bold text-slate-900 dark:text-white">Evolución mensual de cobros</h2><p className="mt-1 text-xs text-slate-500">Abonos por mes durante los últimos seis meses; selecciona una barra para ver el detalle</p></div>{collectionsByMonth.length ? <div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={collectionsByMonth} onClick={(event) => { const month = event?.activeLabel; if (month) openDetail(`Abonos · ${month}`, data.cuotas.filter((row) => cuotaMonth(row) === month), "payments"); }}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis /><Tooltip formatter={(value) => money(value)} /><Bar dataKey="total" name="Monto cobrado" fill="#e29d37" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div> : <p className="py-12 text-center text-sm text-slate-500">Sin cuotas registradas en el período seleccionado.</p>}</section>
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"><div className="mb-4"><h2 className="text-sm font-bold text-slate-900 dark:text-white">Productos financiados</h2><p className="mt-1 text-xs text-slate-500">Top 5 por unidades en créditos aprobados</p></div>{topProducts.length ? <div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={topProducts.slice(0, 5)} layout="vertical" onClick={() => openDetail("Productos con créditos aprobados", topProducts, "top")}><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" allowDecimals={false} /><YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 10 }} /><Tooltip /><Bar dataKey="quantity" name="Unidades aprobadas" fill="#176b5b" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></div> : <p className="py-12 text-center text-sm text-slate-500">No hay productos con créditos aprobados en el período.</p>}</section>
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <header className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Saldo pendiente por empleado</h2>
            <p className="mt-1 text-xs text-slate-500">Saldo de créditos aprobados y activos. Selecciona un importe para ver el desglose.</p>
          </header>
          {balanceByEmployee.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800">
                  <tr><th className="px-4 py-3">Empleado</th><th className="px-4 py-3">Créditos activos</th><th className="px-4 py-3 text-right">Saldo total</th></tr>
                </thead>
                <tbody>
                  {balanceByEmployee.map((employee) => (
                    <tr key={employee.employeeId || employee.name} className="border-t border-slate-100 dark:border-slate-800">
                      <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{employee.name}{employee.employeeId && <span className="mt-0.5 block text-xs font-normal text-slate-500">ID: {employee.employeeId}</span>}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{employee.credits.length}</td>
                      <td className="px-4 py-3 text-right"><button type="button" className="font-semibold text-emerald-800 underline decoration-dotted underline-offset-4 dark:text-emerald-300" onClick={() => openDetail(`Desglose de saldo · ${employee.name}`, employee.credits, "credits")}>{money(employee.total)}</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="px-5 py-10 text-center text-sm text-slate-500">No hay créditos activos con saldo registrado.</p>
          )}
        </section>
      </div>
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <header className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Reservas · solicitudes por estado</h2>
          <p className="mt-1 text-xs text-slate-500">Solicitudes de crédito del período, ordenadas de la más reciente</p>
        </header>
        {solicitudesOrdenadas.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800">
                <tr><th className="px-4 py-3">Fecha</th><th className="px-4 py-3">Solicitante</th><th className="px-4 py-3">Producto</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3 text-right">Monto</th></tr>
              </thead>
              <tbody>
                {solicitudesOrdenadas.slice(0, 20).map((request) => {
                  const status = String(request.estado || "Sin estado");
                  const normalizedStatus = status.toLowerCase();
                  const statusClass = normalizedStatus === "pendiente"
                    ? "bg-amber-100 text-amber-800"
                    : normalizedStatus === "aprobado"
                      ? "bg-emerald-100 text-emerald-800"
                      : normalizedStatus === "rechazado"
                        ? "bg-rose-100 text-rose-800"
                        : "bg-slate-100 text-slate-700";
                  return (
                    <tr key={request.id} className="border-t border-slate-100 dark:border-slate-800">
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-300">{dateFor(request, ["fechaRegistro", "fecha", "createdAt"])?.toLocaleDateString("es-HN") || "-"}</td>
                      <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{`${request.empleadoNombres || ""} ${request.empleadoApellidos || ""}`.trim() || "Sin nombre"}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{request.productoNombre || "-"}</td>
                      <td className="px-4 py-3"><span className={`inline-flex rounded-sm px-2 py-1 text-xs font-semibold ${statusClass}`}>{status}</span></td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-slate-700 dark:text-slate-200">{money(Number(request.datosFinancierosHistoricos?.totalCredito || request.montoSolicitado || 0))}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="px-5 py-10 text-center text-sm text-slate-500">No hay solicitudes en el período seleccionado.</p>
        )}
      </section>
      <p className="flex items-start gap-2 text-xs text-slate-500"><AlertTriangle size={14} className="mt-0.5 shrink-0" /> Los indicadores de reservas se basan en solicitudes de crédito de la colección creditos, clasificadas por estado. El ranking de productos refleja créditos aprobados, no ventas totales.</p>
      {detail && <DetailsModal detail={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}