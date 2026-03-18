import { useState } from "react"
import type { InfoEvento, PerfilInvitado } from "./InvitadoFlow"
import { HeaderInvitado } from "./InvitadoFlow"
import { unirseAEvento, ApiError } from "../../api"

interface Props {
  evento: InfoEvento
  onVolver: () => void
  onContinuar: (perfil: PerfilInvitado) => void
}

// ─── Paleta de colores de avatar ──────────────────────────────────────────────

export const COLORES_AVATAR = [
  { bg: "bg-[#2EC4B6]", hex: "#2EC4B6", label: "Teal" },
  { bg: "bg-orange-400", hex: "#fb923c", label: "Naranja" },
  { bg: "bg-pink-400",   hex: "#f472b6", label: "Rosa" },
  { bg: "bg-sky-400",    hex: "#38bdf8", label: "Azul" },
  { bg: "bg-[#534AB7]",  hex: "#534AB7", label: "Morado" },
  { bg: "bg-amber-400",  hex: "#fbbf24", label: "Amarillo" },
  { bg: "bg-emerald-500",hex: "#10b981", label: "Verde" },
  { bg: "bg-rose-400",   hex: "#fb7185", label: "Rojo" },
  { bg: "bg-indigo-400", hex: "#818cf8", label: "Índigo" },
  { bg: "bg-lime-500",   hex: "#84cc16", label: "Lima" },
]

export default function PasoRegistro({ evento, onVolver, onContinuar }: Props) {
  const [nombre, setNombre] = useState("")
  const [colorIndex, setColorIndex] = useState(0)
  const [error, setError] = useState("")
  const [errorApi, setErrorApi] = useState("")
  const [cargando, setCargando] = useState(false)

  const color = COLORES_AVATAR[colorIndex]
  const inicial = nombre.trim() ? nombre.trim().charAt(0).toUpperCase() : "?"

  const handleSubmit = async () => {
    if (!nombre.trim()) { setError("Escribe tu nombre o apodo."); return }

    setCargando(true)
    setErrorApi("")
    try {
      const invitado = await unirseAEvento({
        codigo: evento.codigo,
        nombre: nombre.trim(),
        color_index: colorIndex,
      })
      // Guardar token en localStorage para recuperar sesión
      localStorage.setItem(`cc_token_${evento.codigo}`, invitado.token)
      onContinuar({
        nombre: nombre.trim(),
        colorIndex,
        invitadoId: invitado.id,
        token: invitado.token,
      })
    } catch (err) {
      setErrorApi(
        err instanceof ApiError
          ? err.mensaje
          : "No se pudo unir al evento. Intenta de nuevo."
      )
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <HeaderInvitado onVolver={onVolver} labelVolver="Acceso" paso={2} />

      <main className="flex-1 max-w-md mx-auto w-full px-4 py-8 flex flex-col gap-7">

        {/* Título */}
        <div>
          <p className="text-xs font-semibold text-[#2EC4B6] uppercase tracking-wider mb-1">
            {evento.nombre}
          </p>
          <h1 className="text-2xl font-black text-gray-800">¿Cómo te llamas?</h1>
          <p className="text-gray-400 text-sm mt-1">
            Así te verán el resto del grupo. No necesitas cuenta.
          </p>
        </div>

        {/* Preview del avatar */}
        <div className="flex flex-col items-center gap-3 py-4">
          <div className={`w-24 h-24 rounded-full ${color.bg} flex items-center justify-center shadow-lg transition-all duration-200`}>
            <span className="text-white font-black text-4xl leading-none">{inicial}</span>
          </div>
          <p className="text-sm text-gray-500">
            {nombre.trim() ? (
              <span className="font-semibold text-gray-700">{nombre.trim()}</span>
            ) : (
              <span className="text-gray-300 italic">Tu nombre aquí</span>
            )}
          </p>
        </div>

        {/* Input de nombre */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-gray-700">
            Nombre o apodo <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={nombre}
            autoFocus
            maxLength={20}
            onChange={(e) => { setNombre(e.target.value); setError("") }}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="Ej. Fer, Ana, El Chivo…"
            className={`border-2 rounded-xl px-4 py-3 text-gray-800 text-sm placeholder:text-gray-300 focus:outline-none transition-colors
              ${error ? "border-red-400" : "border-gray-200 focus:border-[#2EC4B6]"}
            `}
          />
          <div className="flex items-center justify-between">
            {error
              ? <p className="text-xs text-red-400">⚠ {error}</p>
              : <span />
            }
            <span className="text-[11px] text-gray-300 ml-auto">{nombre.length}/20</span>
          </div>
        </div>

        {/* Selector de color */}
        <div className="flex flex-col gap-3">
          <label className="text-sm font-semibold text-gray-700">Color de avatar</label>
          <div className="grid grid-cols-5 gap-3">
            {COLORES_AVATAR.map((c, i) => (
              <button
                key={i}
                type="button"
                title={c.label}
                onClick={() => setColorIndex(i)}
                className={`w-full aspect-square rounded-full ${c.bg} transition-all focus:outline-none
                  ${colorIndex === i
                    ? "ring-3 ring-offset-2 ring-gray-600 scale-110 shadow-lg"
                    : "hover:scale-105 hover:shadow-md opacity-70 hover:opacity-100"
                  }
                `}
              >
                {colorIndex === i && (
                  <svg viewBox="0 0 24 24" className="w-5 h-5 mx-auto text-white" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col gap-3 pt-2 pb-8">
          {errorApi && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <span className="text-base leading-none mt-0.5">⚠️</span>
              <p className="text-sm text-red-600">{errorApi}</p>
            </div>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={cargando}
            className="w-full py-3.5 rounded-xl bg-[#2EC4B6] text-white font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-md shadow-[#2EC4B6]/30 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {cargando ? "Entrando al evento…" : "Listo, entrar al evento →"}
          </button>
        </div>

      </main>
    </div>
  )
}
