import { useState, useRef, useEffect, useCallback } from "react"
import type { DatosEvento } from "../types"
import BarraProgreso from "./BarraProgreso"
import { guardarConsumo, listarConsumos, listarInvitados, eliminarConsumo, actualizarConsumo } from "../api"
import type { InvitadoListado } from "../api"
import { COLORES_AVATAR } from "./invitado/PasoRegistro"
import { BotonCompartir } from "./BotonCompartir"

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  evento: DatosEvento
  onVolver: () => void
  onContinuar: () => void
}

// ─── Tipos internos ───────────────────────────────────────────────────────────

interface ItemConsumo {
  id: number
  nombre: string
  cantidad: number
  precioUnitario: number
  sinAsignar: boolean      // "Los invitados eligen"
  asignados: number[]      // IDs reales de invitados en BD
}

type ModoCaptura = "foto-ticket" | "foto-menu" | "manual"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMXN(n: number) {
  return `$${n.toLocaleString("es-MX")}`
}

// ─── Zona de cámara ───────────────────────────────────────────────────────────

function ZonaCamara({ modo }: { modo: ModoCaptura }) {
  const [escaneando, setEscaneando] = useState(false)
  const [capturado, setCapturado] = useState(false)
  const lineaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!escaneando || capturado) return
    let pos = 0, dir = 1
    const interval = setInterval(() => {
      pos += dir * 2
      if (pos >= 100) dir = -1
      if (pos <= 0) dir = 1
      if (lineaRef.current) lineaRef.current.style.top = `${pos}%`
    }, 16)
    return () => clearInterval(interval)
  }, [escaneando, capturado])

  const handleTap = () => {
    if (capturado) return
    if (!escaneando) { setEscaneando(true); return }
    setCapturado(true)
    setEscaneando(false)
  }

  const textos: Record<ModoCaptura, { idle: string; scanning: string; done: string }> = {
    "foto-ticket": { idle: "Apunta al ticket y toca para capturar", scanning: "Escaneando… toca para capturar", done: "¡Ticket capturado! Revisando items…" },
    "foto-menu":   { idle: "Apunta al menú y toca para capturar",   scanning: "Escaneando… toca para capturar", done: "¡Menú capturado! Revisando items…" },
    "manual":      { idle: "", scanning: "", done: "" },
  }

  if (modo === "manual") return null

  const texto = capturado ? textos[modo].done : escaneando ? textos[modo].scanning : textos[modo].idle

  return (
    <button type="button" onClick={handleTap}
      className="w-full relative rounded-2xl overflow-hidden bg-gray-900 aspect-[4/3] flex items-center justify-center cursor-pointer focus:outline-none group"
      aria-label="Zona de cámara">
      <div className="absolute inset-0 bg-gradient-to-b from-gray-800 to-gray-950" />
      {["top-3 left-3 border-t-2 border-l-2 rounded-tl-lg",
        "top-3 right-3 border-t-2 border-r-2 rounded-tr-lg",
        "bottom-3 left-3 border-b-2 border-l-2 rounded-bl-lg",
        "bottom-3 right-3 border-b-2 border-r-2 rounded-br-lg"].map((cls, i) => (
        <span key={i} className={`absolute w-6 h-6 border-[#534AB7] ${cls}`} />
      ))}
      {escaneando && !capturado && (
        <div ref={lineaRef} className="absolute left-4 right-4 h-0.5 bg-[#534AB7] shadow-[0_0_8px_2px_#534AB7] transition-none" style={{ top: "0%" }} />
      )}
      <div className="relative z-10 flex flex-col items-center gap-3 px-6 text-center">
        {capturado ? (
          <>
            <div className="w-14 h-14 rounded-full bg-green-500/20 border-2 border-green-400 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-7 h-7 text-green-400" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <p className="text-green-400 text-sm font-semibold">{texto}</p>
          </>
        ) : (
          <>
            <div className={`w-14 h-14 rounded-full border-2 flex items-center justify-center transition-colors ${escaneando ? "border-[#534AB7] bg-[#534AB7]/20" : "border-white/30 bg-white/10 group-hover:border-[#534AB7]/60"}`}>
              <svg viewBox="0 0 24 24" className="w-7 h-7 text-white/70" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </div>
            <p className="text-white/70 text-sm leading-snug">{texto}</p>
            {!escaneando && (
              <span className="text-[#534AB7] text-xs font-semibold mt-1 group-hover:text-[#7B73D4] transition-colors">
                Toca para activar
              </span>
            )}
          </>
        )}
      </div>
    </button>
  )
}

