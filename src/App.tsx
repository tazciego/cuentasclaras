import { useState, useEffect } from "react"
import type { DatosEvento, TipoEvento } from "./types"
import type { InfoEvento, PerfilInvitado } from "./components/invitado/InvitadoFlow"
import HomePage from "./components/HomePage"
import CrearEvento from "./components/CrearEvento"
import CompartirQR from "./components/CompartirQR"
import CargarConsumos from "./components/CargarConsumos"
import VistaEnVivo from "./components/VistaEnVivo"
import CobrarYCerrar from "./components/CobrarYCerrar"
import InvitadoFlow from "./components/invitado/InvitadoFlow"
import ReunionFlow from "./components/reunion/ReunionFlow"
import RoomiesFlow from "./components/roomies/RoomiesFlow"
import { buscarEventoPorCodigo, listarPagosInvitado } from "./api"

type Pantalla =
  | "inicio"
  | "crear-evento"
  | "compartir-qr"
  | "cargar-consumos"
  | "vista-en-vivo"
  | "cobrar-y-cerrar"
  | "invitado"
  | "reunion"
  | "roomies"

const PANTALLAS_ANFITRION: Pantalla[] = [
  "compartir-qr", "cargar-consumos", "vista-en-vivo", "cobrar-y-cerrar",
]

