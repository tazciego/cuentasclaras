import { useState, useEffect } from "react"
import type { EventoReunion, Gasto, PagadorMonto } from "./ReunionFlow"
import { HeaderReunion, Avatar, fmt } from "./ReunionFlow"

interface Props {
  evento: EventoReunion
  yoId: number
  gastoAEditar: Gasto | null
  onVolver: () => void
  onGuardar: (g: Omit<Gasto, "id"> | Gasto) => void
}

type ModoDivision = "iguales" | "personalizado"

export default function ReunionAgregarGasto({ evento, yoId, gastoAEditar, onVolver, onGuardar }: Props) {
  const parts = evento.participantes
  const esEdicion = gastoAEditar !== null

  // ─── Estado del formulario ────────────────────────────────────────────────

  const [descripcion, setDescripcion] = useState(gastoAEditar?.descripcion ?? "")
  const [monto, setMonto] = useState(gastoAEditar ? String(gastoAEditar.monto) : "")
  const [variosModal, setVariosModal] = useState(false)
  const [tienesFoto, setTienesFoto] = useState(gastoAEditar?.tienesFoto ?? false)
  const [modoDivision, setModoDivision] = useState<ModoDivision>("iguales")

  // Pagador único (default: yo)
  const [pagadorId, setPagadorId] = useState<number>(gastoAEditar?.pagadores[0]?.participanteId ?? yoId)

  // Varios pagan: mapa id → monto string
  const [montosPagadores, setMontosPagadores] = useState<Record<number, string>>(
    gastoAEditar?.pagadores.reduce((acc, p) => ({ ...acc, [p.participanteId]: String(p.monto) }), {}) ?? {}
  )
  const [esVarios, setEsVarios] = useState((gastoAEditar?.pagadores.length ?? 0) > 1)

  // División personalizada: mapa id → monto string
  const [montosDivision, setMontosDivision] = useState<Record<number, string>>(
    gastoAEditar?.division.reduce((acc, d) => ({ ...acc, [d.participanteId]: String(d.monto) }), {}) ?? {}
  )

  const [errores, setErrores] = useState<Record<string, string>>({})

  const montoNum = parseFloat(monto) || 0

  // Recalcula división igual cuando cambia el monto o los participantes
  useEffect(() => {
    if (modoDivision === "iguales" && montoNum > 0) {
      const montoXPersona = Math.round(montoNum / parts.length)
      const nuevos: Record<number, string> = {}
      parts.forEach(p => { nuevos[p.id] = String(montoXPersona) })
      setMontosDivision(nuevos)
    }
  }, [monto, modoDivision])

  // ─── Validaciones ─────────────────────────────────────────────────────────

  const sumaPagadores = Object.values(montosPagadores).reduce((s, v) => s + (parseFloat(v) || 0), 0)
  const sumaDivision = Object.values(montosDivision).reduce((s, v) => s + (parseFloat(v) || 0), 0)
  const diferenciaPagadores = Math.abs(sumaPagadores - montoNum)
  const diferenciaDivision = Math.abs(sumaDivision - montoNum)

  // ─── Submit ───────────────────────────────────────────────────────────────

  const submit = () => {
    const errs: Record<string, string> = {}
    if (!descripcion.trim()) errs.descripcion = "La descripción es obligatoria."
    if (!montoNum || montoNum <= 0) errs.monto = "Ingresa un monto válido."
    if (esVarios && diferenciaPagadores > 1) errs.pagadores = `Falta asignar ${fmt(montoNum - sumaPagadores)}.`
    if (modoDivision === "personalizado" && diferenciaDivision > 1) errs.division = `La división no cierra. Diferencia: ${fmt(montoNum - sumaDivision)}.`
    setErrores(errs)
    if (Object.keys(errs).length > 0) return

    const pagadores: PagadorMonto[] = esVarios
      ? parts.filter(p => parseFloat(montosPagadores[p.id] ?? "0") > 0)
             .map(p => ({ participanteId: p.id, monto: parseFloat(montosPagadores[p.id]) }))
      : [{ participanteId: pagadorId, monto: montoNum }]

    const division: PagadorMonto[] = parts.map(p => ({
      participanteId: p.id,
      monto: modoDivision === "iguales"
        ? montoNum / parts.length
        : parseFloat(montosDivision[p.id] ?? "0") || 0,
    }))

    const gasto: Omit<Gasto, "id"> = {
      descripcion: descripcion.trim(),
      monto: montoNum,
      fecha: "Hoy",
      pagadores,
      division,
      tienesFoto,
    }

    onGuardar(esEdicion && gastoAEditar ? { ...gasto, id: gastoAEditar.id } : gasto)
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <HeaderReunion
        titulo={esEdicion ? "Editar gasto" : "Agregar gasto"}
        subtitulo={evento.nombre}
        onVolver={onVolver}
        labelVolver="Gastos"
      />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 flex flex-col gap-6 pb-8">

        {/* Descripción */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-gray-700">¿En qué se gastó? <span className="text-red-400">*</span></label>
          <input type="text" value={descripcion}
            onChange={e => { setDescripcion(e.target.value); setErrores(er => ({ ...er, descripcion: "" })) }}
            placeholder="Ej. Cena en el restaurante, gasolina…"
            className={`border-2 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none transition-colors
              ${errores.descripcion ? "border-red-400" : "border-gray-200 focus:border-[#534AB7]"}`} />
          {errores.descripcion && <p className="text-xs text-red-400">⚠ {errores.descripcion}</p>}
        </div>

        {/* Monto */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-gray-700">Monto total <span className="text-red-400">*</span></label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">$</span>
            <input type="number" min="0" step="1" value={monto}
              onChange={e => { setMonto(e.target.value); setErrores(er => ({ ...er, monto: "" })) }}
              placeholder="0"
              className={`w-full border-2 rounded-xl pl-8 pr-4 py-3 text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none transition-colors
                ${errores.monto ? "border-red-400" : "border-gray-200 focus:border-[#534AB7]"}`} />
          </div>
          {errores.monto && <p className="text-xs text-red-400">⚠ {errores.monto}</p>}
        </div>

        {/* ¿Quién pagó? */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-700">¿Quién pagó?</label>

          {!esVarios ? (
            <div className="flex flex-col gap-2">
              {/* Grid de participantes */}
              <div className="bg-white border-2 border-gray-100 rounded-xl p-3 flex flex-wrap gap-2">
                {parts.map(p => {
                  const activo = pagadorId === p.id
                  return (
                    <button key={p.id} type="button" onClick={() => setPagadorId(p.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-sm font-medium transition-all
                        ${activo ? "border-[#534AB7] bg-[#534AB7]/5 text-[#534AB7]" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>
                      <Avatar nombre={p.nombre} colorIndex={p.colorIndex} size="xs" />
                      {p.id === yoId ? "Yo" : p.nombre}
                    </button>
                  )
                })}
              </div>
              <button type="button" onClick={() => {
                setEsVarios(true)
                const reparto: Record<number, string> = {}
                parts.forEach(p => { reparto[p.id] = p.id === pagadorId ? monto : "" })
                setMontosPagadores(reparto)
              }}
                className="text-sm font-semibold text-[#534AB7] hover:underline self-start">
                + Varios lo pagamos
              </button>
            </div>
          ) : (
            <div className="bg-white border-2 border-gray-100 rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-600">Indica cuánto puso cada uno</p>
                <button type="button" onClick={() => setEsVarios(false)}
                  className="text-xs text-gray-400 hover:text-gray-600">Solo uno pagó</button>
              </div>
              {parts.map(p => (
                <div key={p.id} className="flex items-center gap-3">
                  <Avatar nombre={p.nombre} colorIndex={p.colorIndex} size="xs" />
                  <span className="text-sm text-gray-700 w-20 truncate">{p.id === yoId ? "Yo" : p.nombre}</span>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                    <input type="number" min="0" step="1"
                      value={montosPagadores[p.id] ?? ""}
                      onChange={e => setMontosPagadores(prev => ({ ...prev, [p.id]: e.target.value }))}
                      placeholder="0"
                      className="w-full border-2 border-gray-200 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:border-[#534AB7] transition-colors" />
                  </div>
                </div>
              ))}
              {/* Indicador de suma */}
              {montoNum > 0 && (
                <div className={`flex items-center justify-between text-xs font-semibold px-2 py-1.5 rounded-lg
                  ${diferenciaPagadores <= 1 ? "bg-green-50 text-green-600" : "bg-orange-50 text-orange-500"}`}>
                  <span>Asignado</span>
                  <span>{fmt(sumaPagadores)} de {fmt(montoNum)}
                    {diferenciaPagadores > 1 ? ` — falta ${fmt(montoNum - sumaPagadores)}` : " ✓"}
                  </span>
                </div>
              )}
              {errores.pagadores && <p className="text-xs text-red-400">⚠ {errores.pagadores}</p>}
            </div>
          )}
        </div>

        {/* Foto de evidencia */}
        <div>
          <button type="button" onClick={() => setTienesFoto(v => !v)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all w-full
              ${tienesFoto ? "border-[#534AB7] bg-[#534AB7]/5 text-[#534AB7]" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>
            <span className="text-xl">📷</span>
            {tienesFoto ? "✓ Foto adjunta — toca para quitar" : "Tomar foto del ticket o recibo"}
          </button>
          {tienesFoto && (
            <div className="mt-2 w-full h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center gap-2 border-2 border-dashed border-gray-300">
              <span className="text-3xl">🧾</span>
              <span className="text-sm text-gray-500 font-medium">Previsualización del recibo</span>
            </div>
          )}
        </div>

        {/* División */}
        <div className="flex flex-col gap-3">
          <label className="text-sm font-semibold text-gray-700">¿Cómo se divide?</label>
          <div className="grid grid-cols-2 gap-2">
            {([["iguales", "⚖️ Partes iguales"], ["personalizado", "✏️ Personalizado"]] as const).map(([k, label]) => (
              <button key={k} type="button" onClick={() => setModoDivision(k)}
                className={`py-2.5 rounded-xl border-2 text-sm font-bold transition-all
                  ${modoDivision === k ? "border-[#534AB7] bg-[#534AB7]/5 text-[#534AB7]" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>
                {label}
              </button>
            ))}
          </div>

          {modoDivision === "iguales" && montoNum > 0 && (
            <div className="bg-[#534AB7]/5 border border-[#534AB7]/20 rounded-xl px-4 py-3">
              <p className="text-xs text-[#534AB7] font-medium">
                Cada persona paga <span className="font-black">{fmt(montoNum / parts.length)}</span> ({parts.length} personas)
              </p>
            </div>
          )}

          {modoDivision === "personalizado" && (
            <div className="bg-white border-2 border-gray-100 rounded-xl p-4 flex flex-col gap-3">
              <p className="text-xs font-semibold text-gray-600">Asigna cuánto paga cada uno</p>
              {parts.map(p => (
                <div key={p.id} className="flex items-center gap-3">
                  <Avatar nombre={p.nombre} colorIndex={p.colorIndex} size="xs" />
                  <span className="text-sm text-gray-700 w-20 truncate">{p.id === yoId ? "Yo" : p.nombre}</span>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                    <input type="number" min="0" step="1"
                      value={montosDivision[p.id] ?? ""}
                      onChange={e => setMontosDivision(prev => ({ ...prev, [p.id]: e.target.value }))}
                      placeholder="0"
                      className="w-full border-2 border-gray-200 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:border-[#534AB7] transition-colors" />
                  </div>
                </div>
              ))}
              {montoNum > 0 && (
                <div className={`flex items-center justify-between text-xs font-semibold px-2 py-1.5 rounded-lg
                  ${diferenciaDivision <= 1 ? "bg-green-50 text-green-600" : "bg-orange-50 text-orange-500"}`}>
                  <span>Total asignado</span>
                  <span>{fmt(sumaDivision)} de {fmt(montoNum)}
                    {diferenciaDivision > 1 ? ` — diferencia ${fmt(montoNum - sumaDivision)}` : " ✓"}
                  </span>
                </div>
              )}
              {errores.division && <p className="text-xs text-red-400">⚠ {errores.division}</p>}
            </div>
          )}
        </div>

        {/* Botones */}
        <div className="flex flex-col gap-3 pt-2 pb-8">
          <button type="button" onClick={submit}
            className="w-full py-3.5 rounded-xl bg-[#534AB7] text-white font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-md shadow-[#534AB7]/25">
            {esEdicion ? "Guardar cambios ✓" : "Agregar gasto →"}
          </button>
          <button type="button" onClick={onVolver}
            className="w-full py-3 rounded-xl border-2 border-gray-200 text-gray-500 font-semibold text-sm hover:border-gray-300 transition-colors">
            Cancelar
          </button>
        </div>

      </main>

      {variosModal && (
        <div className="fixed inset-0 z-50 bg-black/20" onClick={() => setVariosModal(false)} />
      )}
    </div>
  )
}
