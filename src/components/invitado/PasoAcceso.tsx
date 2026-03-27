import { useState, useEffect, useRef } from "react"
import type { InfoEvento } from "./InvitadoFlow"
import { HeaderInvitado } from "./InvitadoFlow"
import { buscarEventoPorCodigo, ApiError, type EventoAPI } from "../../api"
import { Html5Qrcode } from "html5-qrcode"

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  codigoInicial?: string
  onVolver: () => void
  onContinuar: (evento: InfoEvento) => void
}

// ─── Mapeador API → tipo interno ─────────────────────────────────────────────

function formatearFecha(fecha: string | null): string {
  if (!fecha) return ""
  const d = new Date(fecha + "T12:00:00")
  return d.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" })
}

function mapearEvento(ev: EventoAPI): InfoEvento {
  return {
    eventoId: ev.id,
    codigo: ev.codigo,
    nombre: ev.nombre,
    tipo: ev.tipo === "viaje" ? "reunion" : ev.tipo === "roomies" ? "reunion" : ev.tipo as "restaurante" | "reunion",
    fecha: formatearFecha(ev.fecha),
    lugar: ev.lugar ?? "",
    clabe_spei: ev.clabe_spei ?? undefined,
  }
}

// ─── Zona de QR real (html5-qrcode) ──────────────────────────────────────────

