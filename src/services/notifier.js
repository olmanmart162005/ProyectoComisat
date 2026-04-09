import { sileo } from "sileo";

const entidadLabel = (entidad = "Registro") => String(entidad).trim();

const resolverMensaje = (input, fallbackTitle = "Notificación") => {
  if (typeof input === "string") {
    const description = input.trim();
    return {
      title: fallbackTitle,
      description: description || "Operación completada.",
    };
  }

  if (input && typeof input === "object") {
    const title = String(input.title ?? "").trim();
    const description = String(
      input.description ?? input.message ?? input.detalle ?? "",
    ).trim();

    if (title || description) {
      return {
        title: title || fallbackTitle,
        ...(description && { description }),
      };
    }
  }

  return { title: fallbackTitle, description: "Operación completada." };
};

export const notify = {
  success: (message) => sileo.success(resolverMensaje(message, "Éxito")),
  error: (message) => sileo.error(resolverMensaje(message, "Error")),
  info: (message) => sileo.info(resolverMensaje(message, "Información")),
  warning: (message) =>
    sileo.warning?.(resolverMensaje(message, "Advertencia")) ??
    sileo.info(resolverMensaje(message, "Advertencia")),

  created: (entidad = "Registro") =>
    sileo.success({
      title: "Éxito",
      description: `${entidadLabel(entidad)} creado(a) con éxito.`,
    }),
  updated: (entidad = "Registro") =>
    sileo.success({
      title: "Éxito",
      description: `${entidadLabel(entidad)} actualizado(a) con éxito.`,
    }),
  deleted: (entidad = "Registro") =>
    sileo.success({
      title: "Éxito",
      description: `${entidadLabel(entidad)} eliminado(a) con éxito.`,
    }),

  loadError: (entidad = "datos") =>
    sileo.error({
      title: "Error",
      description: `No se pudieron cargar ${entidadLabel(entidad)}.`,
    }),
  saveError: (entidad = "registro") =>
    sileo.error({
      title: "Error",
      description: `No se pudo guardar ${entidadLabel(entidad)}.`,
    }),
  updateError: (entidad = "registro") =>
    sileo.error({
      title: "Error",
      description: `No se pudo actualizar ${entidadLabel(entidad)}.`,
    }),
  deleteError: (entidad = "registro") =>
    sileo.error({
      title: "Error",
      description: `No se pudo eliminar ${entidadLabel(entidad)}.`,
    }),
};