function App() {
  const [pantalla, setPantalla] = useState<Pantalla>("inicio")
  const [evento, setEvento] = useState<DatosEvento | null>(null)
  const [codigoInvitado, setCodigoInvitado] = useState<string | undefined>()
  const [sesionInicial, setSesionInicial] = useState<{ evento: InfoEvento; perfil: PerfilInvitado; pagoId?: number } | undefined>()
  const [verificandoSesion, setVerificandoSesion] = useState(true)

  // ─── Restaurar sesión al cargar ──────────────────────────────────────────────
  useEffect(() => {
    // ── Prioridad 1: URL de invitación /unirse/CC-XXXXXX (QR o link compartido) ──
    const urlMatch = window.location.pathname.match(/\/unirse\/(CC-\d{4,8})/i)
    if (urlMatch) {
      const codigo = urlMatch[1].toUpperCase()
      window.history.replaceState(null, "", "/")
      setCodigoInvitado(codigo)
      setSesionInicial(undefined)
      setPantalla("invitado")
      setVerificandoSesion(false)
      return
    }

    const rawAnf = localStorage.getItem("cc_sesion_anfitrion")
    const rawInv = localStorage.getItem("cc_sesion")

    if (!rawAnf && !rawInv) { setVerificandoSesion(false); return }

    const intentarAnfitrion = async (): Promise<boolean> => {
      if (!rawAnf) return false
      let sesion: Record<string, unknown>
      try { sesion = JSON.parse(rawAnf) } catch {
        localStorage.removeItem("cc_sesion_anfitrion"); return false
      }
      try {
        const ev = await buscarEventoPorCodigo(String(sesion.codigo))
        if (ev.estado !== "activo") { localStorage.removeItem("cc_sesion_anfitrion"); return false }
        const eventoRec: DatosEvento = {
          eventoId: Number(sesion.eventoId),
          codigo: String(sesion.codigo),
          nombre: String(sesion.nombre),
          tipo: sesion.tipo as TipoEvento,
          fecha: String(sesion.fecha ?? ""),
          hora: String(sesion.hora ?? ""),
          lugar: String(sesion.lugar ?? ""),
          nombreAnfitrion: String(sesion.nombreAnfitrion ?? ""),
          participantes: [],
        }
        setEvento(eventoRec)
        setPantalla(sesion.pantalla as Pantalla)
        return true
      } catch {
        return false   // sin red — mantener sesión para el próximo intento
      }
    }

    const intentarInvitado = async (): Promise<boolean> => {
      if (!rawInv) return false
      let sesion: Record<string, unknown>
      try { sesion = JSON.parse(rawInv) } catch {
        localStorage.removeItem("cc_sesion"); return false
      }
      // Construir objetos desde localStorage antes de la red para poder restaurar sin conexión
      const eventoRec: InfoEvento = {
        eventoId: Number(sesion.eventoId),
        codigo: String(sesion.codigo),
        nombre: String(sesion.eventoNombre),
        tipo: sesion.eventoTipo as "restaurante" | "reunion",
        fecha: String(sesion.fecha ?? ""),
        lugar: String(sesion.lugar ?? ""),
        clabe_spei: sesion.clabe_spei ? String(sesion.clabe_spei) : undefined,
      }
      const perfilRec: PerfilInvitado = {
        nombre: String(sesion.nombre),
        colorIndex: Number(sesion.colorIndex),
        invitadoId: Number(sesion.invitadoId),
        token: String(sesion.token),
      }
      try {
        const ev = await buscarEventoPorCodigo(String(sesion.codigo))
        if (ev.estado !== "activo") { localStorage.removeItem("cc_sesion"); return false }
        // Verificar si hay pago pendiente guardado
        const rawPagoId = localStorage.getItem("cc_pago_pendiente")
        let pagoIdRecuperado: number | undefined
        if (rawPagoId) {
          try {
            const pagos = await listarPagosInvitado(Number(sesion.eventoId), Number(sesion.invitadoId))
            const pago = pagos.find((p) => p.id === Number(rawPagoId) && p.estado === 'solicitando_pago')
            if (pago) pagoIdRecuperado = Number(rawPagoId)
            else localStorage.removeItem("cc_pago_pendiente")
          } catch {
            pagoIdRecuperado = Number(rawPagoId) // sin red, mantener optimistamente
          }
        }
        setSesionInicial({ evento: eventoRec, perfil: perfilRec, ...(pagoIdRecuperado ? { pagoId: pagoIdRecuperado } : {}) })
        setPantalla("invitado")
        return true
      } catch {
        // Sin red — restaurar sesión optimistamente con datos del localStorage, ir directo a PasoElegir
        setSesionInicial({ evento: eventoRec, perfil: perfilRec })
        setPantalla("invitado")
        return true
      }
    }

    // Anfitrión tiene prioridad; si no hay, intentar invitado
    intentarAnfitrion()
      .then((ok) => ok ? true : intentarInvitado())
      .catch(() => false)
      .finally(() => setVerificandoSesion(false))
  }, [])

  // ─── Guardar sesión del anfitrión cuando cambia pantalla/evento ──────────────
  useEffect(() => {
    if (!evento || !PANTALLAS_ANFITRION.includes(pantalla)) return
    localStorage.setItem("cc_sesion_anfitrion", JSON.stringify({
      eventoId: evento.eventoId,
      codigo: evento.codigo,
      nombre: evento.nombre,
      tipo: evento.tipo,
      fecha: evento.fecha,
      hora: evento.hora,
      lugar: evento.lugar,
      nombreAnfitrion: evento.nombreAnfitrion,
      pantalla,
    }))
  }, [evento, pantalla])

  // ─── Limpiar sesión del anfitrión al volver al inicio ────────────────────────
  useEffect(() => {
    if (pantalla === "inicio" && !verificandoSesion) {
      localStorage.removeItem("cc_sesion_anfitrion")
    }
  }, [pantalla, verificandoSesion])

  // ─── Helpers de navegación ────────────────────────────────────────────────────

  const salirDeInvitado = () => {
    localStorage.removeItem("cc_sesion")
    setSesionInicial(undefined)
    setCodigoInvitado(undefined)
    setPantalla("inicio")
  }

  const irAInvitado = (codigo?: string) => {
    setCodigoInvitado(codigo)
    setSesionInicial(undefined)
    setPantalla("invitado")
  }

  // ─── Splash mientras se verifica sesión ──────────────────────────────────────

  if (verificandoSesion) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-[#534AB7] flex items-center justify-center shadow-lg">
            <span className="text-white font-black text-sm">CC</span>
          </div>
          <div className="w-6 h-6 border-2 border-[#534AB7] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  // ─── Render ───────────────────────────────────────────────────────────────────

  if (pantalla === "invitado") return (
    <InvitadoFlow
      codigoInicial={codigoInvitado}
      sesionInicial={sesionInicial}
      onSalir={salirDeInvitado}
    />
  )

  if (pantalla === "reunion")
    return <ReunionFlow onSalir={() => setPantalla("inicio")} />

  if (pantalla === "roomies")
    return <RoomiesFlow onSalir={() => setPantalla("inicio")} />

  if (pantalla === "crear-evento") return (
    <CrearEvento
      onVolver={() => setPantalla("inicio")}
      onContinuar={(datos) => { setEvento(datos); setPantalla("compartir-qr") }}
    />
  )

  if (pantalla === "compartir-qr" && evento) return (
    <CompartirQR
      evento={evento}
      onVolver={() => setPantalla("crear-evento")}
      onContinuar={() => setPantalla("cargar-consumos")}
    />
  )

  if (pantalla === "cargar-consumos" && evento) return (
    <CargarConsumos
      evento={evento}
      onVolver={() => setPantalla("compartir-qr")}
      onContinuar={() => setPantalla("vista-en-vivo")}
    />
  )

  if (pantalla === "vista-en-vivo" && evento) return (
    <VistaEnVivo
      evento={evento}
      onVolver={() => setPantalla("cargar-consumos")}
      onContinuar={() => setPantalla("cobrar-y-cerrar")}
    />
  )

  if (pantalla === "cobrar-y-cerrar" && evento) return (
    <CobrarYCerrar
      evento={evento}
      onVolver={() => setPantalla("vista-en-vivo")}
      onCerrar={() => setPantalla("inicio")}
    />
  )

  return (
    <HomePage
      onCrearEvento={() => setPantalla("crear-evento")}
      onSoyInvitado={irAInvitado}
      onCrearRoomies={() => setPantalla("roomies")}
    />
  )
}

export default App
