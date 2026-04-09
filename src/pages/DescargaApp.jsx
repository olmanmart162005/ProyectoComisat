import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";

const APK_URL = import.meta.env.VITE_APK_URL ?? "#";
const APP_VERSION = import.meta.env.VITE_APP_VERSION ?? "1.0.0";

export default function DescargaApp() {
  const [descargando, setDescargando] = useState(false);

  const handleDescargar = () => {
    setDescargando(true);
    window.open(APK_URL, "_blank");
    setTimeout(() => setDescargando(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 mb-4 shadow-lg">
            <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            App Comisariato San José
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Versión {APP_VERSION} · Android
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 mb-4">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center mb-5">
            Escanea el QR con tu celular para descargar
          </p>

          <div className="flex justify-center mb-5">
            <div className="p-3 bg-white rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <QRCodeSVG
                value={APK_URL}
                size={180}
                bgColor="#ffffff"
                fgColor="#1e293b"
                level="M"
                includeMargin={false}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            <span className="text-xs text-gray-400 dark:text-gray-500">o descarga directamente</span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
          </div>

          <button
            onClick={handleDescargar}
            disabled={descargando}
            className="w-full flex items-center justify-center gap-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold text-sm py-3 px-4 rounded-xl transition-colors duration-150"
          >
            {descargando ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Iniciando descarga...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Descargar APK
              </>
            )}
          </button>
        </div>

        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-4">
          <div className="flex gap-3">
            <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 mb-1">
                Antes de instalar
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                Activa <strong>Instalar apps de fuentes desconocidas</strong> en{" "}
                Ajustes → Seguridad de tu Android antes de abrir el archivo.
              </p>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-6">
          Solo disponible para Android · Comisariato San José
        </p>
      </div>
    </div>
  );
}