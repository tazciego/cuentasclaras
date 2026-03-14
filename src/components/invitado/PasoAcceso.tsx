import { useState, useEffect } from "react"
import type { InfoEvento } from "./InvitadoFlow"
import { HeaderInvitado } from "./InvitadoFlow"

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  codigoInicial?: string
  onVolver: () => void
  onContinuar: (evento: InfoEvento) => void
}

// ─── Demo: lookup de evento por código ───────────────────────────────────────

const DEMO_EVENTO: InfoEvento = {
  codigo: "CC-4829",
  nombre: "Cena de cumpleaños de Fer",
  tipo: "restaurante",
  anfitrion: "Fernando",
  fecha: "Sábado 15 de marzo",
  lugar: "La Docena, Guadalajara",
}

function buscarEvento(codigo: string): InfoEvento | null {
  // En producción: llamada a API. Demo: cualquier CC-XXXX válido.
  if (/^CC-\d{4}$/.test(codigo.trim().toUpperCase())) {
    return { ...DEMO_EVENTO, codigo: codigo.trim().toUpperCase() }
  }
  return null
}

// ─── Zona de QR simulada ──────────────────────────────────────────────────────

function ZonaQR({ onDetectado }: { onDetectado: (codigo: string) => void }) {
  const [activa, setActiva] = useState(false)
  const [detectado, setDetectado] = useState(false)

  const activar = () => {
    if (detectado) return
    if (!activa) { setActiva(true); return }
    // Simula detección después de 1.5s
    setTimeout(() => {
      setDetectado(true)
      setTimeout(() => onDetectado("CC-4829"), 600)
    }, 1500)
  }

  return (
    <button
      type="button"
      onClick={activar}
      className="w-full relative rounded-2xl overflow-hidden bg-gray-900 aspect-square max-h-64 flex items-center justify-center focus:outline-none group"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-gray-800 to-gray-950" />

      {/* Esquinas teal */}
      {["top-4 left-4 border-t-2 border-l-2 rounded-tl-lg",
        "top-4 right-4 border-t-2 border-r-2 rounded-tr-lg",
        "bottom-4 left-4 border-b-2 border-l-2 rounded-bl-lg",
        "bottom-4 right-4 border-b-2 border-r-2 rounded-br-lg"].map((cls, i) => (
        <span key={i} className={`absolute w-7 h-7 border-[#2EC4B6] ${cls}`} />
      ))}

      {/* Línea de escaneo */}
      {activa && !detectado && (
        <div className="absolute left-6 right-6 h-0.5 bg-[#2EC4B6] shadow-[0_0_8px_2px_#2EC4B6] animate-[scan_1.5s_ease-in-out_infinite]" />
      )}

      <div className="relative z-10 flex flex-col items-center gap-3 text-center px-6">
        {detectado ? (
          <>
            <div className="w-14 h-14 rounded-full bg-green-500/20 border-2 border-green-400 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-7 h-7 text-green-400" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <p className="text-green-400 text-sm font-semibold">¡QR detectado!</p>
          </>
        ) : activa ? (
          <>
            <div className="w-14 h-14 rounded-full border-2 border-[#2EC4B6] bg-[#2EC4B6]/20 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-7 h-7 text-white/70" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="5" height="5" rx="1"/><rect x="16" y="3" width="5" height="5" rx="1"/><rect x="3" y="16" width="5" height="5" rx="1"/>
                <path d="M21 16h-3v3M21 21h-2M16 16v2M13 3v5h5M13 13h2M13 18v3M18 13h3M16 21h2" />
              </svg>
            </div>
            <p className="text-white/70 text-sm">Buscando QR… toca para simular</p>
          </>
        ) : (
          <>
            <div className="w-14 h-14 rounded-full border-2 border-white/30 bg-white/10 flex items-center justify-center group-hover:border-[#2EC4B6]/60 transition-colors">
              <svg viewBox="0 0 24 24" className="w-7 h-7 text-white/60" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><circle cx="12" cy="13" r="4" />
              </svg>
            </div>
            <p className="text-white/60 text-sm">Apunta la cámara al QR del anfitrión</p>
            <span className="text-[#2EC4B6] text-xs font-semibold">Toca para activar</span>
          </>
        )}
      </div>

      {/* Animación keyframe inline */}
      <style>{`
        @keyframes scan {
          0%, 100% { top: 20%; }
          50% { top: 75%; }
        }
      `}</style>
    </button>
  )
}

// ─── Tarjeta de preview del evento ───────────────────────────────────────────

