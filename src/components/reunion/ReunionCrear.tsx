import { useState } from "react"
import type { EventoReunion, ParticipanteReunion } from "./ReunionFlow"
import { COLORES_REUNION, HeaderReunion, Avatar } from "./ReunionFlow"

interface Props {
  onVolver: () => void
  onCreado: (evento: EventoReunion) => void
}

function ModalAgregarParticipante({
  nextId, onAgregar, onCerrar,
}: {
  nextId: number
  onAgregar: (p: ParticipanteReunion) => void
  onCerrar: () => void
}) {
  const [nombre, setNombre] = useState("")
  const [colorIndex, setColorIndex] = useState(nextId % COLORES_REUNION.length)
  const submit = () => {
    const n = nombre.trim()
    if (n) onAgregar({ id: nextId, nombre: n, colorIndex, esYo: false })
  }
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <h3 className="font-bold text-gray-800 mb-4">Agregar participante</h3>
        <input autoFocus type="text" value={nombre}
          onChange={e => setNombre(e.target.value)}
          onKeyDown={e => e.key === "Enter" && submit()}
          placeholder="Nombre o apodo"
          className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#534AB7] transition-colors mb-3" />
        <div className="grid grid-cols-8 gap-2 mb-5">
          {COLORES_REUNION.map((c, i) => (
            <button key={i} type="button" onClick={() => setColorIndex(i)}
              className={`w-full aspect-square rounded-full ${c.bg} transition-all ${colorIndex === i ? "ring-2 ring-offset-2 ring-gray-600 scale-110" : "opacity-60 hover:opacity-100 hover:scale-105"}`} />
          ))}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onCerrar}
            className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-500 hover:border-gray-300 transition-colors">
            Cancelar
          </button>
          <button type="button" onClick={submit} disabled={!nombre.trim()}
            className="flex-1 py-2.5 rounded-xl bg-[#534AB7] text-white text-sm font-bold hover:opacity-90 disabled:opacity-40 transition-opacity">
            Agregar
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ReunionCrear({ onVolver, onCreado }: Props) {
  const [nombre, setNombre] = useState("")
  const [tipo, setTipo] = useState<"reunion" | "viaje" | null>(null)
  const [fechaInicio, setFechaInicio] = useState("")
  const [fechaFin, setFechaFin] = useState("")
  const [participantes, setParticipantes] = useState<ParticipanteReunion[]>([
    { id: 0, nombre: "Tú",     colorIndex: 0, esYo: true  },
    { id: 1, nombre: "Ana",    colorIndex: 1, esYo: false },
    { id: 2, nombre: "Carlos", colorIndex: 2, esYo: false },
    { id: 3, nombre: "Rosa",   colorIndex: 3, esYo: false },
  ])
  const [modal, setModal] = useState(false)
  const [nextId, setNextId] = useState(4)
  const [errores, setErrores] = useState<Record<string, string>>({})

  const agregar = (p: ParticipanteReunion) => {
    setParticipantes(prev => [...prev, p])
    setNextId(n => n + 1)
    setModal(false)
  }

  const eliminar = (id: number) => setParticipantes(prev => prev.filter(p => p.id !== id))

  const submit = () => {
    const errs: Record<string, string> = {}
    if (!nombre.trim()) errs.nombre = "El nombre es obligatorio."
    if (!tipo) errs.tipo = "Selecciona el tipo."
    setErrores(errs)
    if (Object.keys(errs).length === 0 && tipo) {
      onCreado({ nombre: nombre.trim(), tipo, fechaInicio, fechaFin, participantes })
    }
  }

  const TIPOS = {
    reunion: { emoji: "🏠", label: "Reunión en casa", desc: "Cena, peda, posada, cumpleaños…" },
    viaje:   { emoji: "✈️", label: "Viaje en grupo",  desc: "Fin de semana, aventura, tour…" },
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <HeaderReunion titulo="CuentasClaras" onVolver={onVolver} labelVolver="Inicio" />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-black text-gray-800">Nuevo grupo</h1>
          <p className="text-gray-400 text-sm mt-1">Crea el grupo y registra gastos compartidos.</p>
        </div>

        {/* Nombre */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-gray-700">Nombre del grupo <span className="text-red-400">*</span></label>
          <input type="text" value={nombre}
            onChange={e => { setNombre(e.target.value); setErrores(er => ({ ...er, nombre: "" })) }}
            placeholder="Ej. Viaje a Oaxaca · Diciembre 2025"
            className={`border-2 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none transition-colors
              ${errores.nombre ? "border-red-400" : "border-gray-200 focus:border-[#534AB7]"}`} />
          {errores.nombre && <p className="text-xs text-red-400">⚠ {errores.nombre}</p>}
        </div>

        {/* Tipo */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-gray-700">Tipo <span className="text-red-400">*</span></label>
          <div className="grid grid-cols-2 gap-3">
            {(["reunion", "viaje"] as const).map(t => {
              const info = TIPOS[t]
              const activo = tipo === t
              return (
                <button key={t} type="button" onClick={() => { setTipo(t); setErrores(er => ({ ...er, tipo: "" })) }}
                  className={`rounded-xl border-2 p-4 text-left transition-all focus:outline-none
                    ${activo ? "border-[#534AB7] bg-[#534AB7]/5" : "border-gray-200 bg-white hover:border-gray-300"}`}>
                  <span className="text-2xl">{info.emoji}</span>
                  <p className={`font-bold text-sm mt-2 ${activo ? "text-[#534AB7]" : "text-gray-700"}`}>{info.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{info.desc}</p>
                  {activo && (
                    <div className="mt-2 flex items-center gap-1">
                      <div className="w-3.5 h-3.5 rounded-full bg-[#534AB7] flex items-center justify-center">
                        <svg viewBox="0 0 8 8" className="w-2 h-2" fill="none"><path d="M1 4l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
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
          {[
            { label: "Fecha de inicio", value: fechaInicio, set: setFechaInicio },
            { label: "Fecha de fin",    value: fechaFin,    set: setFechaFin    },
          ].map(({ label, value, set }) => (
            <div key={label} className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-gray-700">{label}</label>
              <input type="date" value={value} onChange={e => set(e.target.value)}
                className="border-2 border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:border-[#534AB7] transition-colors" />
            </div>
          ))}
        </div>

        {/* Participantes */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-gray-700">Participantes</label>
            <span className="text-xs text-gray-400">{participantes.length} persona{participantes.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="bg-white border-2 border-gray-100 rounded-xl p-4 flex flex-wrap gap-2">
            {participantes.map(p => (
              <div key={p.id} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs font-medium
                ${p.esYo ? "bg-[#534AB7]/10 border-[#534AB7]/30 text-[#534AB7]" : "bg-gray-100 border-gray-200 text-gray-700"}`}>
                <Avatar nombre={p.nombre} colorIndex={p.colorIndex} size="xs" />
                <span>{p.nombre}</span>
                {!p.esYo && (
                  <button type="button" onClick={() => eliminar(p.id)}
                    className="ml-0.5 text-gray-400 hover:text-red-400 transition-colors leading-none">×</button>
                )}
              </div>
            ))}
            <button type="button" onClick={() => setModal(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full border-2 border-dashed border-gray-300 text-gray-400 text-xs font-medium hover:border-[#534AB7] hover:text-[#534AB7] transition-colors">
              <svg viewBox="0 0 20 20" className="w-3.5 h-3.5" fill="currentColor"><path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd"/></svg>
              Agregar
            </button>
          </div>
          <div className="flex items-start gap-2 bg-[#534AB7]/5 border border-[#534AB7]/20 rounded-xl px-4 py-3">
            <span className="text-base">💡</span>
            <p className="text-xs text-[#534AB7] leading-relaxed">
              El evento queda <span className="font-semibold">abierto</span> hasta que tú lo cierres manualmente. Pueden seguir agregando gastos.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col gap-3 pb-8">
          <button type="button" onClick={submit}
            className="w-full py-3.5 rounded-xl bg-[#534AB7] text-white font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-md shadow-[#534AB7]/25">
            Crear grupo →
          </button>
          <button type="button" onClick={onVolver}
            className="w-full py-3 rounded-xl border-2 border-gray-200 text-gray-500 font-semibold text-sm hover:border-gray-300 transition-colors">
            Cancelar
          </button>
        </div>
      </main>

      {modal && <ModalAgregarParticipante nextId={nextId} onAgregar={agregar} onCerrar={() => setModal(false)} />}
    </div>
  )
}
