import { Link } from "react-router";
import PageMeta from "../../components/common/PageMeta";

export default function AccesoDenegado() {
  return (
    <>
      <PageMeta
        title="Acceso denegado - Comisariato"
        description="No tienes permisos para acceder a esta página."
      />
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6 dark:bg-gray-900">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-gray-800 dark:bg-gray-950">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white/90">
            Acceso denegado
          </h1>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            No cuentas con permisos para ver esta sección.
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-700"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </>
  );
}
