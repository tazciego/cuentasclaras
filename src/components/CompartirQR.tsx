import { useState, useEffect } from "react"
import type { DatosEvento } from "../types"
import BarraProgreso from "./BarraProgreso"

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  evento: DatosEvento
  onVolver: () => void
  onContinuar: () => void
}

// ─── QR placeholder SVG ───────────────────────────────────────────────────────

function QRPlaceholder() {
  // Grilla de celdas para simular un código QR
  const SIZE = 21
  // Patrón fijo que imita la estructura de un QR real (esquinas + datos al centro)
  const pattern: boolean[][] = Array.from({ length: SIZE }, (_, r) =>
    Array.from({ length: SIZE }, (_, c) => {
      // Esquinas (finder patterns 7x7)
      const inTopLeft = r < 7 && c < 7
      const inTopRight = r < 7 && c >= SIZE - 7
      const inBottomLeft = r >= SIZE - 7 && c < 7

      if (inTopLeft || inTopRight || inBottomLeft) {
        const lr = inTopLeft ? r : inTopRight ? r : r - (SIZE - 7)
        const lc = inTopLeft ? c : inTopRight ? c - (SIZE - 7) : c
        // borde exterior
        if (lr === 0 || lr === 6 || lc === 0 || lc === 6) return true
        // interior negro
        if (lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4) return true
        return false
      }

      // Timing patterns
      if (r === 6 && c >= 8 && c < SIZE - 8) return c % 2 === 0
      if (c === 6 && r >= 8 && r < SIZE - 8) return r % 2 === 0

      // Zona de datos: patrón pseudo-aleatorio determinista
      return (r * 3 + c * 7 + r * c) % 3 === 0
    })
  )

  return (
    <div className="inline-block p-4 bg-white rounded-2xl shadow-inner border border-gray-100">
      <svg
        viewBox={`0 0 ${SIZE * 8} ${SIZE * 8}`}
        width={SIZE * 8}
        height={SIZE * 8}
        xmlns="http://www.w3.org/2000/svg"
      >
        {pattern.map((row, r) =>
          row.map((filled, c) =>
            filled ? (
              <rect
                key={`${r}-${c}`}
                x={c * 8}
                y={r * 8}
                width={8}
                height={8}
                rx={1}
                fill="#534AB7"
              />
            ) : null
          )
        )}
      </svg>
    </div>
  )
}

// ─── Avatares de invitados ────────────────────────────────────────────────────

const INVITADOS_DEMO = [
  { inicial: "A", color: "bg-orange-400" },
  { inicial: "M", color: "bg-pink-400" },
  { inicial: "R", color: "bg-sky-400" },
]

