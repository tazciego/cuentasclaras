import { useState, useEffect } from "react"
import type { SesionRoomies } from "./RoomiesFlow"
import { COLORES_ROOMIES, HeaderRoomies, AvatarR } from "./RoomiesFlow"
import { buscarEventoPorCodigo, unirseAEvento, ApiError, type EventoAPI } from "../../api"

interface Props {
  codigo: string
  onVolver: () => void
  onUnido: (sesion: SesionRoomies) => void
}

export default function RoomiesUnirse({ codigo, onVolver, onUnido }: Props) {
  const [casa, setCasa]           = useState<EventoAPI | null>(null)
  const [errorBuscar, setErrorBuscar] = useState("")
  const [buscando, setBuscando]   = useState(false)
  const [nombre, setNombre]       = useState("")
  const [colorIndex, setColorIndex] = useState(0)
  const [error, setError]         = useState("")
  const [cargando, setCargando]   = useState(false)

  // Buscar la casa al montar (si ya tenemos el código)
  useEffect(() => {
    if (!codigo) return
    setBuscando(true)
    buscarEventoPorCodigo(codigo)
      .then(ev => {
        if (ev.tipo !== "roomies") { setErrorBuscar("Este código no corresponde a una casa compartida."); return }
        if (ev.estado !== "activo") { setErrorBuscar("Esta casa ya fue cerrada."); return }
        setCasa(ev)
      })
      .catch(e => setErrorBuscar(e instanceof ApiError && e.status === 404
        ? "No encontramos una casa con ese código."
        : "Error de conexión. Revisa tu internet."))
      .finally(() => setBuscando(false))
  }, [codigo])

  const submit = async () => {
    if (!nombre.trim()) { setError("Tu nombre es obligatorio."); return }
    if (!casa) return
    setError("")
    setCargando(true)
    try {
      const inv = await unirseAEvento({ codigo: casa.codigo, nombre: nombre.trim(), color_index: colorIndex, es_anfitrion: 0 })
      onUnido({
        casaId: Number(casa.id),
        casaCodigo: casa.codigo,
        casaNombre: casa.nombre,
        miembroId: Number(inv.id),
        miembroNombre: inv.nombre,
        miembroColorIndex: colorIndex,
        miembroToken: inv.token,
      })
    } catch (e) {
      setError(e instanceof ApiError ? e.mensaje : "Error de conexión. Revisa tu internet.")
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <HeaderRoomies titulo="CuentasClaras" onVolver={onVolver} labelVolver="Inicio" />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-black text-gray-800">Unirse a casa</h1>
          <p className="text-gray-400 text-sm mt-1">Código: <span className="font-mono font-bold text-gray-600">{codigo}</span></p>
        </div>

        {buscando && (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-[#8B1A3A] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {errorBuscar && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 text-center">
            <p className="text-sm text-red-600 font-medium mb-2">⚠ {errorBuscar}</p>
            <button type="button" onClick={onVolver} className="text-sm font-bold text-[#8B1A3A] hover:underline">
              Volver al inicio
            </button>
          </div>
        )}

        {casa && !errorBuscar && (
          <>
            {/* Info de la casa */}
            <div className="bg-[#8B1A3A]/5 border-2 border-[#8B1A3A]/20 rounded-2xl px-5 py-4 flex gap-4 items-center">
              <div className="w-12 h-12 rounded-xl bg-[#8B1A3A] flex items-center justify-center shrink-0">
                <span className="text-white text-xl">🏠</span>
              </div>
              <div>
                <p className="text-xs text-[#8B1A3A]/70 font-semibold uppercase tracking-wide">Casa compartida</p>
                <p className="text-base font-black text-gray-800">{casa.nombre}</p>
              </div>
            </div>

            {/* Tu nombre */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-gray-700">Tu nombre <span className="text-red-400">*</span></label>
              <input type="text" value={nombre}
                onChange={e => { setNombre(e.target.value); setError("") }}
                placeholder="¿Cómo te llamas?"
                className="border-2 border-gray-200 focus:border-[#8B1A3A] rounded-xl px-4 py-3 text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none transition-colors" />
            </div>

            {/* Color de avatar */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700">Tu color</label>
              <div className="flex items-center gap-3">
                <AvatarR nombre={nombre || "?"} colorIndex={colorIndex} size="lg" />
                <div className="grid grid-cols-8 gap-2 flex-1">
                  {COLORES_ROOMIES.map((c, i) => (
                    <button key={i} type="button" onClick={() => setColorIndex(i)}
                      className={`w-full aspect-square rounded-full ${c.bg} transition-all ${colorIndex === i ? "ring-2 ring-offset-2 ring-gray-600 scale-110" : "opacity-60 hover:opacity-100 hover:scale-105"}`} />
                  ))}
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <p className="text-xs text-red-500">⚠ {error}</p>
              </div>
            )}

            <div className="flex flex-col gap-3 pb-8">
              <button type="button" onClick={submit} disabled={cargando}
                className="w-full py-3.5 rounded-xl bg-[#8B1A3A] text-white font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-md shadow-[#8B1A3A]/25 disabled:opacity-60">
                {cargando ? "Uniéndose…" : "Unirme a la casa 🏠"}
              </button>
              <button type="button" onClick={onVolver} disabled={cargando}
                className="w-full py-3 rounded-xl border-2 border-gray-200 text-gray-500 font-semibold text-sm hover:border-gray-300 transition-colors">
                Cancelar
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
