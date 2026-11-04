import { useState, useEffect } from "react"
import type { DatosEvento, TipoEvento } from "./types"
import type { InfoEvento, PerfilInvitado } from "./components/invitado/InvitadoFlow"
import type { SesionReunion } from "./components/reunion/ReunionFlow"
import type { SesionRoomies } from "./components/roomies/RoomiesFlow"
import HomePage from "./components/HomePage"
import CrearEvento from "./components/CrearEvento"
import CompartirQR from "./components/CompartirQR"
import CargarConsumos from "./components/CargarConsumos"
import VistaEnVivo from "./components/VistaEnVivo"
import CobrarYCerrar from "./components/CobrarYCerrar"
import InvitadoFlow from "./components/invitado/InvitadoFlow"
import ReunionFlow from "./components/reunion/ReunionFlow"
import RoomiesFlow from "./components/roomies/RoomiesFlow"
import { buscarEventoPorCodigo, listarPagosInvitado, type EventoAPI } from "./api"
import { guardarEnHistorial, type EntradaHistorial } from "./historial"

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
  // ── Reunión/Viaje ────────────────────────────────────────────────────────────
  const [reunionSesionInicial, setReunionSesionInicial] = useState<SesionReunion | undefined>()
  const [reunionCodigoUnirse, setReunionCodigoUnirse] = useState<string | undefined>()
  // ── Roomies ──────────────────────────────────────────────────────────────────
  const [roomiesSesionInicial, setRoomiesSesionInicial] = useState<SesionRoomies | undefined>()
  const [roomiesCodigoUnirse, setRoomiesCodigoUnirse] = useState<string | undefined>()

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

    const rawAnf     = localStorage.getItem("cc_sesion_anfitrion")
    const rawInv     = localStorage.getItem("cc_sesion")
    const rawReunion = localStorage.getItem("cc_sesion_reunion")
    const rawRoomies = localStorage.getItem("cc_sesion_roomies")

    if (!rawAnf && !rawInv && !rawReunion && !rawRoomies) { setVerificandoSesion(false); return }

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

    const intentarReunion = (): boolean => {
      if (!rawReunion) return false
      try {
        const s = JSON.parse(rawReunion) as SesionReunion
        if (!s.eventoId || !s.miembroId) { localStorage.removeItem("cc_sesion_reunion"); return false }
        setReunionSesionInicial(s)
        setReunionCodigoUnirse(undefined)
        setPantalla("reunion")
        return true
      } catch {
        localStorage.removeItem("cc_sesion_reunion")
        return false
      }
    }

    const intentarRoomies = (): boolean => {
      if (!rawRoomies) return false
      try {
        const s = JSON.parse(rawRoomies) as SesionRoomies
        if (!s.casaId || !s.miembroId) { localStorage.removeItem("cc_sesion_roomies"); return false }
        setRoomiesSesionInicial(s)
        setRoomiesCodigoUnirse(undefined)
        setPantalla("roomies")
        return true
      } catch {
        localStorage.removeItem("cc_sesion_roomies")
        return false
      }
    }

    // Anfitrión tiene prioridad; si no hay, intentar invitado; si no, reunión; si no, roomies
    intentarAnfitrion()
      .then((ok) => ok ? true : intentarInvitado())
      .then((ok) => ok ? true : intentarReunion())
      .then((ok) => ok ? true : intentarRoomies())
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
      setEvento(null)  // limpiar para que la próxima creación inicie en blanco
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

  const manejarEsReunion = (ev: EventoAPI) => {
    setReunionSesionInicial(undefined)
    setReunionCodigoUnirse(ev.codigo)
    setPantalla("reunion")
  }

  const salirDeReunion = () => {
    localStorage.removeItem("cc_sesion_reunion")
    setReunionSesionInicial(undefined)
    setReunionCodigoUnirse(undefined)
    setPantalla("inicio")
  }

  const manejarEsRoomies = (ev: EventoAPI) => {
    setRoomiesSesionInicial(undefined)
    setRoomiesCodigoUnirse(ev.codigo)
    setPantalla("roomies")
  }

  const salirDeRoomies = () => {
    localStorage.removeItem("cc_sesion_roomies")
    setRoomiesSesionInicial(undefined)
    setRoomiesCodigoUnirse(undefined)
    setPantalla("inicio")
  }

  const retomarEvento = (entrada: EntradaHistorial) => {
    if (entrada.rol === 'anfitrion' && entrada.anfitrion) {
      const ev: DatosEvento = {
        eventoId: entrada.eventoId,
        codigo: entrada.eventoCodigo,
        nombre: entrada.eventoNombre,
        tipo: entrada.eventoTipo as TipoEvento,
        fecha: entrada.fecha,
        hora: entrada.anfitrion.hora,
        lugar: entrada.lugar,
        nombreAnfitrion: entrada.anfitrion.nombre,
        participantes: [],
      }
      setEvento(ev)
      setPantalla("vista-en-vivo")
    } else if (entrada.rol === 'invitado' && entrada.invitado) {
      const eventoRec: InfoEvento = {
        eventoId: entrada.eventoId,
        codigo: entrada.eventoCodigo,
        nombre: entrada.eventoNombre,
        tipo: entrada.eventoTipo as "restaurante" | "reunion",
        fecha: entrada.fecha,
        lugar: entrada.lugar,
        clabe_spei: entrada.invitado.clabe_spei ?? undefined,
      }
      const perfilRec: PerfilInvitado = {
        nombre: entrada.invitado.nombre,
        colorIndex: entrada.invitado.colorIndex,
        invitadoId: entrada.invitado.invitadoId,
        token: entrada.invitado.token,
      }
      setSesionInicial({ evento: eventoRec, perfil: perfilRec })
      setCodigoInvitado(undefined)
      setPantalla("invitado")
    }
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
      onEsReunion={manejarEsReunion}
      onEsRoomies={manejarEsRoomies}
    />
  )

  if (pantalla === "reunion") return (
    <ReunionFlow
      onSalir={salirDeReunion}
      sesionInicial={reunionSesionInicial}
      codigoParaUnirse={reunionCodigoUnirse}
    />
  )

  if (pantalla === "roomies")
    return <RoomiesFlow
      onSalir={salirDeRoomies}
      sesionInicial={roomiesSesionInicial}
      codigoParaUnirse={roomiesCodigoUnirse}
    />

  if (pantalla === "crear-evento") return (
    <CrearEvento
      eventoExistente={evento ?? undefined}
      onVolver={() => setPantalla(evento ? "compartir-qr" : "inicio")}
      onContinuar={(datos) => {
        setEvento(datos)
        setPantalla("compartir-qr")
        guardarEnHistorial({
          rol: 'anfitrion',
          eventoNombre: datos.nombre,
          eventoCodigo: datos.codigo,
          eventoId: datos.eventoId,
          eventoTipo: datos.tipo,
          fecha: datos.fecha,
          lugar: datos.lugar,
          anfitrion: { nombre: datos.nombreAnfitrion, hora: datos.hora, pantalla: 'vista-en-vivo' },
        })
      }}
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
      onCrearReunion={() => { setReunionSesionInicial(undefined); setReunionCodigoUnirse(undefined); setPantalla("reunion") }}
      onRetomarEvento={retomarEvento}
    />
  )
}

export default App
