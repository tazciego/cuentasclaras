import { useState, useEffect, useRef } from "react"
import type { InfoEvento, PerfilInvitado, ItemElegido } from "./InvitadoFlow"
import { HeaderInvitado } from "./InvitadoFlow"
import { COLORES_AVATAR } from "./PasoRegistro"
import { listarConsumos, listarInvitados, ApiError, crearSolicitud, listarSolicitudesInvitado, asignarseConsumo, listarNotificacionesCompartir, actualizarEstadoAsignacion, buscarEventoPorCodigo } from "../../api"
import type { SolicitudAPI, InvitadoListado, NotificacionCompartir } from "../../api"

interface Props {
  evento: InfoEvento
  perfil: PerfilInvitado
  cantidadesIniciales?: Record<number, number>
  onVolver: () => void
  onContinuar: (items: ItemElegido[], cantidades: Record<number, number>) => void
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface ItemDisponible {
  id: number
  nombre: string
  precioUnitario: number
  asignadoPorAnfitrion: boolean
  cantidadAsignada: number
  compartidoConOtros: number
  nombresCompartiendo: string[]
  stockDisponible: number
  cantidadTotal: number
}

// ─── Fila de item ─────────────────────────────────────────────────────────────

function FilaItem({
  item,
  cantidad,
  onToggle,
  onQty,
}: {
  item: ItemDisponible
  cantidad: number
  onToggle: () => void
  onQty: (d: number) => void
}) {
  const elegido = cantidad > 0
  const asignado = item.asignadoPorAnfitrion
  const agotado = item.stockDisponible === 0 && !elegido && !asignado

  const handleClick = () => {
    if (agotado || asignado) return
    onToggle()
  }

  return (
    <div
      className={`flex items-center gap-3 px-4 py-4 rounded-2xl border-2 transition-all
        ${asignado
          ? "border-[#534AB7] bg-[#EEEDFE] cursor-default"
          : agotado
            ? "border-gray-100 bg-gray-50 cursor-not-allowed opacity-60"
            : elegido
              ? "border-[#2EC4B6] bg-[#E0F7F5] cursor-pointer"
              : "border-gray-100 bg-white hover:border-gray-200 cursor-pointer"
        }
      `}
      onClick={handleClick}
    >
      {/* Indicador izquierdo */}
      {asignado ? (
        <div className="w-5 h-5 rounded-full border-2 border-[#534AB7] bg-[#534AB7] flex items-center justify-center shrink-0">
          <svg viewBox="0 0 12 12" className="w-3 h-3" fill="none">
            <path d="M2 6l2.5 2.5L10 3.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      ) : (
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all
          ${elegido ? "border-[#2EC4B6] bg-[#2EC4B6]" : "border-gray-300"}`}>
          {elegido && (
            <svg viewBox="0 0 12 12" className="w-3 h-3" fill="none">
              <path d="M2 6l2.5 2.5L10 3.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      )}

      {/* Nombre + precio + badge */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold leading-snug
          ${asignado ? "text-[#534AB7]" : elegido ? "text-[#2EC4B6]" : "text-gray-700"}`}>
          {item.nombre}
        </p>

        {asignado && (
          <span className="inline-block text-[10px] font-bold text-[#534AB7] bg-[#534AB7]/10 border border-[#534AB7]/20 px-1.5 py-0.5 rounded-full mt-0.5">
            👑 El anfitrión te asignó este item · {cantidad} pieza{cantidad !== 1 ? "s" : ""}
          </span>
        )}
        {agotado && (
          <span className="inline-block text-[10px] font-bold text-red-500 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full mt-0.5">
            Agotado
          </span>
        )}
        {!agotado && !asignado && item.cantidadTotal > 1 && (
          <span className="inline-block text-[10px] font-semibold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full mt-0.5">
            {item.stockDisponible} disponibles
          </span>
        )}

        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-xs text-gray-400">{fmt(item.precioUnitario)} c/u</span>
          {item.compartidoConOtros > 0 && (
            <span className="text-[10px] text-gray-400">
              · con: {item.nombresCompartiendo.join(", ")}
            </span>
          )}
        </div>

        {elegido && cantidad > 0 && (
          <p className={`text-sm font-bold mt-0.5 ${asignado ? "text-[#534AB7]" : "text-[#2EC4B6]"}`}>
            {fmt(item.precioUnitario * cantidad)}
          </p>
        )}
      </div>

      {/* Controles de cantidad */}
      <div
        className="flex items-center gap-2 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        {asignado ? (
          /* Item asignado por anfitrión: solo mostrar la cantidad, sin controles */
          <span className="text-xs font-bold text-[#534AB7] bg-[#534AB7]/10 px-2 py-1 rounded-lg">
            ×{cantidad}
          </span>
        ) : elegido ? (
          <>
            <button
              type="button"
              onClick={() => { if (cantidad === 1) onToggle(); else onQty(-1) }}
              className="w-7 h-7 rounded-lg border-2 bg-white border-[#2EC4B6]/40 text-[#2EC4B6] flex items-center justify-center font-bold text-base hover:opacity-80 transition-colors leading-none"
            >
              −
            </button>
            <span className="text-sm font-bold w-5 text-center text-gray-700">{cantidad}</span>
            <button
              type="button"
              onClick={() => onQty(1)}
              className="w-7 h-7 rounded-lg border-2 bg-white border-[#2EC4B6]/40 text-[#2EC4B6] flex items-center justify-center font-bold text-base hover:opacity-80 transition-colors leading-none"
            >
              +
            </button>
          </>
        ) : (
          <div className="w-7 h-7 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300 text-sm">
            1
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Toast solicitud enviada ──────────────────────────────────────────────────

function ToastEnviada({ onDismiss }: { onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3000)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <div className="fixed bottom-24 left-0 right-0 flex justify-center z-30 px-4 pointer-events-none">
      <div className="bg-gray-800 text-white text-sm font-medium px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2">
        <span>📲</span>
        <span>Solicitud enviada al anfitrión</span>
      </div>
    </div>
  )
}

// ─── Modal solicitar item ──────────────────────────────────────────────────────

function ModalSolicitarItem({
  onEnviar,
  onCerrar,
  enviando,
}: {
  onEnviar: (nombre: string, cantidad: number, precioUnitario: number) => void
  onCerrar: () => void
  enviando: boolean
}) {
  const [nombre, setNombre] = useState("")
  const [cantidad, setCantidad] = useState(1)
  const [precio, setPrecio] = useState("")

  const valid = nombre.trim().length > 0 && parseFloat(precio) > 0 && cantidad >= 1

  const handleEnviar = () => {
    if (!valid || enviando) return
    onEnviar(nombre.trim(), cantidad, parseFloat(precio))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl flex flex-col gap-4 p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-gray-800">Solicitar item</h3>
          <button
            type="button"
            onClick={onCerrar}
            className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors text-base leading-none"
          >
            ×
          </button>
        </div>
        <p className="text-sm text-gray-500 -mt-2">
          El anfitrión revisará tu solicitud.
        </p>

        {/* Nombre */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Nombre del item *</label>
          <input
            autoFocus
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleEnviar()}
            placeholder="Ej: Tacos de canasta"
            className="border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2EC4B6] transition-colors"
          />
        </div>

        {/* Cantidad */}
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Cantidad *</label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setCantidad((c) => Math.max(1, c - 1))}
              disabled={cantidad <= 1}
              className="w-8 h-8 rounded-lg border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:border-[#2EC4B6] hover:text-[#2EC4B6] disabled:opacity-30 transition-colors font-bold text-base leading-none"
            >
              −
            </button>
            <span className="text-base font-black text-gray-800 w-5 text-center">{cantidad}</span>
            <button
              type="button"
              onClick={() => setCantidad((c) => c + 1)}
              className="w-8 h-8 rounded-lg border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:border-[#2EC4B6] hover:text-[#2EC4B6] transition-colors font-bold text-base leading-none"
            >
              +
            </button>
          </div>
        </div>

        {/* Precio unitario */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Precio unitario *</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
            <input
              type="number"
              min="0"
              step="0.50"
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
              placeholder="0.00"
              className="w-full border-2 border-gray-200 rounded-xl pl-8 pr-4 py-3 text-sm focus:outline-none focus:border-[#2EC4B6] transition-colors"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCerrar}
            disabled={enviando}
            className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-500 hover:border-gray-300 transition-colors disabled:opacity-40"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleEnviar}
            disabled={!valid || enviando}
            className="flex-1 py-3 rounded-xl bg-[#2EC4B6] text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {enviando && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {enviando ? "Enviando…" : "Enviar solicitud"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Modal compartir item ──────────────────────────────────────────────────────

type ModoCompartir = "iguales" | "personalizado"

function ModalCompartir({
  item,
  invitadosList,
  miInvitadoId,
  compartidosActuales,
  onConfirmar,
  onCerrar,
}: {
  item: ItemDisponible
  invitadosList: InvitadoListado[]
  miInvitadoId: number
  compartidosActuales: number[]
  onConfirmar: (ids: number[]) => void
  onCerrar: () => void
}) {
  const [modo, setModo] = useState<ModoCompartir>("iguales")
  const [seleccionados, setSeleccionados] = useState<number[]>(compartidosActuales)

  const otros = invitadosList.filter((inv) => inv.id !== miInvitadoId && !inv.es_anfitrion)
  const totalPersonas = seleccionados.length + 1 // +1 = yo
  const precioMio = totalPersonas > 1 ? item.precioUnitario / totalPersonas : item.precioUnitario

  const toggle = (id: number) => {
    setSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl flex flex-col gap-0 overflow-hidden">
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-black text-gray-800">Compartir item</h3>
            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[220px]">{item.nombre}</p>
          </div>
          <button type="button" onClick={onCerrar}
            className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 text-base leading-none">
            ×
          </button>
        </div>

        {/* Modo */}
        <div className="px-5 pt-4 flex gap-2">
          {(["iguales", "personalizado"] as ModoCompartir[]).map((m) => (
            <button key={m} type="button" onClick={() => setModo(m)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold border-2 transition-all
                ${modo === m ? "border-[#2EC4B6] bg-[#2EC4B6]/5 text-[#2EC4B6]" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>
              {m === "iguales" ? "Partes iguales" : "Personalizado"}
            </button>
          ))}
        </div>

        {/* Lista */}
        <div className="px-5 py-4 flex flex-col gap-2 max-h-56 overflow-y-auto">
          {otros.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">No hay otros invitados aún.</p>
          )}
          {otros.map((inv) => {
            const activo = seleccionados.includes(inv.id)
            const color = COLORES_AVATAR[inv.color_index % COLORES_AVATAR.length]
            return (
              <button key={inv.id} type="button" onClick={() => toggle(inv.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 text-left transition-all
                  ${activo ? "border-[#2EC4B6] bg-[#2EC4B6]/5" : "border-gray-200 hover:border-gray-300"}`}>
                <div className={`w-8 h-8 rounded-full ${color.bg} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                  {inv.nombre.charAt(0).toUpperCase()}
                </div>
                <span className={`flex-1 text-sm font-medium ${activo ? "text-[#2EC4B6]" : "text-gray-700"}`}>
                  {inv.nombre}
                </span>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${activo ? "border-[#2EC4B6] bg-[#2EC4B6]" : "border-gray-300"}`}>
                  {activo && (
                    <svg viewBox="0 0 12 12" className="w-3 h-3" fill="none">
                      <path d="M2 6l2.5 2.5L10 3.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Resumen de precio */}
        <div className="mx-5 mb-4 bg-[#2EC4B6]/5 border border-[#2EC4B6]/20 rounded-xl px-4 py-3 flex items-center justify-between">
          <span className="text-xs text-gray-500 font-medium">
            {totalPersonas === 1 ? "Solo yo" : `Entre ${totalPersonas} personas`}
          </span>
          <span className="text-sm font-black text-[#2EC4B6]">
            {modo === "iguales"
              ? `${fmt(precioMio)} c/u`
              : `${fmt(item.precioUnitario)} total`}
          </span>
        </div>

        {/* Botones */}
        <div className="px-5 pb-5 flex gap-2">
          <button type="button" onClick={onCerrar}
            className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-500 hover:border-gray-300 transition-colors">
            Cancelar
          </button>
          <button type="button" onClick={() => onConfirmar(seleccionados)}
            className="flex-1 py-3 rounded-xl bg-[#2EC4B6] text-white text-sm font-bold hover:opacity-90 transition-opacity">
            Confirmar
          </button>
        </div>
      </div>
    </div>
  )
}

function fmt(n: number) {
  return `$${Math.round(n).toLocaleString("es-MX")}`
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function PasoElegir({ evento, perfil, cantidadesIniciales, onVolver, onContinuar }: Props) {
  const [items, setItems] = useState<ItemDisponible[]>([])
  const [invitadosList, setInvitadosList] = useState<InvitadoListado[]>([])
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState("")
  const [mostrarToast, setMostrarToast] = useState(false)
  const [modalSolicitud, setModalSolicitud] = useState(false)
  const [enviandoSolicitud, setEnviandoSolicitud] = useState(false)
  const [solicitudes, setSolicitudes] = useState<SolicitudAPI[]>([])
  const [dismissedIds, setDismissedIds] = useState<number[]>([])
  const [cantidades, setCantidades] = useState<Record<number, number>>(cantidadesIniciales ?? {})
  const [compartiendo, setCompartiendo] = useState<number | null>(null)
  const [compartidos, setCompartidos] = useState<Record<number, number[]>>({})
  const [notificacionesCompartir, setNotificacionesCompartir] = useState<NotificacionCompartir[]>([])
  const [dismissedCompartir, setDismissedCompartir] = useState<string[]>([])
  const [solicitudesEnviadas, setSolicitudesEnviadas] = useState<Record<number, string[]>>({})

  const [eventoCerrado, setEventoCerrado] = useState(false)
  const color = COLORES_AVATAR[perfil.colorIndex]
  const inicial = perfil.nombre.charAt(0).toUpperCase()
  const cargadoRef = useRef(false)

  // Verificar si el evento fue cerrado por el anfitrión
  useEffect(() => {
    let mounted = true
    const check = () => {
      buscarEventoPorCodigo(evento.codigo)
        .then((ev) => { if (mounted && ev.estado === "cerrado") setEventoCerrado(true) })
        .catch(() => {})
    }
    check()
    const id = setInterval(check, 1000)
    return () => { mounted = false; clearInterval(id) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [evento.codigo])

  // Cargar lista de invitados para el modal de compartir
  useEffect(() => {
    listarInvitados(evento.eventoId)
      .then((inv) => setInvitadosList(inv))
      .catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [evento.eventoId])

  useEffect(() => {
    let mounted = true

    const cargar = () => {
      listarConsumos(evento.eventoId)
        .then((consumos) => {
          if (!mounted) return
          const mapped: ItemDisponible[] = consumos.map((c) => {
            const miAsignacion = c.asignados.find(
              (a) => a.invitado_id === perfil.invitadoId && a.solicitado_por === null
            )
            const otrosAsignados = c.asignados.filter((a) => a.invitado_id !== perfil.invitadoId)
            const esAsignadoAmi = !!miAsignacion
            const cantidadAsignada = miAsignacion?.cantidad ?? 1
            const totalAsignado = c.asignados.reduce((s, a) => s + a.cantidad, 0)
            return {
              id: c.id,
              nombre: c.descripcion,
              precioUnitario: parseFloat(c.precio) / Math.max(c.cantidad, 1),
              asignadoPorAnfitrion: esAsignadoAmi,
              cantidadAsignada,
              compartidoConOtros: otrosAsignados.length,
              nombresCompartiendo: otrosAsignados.map((a) => a.invitado_nombre),
              stockDisponible: Math.max(0, c.cantidad - totalAsignado),
              cantidadTotal: c.cantidad,
            }
          })
          setItems(mapped)
          // Pre-seleccionar items asignados por el anfitrión con la cantidad real asignada
          setCantidades((prev) => {
            const nuevas = { ...prev }
            mapped.forEach((item) => {
              if (item.asignadoPorAnfitrion && !nuevas[item.id]) {
                nuevas[item.id] = item.cantidadAsignada
              }
            })
            return nuevas
          })
          setErrorCarga("")
          cargadoRef.current = true
        })
        .catch((err) => {
          if (!mounted) return
          const msg = err instanceof ApiError ? err.mensaje : "Error de conexión."
          if (!cargadoRef.current) setErrorCarga(msg)
        })
        .finally(() => {
          if (mounted) setCargando(false)
        })
    }

    cargar()
    const intervalo = setInterval(cargar, 1000)
    return () => { mounted = false; clearInterval(intervalo) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [evento.eventoId, perfil.invitadoId])

  // Polling solicitudes del invitado
  useEffect(() => {
    let mounted = true
    const cargarSols = () => {
      listarSolicitudesInvitado(evento.eventoId, perfil.invitadoId)
        .then((s) => { if (mounted) setSolicitudes(s) })
        .catch(() => {})
    }
    cargarSols()
    const id = setInterval(cargarSols, 1000)
    return () => { mounted = false; clearInterval(id) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [evento.eventoId, perfil.invitadoId])

  // Polling notificaciones de compartir
  useEffect(() => {
    let mounted = true
    const poll = () => {
      listarNotificacionesCompartir(evento.eventoId, perfil.invitadoId)
        .then((n) => { if (mounted) setNotificacionesCompartir(n) })
        .catch(() => {})
    }
    poll()
    const id = setInterval(poll, 1000)
    return () => { mounted = false; clearInterval(id) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [evento.eventoId, perfil.invitadoId])

  const toggle = (id: number) => {
    const was = (cantidades[id] ?? 0) > 0
    const newQty = was ? 0 : 1
    asignarseConsumo({
      consumo_id: id,
      invitado_id: perfil.invitadoId,
      cantidad: newQty,
      // solicitado_por propio marca auto-asignación (≠ null), distingue del anfitrión (null)
      ...(newQty > 0 ? { solicitado_por: perfil.invitadoId } : {}),
    }).catch(() => {})
    setCantidades((prev) => {
      if (was) {
        const next = { ...prev }
        delete next[id]
        return next
      }
      return { ...prev, [id]: 1 }
    })
  }

  const qty = (id: number, delta: number) => {
    const newQty = Math.max(1, (cantidades[id] ?? 1) + delta)
    asignarseConsumo({ consumo_id: id, invitado_id: perfil.invitadoId, cantidad: newQty }).catch(() => {})
    setCantidades((prev) => ({ ...prev, [id]: newQty }))
  }

  const confirmarCompartir = (ids: number[]) => {
    const itemId = compartiendo!
    const item = items.find((i) => i.id === itemId)
    setCompartidos((prev) => ({ ...prev, [itemId]: ids }))
    ids.forEach((invId) => {
      asignarseConsumo({
        consumo_id: itemId,
        invitado_id: invId,
        cantidad: 1,
        estado: 'pendiente',
        solicitado_por: perfil.invitadoId,
      }).catch(() => {})
    })
    // Track solicitudes enviadas para mostrar estado
    if (item) {
      const nombresDestino = ids.map((id) => {
        const inv = invitadosList.find((i) => i.id === id)
        return inv?.nombre ?? `#${id}`
      })
      setSolicitudesEnviadas((prev) => ({ ...prev, [itemId]: nombresDestino }))
    }
    setCompartiendo(null)
  }

  const aceptarCompartir = async (n: NotificacionCompartir) => {
    try {
      await actualizarEstadoAsignacion({
        consumo_id: n.consumo_id,
        invitado_id: perfil.invitadoId,
        estado: 'aceptado',
      })
    } catch { /* silently */ }
  }

  const rechazarCompartir = async (n: NotificacionCompartir) => {
    try {
      await actualizarEstadoAsignacion({
        consumo_id: n.consumo_id,
        invitado_id: perfil.invitadoId,
        estado: 'rechazado',
      })
    } catch { /* silently */ }
  }

  const miTotal = items.reduce((sum, item) => {
    const cant = cantidades[item.id] ?? 0
    if (cant === 0) return sum
    const numCompartidos = (compartidos[item.id]?.length ?? 0) + 1
    return sum + (item.precioUnitario * cant) / numCompartidos
  }, 0)

  const conteoElegidos = Object.values(cantidades).filter((v) => v > 0).length

  const handleContinuar = () => {
    const elegidos: ItemElegido[] = items
      .filter((it) => (cantidades[it.id] ?? 0) > 0)
      .map((it) => ({
        id: it.id,
        nombre: it.nombre,
        precioBase: it.precioUnitario,
        cantidad: cantidades[it.id],
        compartidoConOtros: it.compartidoConOtros,
      }))
    onContinuar(elegidos, cantidades)
  }

  const enviarSolicitud = async (nombre: string, cantidad: number, precioUnitario: number) => {
    setEnviandoSolicitud(true)
    try {
      await crearSolicitud({
        evento_id: evento.eventoId,
        invitado_id: perfil.invitadoId,
        nombre_item: nombre,
        cantidad,
        precio_unitario: precioUnitario,
      })
      setModalSolicitud(false)
      setMostrarToast(true)
    } catch {
      // silently ignore
    } finally {
      setEnviandoSolicitud(false)
    }
  }

  if (eventoCerrado) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6 text-center">
        <div className="flex flex-col items-center gap-4 max-w-sm">
          <span className="text-5xl">🔒</span>
          <h2 className="text-xl font-black text-gray-800">Evento cerrado</h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            Este evento ha sido cerrado por el anfitrión.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <HeaderInvitado onVolver={onVolver} labelVolver="Registro" paso={3} />

      <main className="flex-1 max-w-md mx-auto w-full px-4 py-6 flex flex-col gap-4 pb-32">

        <div>
          <p className="text-xs font-semibold text-[#2EC4B6] uppercase tracking-wider mb-1">{evento.nombre}</p>
          <h1 className="text-xl font-black text-gray-800">Elige tus consumos</h1>
          <p className="text-gray-400 text-sm mt-1">Selecciona lo que pediste y ajusta la cantidad.</p>
        </div>

        {cargando && (
          <div className="flex flex-col items-center gap-3 py-12 text-gray-400">
            <div className="w-8 h-8 border-2 border-[#2EC4B6] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm">Conectando con el anfitrión…</p>
          </div>
        )}

        {!cargando && errorCarga && (
          <div className="flex flex-col items-center gap-3 py-10">
            <span className="text-3xl">⚠️</span>
            <p className="text-sm text-red-400 text-center">{errorCarga}</p>
            <button
              type="button"
              onClick={() => { setCargando(true); setErrorCarga(""); cargadoRef.current = false }}
              className="px-4 py-2 rounded-xl bg-[#2EC4B6] text-white text-sm font-bold hover:opacity-90"
            >
              Reintentar
            </button>
          </div>
        )}

        {!cargando && !errorCarga && items.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-12 text-gray-400">
            <span className="text-4xl">⏳</span>
            <p className="text-sm text-center font-medium text-gray-500">
              El anfitrión está cargando el menú…
            </p>
            <p className="text-xs text-gray-300">Esta pantalla se actualiza sola cada segundo.</p>
          </div>
        )}

        {!cargando && !errorCarga && items.length > 0 && (
          <div className="flex flex-col gap-2.5">
            {items.map((item) => {
              const numCompartidos = (compartidos[item.id]?.length ?? 0) + 1
              const elegido = (cantidades[item.id] ?? 0) > 0
              return (
                <div key={item.id}>
                  <FilaItem
                    item={item}
                    cantidad={cantidades[item.id] ?? 0}
                    onToggle={() => toggle(item.id)}
                    onQty={(d) => qty(item.id, d)}
                  />
                  {elegido && !item.asignadoPorAnfitrion && (
                    <button type="button"
                      onClick={() => setCompartiendo(item.id)}
                      className="mt-1 ml-2 flex items-center gap-1.5 text-[10px] font-bold text-gray-400 hover:text-[#2EC4B6] transition-colors">
                      <svg viewBox="0 0 16 16" className="w-3 h-3" fill="currentColor">
                        <path d="M11 2.5a2.5 2.5 0 11.91 1.94L6.6 7.22a2.5 2.5 0 010 1.56l5.31 2.78a2.5 2.5 0 11-.91 1.94L5.69 10.72a2.5 2.5 0 110-5.44l5.31-2.78z"/>
                      </svg>
                      {solicitudesEnviadas[item.id]?.length
                        ? `⏳ Esperando a ${solicitudesEnviadas[item.id].join(", ")}`
                        : numCompartidos > 1
                          ? `Compartido entre ${numCompartidos}`
                          : "Compartir con…"}
                    </button>
                  )}
                </div>
              )
            })}

            {/* Invitaciones a compartir pendientes */}
            {notificacionesCompartir
              .filter((n) => n.estado === 'pendiente' && !dismissedCompartir.includes(`${n.consumo_id}-${n.invitado_id}`))
              .map((n) => {
                const precioTotal = parseFloat(n.precio)
                const miParte = Math.round(precioTotal / 2)
                const key = `comp-pend-${n.consumo_id}-${n.solicitado_por}`
                return (
                  <div key={key} className="flex items-start gap-3 px-4 py-4 rounded-2xl border-2 border-blue-200 bg-blue-50">
                    <span className="text-xl shrink-0 mt-0.5">🤝</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-blue-600 uppercase tracking-wide">Invitación a compartir</p>
                      <p className="text-sm font-semibold text-gray-800 leading-snug">
                        <span className="text-blue-700">{n.solicitante_nombre}</span> quiere compartir{" "}
                        <span className="font-bold">"{n.consumo_nombre}"</span> contigo
                      </p>
                      <p className="text-xs text-blue-500 mt-0.5">Tu parte aprox: {fmt(miParte)} (total: {fmt(precioTotal)})</p>
                      <div className="flex gap-2 mt-2">
                        <button type="button" onClick={() => aceptarCompartir(n)}
                          className="px-3 py-1.5 rounded-lg bg-[#2EC4B6] text-white text-xs font-bold hover:opacity-90 transition-opacity">
                          ✓ Aceptar
                        </button>
                        <button type="button" onClick={() => rechazarCompartir(n)}
                          className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 border border-gray-200 text-xs font-bold hover:bg-gray-200 transition-colors">
                          Rechazar
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })
            }

            {/* Compartires rechazados */}
            {notificacionesCompartir
              .filter((n) => n.estado === 'rechazado' && !dismissedCompartir.includes(`rec-${n.consumo_id}-${n.invitado_id}`))
              .map((n) => {
                const key = `comp-rec-${n.consumo_id}-${n.invitado_id}`
                return (
                  <div key={key} className="flex items-center gap-3 px-4 py-3 rounded-2xl border-2 border-red-200 bg-red-50">
                    <span className="text-base shrink-0">❌</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-red-500 uppercase tracking-wide">Compartir rechazado</p>
                      <p className="text-sm font-semibold text-red-700 truncate">
                        {n.invitado_nombre} rechazó compartir "{n.consumo_nombre}"
                      </p>
                    </div>
                    <button type="button"
                      onClick={() => setDismissedCompartir((prev) => [...prev, `rec-${n.consumo_id}-${n.invitado_id}`])}
                      className="text-red-300 hover:text-red-500 text-lg leading-none shrink-0">
                      ×
                    </button>
                  </div>
                )
              })
            }

            {/* Solicitar item al anfitrión */}
            <button
              type="button"
              onClick={() => setModalSolicitud(true)}
              className="flex items-center gap-2 px-4 py-3.5 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 text-sm font-medium hover:border-[#2EC4B6] hover:text-[#2EC4B6] transition-colors bg-white"
            >
              <svg viewBox="0 0 20 20" className="w-4 h-4" fill="currentColor">
                <path d="M2 3a1 1 0 00-1 1v1a1 1 0 001 1h13a1 1 0 001-1V4a1 1 0 00-1-1H2zM2 8.5a.5.5 0 01.5-.5h10a.5.5 0 010 1H2.5a.5.5 0 01-.5-.5zm0 3a.5.5 0 01.5-.5h6a.5.5 0 010 1H2.5a.5.5 0 01-.5-.5z" />
              </svg>
              Solicitar item al anfitrión
            </button>

            {/* Respuestas del anfitrión: autorizados */}
            {solicitudes
              .filter((s) => s.estado === "autorizado" && !dismissedIds.includes(s.id))
              .map((s) => (
                <div key={`aut-${s.id}`} className="flex items-center gap-3 px-4 py-3 rounded-2xl border-2 border-green-200 bg-green-50">
                  <span className="text-base shrink-0">✅</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-green-600 uppercase tracking-wide">¡Autorizado!</p>
                    <p className="text-sm font-semibold text-green-800 truncate">
                      {s.nombre_item} ya está en el menú
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDismissedIds((prev) => [...prev, s.id])}
                    className="text-green-300 hover:text-green-500 text-lg leading-none shrink-0"
                  >
                    ×
                  </button>
                </div>
              ))
            }

            {/* Respuestas del anfitrión: rechazados */}
            {solicitudes
              .filter((s) => s.estado === "rechazado" && !dismissedIds.includes(s.id))
              .map((s) => (
                <div key={`rec-${s.id}`} className="flex items-center gap-3 px-4 py-3 rounded-2xl border-2 border-red-200 bg-red-50">
                  <span className="text-base shrink-0">❌</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-red-500 uppercase tracking-wide">No autorizado</p>
                    <p className="text-sm font-semibold text-red-700 truncate">{s.nombre_item}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDismissedIds((prev) => [...prev, s.id])}
                    className="text-red-300 hover:text-red-500 text-lg leading-none shrink-0"
                  >
                    ×
                  </button>
                </div>
              ))
            }
          </div>
        )}

      </main>

      {/* Barra fija inferior */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-lg z-20">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full ${color.bg} flex items-center justify-center text-white font-black text-sm shrink-0`}>
            {inicial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 font-medium">Mi cuenta</p>
            <p className="text-lg font-black text-[#2EC4B6] leading-tight">{fmt(miTotal)}</p>
          </div>
          {conteoElegidos > 0 && (
            <span className="text-xs font-bold text-gray-400">
              {conteoElegidos} item{conteoElegidos !== 1 ? "s" : ""}
            </span>
          )}
          <button
            type="button"
            onClick={handleContinuar}
            disabled={conteoElegidos === 0}
            className="shrink-0 px-5 py-2.5 rounded-xl bg-[#2EC4B6] text-white font-bold text-sm hover:opacity-90 active:scale-[0.97] transition-all shadow-md shadow-[#2EC4B6]/30 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Revisar →
          </button>
        </div>
      </div>

      {mostrarToast && <ToastEnviada onDismiss={() => setMostrarToast(false)} />}
      {modalSolicitud && (
        <ModalSolicitarItem
          onEnviar={enviarSolicitud}
          onCerrar={() => setModalSolicitud(false)}
          enviando={enviandoSolicitud}
        />
      )}
      {compartiendo !== null && (() => {
        const item = items.find((i) => i.id === compartiendo)
        return item ? (
          <ModalCompartir
            item={item}
            invitadosList={invitadosList}
            miInvitadoId={perfil.invitadoId}
            compartidosActuales={compartidos[compartiendo] ?? []}
            onConfirmar={confirmarCompartir}
            onCerrar={() => setCompartiendo(null)}
          />
        ) : null
      })()}
    </div>
  )
}
