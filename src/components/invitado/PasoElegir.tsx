import { useState, useEffect, useRef } from "react"
import type { InfoEvento, PerfilInvitado, ItemElegido } from "./InvitadoFlow"
import { HeaderInvitado } from "./InvitadoFlow"
import { COLORES_AVATAR } from "./PasoRegistro"
import { listarConsumos, ApiError } from "../../api"

interface Props {
  evento: InfoEvento
  perfil: PerfilInvitado
  onVolver: () => void
  onContinuar: (items: ItemElegido[]) => void
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface ItemDisponible {
  id: number
  nombre: string
  precioUnitario: number
  asignadoPorAnfitrion: boolean  // el anfitrión asignó este item a este invitado
  compartidoConOtros: number
  nombresCompartiendo: string[]
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return `$${Math.round(n).toLocaleString("es-MX")}`
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

  const handleClick = () => {
    // Items asignados por el anfitrión no se pueden deseleccionar
    if (asignado && elegido) return
    onToggle()
  }

  return (
    <div
      className={`flex items-center gap-3 px-4 py-4 rounded-2xl border-2 transition-all
        ${asignado
          ? "border-[#534AB7] bg-[#534AB7]/5 cursor-default"
          : elegido
            ? "border-[#2EC4B6] bg-[#2EC4B6]/5 cursor-pointer"
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
            El anfitrión te asignó este item
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
        {elegido ? (
          <>
            <button
              type="button"
              onClick={() => {
                // Items asignados: no pueden bajar de 1
                if (asignado && cantidad <= 1) return
                if (cantidad === 1) onToggle()
                else onQty(-1)
              }}
              className={`w-7 h-7 rounded-lg border-2 bg-white flex items-center justify-center font-bold text-base hover:opacity-80 transition-colors leading-none
                ${asignado
                  ? cantidad <= 1
                    ? "border-[#534AB7]/20 text-[#534AB7]/30 cursor-not-allowed"
                    : "border-[#534AB7]/40 text-[#534AB7]"
                  : "border-[#2EC4B6]/40 text-[#2EC4B6]"
                }`}
              disabled={asignado && cantidad <= 1}
            >
              −
            </button>
            <span className={`text-sm font-bold w-5 text-center ${asignado ? "text-[#534AB7]" : "text-gray-700"}`}>
              {cantidad}
            </span>
            <button
              type="button"
              onClick={() => onQty(1)}
              className={`w-7 h-7 rounded-lg border-2 bg-white flex items-center justify-center font-bold text-base hover:opacity-80 transition-colors leading-none
                ${asignado ? "border-[#534AB7]/40 text-[#534AB7]" : "border-[#2EC4B6]/40 text-[#2EC4B6]"}`}
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

// ─── Toast solicitud ──────────────────────────────────────────────────────────

function ToastSolicitud({ onDismiss }: { onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3000)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <div className="fixed bottom-24 left-0 right-0 flex justify-center z-30 px-4 pointer-events-none">
      <div className="bg-gray-800 text-white text-sm font-medium px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-fade-in">
        <span>📲</span>
        <span>Solicitud enviada al anfitrión</span>
      </div>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function PasoElegir({ evento, perfil, onVolver, onContinuar }: Props) {
  const [items, setItems] = useState<ItemDisponible[]>([])
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState("")
  const [mostrarToast, setMostrarToast] = useState(false)
  const [cantidades, setCantidades] = useState<Record<number, number>>({})

  const color = COLORES_AVATAR[perfil.colorIndex]
  const inicial = perfil.nombre.charAt(0).toUpperCase()
  const cargadoRef = useRef(false)

  useEffect(() => {
    let mounted = true

    const cargar = () => {
      listarConsumos(evento.eventoId)
        .then((consumos) => {
          if (!mounted) return
          const mapped: ItemDisponible[] = consumos.map((c) => {
            const otrosAsignados = c.asignados.filter((a) => a.invitado_id !== perfil.invitadoId)
            const esAsignadoAmi = c.asignados.some((a) => a.invitado_id === perfil.invitadoId)
            return {
              id: c.id,
              nombre: c.descripcion,
              precioUnitario: parseFloat(c.precio) / Math.max(c.cantidad, 1),
              asignadoPorAnfitrion: esAsignadoAmi,
              compartidoConOtros: otrosAsignados.length,
              nombresCompartiendo: otrosAsignados.map((a) => a.invitado_nombre),
            }
          })
          setItems(mapped)
          // Pre-seleccionar items asignados por el anfitrión si no tienen cantidad aún
          setCantidades((prev) => {
            const nuevas = { ...prev }
            mapped.forEach((item) => {
              if (item.asignadoPorAnfitrion && !nuevas[item.id]) {
                nuevas[item.id] = 1
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
    const intervalo = setInterval(cargar, 5000)
    return () => { mounted = false; clearInterval(intervalo) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [evento.eventoId, perfil.invitadoId])

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

  const miTotal = items.reduce((sum, item) => {
    const cant = cantidades[item.id] ?? 0
    return sum + item.precioUnitario * cant
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
    onContinuar(elegidos)
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

        {/* Cargando primera vez */}
        {cargando && (
          <div className="flex flex-col items-center gap-3 py-12 text-gray-400">
            <div className="w-8 h-8 border-2 border-[#2EC4B6] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm">Conectando con el anfitrión…</p>
          </div>
        )}

        {/* Error */}
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

        {/* Menú vacío */}
        {!cargando && !errorCarga && items.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-12 text-gray-400">
            <span className="text-4xl">⏳</span>
            <p className="text-sm text-center font-medium text-gray-500">
              El anfitrión está cargando el menú…
            </p>
            <p className="text-xs text-gray-300">Esta pantalla se actualiza sola cada 5 segundos.</p>
          </div>
        )}

        {/* Lista de items */}
        {!cargando && !errorCarga && items.length > 0 && (
          <div className="flex flex-col gap-2.5">
            {items.map((item) => (
              <FilaItem
                key={item.id}
                item={item}
                cantidad={cantidades[item.id] ?? 0}
                onToggle={() => toggle(item.id)}
                onQty={(d) => qty(item.id, d)}
              />
            ))}

            {/* Solicitar item al anfitrión */}
            <button
              type="button"
              onClick={() => setMostrarToast(true)}
              className="flex items-center gap-2 px-4 py-3.5 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 text-sm font-medium hover:border-[#2EC4B6] hover:text-[#2EC4B6] transition-colors bg-white"
            >
              <svg viewBox="0 0 20 20" className="w-4 h-4" fill="currentColor">
                <path d="M2 3a1 1 0 00-1 1v1a1 1 0 001 1h13a1 1 0 001-1V4a1 1 0 00-1-1H2zM2 8.5a.5.5 0 01.5-.5h10a.5.5 0 010 1H2.5a.5.5 0 01-.5-.5zm0 3a.5.5 0 01.5-.5h6a.5.5 0 010 1H2.5a.5.5 0 01-.5-.5z" />
              </svg>
              Solicitar item al anfitrión
            </button>
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

      {mostrarToast && <ToastSolicitud onDismiss={() => setMostrarToast(false)} />}
    </div>
  )
}
