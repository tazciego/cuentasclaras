import { useState, useRef, useEffect } from "react"
import type { DatosEvento, Participante } from "../types"
import BarraProgreso from "./BarraProgreso"

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
  compartido: boolean
  asignados: number[] // ids de participantes (0 = anfitrión "Tú")
}

type ModoCaptura = "foto-ticket" | "foto-menu" | "manual"

// ─── Datos de demo ────────────────────────────────────────────────────────────

const ITEMS_DEMO: ItemConsumo[] = [
  { id: 1, nombre: "Tacos de canasta x3", cantidad: 1, precioUnitario: 85,  compartido: false, asignados: [0] },
  { id: 2, nombre: "Orden de quesadillas",  cantidad: 1, precioUnitario: 120, compartido: false, asignados: [1] },
  { id: 3, nombre: "Agua mineral 600ml",    cantidad: 2, precioUnitario: 40,  compartido: false, asignados: [0, 1] },
  { id: 4, nombre: "Salsa verde extra",     cantidad: 1, precioUnitario: 30,  compartido: true,  asignados: [0, 1, 2] },
  { id: 5, nombre: "Postre del día",        cantidad: 1, precioUnitario: 95,  compartido: false, asignados: [2] },
]

// ─── Colores de avatar ────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "bg-[#534AB7]", // anfitrión
  "bg-orange-400",
  "bg-pink-400",
  "bg-sky-400",
  "bg-amber-400",
  "bg-emerald-400",
]

// ─── Participantes resueltos (anfitrión + invitados del evento) ───────────────

