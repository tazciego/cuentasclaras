// Reusable falling-confetti animation component

const FORMAS = ["rounded-full", "rounded-sm", "rotate-45 rounded-sm"]

interface Pieza {
  left: string
  delay: string
  duration: string
  color: string
  width: string
  height: string
  forma: string
}

function generarPiezas(colores: string[], cantidad: number): Pieza[] {
  return Array.from({ length: cantidad }, (_, i) => ({
    left:     `${(i * 7 + 3) % 100}%`,
    delay:    `${((i * 0.13) % 1.8).toFixed(2)}s`,
    duration: `${(2.2 + (i % 5) * 0.3).toFixed(1)}s`,
    color:    colores[i % colores.length],
    width:    `${7 + (i % 3) * 5}px`,
    height:   `${5 + (i % 4) * 4}px`,
    forma:    FORMAS[i % FORMAS.length],
  }))
}

export default function Confetti({
  colores = ["#534AB7", "#2EC4B6", "#8B1A3A", "#FFD166", "#F4A261", "#06D6A0"],
  cantidad = 50,
}: {
  colores?: string[]
  cantidad?: number
}) {
  const piezas = generarPiezas(colores, cantidad)

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(-20px) rotate(0deg);   opacity: 1; }
          80%  { opacity: 1; }
          100% { transform: translateY(105vh) rotate(540deg); opacity: 0; }
        }
        @keyframes confettiSway {
          0%,100% { margin-left: 0; }
          50%      { margin-left: 30px; }
        }
      `}</style>
      {piezas.map((p, i) => (
        <div
          key={i}
          className={p.forma}
          style={{
            position: "absolute",
            left: p.left,
            top: "-24px",
            width: p.width,
            height: p.height,
            backgroundColor: p.color,
            animation: `confettiFall ${p.duration} ${p.delay} ease-in forwards, confettiSway ${p.duration} ${p.delay} ease-in-out infinite`,
          }}
        />
      ))}
    </div>
  )
}
