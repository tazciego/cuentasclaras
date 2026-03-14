import { useState } from "react"
import type { InfoEvento, PerfilInvitado, ItemElegido } from "./InvitadoFlow"
import { HeaderInvitado } from "./InvitadoFlow"
import { COLORES_AVATAR } from "./PasoRegistro"

interface Props {
  evento: InfoEvento
  perfil: PerfilInvitado
  onVolver: () => void
  onContinuar: (items: ItemElegido[]) => void
}

// ─── Catálogo de items disponibles ───────────────────────────────────────────

interface ItemDisponible {
  id: number
  nombre: string
  precioBase: number
  compartidoConOtros: number   // cuántos ya lo eligieron
  nombresCompartiendo: string[] // quiénes ya lo eligieron
}

const ITEMS_DISPONIBLES: ItemDisponible[] = [
  { id: 1, nombre: "Tacos de canasta x3",  precioBase: 85,  compartidoConOtros: 0, nombresCompartiendo: [] },
  { id: 2, nombre: "Orden de quesadillas", precioBase: 120, compartidoConOtros: 0, nombresCompartiendo: [] },
  { id: 3, nombre: "Agua mineral 600ml",   precioBase: 80,  compartidoConOtros: 1, nombresCompartiendo: ["Ana"] },
  { id: 4, nombre: "Salsa verde extra",    precioBase: 30,  compartidoConOtros: 2, nombresCompartiendo: ["Ana", "Carlos"] },
  { id: 5, nombre: "Postre del día",       precioBase: 95,  compartidoConOtros: 0, nombresCompartiendo: [] },
  { id: 6, nombre: "Horchata grande",      precioBase: 55,  compartidoConOtros: 0, nombresCompartiendo: [] },
  { id: 7, nombre: "Plato de guacamole",   precioBase: 90,  compartidoConOtros: 1, nombresCompartiendo: ["Carlos"] },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return `$${Math.round(n).toLocaleString("es-MX")}`
}

function precioMio(item: ItemDisponible, esMio: boolean) {
  const divisor = item.compartidoConOtros + (esMio ? 1 : 0)
  return divisor > 0 ? item.precioBase / divisor : item.precioBase
}

// ─── Modal agregar item no listado ────────────────────────────────────────────

