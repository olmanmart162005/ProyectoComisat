import { useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { useNavigate } from "react-router-dom";
import { sileo, Toaster } from "sileo";

export default function Login() {
  Toaster.position = "top-right";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);

    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      console.error("Error capturado:", err.code ?? err.message);

      // 1. Usuario inactivo — lanzado manualmente desde AuthProvider
      if (err.message === "Cuenta inactiva") {
        sileo.error({
          title: "Acceso denegado",
          description: "Tu cuenta se encuentra inactiva. Contacta al administrador.",
        });
      }
      // 2. Credenciales incorrectas — error de Firebase
      else if (err.code === "auth/invalid-credential") {
        sileo.error({
          title: "Credenciales incorrectas",
          description: "Correo o contraseña incorrectos. Intenta de nuevo.",
        });
      }
      // 3. Cualquier otro error
      else {
        sileo.error({
          title: "Error al iniciar sesión",
          description: "Ocurrió un error inesperado. Intenta más tarde.",
        });
      }
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center px-4">

      <div className="w-full max-w-sm mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Portal Administrativo del Comisariato
        </h1>
      </div>

      <div className="w-full max-w-sm bg-white rounded-2xl shadow-md px-8 py-10">
        <form onSubmit={handleSubmit} className="space-y-5">

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="empleado@azucarera.com"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Password
              </label>
              {/* <button
                type="button"
                className="text-xs text-blue-600 hover:text-blue-800 font-medium transition"
              >
                ¿Olvidaste tu contraseña?
              </button> */}
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 pr-10 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88L6.59 6.59m7.532 7.532l3.29 3.29M3 3l18 18"
                    />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={enviando}
            className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white font-semibold py-3 rounded-lg transition text-sm tracking-wide"
          >
            {enviando ? "Iniciando sesión..." : "Iniciar sesión"}
          </button>

        </form>
      </div>

      <p className="mt-8 text-center text-xs text-gray-400 uppercase tracking-widest">
        © 2026 Sistema de Comisariato — Equipo C, UNICAH
      </p>

    </div>
  );
}