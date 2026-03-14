import { useState, useEffect } from "react"
import type { Casa, GastoRoomie, CategoriaRoomie } from "./RoomiesFlow"
import { CATEGORIA_META, COLORES_ROOMIES, HeaderRoomies, AvatarR, fmt } from "./RoomiesFlow"

interface Props {
  casa: Casa
  yoId: number
  gastoAEditar: GastoRoomie | null
  onVolver: () => void
  onGuardar: (g: Omit<GastoRoomie, "id">) => void
}

const CATEGORIAS: CategoriaRoomie[] = ["renta", "servicios", "despensa", "suscripciones", "otros"]
const MES_ACTUAL = "2026-03"

export default function RoomiesAgregarGasto({ casa, yoId, gastoAEditar, onVolver, onGuardar }: Props) {
  const editando = gastoAEditar !== null

  const [descripcion, setDescripcion] = useState(gastoAEditar?.descripcion ?? "")
  const [categoria, setCategoria] = useState<CategoriaRoomie>(gastoAEditar?.categoria ?? "otros")
  const [monto, setMonto] = useState(gastoAEditar ? String(gastoAEditar.monto) : "")
  const [pagadorId, setPagadorId] = useState(gastoAEditar?.pagadorId ?? yoId)
  const [recurrente, setRecurrente] = useState(gastoAEditar?.recurrente ?? false)
  const [divisionTipo, setDivisionTipo] = useState<"igual" | "personalizada">("igual")
  const [divisionCustom, setDivisionCustom] = useState<Record<number, string>>({})
  const [errores, setErrores] = useState<Record<string, string>>({})

  const montoNum = parseFloat(monto) || 0

  // Init custom division
  useEffect(() => {
    if (gastoAEditar) {
      const custom: Record<number, string> = {}
      for (const d of gastoAEditar.division) custom[d.roomieId] = String(d.monto)
      setDivisionCustom(custom)
      const igualMonto = Math.round(montoNum / casa.roomies.length)
      const esIgual = gastoAEditar.division.every(d => Math.abs(d.monto - igualMonto) <= 1)
      setDivisionTipo(esIgual ? "igual" : "personalizada")
    } else {
      const custom: Record<number, string> = {}
      for (const r of casa.roomies) custom[r.id] = ""
      setDivisionCustom(custom)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const calcDivisionIgual = () =>
    casa.roomies.map(r => ({ roomieId: r.id, monto: Math.round(montoNum / casa.roomies.length) }))

  const calcDivisionCustom = () =>
    casa.roomies.map(r => ({ roomieId: r.id, monto: parseFloat(divisionCustom[r.id] ?? "0") || 0 }))

  const sumaCustom = Object.values(divisionCustom).reduce((s, v) => s + (parseFloat(v) || 0), 0)
  const diferenciaCustom = montoNum - sumaCustom

  const submit = () => {
    const errs: Record<string, string> = {}
    if (!descripcion.trim()) errs.descripcion = "La descripción es obligatoria."
    if (!monto || montoNum <= 0) errs.monto = "El monto debe ser mayor a $0."
    if (divisionTipo === "personalizada" && Math.abs(diferenciaCustom) > 0.5)
      errs.division = `La división no cuadra. Diferencia: ${fmt(diferenciaCustom)}`
    setErrores(errs)
    if (Object.keys(errs).length > 0) return

    const division = divisionTipo === "igual" ? calcDivisionIgual() : calcDivisionCustom()
    onGuardar({ descripcion: descripcion.trim(), categoria, monto: montoNum, mes: MES_ACTUAL, pagadorId, division, recurrente, tienesFoto: false })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <HeaderRoomies
        titulo={editando ? "Editar gasto" : "Nuevo gasto"}
        subtitulo={casa.nombre}
        onVolver={onVolver}
        labelVolver="Gastos"
      />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 flex flex-col gap-5 pb-24">

        {/* Categoría */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-700">Categoría</label>
          <div className="grid grid-cols-5 gap-2">
            {CATEGORIAS.map(c => {
              const meta = CATEGORIA_META[c]
              const activo = categoria === c
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategoria(c)}
                  className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-all ${
                    activo
                      ? "border-[#8B1A3A] bg-[#8B1A3A]/5"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <span className="text-xl">{meta.emoji}</span>
                  <span className={`text-[10px] font-semibold ${activo ? "text-[#8B1A3A]" : "text-gray-500"}`}>
                    {meta.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Descripción */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-gray-700">
            Descripción <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={descripcion}
            onChange={e => { setDescripcion(e.target.value); setErrores(p => ({ ...p, descripcion: "" })) }}
            placeholder={`Ej. ${CATEGORIA_META[categoria].label} mensual`}
            className={`border-2 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none transition-colors
              ${errores.descripcion ? "border-red-400" : "border-gray-200 focus:border-[#8B1A3A]"}`}
          />
          {errores.descripcion && <p className="text-xs text-red-400">⚠ {errores.descripcion}</p>}
        </div>

        {/* Monto */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-gray-700">
            Monto <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">$</span>
            <input
              type="number"
              inputMode="decimal"
              value={monto}
              onChange={e => { setMonto(e.target.value); setErrores(p => ({ ...p, monto: "" })) }}
              placeholder="0.00"
              className={`w-full border-2 rounded-xl pl-8 pr-4 py-3 text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none transition-colors
                ${errores.monto ? "border-red-400" : "border-gray-200 focus:border-[#8B1A3A]"}`}
            />
          </div>
          {errores.monto && <p className="text-xs text-red-400">⚠ {errores.monto}</p>}
        </div>

        {/* Quién pagó */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-700">¿Quién pagó?</label>
          <div className="flex flex-wrap gap-2">
            {casa.roomies.map(r => {
              const activo = pagadorId === r.id
              const color = COLORES_ROOMIES[r.colorIndex % COLORES_ROOMIES.length]
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setPagadorId(r.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all ${
                    activo ? `border-[#8B1A3A] bg-[#8B1A3A]/5` : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full ${color.bg} flex items-center justify-center`}>
                    <span className="text-white font-bold text-[9px]">{r.nombre.charAt(0).toUpperCase()}</span>
                  </div>
                  <span className={`text-sm font-semibold ${activo ? "text-[#8B1A3A]" : "text-gray-700"}`}>
                    {r.esYo ? "Tú" : r.nombre}
                  </span>
                  {activo && <span className="text-[#8B1A3A] text-xs">✓</span>}
                </button>
              )
            })}
          </div>
        </div>

        {/* División */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-700">División</label>
          <div className="flex gap-2">
            {(["igual", "personalizada"] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setDivisionTipo(t)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                  divisionTipo === t
                    ? "border-[#8B1A3A] bg-[#8B1A3A]/5 text-[#8B1A3A]"
                    : "border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                {t === "igual" ? "⚖ A partes iguales" : "✏ Personalizada"}
              </button>
            ))}
          </div>

          {divisionTipo === "igual" && montoNum > 0 && (
            <div className="bg-white rounded-xl border-2 border-gray-100 overflow-hidden">
              {casa.roomies.map(r => (
                <div key={r.id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0">
                  <AvatarR nombre={r.nombre} colorIndex={r.colorIndex} size="sm" />
                  <span className="flex-1 text-sm text-gray-700">{r.esYo ? "Tú" : r.nombre}</span>
                  <span className="text-sm font-bold text-gray-800">{fmt(Math.round(montoNum / casa.roomies.length))}</span>
                </div>
              ))}
            </div>
          )}

          {divisionTipo === "personalizada" && (
            <div className="bg-white rounded-xl border-2 border-gray-100 overflow-hidden">
              {casa.roomies.map(r => (
                <div key={r.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-50 last:border-0">
                  <AvatarR nombre={r.nombre} colorIndex={r.colorIndex} size="sm" />
                  <span className="flex-1 text-sm text-gray-700">{r.esYo ? "Tú" : r.nombre}</span>
                  <div className="relative w-24">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">$</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={divisionCustom[r.id] ?? ""}
                      onChange={e => {
                        setDivisionCustom(prev => ({ ...prev, [r.id]: e.target.value }))
                        setErrores(p => ({ ...p, division: "" }))
                      }}
                      placeholder="0"
                      className="w-full border-2 border-gray-200 rounded-lg pl-6 pr-2 py-1.5 text-sm text-right focus:outline-none focus:border-[#8B1A3A] transition-colors"
                    />
                  </div>
                </div>
              ))}
              {montoNum > 0 && (
                <div className={`px-4 py-2.5 flex items-center justify-between text-xs font-semibold border-t ${
                  Math.abs(diferenciaCustom) < 0.5 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
                }`}>
                  <span>{Math.abs(diferenciaCustom) < 0.5 ? "✓ División correcta" : "Diferencia:"}</span>
                  {Math.abs(diferenciaCustom) >= 0.5 && <span>{fmt(Math.abs(diferenciaCustom))}</span>}
                </div>
              )}
            </div>
          )}

          {errores.division && <p className="text-xs text-red-400">⚠ {errores.division}</p>}
        </div>

        {/* Gasto recurrente toggle */}
        <div className="flex items-center justify-between bg-white rounded-xl border-2 border-gray-100 px-4 py-3.5">
          <div>
            <p className="text-sm font-semibold text-gray-800">Gasto recurrente</p>
            <p className="text-xs text-gray-400">Se repite cada mes (renta, servicios, etc.)</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={recurrente}
            onClick={() => setRecurrente(r => !r)}
            className={`relative w-12 h-6 rounded-full transition-colors ${recurrente ? "bg-[#8B1A3A]" : "bg-gray-300"}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${recurrente ? "translate-x-6" : "translate-x-0.5"}`} />
          </button>
        </div>

      </main>

      {/* Botones fijos */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-4 flex flex-col gap-2 max-w-2xl mx-auto">
        <button
          type="button"
          onClick={submit}
          className="w-full py-3.5 rounded-xl bg-[#8B1A3A] text-white font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-md shadow-[#8B1A3A]/25"
        >
          {editando ? "Guardar cambios" : "Agregar gasto"}
        </button>
        <button
          type="button"
          onClick={onVolver}
          className="w-full py-2.5 rounded-xl border-2 border-gray-200 text-gray-500 font-semibold text-sm hover:border-gray-300 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
