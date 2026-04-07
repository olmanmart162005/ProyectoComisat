import emailjs from "@emailjs/browser";

/**
 * Genera una contraseña temporal basada en datos del empleado.
 * Formato: PrimeraLetraApellido1 + Apellido2 + Últimos3DNI + Random4
 * Ej: apellidos="García López", dni="080119901234" → "GLópez234X7K2"
 */
export function generarPasswordTemporal(apellidos = "", dni = "") {
  const partes = apellidos.trim().split(/\s+/);
  const primerApellido = partes[0] ?? "";
  const segundoApellido = partes[1] ?? "";

  const primeraLetra = primerApellido.charAt(0).toUpperCase();
  const ultimos3DNI = dni.replace(/\D/g, "").slice(-3);
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();

  return `${primeraLetra}${segundoApellido}${ultimos3DNI}${random}`;
}

/**
 * Envía el correo de bienvenida con credenciales al correoPersonal del empleado.
 */
export async function enviarCorreoCredenciales({
  nombre,
  correoInstitucional,
  passwordGenerada,
  correoDestino,
}) {
  await emailjs.send(
    import.meta.env.VITE_EMAILJS_SERVICE_ID,
    import.meta.env.VITE_EMAILJS_TEMPLATE_CREDENCIALES_ID,
    {
      nombre,
      correo_institucional: correoInstitucional,
      password_generada: passwordGenerada,
      correo_destino: correoDestino,
    },
    import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
  );
}