function resolverParticipantes(evento: DatosEvento): Array<Participante & { isHost: boolean }> {
  return [
    { id: 0, nombre: "Tú", isHost: true },
    ...evento.participantes.map((p) => ({ ...p, isHost: false })),
  ]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMXN(n: number) {
  return `$${n.toLocaleString("es-MX")}`
}

// ─── Zona de cámara ───────────────────────────────────────────────────────────

function ZonaCamara({ modo }: { modo: ModoCaptura }) {
  const [escaneando, setEscaneando] = useState(false)
  const [capturado, setCapturado] = useState(false)
  const lineaRef = useRef<HTMLDivElement>(null)

  // Animación de línea de escaneo
  useEffect(() => {
    if (!escaneando || capturado) return
    let pos = 0
    let dir = 1
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
    "foto-ticket":  { idle: "Apunta al ticket y toca para capturar", scanning: "Escaneando… toca para capturar", done: "¡Ticket capturado! Revisando items…" },
    "foto-menu":    { idle: "Apunta al menú y toca para capturar",   scanning: "Escaneando… toca para capturar", done: "¡Menú capturado! Revisando items…" },
    "manual":       { idle: "",                                        scanning: "",                               done: "" },
  }

  const texto = capturado ? textos[modo].done : escaneando ? textos[modo].scanning : textos[modo].idle

  if (modo === "manual") return null

  return (
    <button
      type="button"
      onClick={handleTap}
      className="w-full relative rounded-2xl overflow-hidden bg-gray-900 aspect-[4/3] flex items-center justify-center cursor-pointer focus:outline-none group"
      aria-label="Zona de cámara"
    >
      {/* Fondo con gradiente sutil */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-800 to-gray-950" />

      {/* Esquinas moradas */}
      {[
        "top-3 left-3 border-t-2 border-l-2 rounded-tl-lg",
        "top-3 right-3 border-t-2 border-r-2 rounded-tr-lg",
        "bottom-3 left-3 border-b-2 border-l-2 rounded-bl-lg",
        "bottom-3 right-3 border-b-2 border-r-2 rounded-br-lg",
      ].map((cls, i) => (
        <span key={i} className={`absolute w-6 h-6 border-[#534AB7] ${cls}`} />
      ))}

      {/* Línea de escaneo */}
      {escaneando && !capturado && (
        <div
          ref={lineaRef}
          className="absolute left-4 right-4 h-0.5 bg-[#534AB7] shadow-[0_0_8px_2px_#534AB7] transition-none"
          style={{ top: "0%" }}
        />
      )}

      {/* Contenido central */}
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
            <div className={`w-14 h-14 rounded-full border-2 flex items-center justify-center transition-colors
              ${escaneando ? "border-[#534AB7] bg-[#534AB7]/20" : "border-white/30 bg-white/10 group-hover:border-[#534AB7]/60"}`}
            >
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
  participantes,
  onChange,
  onEliminar,
}: {
  item: ItemConsumo
  participantes: Array<Participante & { isHost: boolean }>
  onChange: (updated: ItemConsumo) => void
  onEliminar: () => void
}) {
  const total = item.cantidad * item.precioUnitario

  const toggleAsignado = (pid: number) => {
    const yaEsta = item.asignados.includes(pid)
    onChange({
      ...item,
      asignados: yaEsta
        ? item.asignados.filter((id) => id !== pid)
        : [...item.asignados, pid],
    })
  }

  const setQty = (delta: number) => {
    const nueva = Math.max(1, item.cantidad + delta)
    onChange({ ...item, cantidad: nueva })
  }

  return (
    <div className="flex flex-col gap-2.5 py-4 border-b border-gray-100 last:border-0">
      {/* Fila principal */}
      <div className="flex items-start gap-3">
        {/* Nombre + badge */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-gray-800 leading-snug">{item.nombre}</span>
            {item.compartido && (
              <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-50 border border-green-200 text-green-600">
                compartido
              </span>
            )}
          </div>
          {/* Controles de cantidad */}
          <div className="flex items-center gap-2 mt-1.5">
            <button
              type="button"
              onClick={() => setQty(-1)}
              disabled={item.cantidad <= 1}
              className="w-6 h-6 rounded-md border border-gray-200 flex items-center justify-center text-gray-500 hover:border-[#534AB7] hover:text-[#534AB7] disabled:opacity-30 transition-colors text-sm font-bold leading-none"
            >−</button>
            <span className="text-sm font-bold text-gray-700 w-4 text-center">{item.cantidad}</span>
            <button
              type="button"
              onClick={() => setQty(1)}
              className="w-6 h-6 rounded-md border border-gray-200 flex items-center justify-center text-gray-500 hover:border-[#534AB7] hover:text-[#534AB7] transition-colors text-sm font-bold leading-none"
            >+</button>
            <span className="text-xs text-gray-400 ml-1">{formatMXN(item.precioUnitario)} c/u</span>
          </div>
        </div>

        {/* Precio + eliminar */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm font-bold text-gray-800">{formatMXN(total)}</span>
          <button
            type="button"
            onClick={onEliminar}
            className="w-6 h-6 rounded-md flex items-center justify-center text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors text-base leading-none"
            aria-label={`Eliminar ${item.nombre}`}
          >×</button>
        </div>
      </div>

      {/* Avatares de asignación */}
      {participantes.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap pl-0.5">
          <span className="text-[10px] text-gray-400 font-medium shrink-0">Para:</span>
          {participantes.map((p) => {
            const activo = item.asignados.includes(p.id)
            const color = AVATAR_COLORS[p.id % AVATAR_COLORS.length]
            const inicial = p.nombre.charAt(0).toUpperCase()
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => toggleAsignado(p.id)}
                title={p.nombre}
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white transition-all
                  ${activo ? `${color} ring-2 ring-[#534AB7] ring-offset-1 opacity-100` : `${color} opacity-30 hover:opacity-60`}
                `}
              >
                {inicial}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Modal agregar item ───────────────────────────────────────────────────────

function ModalAgregarItem({
  onAgregar,
  onCerrar,
}: {
  onAgregar: (nombre: string, precio: number) => void
  onCerrar: () => void
}) {
  const [nombre, setNombre] = useState("")
  const [precio, setPrecio] = useState("")

  const submit = () => {
    const n = nombre.trim()
    const p = parseFloat(precio)
    if (n && p > 0) onAgregar(n, p)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <h3 className="font-bold text-gray-800 mb-4">Agregar item</h3>
        <div className="flex flex-col gap-3">
          <input
            autoFocus
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre del item"
            className="border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#534AB7] transition-colors"
          />
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">$</span>
            <input
              type="number"
              min="0"
              step="0.50"
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="0.00"
              className="w-full border-2 border-gray-200 rounded-xl pl-8 pr-4 py-3 text-sm focus:outline-none focus:border-[#534AB7] transition-colors"
            />
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button type="button" onClick={onCerrar}
            className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-500 hover:border-gray-300 transition-colors">
            Cancelar
          </button>
          <button type="button" onClick={submit} disabled={!nombre.trim() || parseFloat(precio) <= 0}
            className="flex-1 py-2.5 rounded-xl bg-[#534AB7] text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-40">
            Agregar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

const MODOS: Array<{ key: ModoCaptura; label: string; emoji: string; descripcion: string }> = [
  { key: "foto-ticket", label: "Foto ticket",  emoji: "🧾", descripcion: "Escanea el comprobante" },
  { key: "foto-menu",   label: "Foto menú",    emoji: "📋", descripcion: "Escanea la carta" },
  { key: "manual",      label: "Manual",       emoji: "✏️",  descripcion: "Escribe tú mismo" },
]

export default function CargarConsumos({ evento, onVolver, onContinuar }: Props) {
  const [modo, setModo] = useState<ModoCaptura>("foto-ticket")
  const [items, setItems] = useState<ItemConsumo[]>(ITEMS_DEMO)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [nextId, setNextId] = useState(100)
  const [nombreInline, setNombreInline] = useState("")

  const participantes = resolverParticipantes(evento)

  const total = items.reduce((sum, it) => sum + it.cantidad * it.precioUnitario, 0)
  const cantidadItems = items.reduce((sum, it) => sum + it.cantidad, 0)

  const actualizarItem = (id: number, updated: ItemConsumo) =>
    setItems((prev) => prev.map((it) => (it.id === id ? updated : it)))

  const eliminarItem = (id: number) =>
    setItems((prev) => prev.filter((it) => it.id !== id))

  const agregarItem = (nombre: string, precio: number) => {
    setItems((prev) => [
      ...prev,
      { id: nextId, nombre, cantidad: 1, precioUnitario: precio, compartido: false, asignados: [0] },
    ])
    setNextId((n) => n + 1)
    setModalAbierto(false)
  }

  const agregarInline = () => {
    const n = nombreInline.trim()
    if (!n) return
    setItems((prev) => [
      ...prev,
      { id: nextId, nombre: n, cantidad: 1, precioUnitario: 0, compartido: false, asignados: [0] },
    ])
    setNextId((n) => n + 1)
    setNombreInline("")
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* Header */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            type="button"
            onClick={onVolver}
            className="flex items-center gap-1.5 text-gray-500 hover:text-[#534AB7] transition-colors text-sm font-medium"
          >
            <svg viewBox="0 0 20 20" className="w-4 h-4" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Compartir QR
          </button>
          <div className="h-4 w-px bg-gray-200" />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#534AB7] flex items-center justify-center">
              <span className="text-white font-black text-xs">CC</span>
            </div>
            <span className="font-black text-[#534AB7] text-base tracking-tight">CuentasClaras</span>
          </div>
        </div>
      </header>

      {/* Barra de progreso */}
      <BarraProgreso pasoActual={3} />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 flex flex-col gap-6">

        {/* Título */}
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
              <button
                key={m.key}
                type="button"
                onClick={() => setModo(m.key)}
                className={`rounded-xl border-2 p-3 text-left transition-all focus:outline-none
                  ${activo ? "border-[#534AB7] bg-[#534AB7]/5 shadow-sm" : "border-gray-200 bg-white hover:border-gray-300"}
                `}
              >
                <span className="text-xl">{m.emoji}</span>
                <p className={`text-sm font-bold mt-1.5 ${activo ? "text-[#534AB7]" : "text-gray-700"}`}>
                  {m.label}
                </p>
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

          {/* Encabezado */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div>
              <h2 className="text-sm font-bold text-gray-800">Items capturados</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 font-medium">{formatMXN(total)}</span>
              <span className="w-1 h-1 rounded-full bg-gray-300" />
              <span className="text-xs text-gray-400 font-medium">{cantidadItems} item{cantidadItems !== 1 ? "s" : ""}</span>
            </div>
          </div>

          {/* Filas */}
          <div className="px-5">
            {items.length === 0 ? (
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
                  participantes={participantes}
                  onChange={(updated) => actualizarItem(item.id, updated)}
                  onEliminar={() => eliminarItem(item.id)}
                />
              ))
            )}
          </div>

          {/* Agregar inline */}
          <div className="px-5 pb-4 pt-2 border-t border-dashed border-gray-100">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={nombreInline}
                onChange={(e) => setNombreInline(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && agregarInline()}
                placeholder="+ Agregar item manualmente…"
                className="flex-1 text-sm text-gray-600 placeholder:text-gray-300 bg-transparent focus:outline-none py-2"
              />
              {nombreInline && (
                <button
                  type="button"
                  onClick={() => setModalAbierto(true)}
                  className="shrink-0 text-xs font-semibold text-[#534AB7] hover:underline"
                >
                  + precio
                </button>
              )}
            </div>
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
            className="w-full py-3.5 rounded-xl bg-[#534AB7] text-white font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-md shadow-[#534AB7]/25 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Listo — ir a vista en vivo →
          </button>
          {items.length === 0 && (
            <p className="text-center text-xs text-gray-400">Agrega al menos un item para continuar.</p>
          )}
        </div>

      </main>

      {/* Modal agregar con precio */}
      {modalAbierto && (
        <ModalAgregarItem
          onAgregar={agregarItem}
          onCerrar={() => setModalAbierto(false)}
        />
      )}
    </div>
  )
}
