import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { sileo, Toaster } from "sileo";

export default function Login() {
  Toaster.position = "top-right";
  const [email, setEmail] = useState("");
  const [buscando, setBuscando] = useState(false);
  const navigate = useNavigate();

  const handleContinuar = async (e) => {
    e.preventDefault();
    setBuscando(true);

    try {
      const q = query(collection(db, "usuarios"), where("correo", "==", email.trim().toLowerCase()));
      const snap = await getDocs(q);

      if (snap.empty) {
        sileo.error({
          title: "Correo no encontrado",
          description: "Este correo no está registrado en el sistema.",
        });
        return;
      }

      const docSnap = snap.docs[0];
      const userData = { id: docSnap.id, ...docSnap.data() };

      if (userData.estado?.toLowerCase() === "inactivo") {
        sileo.error({
          title: "Cuenta inactiva",
          description: "Tu cuenta está inactiva. Contacta al administrador.",
        });
        return;
      }

      // Pasa los datos del usuario a la pantalla 2 via navigation state
      navigate("/login/metodos", { state: { email, userData } });

    } catch (err) {
      console.error(err);
      sileo.error({ title: "Error", description: "Ocurrió un error. Intenta de nuevo." });
    } finally {
      setBuscando(false);
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
        <form onSubmit={handleContinuar} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
              Correo corporativo
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

          <button
            type="submit"
            disabled={buscando}
            className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white font-semibold py-3 rounded-lg transition text-sm tracking-wide"
          >
            {buscando ? "Verificando..." : "Continuar"}
          </button>
        </form>
      </div>

      <p className="mt-8 text-center text-xs text-gray-400 uppercase tracking-widest">
        © 2026 Sistema de Comisariato — Equipo C, UNICAH
      </p>
    </div>
  );
}