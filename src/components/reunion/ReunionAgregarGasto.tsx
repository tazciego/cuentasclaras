import { useState } from "react"
import type { SesionReunion, MiembroReunion, ConsumoReunion } from "./ReunionFlow"
import { HeaderReunion, Avatar } from "./ReunionFlow"
import { guardarConsumo, actualizarConsumo } from "../../api"

interface Props {
  sesion: SesionReunion
  miembros: MiembroReunion[]
  yoId: number
  consumoAEditar: ConsumoReunion | null
  onVolver: () => void
  onGuardado: () => void
}

type ModoItem = "gasto" | "lista"

export default function ReunionAgregarGasto({
  sesion, miembros, yoId, consumoAEditar, onVolver, onGuardado,
}: Props) {
  const esEdicion = consumoAEditar !== null

  // Determinar modo inicial al editar
  const modoInicial: ModoItem = consumoAEditar
    ? (consumoAEditar.pagadoPorId !== null ? "gasto" : "lista")
    : "gasto"

  const [modo, setModo]           = useState<ModoItem>(modoInicial)
  const [descripcion, setDescripcion] = useState(consumoAEditar?.descripcion ?? "")
  const [montoStr, setMontoStr]   = useState(consumoAEditar?.precio ? String(consumoAEditar.precio) : "")
  const [pagadorId, setPagadorId] = useState<number>(
    consumoAEditar?.pagadoPorId ?? yoId
  )
  const [cargando, setCargando]   = useState(false)
  const [errores, setErrores]     = useState<Record<string, string>>({})

  const montoNum = parseFloat(montoStr.replace(",", ".")) || 0

  const submit = async () => {
    const errs: Record<string, string> = {}
    if (!descripcion.trim()) errs.descripcion = "La descripción es obligatoria."
    if (modo === "gasto" && (!montoNum || montoNum <= 0)) errs.monto = "Ingresa un monto válido."
    setErrores(errs)
    if (Object.keys(errs).length > 0) return

    setCargando(true)
    try {
      if (esEdicion && consumoAEditar) {
        await actualizarConsumo({
          id: consumoAEditar.id,
          descripcion: descripcion.trim(),
          precio: montoNum || 0,
          pagado_por_invitado_id: modo === "gasto" ? pagadorId : null,
        })
      } else {
        await guardarConsumo({
          evento_id: sesion.eventoId,
          descripcion: descripcion.trim(),
          precio: montoNum || 0,
          cantidad: 1,
          pagado_por_invitado_id: modo === "gasto" ? pagadorId : null,
        })
      }
      onGuardado()
    } catch {
      setErrores(er => ({ ...er, general: "No se pudo guardar. Verifica tu conexión." }))
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <HeaderReunion
        titulo={esEdicion ? "Editar item" : "Agregar item"}
        subtitulo={sesion.eventoNombre}
        onVolver={onVolver}
        labelVolver="Gastos"
      />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 flex flex-col gap-6 pb-10">

        {/* Selector de modo (solo al crear) */}
        {!esEdicion && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-700">Tipo de item</label>
            <div className="grid grid-cols-2 gap-3">
              {([
                ["gasto", "💸", "Gasto directo",    "Ya pagué, quiero registrarlo"],
                ["lista", "🛒", "Lista de compras", "Algo por comprar (precio opcional)"],
              ] as const).map(([k, em, label, desc]) => {
                const activo = modo === k
                return (
                  <button key={k} type="button" onClick={() => setModo(k)}
                    className={`rounded-xl border-2 p-4 text-left transition-all focus:outline-none
                      ${activo ? "border-[#534AB7] bg-[#534AB7]/5" : "border-gray-200 bg-white hover:border-gray-300"}`}>
                    <span className="text-xl">{em}</span>
                    <p className={`font-bold text-sm mt-2 ${activo ? "text-[#534AB7]" : "text-gray-700"}`}>{label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Descripción */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-gray-700">
            {modo === "gasto" ? "¿En qué se gastó?" : "¿Qué hay que comprar?"}
            <span className="text-red-400"> *</span>
          </label>
          <input type="text" value={descripcion} autoFocus
            onChange={e => { setDescripcion(e.target.value); setErrores(er => ({ ...er, descripcion: "" })) }}
            placeholder={modo === "gasto" ? "Ej. Cena, gasolina, hotel…" : "Ej. Papas, refresco, hielo…"}
            className={`border-2 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none transition-colors
              ${errores.descripcion ? "border-red-400" : "border-gray-200 focus:border-[#534AB7]"}`} />
          {errores.descripcion && <p className="text-xs text-red-400">⚠ {errores.descripcion}</p>}
        </div>

        {/* Monto */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-gray-700">
            {modo === "gasto" ? "Monto total" : "Precio estimado"}
            {modo === "gasto" && <span className="text-red-400"> *</span>}
            {modo === "lista" && <span className="text-gray-400 font-normal"> (opcional)</span>}
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">$</span>
            <input type="number" min="0" step="1" value={montoStr}
              onChange={e => { setMontoStr(e.target.value); setErrores(er => ({ ...er, monto: "" })) }}
              placeholder="0"
              className={`w-full border-2 rounded-xl pl-8 pr-4 py-3 text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none transition-colors
                ${errores.monto ? "border-red-400" : "border-gray-200 focus:border-[#534AB7]"}`} />
          </div>
          {errores.monto && <p className="text-xs text-red-400">⚠ {errores.monto}</p>}
        </div>

        {/* Pagador (solo para gastos) */}
        {modo === "gasto" && miembros.length > 0 && (
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">¿Quién pagó?</label>
            <div className="bg-white border-2 border-gray-100 rounded-xl p-3 flex flex-wrap gap-2">
              {miembros.map(m => {
                const activo = pagadorId === m.id
                return (
                  <button key={m.id} type="button" onClick={() => setPagadorId(m.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-sm font-medium transition-all
                      ${activo ? "border-[#534AB7] bg-[#534AB7]/5 text-[#534AB7]" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>
                    <Avatar nombre={m.nombre} colorIndex={m.colorIndex} size="xs" />
                    {m.id === yoId ? "Yo" : m.nombre}
                  </button>
                )
              })}
            </div>
            {montoNum > 0 && miembros.length > 1 && (
              <div className="bg-[#534AB7]/5 border border-[#534AB7]/20 rounded-xl px-4 py-3">
                <p className="text-xs text-[#534AB7] font-medium">
                  Se divide entre <span className="font-black">{miembros.length} personas</span> —
                  {" "}<span className="font-black">{`$${Math.round(montoNum / miembros.length).toLocaleString("es-MX")}`}</span> cada una
                </p>
              </div>
            )}
          </div>
        )}

        {/* Aviso lista de compras */}
        {modo === "lista" && (
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <span className="text-base">🛒</span>
            <p className="text-xs text-amber-700 leading-relaxed">
              Se agregará a la lista de compras. Cualquier miembro puede reclamar comprarlo y registrar el precio real.
            </p>
          </div>
        )}

        {errores.general && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <p className="text-xs text-red-600">⚠ {errores.general}</p>
          </div>
        )}

        {/* Botones */}
        <div className="flex flex-col gap-3 pt-2 pb-8">
          <button type="button" onClick={submit} disabled={cargando}
            className="w-full py-3.5 rounded-xl bg-[#534AB7] text-white font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-md shadow-[#534AB7]/25 disabled:opacity-60">
            {cargando
              ? "Guardando…"
              : esEdicion
                ? "Guardar cambios ✓"
                : modo === "gasto" ? "Registrar gasto →" : "Agregar a lista →"}
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