function AvatarInvitado({ inicial, color }: { inicial: string; color: string }) {
  return (
    <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center text-white text-sm font-bold ring-2 ring-white -ml-2 first:ml-0`}>
      {inicial}
    </div>
  )
}

// ─── Botón de compartir ───────────────────────────────────────────────────────

function BotonCompartir({
  label,
  emoji,
  bgClass,
  textClass,
  borderClass,
  onClick,
}: {
  label: string
  emoji: string
  bgClass: string
  textClass: string
  borderClass: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 ${borderClass} ${bgClass} ${textClass} text-sm font-semibold hover:opacity-90 active:scale-[0.97] transition-all`}
    >
      <span className="text-base leading-none">{emoji}</span>
      {label}
    </button>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

const TIPOS_LABEL: Record<string, string> = {
  restaurante: "Restaurante o bar",
  reunion: "Reunión o viaje",
}

const TIPOS_EMOJI: Record<string, string> = {
  restaurante: "🍽️",
  reunion: "✈️",
}

export default function CompartirQR({ evento, onVolver, onContinuar }: Props) {
  const [copiado, setCopiado] = useState(false)
  const [linkCopiado, setLinkCopiado] = useState(false)
  const [invitadosConectados, setInvitadosConectados] = useState(INVITADOS_DEMO.slice(0, 0))

  // Simula invitados uniéndose en tiempo real
  useEffect(() => {
    const timers = [
      setTimeout(() => setInvitadosConectados(INVITADOS_DEMO.slice(0, 1)), 2000),
      setTimeout(() => setInvitadosConectados(INVITADOS_DEMO.slice(0, 2)), 4500),
      setTimeout(() => setInvitadosConectados(INVITADOS_DEMO.slice(0, 3)), 7000),
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

  const copiarCodigo = () => {
    navigator.clipboard.writeText(evento.codigo).catch(() => {})
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  const copiarLink = () => {
    navigator.clipboard.writeText(`https://cuentasclaras.mx/unirse/${evento.codigo}`).catch(() => {})
    setLinkCopiado(true)
    setTimeout(() => setLinkCopiado(false), 2000)
  }

  const compartirWhatsApp = () => {
    const texto = encodeURIComponent(
      `¡Hola! Únete a "${evento.nombre}" en CuentasClaras.\nCódigo: ${evento.codigo}\nhttps://cuentasclaras.mx/unirse/${evento.codigo}`
    )
    window.open(`https://wa.me/?text=${texto}`, "_blank")
  }

  const compartirTelegram = () => {
    const texto = encodeURIComponent(
      `¡Únete a "${evento.nombre}" en CuentasClaras! Código: ${evento.codigo}`
    )
    const url = encodeURIComponent(`https://cuentasclaras.mx/unirse/${evento.codigo}`)
    window.open(`https://t.me/share/url?url=${url}&text=${texto}`, "_blank")
  }

  const fechaFormateada = evento.fecha
    ? new Date(evento.fecha + "T12:00:00").toLocaleDateString("es-MX", {
        weekday: "long",
        day: "numeric",
        month: "long",
      })
    : null

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
            Editar evento
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
      <BarraProgreso pasoActual={2} />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 flex flex-col gap-6">

        {/* Título */}
        <div>
          <h1 className="text-2xl font-black text-gray-800">Comparte la invitación</h1>
          <p className="text-gray-400 text-sm mt-1">
            Tus invitados escanean el QR o ingresan el código para unirse.
          </p>
        </div>

        {/* Tarjeta resumen del evento */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-4">
          <span className="text-3xl mt-0.5">{TIPOS_EMOJI[evento.tipo]}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-black text-gray-800 text-lg leading-tight truncate">{evento.nombre}</h2>
              <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 border border-green-200 text-green-600 text-[11px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Activo
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">{TIPOS_LABEL[evento.tipo]}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-400">
              {fechaFormateada && (
                <span className="flex items-center gap-1">
                  <span>📅</span> {fechaFormateada}{evento.hora ? ` · ${evento.hora}` : ""}
                </span>
              )}
              {evento.lugar && (
                <span className="flex items-center gap-1 truncate">
                  <span>📍</span> {evento.lugar}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* QR + código */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col items-center gap-5">
          <QRPlaceholder />

          <div className="w-full border-t border-dashed border-gray-100 pt-4 flex flex-col items-center gap-3">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
              O comparte el código de invitación
            </p>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-black tracking-widest text-[#534AB7] select-all">
                {evento.codigo}
              </span>
              <button
                type="button"
                onClick={copiarCodigo}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 text-xs font-bold transition-all
                  ${copiado
                    ? "border-green-400 bg-green-50 text-green-600"
                    : "border-[#534AB7]/30 bg-[#534AB7]/5 text-[#534AB7] hover:bg-[#534AB7]/10"
                  }
                `}
              >
                {copiado ? (
                  <>
                    <svg viewBox="0 0 12 12" className="w-3 h-3" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    ¡Copiado!
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 16 16" className="w-3 h-3" fill="currentColor">
                      <path d="M10.5 1h-7A1.5 1.5 0 002 2.5v9H3.5v-9h7V1zm2 2h-6A1.5 1.5 0 005 4.5v9A1.5 1.5 0 006.5 15h6a1.5 1.5 0 001.5-1.5v-9A1.5 1.5 0 0012.5 3zm0 10.5h-6v-9h6v9z" />
                    </svg>
                    Copiar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Compartir por */}
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-gray-700">Compartir invitación por:</p>
          <div className="grid grid-cols-2 gap-3">
            <BotonCompartir
              label="WhatsApp"
              emoji="💬"
              bgClass="bg-[#25D366]/10"
              textClass="text-[#128C5E]"
              borderClass="border-[#25D366]/40"
              onClick={compartirWhatsApp}
            />
            <BotonCompartir
              label="Telegram"
              emoji="✈️"
              bgClass="bg-[#229ED9]/10"
              textClass="text-[#229ED9]"
              borderClass="border-[#229ED9]/40"
              onClick={compartirTelegram}
            />
            <BotonCompartir
              label={linkCopiado ? "¡Link copiado!" : "Copiar link"}
              emoji={linkCopiado ? "✅" : "🔗"}
              bgClass="bg-gray-50"
              textClass="text-gray-600"
              borderClass="border-gray-200"
              onClick={copiarLink}
            />
            <BotonCompartir
              label="Guardar QR"
              emoji="📥"
              bgClass="bg-gray-50"
              textClass="text-gray-600"
              borderClass="border-gray-200"
              onClick={() => {/* TODO: descargar QR como imagen */}}
            />
          </div>
        </div>

        {/* Invitados conectados */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-gray-700">Invitados conectados</p>
            <span className="flex items-center gap-1.5 text-xs font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              En vivo
            </span>
          </div>

          {invitadosConectados.length === 0 ? (
            <div className="flex flex-col items-center py-4 gap-2 text-gray-400">
              <span className="text-3xl">⏳</span>
              <p className="text-sm">Esperando que se unan los invitados…</p>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="flex">
                {invitadosConectados.map((inv) => (
                  <AvatarInvitado key={inv.inicial} inicial={inv.inicial} color={inv.color} />
                ))}
              </div>
              <p className="text-sm text-gray-600">
                <span className="font-bold text-gray-800">{invitadosConectados.length} persona{invitadosConectados.length !== 1 ? "s" : ""}</span>
                {" "}ya se {invitadosConectados.length !== 1 ? "unieron" : "unió"}
              </p>
            </div>
          )}
        </div>

        {/* Botón continuar */}
        <div className="flex flex-col gap-3 pb-8">
          <button
            type="button"
            onClick={onContinuar}
            className="w-full py-3.5 rounded-xl bg-[#534AB7] text-white font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-md shadow-[#534AB7]/25"
          >
            Continuar — cargar consumos →
          </button>
          <p className="text-center text-xs text-gray-400">
            Puedes seguir compartiendo el QR después de avanzar.
          </p>
        </div>

      </main>
    </div>
  )
}