function TarjetaEvento({ ev }: { ev: InfoEvento }) {
  const emoji = ev.tipo === "restaurante" ? "🍽️" : "✈️"
  const tipoLabel = ev.tipo === "restaurante" ? "Restaurante o bar" : "Reunión o viaje"
  return (
    <div className="bg-[#2EC4B6]/5 border-2 border-[#2EC4B6]/30 rounded-2xl px-5 py-4 flex gap-4 items-start">
      <span className="text-3xl mt-0.5">{emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <h3 className="font-black text-gray-800 text-base leading-snug">{ev.nombre}</h3>
          <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-50 border border-green-200 text-green-600">
            Activo
          </span>
        </div>
        <p className="text-xs text-gray-500 mb-2">{tipoLabel} · Organizado por <span className="font-semibold">{ev.anfitrion}</span></p>
        <div className="flex flex-col gap-1">
          {ev.fecha && (
            <span className="text-xs text-gray-400 flex items-center gap-1">📅 {ev.fecha}</span>
          )}
          {ev.lugar && (
            <span className="text-xs text-gray-400 flex items-center gap-1">📍 {ev.lugar}</span>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function PasoAcceso({ codigoInicial = "", onVolver, onContinuar }: Props) {
  const [tab, setTab] = useState<"qr" | "codigo">(codigoInicial ? "codigo" : "qr")
  const [codigo, setCodigo] = useState(codigoInicial)
  const [evento, setEvento] = useState<InfoEvento | null>(
    codigoInicial ? buscarEvento(codigoInicial) : null
  )
  const [error, setError] = useState("")

  // Busca el evento cuando el código tiene formato completo
  useEffect(() => {
    if (/^CC-\d{4}$/.test(codigo.trim())) {
      const ev = buscarEvento(codigo)
      if (ev) { setEvento(ev); setError("") }
      else setError("No encontramos un evento con ese código.")
    } else {
      if (evento) setEvento(null)
    }
  }, [codigo])

  const handleCodigoChange = (v: string) => {
    const upper = v.toUpperCase().replace(/[^CC\-0-9]/g, "")
    setCodigo(upper)
    setError("")
  }

  const handleQRDetectado = (cod: string) => {
    const ev = buscarEvento(cod)
    if (ev) { setEvento(ev); setTab("codigo"); setCodigo(cod) }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <HeaderInvitado onVolver={onVolver} labelVolver="Inicio" paso={1} />

      <main className="flex-1 max-w-md mx-auto w-full px-4 py-8 flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-black text-gray-800">Unirse al evento</h1>
          <p className="text-gray-400 text-sm mt-1">Escanea el QR del anfitrión o ingresa el código.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {([["qr", "📷 Escanear QR"], ["codigo", "🔑 Tengo código"]] as const).map(([k, label]) => (
            <button key={k} type="button" onClick={() => setTab(k)}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all
                ${tab === k ? "bg-white text-[#2EC4B6] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Zona QR */}
        {tab === "qr" && (
          <ZonaQR onDetectado={handleQRDetectado} />
        )}

        {/* Input de código */}
        {tab === "codigo" && (
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">Código de invitación</label>
            <input
              type="text"
              value={codigo}
              onChange={(e) => handleCodigoChange(e.target.value)}
              placeholder="CC-0000"
              maxLength={7}
              className={`border-2 rounded-xl px-4 py-3.5 text-center text-2xl font-black tracking-widest text-gray-800 placeholder:text-gray-200 placeholder:font-normal placeholder:text-lg placeholder:tracking-normal focus:outline-none transition-colors
                ${error ? "border-red-400" : evento ? "border-[#2EC4B6]" : "border-gray-200 focus:border-[#2EC4B6]"}
              `}
            />
            {error && <p className="text-xs text-red-400 text-center">{error}</p>}
          </div>
        )}

        {/* Preview del evento */}
        {evento && (
          <div className="flex flex-col gap-4">
            <TarjetaEvento ev={evento} />

            <div className="flex items-start gap-2 bg-[#2EC4B6]/8 border border-[#2EC4B6]/25 rounded-xl px-4 py-3">
              <span className="text-base">💡</span>
              <p className="text-xs text-teal-700 leading-relaxed">
                <span className="font-semibold">No necesitas crear cuenta.</span>{" "}
                Solo elige un nombre y listo.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onContinuar(evento)}
              className="w-full py-3.5 rounded-xl bg-[#2EC4B6] text-white font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-md shadow-[#2EC4B6]/30"
            >
              Confirmar y entrar →
            </button>
          </div>
        )}

        {/* Sin evento todavía */}
        {!evento && (
          <div className="flex flex-col items-center gap-2 py-6 text-gray-400">
            <span className="text-4xl">🎉</span>
            <p className="text-sm text-center">
              {tab === "qr"
                ? "Pídele al anfitrión que muestre el QR."
                : "El código tiene formato CC-0000."}
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
