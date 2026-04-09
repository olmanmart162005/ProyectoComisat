import { useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useLocation, useNavigate } from "react-router-dom";
import PageShell from "../../components/common/PageShell";
import { useAuth } from "../../auth/AuthProvider";
import { useNombreEmpleadoActual } from "../../hooks/useNombreEmpleadoActual";
import { useCategorias } from "./hooks/useCategorias";
import {
  MAX_NOMBRE_CATEGORIA,
  sanitizeNombreCategoria,
} from "../../utils/productoUtils";
export default function CategoriaFormulario() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const nombreEmpleado = useNombreEmpleadoActual();
  const categoria = location.state?.categoria ?? null;
  const modoEdicion = Boolean(categoria);
  const { guardarCategoria, actualizarCategoria } = useCategorias({
    user,
    nombreEmpleado,
    cargarCategorias: false,
  });
  const [enviando, setEnviando] = useState(false);
  const [nombre, setNombre] = useState("");
  const [archivoImagen, setArchivoImagen] = useState(null);
  const [previewImagen, setPreviewImagen] = useState(null);
  const [imagenUrlActual, setImagenUrlActual] = useState("");
  useEffect(() => {
    if (modoEdicion && categoria) {
      setNombre(categoria.nombre || "");
      setImagenUrlActual(categoria.imagenUrl || "");
      setPreviewImagen(categoria.imagenUrl || null);
      setArchivoImagen(null);
    } else {
      setNombre("");
      setArchivoImagen(null);
      setPreviewImagen(null);
      setImagenUrlActual("");
    }
  }, [modoEdicion, categoria]);
  const handleImagenChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setArchivoImagen(file);
    setPreviewImagen(URL.createObjectURL(file));
  };
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        handleImagenChange({ target: { files: acceptedFiles } });
      }
    },
    accept: {
      "image/png": [],
      "image/jpeg": [],
      "image/webp": [],
    },
  });
  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);
    try {
      const payload = {
        nombre,
        archivoImagen,
        onSuccess: () => navigate("/categorias"),
      };
      if (modoEdicion) {
        await actualizarCategoria?.({
          ...payload,
          categoriaId: categoria.id,
          categoriaData: categoria,
          imagenUrlActual,
        });
      } else {
        await guardarCategoria?.(payload);
      }
    } finally {
      setEnviando(false);
    }
  };
  if (location.pathname.endsWith("/editar") && !categoria) {
    return (
      <PageShell
        breadcrumbCurrent="Editar"
        homeLabel="Categorías"
        homePath="/categorias"
        pageTitle="Editar Categoría"
        title="Editar Categoría"
      >
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          No se encontró la categoría para editar.
        </div>
      </PageShell>
    );
  }
  return (
    <PageShell
      breadcrumbCurrent={modoEdicion ? "Editar" : "Nueva"}
      homeLabel="Categorías"
      homePath="/categorias"
      contentClassName="rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start lg:items-center">
          <div className="w-full lg:w-72 lg:flex-shrink-0 space-y-2.5">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
              Imagen de la Categoría
            </label>
            <div
              {...getRootProps()}
              className={`group relative flex aspect-square cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed p-1.5 transition-all ${
                isDragActive
                  ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-500/10"
                  : "border-gray-200 bg-gray-50 hover:border-blue-300 dark:border-white/10 dark:bg-gray-900/40 dark:hover:border-blue-500/40"
              }`}
            >
              <input {...getInputProps()} />
              {previewImagen ? (
                <img
                  src={previewImagen}
                  alt={nombre || "Preview"}
                  className="h-full w-full rounded-lg object-cover opacity-100 transition-opacity group-hover:opacity-95"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-white/60 to-transparent dark:from-gray-900/70 dark:via-gray-900/45" />
              )}
              {(!previewImagen || isDragActive) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition-transform group-hover:scale-105 dark:bg-blue-500/10 dark:text-blue-400">
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.8}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    {isDragActive
                      ? "Suelta la imagen aquí"
                      : "Haz clic o arrastra la imagen"}
                  </p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                    PNG, JPEG o WebP
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className="w-full lg:flex-1 space-y-2.5">
            <div className="flex items-end justify-between gap-3">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                Nombre de la Categoría *
              </label>
              <span className="text-[9px] font-bold uppercase text-gray-400 dark:text-gray-500">
                {nombre.length} / {MAX_NOMBRE_CATEGORIA}
              </span>
            </div>
            <input
              type="text"
              value={nombre}
              maxLength={MAX_NOMBRE_CATEGORIA}
              onChange={(e) =>
                setNombre(
                  sanitizeNombreCategoria(e.target.value || "").slice(
                    0,
                    MAX_NOMBRE_CATEGORIA,
                  ),
                )
              }
              placeholder="ej: Electrodomésticos"
              required
              disabled={enviando}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 text-gray-900 dark:text-white/90 placeholder-gray-500 dark:placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 transition-colors"
            />
          </div>
        </section>
        <div className="border-t border-gray-200 dark:border-white/10 pt-6 flex gap-3 justify-end">
          <button
            type="button"
            onClick={() => navigate("/categorias")}
            disabled={enviando}
            className="px-6 py-3 rounded-lg border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 font-semibold text-sm hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={enviando || !nombre.trim()}
            className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {enviando ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {modoEdicion ? "Actualizando..." : "Creando..."}
              </>
            ) : modoEdicion ? (
              "Actualizar Categoría"
            ) : (
              "Crear Categoría"
            )}
          </button>
        </div>
      </form>
    </PageShell>
  );
}