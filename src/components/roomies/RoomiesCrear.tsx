import { useState } from "react"
import type { SesionRoomies } from "./RoomiesFlow"
import { COLORES_ROOMIES, HeaderRoomies, AvatarR } from "./RoomiesFlow"
import { crearEvento, unirseAEvento, ApiError } from "../../api"

interface Props {
  onVolver: () => void
  onCreado: (sesion: SesionRoomies) => void
}

export default function RoomiesCrear({ onVolver, onCreado }: Props) {
  const [nombreCasa, setNombreCasa] = useState("")
  const [tuNombre, setTuNombre]     = useState("")
  const [colorIndex, setColorIndex] = useState(0)
  const [error, setError]           = useState("")
  const [cargando, setCargando]     = useState(false)

  const submit = async () => {
    if (!nombreCasa.trim()) { setError("El nombre de la casa es obligatorio."); return }
    if (!tuNombre.trim())   { setError("Tu nombre es obligatorio."); return }
    setError("")
    setCargando(true)
    try {
      const { id: eventoId, codigo } = await crearEvento({ nombre: nombreCasa.trim(), tipo: "roomies" })
      const inv = await unirseAEvento({ codigo, nombre: tuNombre.trim(), color_index: colorIndex, es_anfitrion: 1 })
      onCreado({
        casaId: Number(eventoId),
        casaCodigo: codigo,
        casaNombre: nombreCasa.trim(),
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
          <h1 className="text-2xl font-black text-gray-800">Nueva casa compartida</h1>
          <p className="text-gray-400 text-sm mt-1">Lleva el control de los gastos del hogar con tus roomies.</p>
        </div>

        {/* Nombre de la casa */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-gray-700">Nombre de la casa <span className="text-red-400">*</span></label>
          <input type="text" value={nombreCasa}
            onChange={e => { setNombreCasa(e.target.value); setError("") }}
            placeholder="Ej. Casa Condesa, Depa Roma Norte…"
            className="border-2 border-gray-200 focus:border-[#8B1A3A] rounded-xl px-4 py-3 text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none transition-colors" />
        </div>

        {/* Tu nombre */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-gray-700">Tu nombre <span className="text-red-400">*</span></label>
          <input type="text" value={tuNombre}
            onChange={e => { setTuNombre(e.target.value); setError("") }}
            placeholder="¿Cómo te llamas?"
            className="border-2 border-gray-200 focus:border-[#8B1A3A] rounded-xl px-4 py-3 text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none transition-colors" />
        </div>

        {/* Color de avatar */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-700">Tu color</label>
          <div className="flex items-center gap-3">
            <AvatarR nombre={tuNombre || "?"} colorIndex={colorIndex} size="lg" />
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

        {/* Aviso invitación */}
        <div className="flex items-start gap-2 bg-[#8B1A3A]/5 border border-[#8B1A3A]/20 rounded-xl px-4 py-3">
          <span className="text-base">💡</span>
          <p className="text-xs text-[#8B1A3A]/80 leading-relaxed">
            Después de crear la casa, podrás invitar a tus roomies con un código o link.
          </p>
        </div>

        {/* CTA */}
        <div className="flex flex-col gap-3 pb-8">
          <button type="button" onClick={submit} disabled={cargando}
            className="w-full py-3.5 rounded-xl bg-[#8B1A3A] text-white font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-md shadow-[#8B1A3A]/25 disabled:opacity-60">
            {cargando ? "Creando casa…" : "Crear casa compartida 🏠"}
          </button>
          <button type="button" onClick={onVolver} disabled={cargando}
            className="w-full py-3 rounded-xl border-2 border-gray-200 text-gray-500 font-semibold text-sm hover:border-gray-300 transition-colors">
            Cancelar
          </button>
        </div>
      </main>
    </div>
  )
}
