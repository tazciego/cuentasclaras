import { useState, useEffect } from "react"
import type { SesionReunion } from "./ReunionFlow"
import { COLORES_REUNION, HeaderReunion, Avatar } from "./ReunionFlow"
import { buscarEventoPorCodigo, unirseAEvento, type EventoAPI } from "../../api"

interface Props {
  codigo: string
  onVolver: () => void
  onUnido: (s: SesionReunion) => void
}

export default function ReunionUnirse({ codigo, onVolver, onUnido }: Props) {
  const [evento, setEvento]       = useState<EventoAPI | null>(null)
  const [errorFetch, setErrorFetch] = useState("")
  const [nombre, setNombre]       = useState("")
  const [colorIndex, setColorIndex] = useState(0)
  const [cargando, setCargando]   = useState(false)
  const [errorForm, setErrorForm] = useState("")

  // Cargar evento al montar
  useEffect(() => {
    if (!codigo) { setErrorFetch("Código de invitación no válido."); return }
    buscarEventoPorCodigo(codigo)
      .then(ev => {
        if (ev.estado !== "activo") {
          setErrorFetch("Este evento ya fue cerrado.")
        } else {
          setEvento(ev)
        }
      })
      .catch(() => setErrorFetch("No se encontró el evento. Verifica el código e intenta de nuevo."))
  }, [codigo])

  const submit = async () => {
    if (!nombre.trim()) { setErrorForm("Escribe tu nombre."); return }
    if (!evento) return

    setCargando(true)
    setErrorForm("")
    try {
      const inv = await unirseAEvento({
        codigo: evento.codigo,
        nombre: nombre.trim(),
        color_index: colorIndex,
      })

      onUnido({
        eventoId: evento.id,
        eventoCodigo: evento.codigo,
        eventoNombre: evento.nombre,
        eventoTipo: (evento.tipo === "viaje" ? "viaje" : "reunion") as "reunion" | "viaje",
        fechaInicio: evento.fecha ?? new Date().toISOString().split("T")[0],
        fechaFin: evento.fecha_fin ?? null,
        miembroId: inv.id,
        miembroNombre: inv.nombre,
        miembroColorIndex: colorIndex,
        miembroToken: inv.token,
      })
    } catch {
      setErrorForm("No se pudo unir al grupo. Verifica tu conexión e intenta de nuevo.")
    } finally {
      setCargando(false)
    }
  }

  const tipoLabel = evento?.tipo === "viaje" ? "Viaje en grupo" : "Reunión"
  const tipoEmoji = evento?.tipo === "viaje" ? "✈️" : "🏠"

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <HeaderReunion titulo="CuentasClaras" onVolver={onVolver} labelVolver="Inicio" />

      <main className="flex-1 max-w-md mx-auto w-full px-4 py-8 flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-black text-gray-800">Unirse al grupo</h1>
          <p className="text-gray-400 text-sm mt-1">Regístrate para ver y agregar gastos.</p>
        </div>

        {/* Tarjeta del evento */}
        {!evento && !errorFetch && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-[#534AB7] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {errorFetch && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4">
            <p className="text-sm text-red-600 font-medium">⚠ {errorFetch}</p>
            <button type="button" onClick={onVolver}
              className="mt-3 text-sm font-bold text-[#534AB7] hover:underline">
              Volver al inicio
            </button>
          </div>
        )}

        {evento && (
          <>
            <div className="bg-[#534AB7]/5 border-2 border-[#534AB7]/30 rounded-2xl px-5 py-4 flex gap-4 items-start">
              <span className="text-3xl mt-0.5">{tipoEmoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <h3 className="font-black text-gray-800 text-base leading-snug">{evento.nombre}</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-50 border border-green-200 text-green-600">
                    Activo
                  </span>
                </div>
                <p className="text-xs text-gray-500">{tipoLabel}</p>
                {evento.fecha && (
                  <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                    📅 {evento.fecha}{evento.fecha_fin ? ` → ${evento.fecha_fin}` : ""}
                  </p>
                )}
              </div>
            </div>

            {/* Nombre */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700">Tu nombre <span className="text-red-400">*</span></label>
              <input type="text" value={nombre}
                onChange={e => { setNombre(e.target.value); setErrorForm("") }}
                onKeyDown={e => e.key === "Enter" && submit()}
                autoFocus
                placeholder="¿Cómo te llaman?"
                className={`border-2 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none transition-colors
                  ${errorForm ? "border-red-400" : "border-gray-200 focus:border-[#534AB7]"}`} />
              {errorForm && <p className="text-xs text-red-400">⚠ {errorForm}</p>}
            </div>

            {/* Color de avatar */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700">Tu color de avatar</label>
              <div className="flex items-center gap-4">
                <Avatar nombre={nombre || "?"} colorIndex={colorIndex} size="md" ring />
                <div className="grid grid-cols-8 gap-2 flex-1">
                  {COLORES_REUNION.map((c, i) => (
                    <button key={i} type="button" onClick={() => setColorIndex(i)}
                      className={`w-full aspect-square rounded-full ${c.bg} transition-all
                        ${colorIndex === i ? "ring-2 ring-offset-2 ring-gray-600 scale-110" : "opacity-60 hover:opacity-100 hover:scale-105"}`} />
                  ))}
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="flex flex-col gap-3 pt-2">
              <button type="button" onClick={submit} disabled={cargando || !nombre.trim()}
                className="w-full py-3.5 rounded-xl bg-[#534AB7] text-white font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-md shadow-[#534AB7]/25 disabled:opacity-60">
                {cargando ? "Uniéndome…" : "Unirme al grupo →"}
              </button>
              <button type="button" onClick={onVolver} disabled={cargando}
                className="w-full py-3 rounded-xl border-2 border-gray-200 text-gray-500 font-semibold text-sm hover:border-gray-300 transition-colors disabled:opacity-60">
                Cancelar
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
