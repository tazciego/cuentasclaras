import { useState } from "react"
import type { SesionReunion } from "./ReunionFlow"
import { COLORES_REUNION, HeaderReunion, Avatar } from "./ReunionFlow"
import { crearEvento, unirseAEvento } from "../../api"

interface Props {
  onVolver: () => void
  onCreado: (s: SesionReunion) => void
}

export default function ReunionCrear({ onVolver, onCreado }: Props) {
  const [grupoNombre, setGrupoNombre] = useState("")
  const [miNombre, setMiNombre]       = useState("")
  const [miColor, setMiColor]         = useState(0)
  const [tipo, setTipo]               = useState<"reunion" | "viaje" | null>(null)
  const [fechaInicio, setFechaInicio] = useState("")
  const [fechaFin, setFechaFin]       = useState("")
  const [cargando, setCargando]       = useState(false)
  const [error, setError]             = useState("")
  const [errores, setErrores]         = useState<Record<string, string>>({})

  const submit = async () => {
    const errs: Record<string, string> = {}
    if (!grupoNombre.trim()) errs.grupoNombre = "El nombre del grupo es obligatorio."
    if (!miNombre.trim())    errs.miNombre    = "Tu nombre es obligatorio."
    if (!tipo)               errs.tipo        = "Selecciona el tipo."
    setErrores(errs)
    if (Object.keys(errs).length > 0) return

    setCargando(true)
    setError("")
    try {
      const { id: eventoId, codigo: eventoCodigo } = await crearEvento({
        nombre: grupoNombre.trim(),
        tipo: tipo!,
        fecha: fechaInicio || undefined,
        fecha_fin: (tipo === "viaje" && fechaFin) ? fechaFin : undefined,
      })

      const inv = await unirseAEvento({
        codigo: eventoCodigo,
        nombre: miNombre.trim(),
        color_index: miColor,
        es_anfitrion: 1,
      })

      onCreado({
        eventoId,
        eventoCodigo,
        eventoNombre: grupoNombre.trim(),
        eventoTipo: tipo!,
        fechaInicio: fechaInicio || new Date().toISOString().split("T")[0],
        fechaFin: (tipo === "viaje" && fechaFin) ? fechaFin : null,
        miembroId: inv.id,
        miembroNombre: inv.nombre,
        miembroColorIndex: miColor,
        miembroToken: inv.token,
      })
    } catch {
      setError("No se pudo crear el grupo. Verifica tu conexión e intenta de nuevo.")
    } finally {
      setCargando(false)
    }
  }

  const TIPOS = {
    reunion: { emoji: "🏠", label: "Reunión en casa", desc: "Cena, peda, posada, cumpleaños…" },
    viaje:   { emoji: "✈️", label: "Viaje en grupo",  desc: "Fin de semana, aventura, tour…" },
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <HeaderReunion titulo="CuentasClaras" onVolver={onVolver} labelVolver="Inicio" />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 flex flex-col gap-6 pb-10">
        <div>
          <h1 className="text-2xl font-black text-gray-800">Nuevo grupo</h1>
          <p className="text-gray-400 text-sm mt-1">Crea el grupo y comparte el código para que se unan.</p>
        </div>

        {/* Nombre del grupo */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-gray-700">Nombre del grupo <span className="text-red-400">*</span></label>
          <input type="text" value={grupoNombre}
            onChange={e => { setGrupoNombre(e.target.value); setErrores(er => ({ ...er, grupoNombre: "" })) }}
            placeholder="Ej. Viaje a Oaxaca · Diciembre 2025"
            className={`border-2 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none transition-colors
              ${errores.grupoNombre ? "border-red-400" : "border-gray-200 focus:border-[#534AB7]"}`} />
          {errores.grupoNombre && <p className="text-xs text-red-400">⚠ {errores.grupoNombre}</p>}
        </div>

        {/* Tu nombre + color */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-700">Tu nombre <span className="text-red-400">*</span></label>
          <input type="text" value={miNombre}
            onChange={e => { setMiNombre(e.target.value); setErrores(er => ({ ...er, miNombre: "" })) }}
            placeholder="¿Cómo te llamas?"
            className={`border-2 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none transition-colors
              ${errores.miNombre ? "border-red-400" : "border-gray-200 focus:border-[#534AB7]"}`} />
          {errores.miNombre && <p className="text-xs text-red-400">⚠ {errores.miNombre}</p>}

          <div className="flex items-center gap-3 mt-1">
            <Avatar nombre={miNombre || "?"} colorIndex={miColor} size="md" ring />
            <div className="grid grid-cols-8 gap-2 flex-1">
              {COLORES_REUNION.map((c, i) => (
                <button key={i} type="button" onClick={() => setMiColor(i)}
                  className={`w-full aspect-square rounded-full ${c.bg} transition-all
                    ${miColor === i ? "ring-2 ring-offset-2 ring-gray-600 scale-110" : "opacity-60 hover:opacity-100 hover:scale-105"}`} />
              ))}
            </div>
          </div>
        </div>

        {/* Tipo */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-gray-700">Tipo <span className="text-red-400">*</span></label>
          <div className="grid grid-cols-2 gap-3">
            {(["reunion", "viaje"] as const).map(t => {
              const info = TIPOS[t]
              const activo = tipo === t
              return (
                <button key={t} type="button"
                  onClick={() => { setTipo(t); setErrores(er => ({ ...er, tipo: "" })) }}
                  className={`rounded-xl border-2 p-4 text-left transition-all focus:outline-none
                    ${activo ? "border-[#534AB7] bg-[#534AB7]/5" : "border-gray-200 bg-white hover:border-gray-300"}`}>
                  <span className="text-2xl">{info.emoji}</span>
                  <p className={`font-bold text-sm mt-2 ${activo ? "text-[#534AB7]" : "text-gray-700"}`}>{info.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{info.desc}</p>
                  {activo && (
                    <div className="mt-2 flex items-center gap-1">
                      <div className="w-3.5 h-3.5 rounded-full bg-[#534AB7] flex items-center justify-center">
                        <svg viewBox="0 0 8 8" className="w-2 h-2" fill="none">
                          <path d="M1 4l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <span className="text-[10px] font-semibold text-[#534AB7]">Seleccionado</span>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
          {errores.tipo && <p className="text-xs text-red-400">⚠ {errores.tipo}</p>}
        </div>

        {/* Fechas */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-700">Fecha de inicio</label>
            <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)}
              className="border-2 border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:border-[#534AB7] transition-colors" />
          </div>
          {tipo === "viaje" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-gray-700">Fecha de regreso</label>
              <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)}
                min={fechaInicio || undefined}
                className="border-2 border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:border-[#534AB7] transition-colors" />
            </div>
          )}
        </div>

        {/* Aviso código */}
        <div className="flex items-start gap-2 bg-[#534AB7]/5 border border-[#534AB7]/20 rounded-xl px-4 py-3">
          <span className="text-base">💡</span>
          <p className="text-xs text-[#534AB7] leading-relaxed">
            Al crear el grupo recibirás un <span className="font-semibold">código de invitación</span> para que los demás se unan desde su cel.
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <span className="text-base">⚠</span>
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        {/* CTA */}
        <div className="flex flex-col gap-3 pb-8">
          <button type="button" onClick={submit} disabled={cargando}
            className="w-full py-3.5 rounded-xl bg-[#534AB7] text-white font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-md shadow-[#534AB7]/25 disabled:opacity-60">
            {cargando ? "Creando grupo…" : "Crear grupo →"}
          </button>
          <button type="button" onClick={onVolver} disabled={cargando}
            className="w-full py-3 rounded-xl border-2 border-gray-200 text-gray-500 font-semibold text-sm hover:border-gray-300 transition-colors disabled:opacity-60">
            Cancelar
          </button>
        </div>
      </main>
    </div>
  )
}