function ZonaQR({ onDetectado }: { onDetectado: (codigo: string) => void }) {
  const [activo, setActivo] = useState(false)
  const [errorCamara, setErrorCamara] = useState("")
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const detectadoRef = useRef(false)

  useEffect(() => {
    if (!activo) return

    const scanner = new Html5Qrcode("cc-qr-reader")
    scannerRef.current = scanner
    detectadoRef.current = false

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 200, height: 200 } },
        (texto) => {
          if (detectadoRef.current) return
          const match = texto.match(/CC-\d{4,8}/)
          if (match) {
            detectadoRef.current = true
            scanner.stop().catch(() => {})
            setActivo(false)
            onDetectado(match[0])
          }
        },
        () => {}
      )
      .catch(() => {
        setErrorCamara("No se pudo acceder a la cámara. Verifica los permisos del sitio.")
        setActivo(false)
      })

    return () => {
      if (scanner.isScanning) scanner.stop().catch(() => {})
    }
  }, [activo, onDetectado])

  const detener = () => {
    if (scannerRef.current?.isScanning) scannerRef.current.stop().catch(() => {})
    setActivo(false)
  }

  if (activo) {
    return (
      <div className="flex flex-col gap-3">
        <div className="w-full relative rounded-2xl overflow-hidden bg-gray-900" style={{ height: "280px" }}>
          <div id="cc-qr-reader" className="w-full h-full" />
          {["top-4 left-4 border-t-2 border-l-2 rounded-tl-lg",
            "top-4 right-4 border-t-2 border-r-2 rounded-tr-lg",
            "bottom-4 left-4 border-b-2 border-l-2 rounded-bl-lg",
            "bottom-4 right-4 border-b-2 border-r-2 rounded-br-lg"].map((cls, i) => (
            <span key={i} className={`absolute w-7 h-7 border-[#2EC4B6] ${cls} pointer-events-none`} />
          ))}
          <p className="absolute bottom-4 left-0 right-0 text-center text-white/70 text-xs pointer-events-none">
            Apunta al código QR del anfitrión
          </p>
        </div>
        <button type="button" onClick={detener}
          className="w-full py-2.5 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-500 hover:border-gray-300 bg-white">
          Cancelar
        </button>
      </div>
    )
  }

  if (errorCamara) {
    return (
      <div className="w-full rounded-2xl overflow-hidden bg-gray-900 flex items-center justify-center" style={{ height: "200px" }}>
        <div className="flex flex-col items-center gap-3 text-center px-6">
          <div className="w-14 h-14 rounded-full bg-red-500/20 border-2 border-red-400 flex items-center justify-center text-2xl">📷</div>
          <p className="text-white/70 text-sm">{errorCamara}</p>
          <button type="button" onClick={() => setErrorCamara("")} className="text-[#2EC4B6] text-xs font-semibold">
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <button type="button" onClick={() => setActivo(true)}
      className="w-full relative rounded-2xl overflow-hidden bg-gray-900 aspect-square max-h-64 flex items-center justify-center focus:outline-none group">
      <div className="absolute inset-0 bg-gradient-to-b from-gray-800 to-gray-950" />
      {["top-4 left-4 border-t-2 border-l-2 rounded-tl-lg",
        "top-4 right-4 border-t-2 border-r-2 rounded-tr-lg",
        "bottom-4 left-4 border-b-2 border-l-2 rounded-bl-lg",
        "bottom-4 right-4 border-b-2 border-r-2 rounded-br-lg"].map((cls, i) => (
        <span key={i} className={`absolute w-7 h-7 border-[#2EC4B6] ${cls}`} />
      ))}
      <div className="relative z-10 flex flex-col items-center gap-3 text-center px-6">
        <div className="w-14 h-14 rounded-full border-2 border-white/30 bg-white/10 flex items-center justify-center group-hover:border-[#2EC4B6]/60 transition-colors">
          <svg viewBox="0 0 24 24" className="w-7 h-7 text-white/60" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><circle cx="12" cy="13" r="4" />
          </svg>
        </div>
        <p className="text-white/60 text-sm">Apunta la cámara al QR del anfitrión</p>
        <span className="text-[#2EC4B6] text-xs font-semibold">Toca para activar</span>
      </div>
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
        <p className="text-xs text-gray-500 mb-2">
          {tipoLabel}{ev.anfitrion ? <> · Organizado por <span className="font-semibold">{ev.anfitrion}</span></> : null}
        </p>
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
  const [rawInput, setRawInput] = useState(
    codigoInicial.startsWith("CC-") ? codigoInicial.slice(3) : codigoInicial
  )
  const [evento, setEvento] = useState<InfoEvento | null>(null)
  const [error, setError] = useState("")
  const [cargando, setCargando] = useState(false)

  const buscar = () => {
    const digitos = rawInput.replace(/\D/g, "")
    if (!digitos) {
      setError("Escribe el código de 6 dígitos.")
      return
    }
    const codigoNorm = `CC-${digitos}`
    setError("")
    setEvento(null)
    setCargando(true)

    buscarEventoPorCodigo(codigoNorm)
      .then((ev) => {
        if (ev.estado !== "activo") {
          setError("Este evento ya fue cerrado.")
        } else {
          setEvento(mapearEvento(ev))
        }
      })
      .catch((err) => {
        setError(
          err instanceof ApiError && err.status === 404
            ? "No encontramos un evento con ese código."
            : "Error de conexión. Revisa tu internet."
        )
      })
      .finally(() => setCargando(false))
  }

  const handleQRDetectado = (cod: string) => {
    setTab("codigo")
    setRawInput(cod.startsWith("CC-") ? cod.slice(3) : cod)
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
          <div className="flex flex-col gap-3">
            <label className="text-sm font-semibold text-gray-700">
              Código de invitación
            </label>
            <input
              type="tel"
              value={rawInput}
              onChange={(e) => { setRawInput(e.target.value); setError("") }}
              onKeyDown={(e) => e.key === "Enter" && buscar()}
              placeholder="000000"
              className={`border-2 rounded-xl px-4 py-4 text-center text-3xl font-black tracking-[0.3em] text-gray-800 placeholder:text-gray-300 placeholder:font-normal placeholder:text-2xl placeholder:tracking-normal focus:outline-none transition-colors
                ${error ? "border-red-400" : evento ? "border-[#2EC4B6]" : "border-gray-200 focus:border-[#2EC4B6]"}
              `}
            />
            {error && <p className="text-xs text-red-400 text-center">⚠ {error}</p>}
            <button
              type="button"
              onClick={buscar}
              disabled={cargando}
              className="w-full py-3.5 rounded-xl bg-[#2EC4B6] text-white font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-md shadow-[#2EC4B6]/30 disabled:opacity-60"
            >
              {cargando ? "Buscando evento…" : "Buscar evento →"}
            </button>
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
        {!evento && tab === "qr" && (
          <div className="flex flex-col items-center gap-2 py-6 text-gray-400">
            <span className="text-4xl">🎉</span>
            <p className="text-sm text-center">Pídele al anfitrión que muestre el QR.</p>
          </div>
        )}
      </main>
    </div>
  )
}