// ─── Fila de item ─────────────────────────────────────────────────────────────

function FilaItem({
  item,
  invitados,
  eliminando,
  onEditar,
  onEliminar,
}: {
  item: ItemConsumo
  invitados: InvitadoListado[]
  eliminando: boolean
  onEditar: () => void
  onEliminar: () => void
}) {
  const total = item.cantidad * item.precioUnitario

  const asignadosNombres = item.sinAsignar
    ? []
    : invitados.filter((inv) => item.asignados.includes(inv.id))

  return (
    <div className="flex flex-col gap-2 py-4 border-b border-gray-100 last:border-0">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-gray-800 leading-snug">{item.nombre}</span>
          <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
            <span>{item.cantidad} × {formatMXN(item.precioUnitario)}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-sm font-bold text-gray-800 mr-1">{formatMXN(total)}</span>
          <button type="button" onClick={onEditar} disabled={eliminando}
            className="w-7 h-7 rounded-md flex items-center justify-center text-gray-300 hover:text-[#534AB7] hover:bg-[#534AB7]/10 transition-colors disabled:opacity-30"
            aria-label={`Editar ${item.nombre}`}>
            <svg viewBox="0 0 20 20" className="w-3.5 h-3.5" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </button>
          {eliminando ? (
            <div className="w-7 h-7 flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-red-300 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <button type="button" onClick={onEliminar}
              className="w-7 h-7 rounded-md flex items-center justify-center text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors text-base leading-none"
              aria-label={`Eliminar ${item.nombre}`}>×</button>
          )}
        </div>
      </div>

      {/* Chips de asignación */}
      <div className="flex items-center gap-1.5 flex-wrap pl-0.5">
        {item.sinAsignar ? (
          <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            Los invitados eligen
          </span>
        ) : asignadosNombres.length === 0 ? (
          <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            Sin asignar
          </span>
        ) : (
          asignadosNombres.map((inv) => {
            const color = COLORES_AVATAR[inv.color_index % COLORES_AVATAR.length]
            return (
              <div key={inv.id} className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-full pl-0.5 pr-2 py-0.5">
                <div className={`w-4 h-4 rounded-full ${color.bg} flex items-center justify-center text-white text-[9px] font-bold`}>
                  {inv.nombre.charAt(0).toUpperCase()}
                </div>
                <span className="text-[10px] font-medium text-gray-600">{inv.nombre}</span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

// ─── Modal agregar / editar item ──────────────────────────────────────────────

function ModalAgregarItem({
  eventoId,
  initialValues,
  guardando,
  errorExterno,
  onGuardar,
  onCerrar,
}: {
  eventoId: number
  initialValues?: Omit<ItemConsumo, "id">
  guardando: boolean
  errorExterno: string
  onGuardar: (item: Omit<ItemConsumo, "id">) => void
  onCerrar: () => void
}) {
  const modoEdicion = !!initialValues
  const [nombre, setNombre] = useState(initialValues?.nombre ?? "")
  const [precio, setPrecio] = useState(initialValues ? String(initialValues.precioUnitario) : "")
  const [cantidad, setCantidad] = useState(initialValues?.cantidad ?? 1)
  const [sinAsignar, setSinAsignar] = useState(initialValues?.sinAsignar ?? false)
  const [asignadosIds, setAsignadosIds] = useState<number[]>(initialValues?.asignados ?? [])
  const [invitados, setInvitados] = useState<InvitadoListado[]>([])
  const [cargandoInvitados, setCargandoInvitados] = useState(true)

  useEffect(() => {
    listarInvitados(eventoId)
      .then(setInvitados)
      .catch(() => {})
      .finally(() => setCargandoInvitados(false))
  }, [eventoId])

  const toggleInvitado = (id: number) => {
    setAsignadosIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const valid = nombre.trim().length > 0 && parseFloat(precio) > 0

  const submit = () => {
    if (!valid || guardando) return
    onGuardar({
      nombre: nombre.trim(),
      precioUnitario: parseFloat(precio),
      cantidad,
      sinAsignar,
      asignados: sinAsignar ? [] : asignadosIds,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl flex flex-col max-h-[90vh]">

        {/* Header fijo */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <h3 className="font-black text-gray-800 text-base">
            {modoEdicion ? "Editar item" : "Agregar item"}
          </h3>
        </div>

        {/* Contenido scrolleable */}
        <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4">

          {/* Nombre */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Nombre del item</label>
            <input
              autoFocus
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Tacos de canasta"
              className="border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#534AB7] transition-colors"
            />
          </div>

          {/* Precio */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Precio unitario</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">$</span>
              <input
                type="number"
                min="0"
                step="0.50"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                placeholder="0.00"
                className="w-full border-2 border-gray-200 rounded-xl pl-8 pr-4 py-3 text-sm focus:outline-none focus:border-[#534AB7] transition-colors"
              />
            </div>
          </div>

          {/* Cantidad */}
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Cantidad</label>
            <div className="flex items-center gap-3">
              <button type="button"
                onClick={() => setCantidad((c) => Math.max(1, c - 1))}
                disabled={cantidad <= 1}
                className="w-8 h-8 rounded-lg border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:border-[#534AB7] hover:text-[#534AB7] disabled:opacity-30 transition-colors font-bold text-base leading-none">
                −
              </button>
              <span className="text-base font-black text-gray-800 w-5 text-center">{cantidad}</span>
              <button type="button"
                onClick={() => setCantidad((c) => c + 1)}
                className="w-8 h-8 rounded-lg border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:border-[#534AB7] hover:text-[#534AB7] transition-colors font-bold text-base leading-none">
                +
              </button>
            </div>
          </div>

          {/* Asignar a */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Asignar a:</p>

            {/* Opción: Los invitados eligen */}
            <button
              type="button"
              onClick={() => { setSinAsignar((v) => !v); setAsignadosIds([]) }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all
                ${sinAsignar
                  ? "border-[#534AB7] bg-[#534AB7]/5"
                  : "border-gray-200 bg-white hover:border-gray-300"}`}
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all
                ${sinAsignar ? "border-[#534AB7] bg-[#534AB7]" : "border-gray-300"}`}>
                {sinAsignar && (
                  <svg viewBox="0 0 12 12" className="w-3 h-3" fill="none">
                    <path d="M2 6l2.5 2.5L10 3.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <div>
                <p className={`text-sm font-semibold ${sinAsignar ? "text-[#534AB7]" : "text-gray-700"}`}>
                  Los invitados eligen
                </p>
                <p className="text-[11px] text-gray-400">Cada quien marca lo suyo</p>
              </div>
            </button>

            {/* Lista de invitados reales */}
            {!sinAsignar && (
              <div className="flex flex-col gap-1.5 mt-1">
                {cargandoInvitados ? (
                  <div className="flex items-center gap-2 py-3 text-gray-400 text-sm">
                    <div className="w-4 h-4 border-2 border-[#534AB7] border-t-transparent rounded-full animate-spin" />
                    Cargando invitados…
                  </div>
                ) : invitados.length === 0 ? (
                  <p className="text-xs text-gray-400 py-2">
                    Aún no hay invitados en el evento.
                  </p>
                ) : (
                  invitados.map((inv) => {
                    const activo = asignadosIds.includes(inv.id)
                    const color = COLORES_AVATAR[inv.color_index % COLORES_AVATAR.length]
                    return (
                      <button
                        key={inv.id}
                        type="button"
                        onClick={() => toggleInvitado(inv.id)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 text-left transition-all
                          ${activo
                            ? "border-[#534AB7] bg-[#534AB7]/5"
                            : "border-gray-200 bg-white hover:border-gray-300"}`}
                      >
                        {/* Avatar */}
                        <div className="relative shrink-0">
                          <div className={`w-8 h-8 rounded-full ${color.bg} flex items-center justify-center text-white text-xs font-bold`}>
                            {inv.nombre.charAt(0).toUpperCase()}
                          </div>
                          {inv.es_anfitrion === 1 && (
                            <span className="absolute -top-1 -right-1 text-[10px] leading-none">👑</span>
                          )}
                        </div>
                        {/* Nombre */}
                        <span className={`flex-1 text-sm font-medium ${activo ? "text-[#534AB7]" : "text-gray-700"}`}>
                          {inv.nombre}
                          {inv.es_anfitrion === 1 && (
                            <span className="ml-1.5 text-[10px] text-gray-400">(anfitrión)</span>
                          )}
                        </span>
                        {/* Checkbox visual */}
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all
                          ${activo ? "border-[#534AB7] bg-[#534AB7]" : "border-gray-300"}`}>
                          {activo && (
                            <svg viewBox="0 0 12 12" className="w-3 h-3" fill="none">
                              <path d="M2 6l2.5 2.5L10 3.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            )}
          </div>
        </div>

        {/* Botones fijos abajo */}
        <div className="px-6 pb-6 pt-4 border-t border-gray-100 flex flex-col gap-2">
          {errorExterno && (
            <p className="text-xs text-red-400 text-center">⚠ {errorExterno}</p>
          )}
          <div className="flex gap-2">
            <button type="button" onClick={onCerrar} disabled={guardando}
              className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-500 hover:border-gray-300 transition-colors disabled:opacity-40">
              Cancelar
            </button>
            <button type="button" onClick={submit} disabled={!valid || guardando}
              className="flex-1 py-3 rounded-xl bg-[#534AB7] text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2">
              {guardando && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {guardando ? "Guardando…" : modoEdicion ? "Guardar cambios" : "Agregar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

const MODOS: Array<{ key: ModoCaptura; label: string; emoji: string; descripcion: string }> = [
  { key: "foto-ticket", label: "Foto ticket", emoji: "🧾", descripcion: "Escanea el comprobante" },
  { key: "foto-menu",   label: "Foto menú",   emoji: "📋", descripcion: "Escanea la carta" },
  { key: "manual",      label: "Manual",      emoji: "✏️",  descripcion: "Escribe tú mismo" },
]

export default function CargarConsumos({ evento, onVolver, onContinuar }: Props) {
  const [modo, setModo] = useState<ModoCaptura>("foto-ticket")
  const [items, setItems] = useState<ItemConsumo[]>([])
  const [invitados, setInvitados] = useState<InvitadoListado[]>([])
  const [cargandoItems, setCargandoItems] = useState(true)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [itemEditando, setItemEditando] = useState<ItemConsumo | null>(null)
  const [guardandoItem, setGuardandoItem] = useState(false)
  const [errorModal, setErrorModal] = useState("")
  const [eliminandoId, setEliminandoId] = useState<number | null>(null)

  // Cargar items y invitados existentes al montar
  const cargarDatos = useCallback(() => {
    listarInvitados(evento.eventoId).then(setInvitados).catch(() => {})
  }, [evento.eventoId])

  useEffect(() => {
    setCargandoItems(true)
    Promise.all([
      listarConsumos(evento.eventoId),
      listarInvitados(evento.eventoId),
    ])
      .then(([consumos, invs]) => {
        setInvitados(invs)
        setItems(consumos.map((c) => ({
          id: c.id,
          nombre: c.descripcion,
          cantidad: c.cantidad,
          precioUnitario: parseFloat(c.precio) / Math.max(c.cantidad, 1),
          sinAsignar: c.asignados.length === 0,
          asignados: c.asignados.map((a) => a.invitado_id),
        })))
      })
      .catch(() => {})
      .finally(() => setCargandoItems(false))
  }, [evento.eventoId])

  const total = items.reduce((sum, it) => sum + it.cantidad * it.precioUnitario, 0)
  const cantidadItems = items.reduce((sum, it) => sum + it.cantidad, 0)

  const cerrarModal = () => {
    setModalAbierto(false)
    setItemEditando(null)
    setErrorModal("")
  }

  const agregarItem = async (datos: Omit<ItemConsumo, "id">) => {
    setGuardandoItem(true)
    setErrorModal("")
    try {
      const res = await guardarConsumo({
        evento_id: evento.eventoId,
        descripcion: datos.nombre,
        precio: datos.precioUnitario * datos.cantidad,
        cantidad: datos.cantidad,
        asignados: datos.sinAsignar ? [] : datos.asignados,
      })
      setItems((prev) => [...prev, { id: res.id, ...datos }])
      cerrarModal()
      cargarDatos()
    } catch {
      setErrorModal("Error al guardar. Revisa tu conexión e intenta de nuevo.")
    } finally {
      setGuardandoItem(false)
    }
  }

  const actualizarItem = async (datos: Omit<ItemConsumo, "id">) => {
    if (!itemEditando) return
    setGuardandoItem(true)
    setErrorModal("")
    try {
      await actualizarConsumo({
        id: itemEditando.id,
        descripcion: datos.nombre,
        precio: datos.precioUnitario * datos.cantidad,
        cantidad: datos.cantidad,
        asignados: datos.sinAsignar ? [] : datos.asignados,
      })
      setItems((prev) =>
        prev.map((it) => it.id === itemEditando.id ? { id: it.id, ...datos } : it)
      )
      cerrarModal()
    } catch {
      setErrorModal("Error al guardar. Revisa tu conexión e intenta de nuevo.")
    } finally {
      setGuardandoItem(false)
    }
  }

  const handleEliminar = async (id: number) => {
    setEliminandoId(id)
    try {
      await eliminarConsumo(id)
      setItems((prev) => prev.filter((it) => it.id !== id))
    } catch {
      // silently ignore — item stays in list
    } finally {
      setEliminandoId(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* Header */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button type="button" onClick={onVolver}
            className="flex items-center gap-1.5 text-gray-500 hover:text-[#534AB7] transition-colors text-sm font-medium">
            <svg viewBox="0 0 20 20" className="w-4 h-4" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Compartir QR
          </button>
          <div className="h-4 w-px bg-gray-200" />
          <div className="flex items-center gap-2 flex-1">
            <div className="w-7 h-7 rounded-lg bg-[#534AB7] flex items-center justify-center">
              <span className="text-white font-black text-xs">CC</span>
            </div>
            <span className="font-black text-[#534AB7] text-base tracking-tight">CuentasClaras</span>
          </div>
          <BotonCompartir codigo={evento.codigo} />
        </div>
      </header>

      <BarraProgreso pasoActual={3} />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 flex flex-col gap-6">

        <div>
          <h1 className="text-2xl font-black text-gray-800">Cargar consumos</h1>
          <p className="text-gray-400 text-sm mt-1">
            Captura o agrega los items del {evento.tipo === "restaurante" ? "ticket" : "gasto"}.
          </p>
        </div>

        {/* Selector de modo */}
        <div className="grid grid-cols-3 gap-3">
          {MODOS.map((m) => {
            const activo = modo === m.key
            return (
              <button key={m.key} type="button" onClick={() => setModo(m.key)}
                className={`rounded-xl border-2 p-3 text-left transition-all focus:outline-none
                  ${activo ? "border-[#534AB7] bg-[#534AB7]/5 shadow-sm" : "border-gray-200 bg-white hover:border-gray-300"}`}>
                <span className="text-xl">{m.emoji}</span>
                <p className={`text-sm font-bold mt-1.5 ${activo ? "text-[#534AB7]" : "text-gray-700"}`}>{m.label}</p>
                <p className="text-[11px] text-gray-400 mt-0.5 leading-tight">{m.descripcion}</p>
                {activo && (
                  <div className="mt-2 w-3 h-3 rounded-full bg-[#534AB7] flex items-center justify-center">
                    <svg viewBox="0 0 8 8" className="w-2 h-2" fill="none">
                      <path d="M1 4l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Zona de cámara */}
        <ZonaCamara modo={modo} />

        {/* Lista de items */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-800">Items capturados</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 font-medium">{formatMXN(total)}</span>
              <span className="w-1 h-1 rounded-full bg-gray-300" />
              <span className="text-xs text-gray-400 font-medium">{cantidadItems} item{cantidadItems !== 1 ? "s" : ""}</span>
            </div>
          </div>

          <div className="px-5">
            {cargandoItems ? (
              <div className="py-10 flex flex-col items-center gap-2 text-gray-400">
                <div className="w-6 h-6 border-2 border-[#534AB7] border-t-transparent rounded-full animate-spin" />
                <p className="text-sm">Cargando items…</p>
              </div>
            ) : items.length === 0 ? (
              <div className="py-10 flex flex-col items-center gap-2 text-gray-400">
                <span className="text-3xl">🧾</span>
                <p className="text-sm">No hay items todavía.</p>
                <p className="text-xs">Captura el ticket o agrégalos manualmente.</p>
              </div>
            ) : (
              items.map((item) => (
                <FilaItem
                  key={item.id}
                  item={item}
                  invitados={invitados}
                  eliminando={eliminandoId === item.id}
                  onEditar={() => setItemEditando(item)}
                  onEliminar={() => handleEliminar(item.id)}
                />
              ))
            )}
          </div>

          {/* Botón agregar */}
          <div className="px-5 pb-4 pt-2 border-t border-dashed border-gray-100">
            <button
              type="button"
              onClick={() => setModalAbierto(true)}
              className="flex items-center gap-2 text-sm font-semibold text-[#534AB7] hover:text-[#3d35a0] transition-colors py-2">
              <div className="w-6 h-6 rounded-lg bg-[#534AB7] flex items-center justify-center">
                <svg viewBox="0 0 12 12" className="w-3 h-3" fill="none">
                  <path d="M6 2v8M2 6h8" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </div>
              Agregar item manualmente
            </button>
          </div>
        </div>

        {/* Total del ticket */}
        <div className="bg-[#534AB7]/5 border border-[#534AB7]/20 rounded-2xl px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🧮</span>
            <span className="text-sm font-semibold text-gray-700">Total del ticket</span>
          </div>
          <span className="text-lg font-black text-[#534AB7]">
            {formatMXN(total)} <span className="text-xs font-semibold text-gray-400">MXN</span>
          </span>
        </div>

        {/* Botón principal */}
        <div className="flex flex-col gap-3 pb-8">
          <button
            type="button"
            onClick={onContinuar}
            disabled={items.length === 0}
            className="w-full py-3.5 rounded-xl bg-[#534AB7] text-white font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-md shadow-[#534AB7]/25 disabled:opacity-40 disabled:cursor-not-allowed">
            Listo — ir a vista en vivo →
          </button>
          {items.length === 0 && (
            <p className="text-center text-xs text-gray-400">Agrega al menos un item para continuar.</p>
          )}
        </div>

      </main>

      {(modalAbierto || itemEditando) && (
        <ModalAgregarItem
          eventoId={evento.eventoId}
          initialValues={itemEditando ? {
            nombre: itemEditando.nombre,
            precioUnitario: itemEditando.precioUnitario,
            cantidad: itemEditando.cantidad,
            sinAsignar: itemEditando.sinAsignar,
            asignados: itemEditando.asignados,
          } : undefined}
          guardando={guardandoItem}
          errorExterno={errorModal}
          onGuardar={itemEditando ? actualizarItem : agregarItem}
          onCerrar={cerrarModal}
        />
      )}
    </div>
  )
}
