import { useState } from "react";
import { Toaster } from "sileo";
import DataTable from "../../components/ui/table/DataTable";
import ConfirmDeleteModal from "../../components/common/ConfirmDeleteModal";
import MetricCard from "../../components/common/MetricCard";
import { GroupIcon } from "../../icons";
import { useActivaciones } from "./hooks/useActivaciones";
import { activacionColumns } from "./columns/activacionColumns";
export default function Gest_Activaciones() {
  Toaster.position = "top-right";
  const { pendientes, loading, handleActivar } = useActivaciones();
  const [usuarioAActivar, setUsuarioAActivar] = useState(null);
  const [activando, setActivando] = useState(false);
  const abrirConfirmar = (id) => {
    const usuario = pendientes.find((u) => u.id === id) || null;
    setUsuarioAActivar(usuario);
  };
  const cerrarConfirmar = () => {
    if (activando) return;
    setUsuarioAActivar(null);
  };
  const confirmarActivacion = async () => {
    if (!usuarioAActivar?.id) return;
    setActivando(true);
    await handleActivar(usuarioAActivar.id);
    setActivando(false);
    setUsuarioAActivar(null);
  };
  const columns = activacionColumns({ onActivar: abrirConfirmar });
  return (
    <div className="space-y-6">
      <div className="flex sm:justify-between flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            Activaciones Pendientes
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Usuarios pendientes de registro en Firebase Auth.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:gap-6">
        <MetricCard
          title="Pendientes de activar"
          value={pendientes.length}
          icon={
            <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />
          }
          iconWrapperClass="bg-yellow-50 dark:bg-yellow-500/10"
        />
      </div>
      <DataTable columns={columns} data={pendientes} loading={loading}>
        <DataTable.Toolbar searchPlaceholder="Buscar usuario..." />
        <DataTable.Table />
        <DataTable.Pagination />
      </DataTable>
      <ConfirmDeleteModal
        isOpen={Boolean(usuarioAActivar)}
        onClose={cerrarConfirmar}
        onConfirm={confirmarActivacion}
        itemName={usuarioAActivar?.nombre}
        message="¿Confirmas que ya registraste en Firebase Auth al usuario"
        loading={activando}
      />
    </div>
  );
}