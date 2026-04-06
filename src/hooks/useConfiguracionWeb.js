import { useEffect, useState } from 'react'
import { db } from '../firebase/firebase'
import { doc, getDoc } from 'firebase/firestore'



export function useConfiguracionWeb() {
  const [tiempoInactividad, setTiempoInactividad] = useState(15)

  useEffect(() => {
    const cargar = async () => {
      try {
        const snap = await getDoc(doc(db, 'configuracion', 'configuracionWeb'))
        if (snap.exists()) {
          setTiempoInactividad(snap.data().tiempoInactividad ?? 15)
        }
      } catch (e) {
        console.error('Error al cargar configuración web:', e)
      }
    }
    cargar()
  }, [])

  return { tiempoInactividad }
}