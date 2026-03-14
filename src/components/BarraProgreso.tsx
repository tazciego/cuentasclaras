const PASOS = [
  "Crear evento",
  "Compartir QR",
  "Cargar consumos",
  "Vista en vivo",
  "Cobrar y cerrar",
]

export default function BarraProgreso({ pasoActual }: { pasoActual: number }) {
  return (
    <div className="w-full px-4 py-4 bg-white border-b border-gray-100">
      <div className="max-w-2xl mx-auto">
        {/* línea de progreso */}
        <div className="relative flex items-center justify-between mb-2">
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 bg-gray-200" />
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-[#534AB7] transition-all duration-300"
            style={{ width: `${((pasoActual - 1) / (PASOS.length - 1)) * 100}%` }}
          />
          {PASOS.map((_, i) => {
            const num = i + 1
            const activo = num === pasoActual
            const completado = num < pasoActual
            return (
              <div
                key={num}
                className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all
                  ${activo ? "bg-[#534AB7] border-[#534AB7] text-white shadow-md shadow-[#534AB7]/30" : ""}
                  ${completado ? "bg-[#534AB7] border-[#534AB7] text-white" : ""}
                  ${!activo && !completado ? "bg-white border-gray-300 text-gray-400" : ""}
                `}
              >
                {completado ? (
                  <svg viewBox="0 0 12 12" className="w-3 h-3" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  num
                )}
              </div>
            )
          })}
        </div>
        {/* etiquetas */}
        <div className="flex justify-between">
          {PASOS.map((label, i) => {
            const num = i + 1
            const activo = num === pasoActual
            const completado = num < pasoActual
            return (
              <span
                key={num}
                className={`text-[10px] text-center leading-tight w-14 transition-colors
                  ${activo ? "text-[#534AB7] font-bold" : ""}
                  ${completado ? "text-[#534AB7]/70 font-medium" : ""}
                  ${!activo && !completado ? "text-gray-400" : ""}
                `}
              >
                {label}
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}