function ModalAgregarItem({
  onAgregar,
  onCerrar,
}: {
  onAgregar: (nombre: string, precio: number) => void
  onCerrar: () => void
}) {
  const [nombre, setNombre] = useState("")
  const [precio, setPrecio] = useState("")
  const valid = nombre.trim() && parseFloat(precio) > 0

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <h3 className="font-bold text-gray-800 mb-1">Agregar item no listado</h3>
        <p className="text-xs text-gray-400 mb-4">¿Pediste algo que no aparece? Agrégalo manualmente.</p>
        <div className="flex flex-col gap-3">
          <input autoFocus type="text" value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre del item"
            className="border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2EC4B6] transition-colors" />
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">$</span>
            <input type="number" min="0" step="1" value={precio}
              onChange={(e) => setPrecio(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && valid && onAgregar(nombre.trim(), parseFloat(precio))}
              placeholder="0"
              className="w-full border-2 border-gray-200 rounded-xl pl-8 pr-4 py-3 text-sm focus:outline-none focus:border-[#2EC4B6] transition-colors" />
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button type="button" onClick={onCerrar}
            className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-500 hover:border-gray-300 transition-colors">
            Cancelar
          </button>
          <button type="button"
            onClick={() => valid && onAgregar(nombre.trim(), parseFloat(precio))}
            disabled={!valid}
            className="flex-1 py-2.5 rounded-xl bg-[#2EC4B6] text-white text-sm font-bold hover:opacity-90 disabled:opacity-40 transition-opacity">
            Agregar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Fila de item ─────────────────────────────────────────────────────────────

function FilaItem({
  item,
  cantidad,
  onToggle,
  onQty,
}: {
  item: ItemDisponible
  cantidad: number  // 0 = no elegido
  onToggle: () => void
  onQty: (d: number) => void
}) {
  const elegido = cantidad > 0
  const precio = precioMio(item, elegido)
  const compartidoConmigo = item.compartidoConOtros + (elegido ? 1 : 0)
  const esCompartido = compartidoConmigo > 1

  return (
    <div
      className={`flex items-start gap-3 px-4 py-4 rounded-2xl border-2 transition-all cursor-pointer
        ${elegido
          ? "border-[#2EC4B6] bg-[#2EC4B6]/5"
          : "border-gray-100 bg-white hover:border-gray-200"
        }
      `}
      onClick={onToggle}
    >
      {/* Checkbox visual */}
      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0 transition-all
        ${elegido ? "border-[#2EC4B6] bg-[#2EC4B6]" : "border-gray-300"}`}>
        {elegido && (
          <svg viewBox="0 0 12 12" className="w-3 h-3" fill="none">
            <path d="M2 6l2.5 2.5L10 3.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>

      {/* Contenido */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold leading-snug ${elegido ? "text-[#2EC4B6]" : "text-gray-700"}`}>
          {item.nombre}
        </p>

        {/* Info de compartido */}
        {esCompartido && (
          <p className="text-xs text-gray-400 mt-0.5">
            Compartido con{" "}
            <span className="font-medium text-gray-500">
              {item.nombresCompartiendo.join(", ")}
              {elegido && item.nombresCompartiendo.length > 0 ? " y tú" : elegido ? "tú" : ""}
            </span>
          </p>
        )}

        {/* Precio */}
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className={`text-sm font-bold ${elegido ? "text-[#2EC4B6]" : "text-gray-600"}`}>
            {fmt(precio * cantidad || precio)}
          </span>
          {esCompartido && (
            <span className="text-[10px] font-semibold bg-green-50 border border-green-200 text-green-600 px-1.5 py-0.5 rounded-full">
              {fmt(precio)} c/u entre {compartidoConmigo}
            </span>
          )}
        </div>
      </div>

      {/* Controles de cantidad (solo si elegido) */}
      {elegido && (
        <div
          className="flex items-center gap-2 shrink-0 mt-0.5"
          onClick={(e) => e.stopPropagation()}
        >
          <button type="button"
            onClick={() => cantidad === 1 ? onToggle() : onQty(-1)}
            className="w-7 h-7 rounded-lg border-2 border-[#2EC4B6]/40 bg-white flex items-center justify-center text-[#2EC4B6] font-bold text-base hover:bg-[#2EC4B6]/10 transition-colors leading-none">
            −
          </button>
          <span className="text-sm font-bold text-gray-700 w-4 text-center">{cantidad}</span>
          <button type="button"
            onClick={() => onQty(1)}
            className="w-7 h-7 rounded-lg border-2 border-[#2EC4B6]/40 bg-white flex items-center justify-center text-[#2EC4B6] font-bold text-base hover:bg-[#2EC4B6]/10 transition-colors leading-none">
            +
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function PasoElegir({ evento, perfil, onVolver, onContinuar }: Props) {
  // cantidad por id (0 = no elegido)
  const [cantidades, setCantidades] = useState<Record<number, number>>({})
  const [extras, setExtras] = useState<ItemDisponible[]>([])
  const [modalAbierto, setModalAbierto] = useState(false)
  const [nextId, setNextId] = useState(100)

  const color = COLORES_AVATAR[perfil.colorIndex]
  const inicial = perfil.nombre.charAt(0).toUpperCase()

  const todosItems = [...ITEMS_DISPONIBLES, ...extras]

  const toggle = (id: number) => {
    setCantidades((prev) => {
      if ((prev[id] ?? 0) > 0) {
        const next = { ...prev }; delete next[id]; return next
      }
      return { ...prev, [id]: 1 }
    })
  }

  const qty = (id: number, delta: number) => {
    setCantidades((prev) => ({
      ...prev,
      [id]: Math.max(1, (prev[id] ?? 1) + delta),
    }))
  }

  const agregarExtra = (nombre: string, precio: number) => {
    const nuevoItem: ItemDisponible = { id: nextId, nombre, precioBase: precio, compartidoConOtros: 0, nombresCompartiendo: [] }
    setExtras((prev) => [...prev, nuevoItem])
    setCantidades((prev) => ({ ...prev, [nextId]: 1 }))
    setNextId((n) => n + 1)
    setModalAbierto(false)
  }

  // Calcula mi total
  const miTotal = todosItems.reduce((sum, item) => {
    const cant = cantidades[item.id] ?? 0
    if (!cant) return sum
    const precio = precioMio(item, true)
    return sum + precio * cant
  }, 0)

  const conteoElegidos = Object.values(cantidades).filter((v) => v > 0).length

  const handleContinuar = () => {
    const elegidos: ItemElegido[] = todosItems
      .filter((it) => (cantidades[it.id] ?? 0) > 0)
      .map((it) => ({
        id: it.id,
        nombre: it.nombre,
        precioBase: it.precioBase,
        cantidad: cantidades[it.id],
        compartidoConOtros: it.compartidoConOtros,
      }))
    onContinuar(elegidos)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <HeaderInvitado onVolver={onVolver} labelVolver="Registro" paso={3} />

      <main className="flex-1 max-w-md mx-auto w-full px-4 py-6 flex flex-col gap-4 pb-32">

        {/* Título */}
        <div>
          <p className="text-xs font-semibold text-[#2EC4B6] uppercase tracking-wider mb-1">{evento.nombre}</p>
          <h1 className="text-xl font-black text-gray-800">Elige tus consumos</h1>
          <p className="text-gray-400 text-sm mt-1">Toca cada item que pediste.</p>
        </div>

        {/* Lista */}
        <div className="flex flex-col gap-2.5">
          {todosItems.map((item) => (
            <FilaItem
              key={item.id}
              item={item}
              cantidad={cantidades[item.id] ?? 0}
              onToggle={() => toggle(item.id)}
              onQty={(d) => qty(item.id, d)}
            />
          ))}

          {/* Agregar no listado */}
          <button type="button"
            onClick={() => setModalAbierto(true)}
            className="flex items-center gap-2 px-4 py-3.5 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 text-sm font-medium hover:border-[#2EC4B6] hover:text-[#2EC4B6] transition-colors bg-white">
            <svg viewBox="0 0 20 20" className="w-4 h-4" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Agregar item no listado…
          </button>
        </div>

      </main>

      {/* Barra fija inferior */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-lg z-20">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-3">
          {/* Avatar */}
          <div className={`w-10 h-10 rounded-full ${color.bg} flex items-center justify-center text-white font-black text-sm shrink-0`}>
            {inicial}
          </div>
          {/* Mi cuenta */}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 font-medium">Mi cuenta</p>
            <p className="text-lg font-black text-[#2EC4B6] leading-tight">{fmt(miTotal)}</p>
          </div>
          {/* Contador */}
          {conteoElegidos > 0 && (
            <span className="text-xs font-bold text-gray-400">
              {conteoElegidos} item{conteoElegidos !== 1 ? "s" : ""}
            </span>
          )}
          {/* CTA */}
          <button type="button"
            onClick={handleContinuar}
            disabled={conteoElegidos === 0}
            className="shrink-0 px-5 py-2.5 rounded-xl bg-[#2EC4B6] text-white font-bold text-sm hover:opacity-90 active:scale-[0.97] transition-all shadow-md shadow-[#2EC4B6]/30 disabled:opacity-40 disabled:cursor-not-allowed">
            Revisar →
          </button>
        </div>
      </div>

      {modalAbierto && (
        <ModalAgregarItem onAgregar={agregarExtra} onCerrar={() => setModalAbierto(false)} />
      )}
    </div>
  )
}
