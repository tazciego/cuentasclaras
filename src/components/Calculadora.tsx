import { useState, useCallback } from "react"

// ─── Calculadora General ──────────────────────────────────────────────────────

type OpType = "+" | "-" | "×" | "÷" | null

function CalcGeneral() {
  const [display, setDisplay] = useState("0")
  const [prev, setPrev] = useState<number | null>(null)
  const [op, setOp] = useState<OpType>(null)
  const [esperando, setEsperando] = useState(false)

  const pushDigit = useCallback((d: string) => {
    setDisplay(cur => {
      if (esperando) { setEsperando(false); return d }
      if (cur === "0" && d !== ".") return d
      if (d === "." && cur.includes(".")) return cur
      return cur.length < 12 ? cur + d : cur
    })
  }, [esperando])

  const pushOp = useCallback((newOp: OpType) => {
    const n = parseFloat(display)
    if (prev !== null && op && !esperando) {
      const res = evalOp(prev, n, op)
      setDisplay(fmtRes(res))
      setPrev(res)
    } else {
      setPrev(n)
    }
    setOp(newOp)
    setEsperando(true)
  }, [display, prev, op, esperando])

  const igual = useCallback(() => {
    if (prev === null || !op) return
    const n = parseFloat(display)
    const res = evalOp(prev, n, op)
    setDisplay(fmtRes(res))
    setPrev(null)
    setOp(null)
    setEsperando(false)
  }, [display, prev, op])

  const clear = () => { setDisplay("0"); setPrev(null); setOp(null); setEsperando(false) }
  const backspace = () => {
    if (esperando) return
    setDisplay(d => {
      const next = d.length > 1 ? d.slice(0, -1) : "0"
      return next === "-" ? "0" : next
    })
  }
  const pct = () => setDisplay(d => fmtRes(parseFloat(d) / 100))

  const FILAS = [
    [{ label: "AC", action: clear, cls: "bg-gray-200 text-gray-700" },
     { label: "⌫", action: backspace, cls: "bg-gray-200 text-gray-700" },
     { label: "%", action: pct, cls: "bg-gray-200 text-gray-700" },
     { label: "÷", action: () => pushOp("÷"), cls: "bg-[#534AB7] text-white", isOp: true }],
    ["7","8","9", { label: "×", action: () => pushOp("×"), cls: "bg-[#534AB7] text-white", isOp: true }],
    ["4","5","6", { label: "−", action: () => pushOp("-"), cls: "bg-[#534AB7] text-white", isOp: true }],
    ["1","2","3", { label: "+", action: () => pushOp("+"), cls: "bg-[#534AB7] text-white", isOp: true }],
    [{ label: "0", wide: true, action: () => pushDigit("0"), cls: "bg-white border border-gray-200 text-gray-800" },
     { label: ".", action: () => pushDigit("."), cls: "bg-white border border-gray-200 text-gray-800" },
     { label: "=", action: igual, cls: "bg-[#534AB7] text-white", isOp: true }],
  ]

  return (
    <div className="flex flex-col gap-3">
      {/* Display */}
      <div className="bg-gray-50 rounded-xl px-4 py-3 text-right min-h-[3.5rem] flex flex-col items-end justify-end">
        {prev !== null && op && (
          <p className="text-xs text-gray-400">{fmtRes(prev)} {op}</p>
        )}
        <p className="text-3xl font-black text-gray-800 break-all leading-tight">
          {display}
        </p>
      </div>
      {/* Teclado */}
      <div className="flex flex-col gap-2">
        {FILAS.map((fila, fi) => (
          <div key={fi} className="grid gap-2" style={{ gridTemplateColumns: buildGrid(fila) }}>
            {fila.map((btn, bi) => {
              if (typeof btn === "string") {
                return (
                  <button key={bi} type="button"
                    onClick={() => pushDigit(btn)}
                    className="py-3.5 rounded-xl bg-white border border-gray-200 text-gray-800 font-bold text-lg hover:bg-gray-50 active:scale-95 transition-all">
                    {btn}
                  </button>
                )
              }
              return (
                <button key={bi} type="button"
                  onClick={btn.action}
                  className={`py-3.5 rounded-xl font-bold text-lg hover:opacity-90 active:scale-95 transition-all ${btn.cls ?? ""}
                    ${(btn as { isOp?: boolean }).isOp && op === btn.label ? "ring-2 ring-offset-1 ring-[#534AB7]/50" : ""}
                    ${"wide" in btn && btn.wide ? "col-span-2" : ""}`}>
                  {btn.label}
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

function buildGrid(fila: unknown[]) {
  // check if any item is wide
  const hasWide = fila.some(b => typeof b !== "string" && "wide" in (b as object))
  if (hasWide) return "2fr 1fr 1fr"
  return `repeat(${fila.length}, 1fr)`
}

function evalOp(a: number, b: number, op: OpType): number {
  if (op === "+") return a + b
  if (op === "-") return a - b
  if (op === "×") return a * b
  if (op === "÷") return b !== 0 ? a / b : 0
  return b
}

function fmtRes(n: number): string {
  if (!isFinite(n)) return "Error"
  const s = parseFloat(n.toFixed(10)).toString()
  return s
}

// ─── Dividir ──────────────────────────────────────────────────────────────────

function CalcDividir() {
  const [monto, setMonto] = useState("")
  const [personas, setPersonas] = useState(2)

  const montoNum = parseFloat(monto) || 0
  const porPersona = personas > 0 ? montoNum / personas : 0

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-gray-600">Monto total</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
          <input
            type="number"
            inputMode="decimal"
            value={monto}
            onChange={e => setMonto(e.target.value)}
            placeholder="0.00"
            className="w-full border-2 border-gray-200 rounded-xl pl-9 pr-4 py-3 text-lg font-bold text-gray-800 placeholder:text-gray-300 focus:outline-none focus:border-[#534AB7] transition-colors"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-gray-600">Número de personas</label>
        <div className="flex items-center gap-4">
          <button type="button"
            onClick={() => setPersonas(p => Math.max(1, p - 1))}
            className="w-12 h-12 rounded-xl border-2 border-gray-200 text-gray-600 text-2xl font-bold hover:border-[#534AB7] hover:text-[#534AB7] transition-colors flex items-center justify-center active:scale-95">
            −
          </button>
          <span className="flex-1 text-center text-3xl font-black text-gray-800">{personas}</span>
          <button type="button"
            onClick={() => setPersonas(p => Math.min(30, p + 1))}
            className="w-12 h-12 rounded-xl border-2 border-gray-200 text-gray-600 text-2xl font-bold hover:border-[#534AB7] hover:text-[#534AB7] transition-colors flex items-center justify-center active:scale-95">
            +
          </button>
        </div>
      </div>

      <div className="bg-[#534AB7]/5 border-2 border-[#534AB7]/20 rounded-2xl p-5 text-center">
        <p className="text-sm text-[#534AB7] font-semibold mb-1">Por persona</p>
        <p className="text-4xl font-black text-[#534AB7]">
          ${porPersona.toLocaleString("es-MX", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
        </p>
        {montoNum > 0 && (
          <p className="text-xs text-gray-400 mt-2">
            ${montoNum.toLocaleString("es-MX")} ÷ {personas} {personas === 1 ? "persona" : "personas"}
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Propina ──────────────────────────────────────────────────────────────────

function CalcPropina() {
  const [subtotal, setSubtotal] = useState("")
  const [pct, setPct] = useState(0)

  const sub = parseFloat(subtotal) || 0
  const propina = sub * (pct / 100)
  const total = sub + propina

  const OPCIONES = [0, 5, 10, 15, 20]

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-gray-600">Subtotal</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
          <input
            type="number"
            inputMode="decimal"
            value={subtotal}
            onChange={e => setSubtotal(e.target.value)}
            placeholder="0.00"
            className="w-full border-2 border-gray-200 rounded-xl pl-9 pr-4 py-3 text-lg font-bold text-gray-800 placeholder:text-gray-300 focus:outline-none focus:border-[#534AB7] transition-colors"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-gray-600">Propina</label>
        <div className="grid grid-cols-5 gap-1.5">
          {OPCIONES.map(o => (
            <button key={o} type="button"
              onClick={() => setPct(o)}
              className={`py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                pct === o
                  ? "border-[#534AB7] bg-[#534AB7] text-white"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}>
              {o === 0 ? "Sin" : `${o}%`}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-xs text-gray-400 w-6 text-right">0%</span>
          <input
            type="range" min={0} max={30} step={1} value={pct}
            onChange={e => setPct(Number(e.target.value))}
            className="flex-1 h-2 rounded-full appearance-none cursor-pointer"
            style={{ accentColor: "#534AB7" }}
          />
          <span className="text-xs text-gray-400 w-8">30%</span>
        </div>
        <p className="text-center text-xs font-bold text-[#534AB7]">{pct}%</p>
      </div>

      <div className="bg-[#534AB7]/5 border-2 border-[#534AB7]/20 rounded-2xl p-5">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-500">Subtotal</span>
          <span className="font-semibold text-gray-800">${sub.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
        {pct > 0 && (
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-500">Propina ({pct}%)</span>
            <span className="font-semibold text-gray-800">${propina.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        )}
        <div className="border-t border-[#534AB7]/20 pt-2 flex justify-between">
          <span className="font-bold text-[#534AB7]">Total</span>
          <span className="text-2xl font-black text-[#534AB7]">
            ${total.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────

type Tab = "general" | "dividir" | "propina"

const TABS: { key: Tab; label: string; emoji: string }[] = [
  { key: "general", label: "General", emoji: "🧮" },
  { key: "dividir", label: "Dividir", emoji: "➗" },
  { key: "propina", label: "Propina", emoji: "💰" },
]

// ─── Componente principal ─────────────────────────────────────────────────────

export default function Calculadora() {
  const [abierta, setAbierta] = useState(false)
  const [tab, setTab] = useState<Tab>("general")

  return (
    <>
      {/* FAB */}
      <button
        type="button"
        onClick={() => setAbierta(true)}
        aria-label="Abrir calculadora"
        style={{ position: "fixed", bottom: "24px", right: "20px", zIndex: 9999 }}
        className="w-14 h-14 rounded-2xl bg-[#534AB7] text-white shadow-xl shadow-[#534AB7]/40 flex items-center justify-center hover:opacity-90 active:scale-95 transition-all"
      >
        {/* Calculator icon: display bar + 3×3 grid of keys */}
        <svg viewBox="0 0 28 28" className="w-7 h-7" fill="currentColor">
          <rect x="4" y="2" width="20" height="24" rx="3" fill="white" fillOpacity="0.2" />
          {/* Display */}
          <rect x="6" y="4" width="16" height="6" rx="1.5" fill="white" fillOpacity="0.9" />
          {/* Row 1 keys */}
          <rect x="6" y="12" width="4" height="4" rx="1" fill="white" fillOpacity="0.7" />
          <rect x="12" y="12" width="4" height="4" rx="1" fill="white" fillOpacity="0.7" />
          <rect x="18" y="12" width="4" height="4" rx="1" fill="white" fillOpacity="0.9" />
          {/* Row 2 keys */}
          <rect x="6" y="18" width="4" height="4" rx="1" fill="white" fillOpacity="0.7" />
          <rect x="12" y="18" width="4" height="4" rx="1" fill="white" fillOpacity="0.7" />
          <rect x="18" y="18" width="4" height="4" rx="1" fill="white" fillOpacity="0.9" />
        </svg>
      </button>

      {/* Overlay + modal */}
      {abierta && (
        <div
          style={{ zIndex: 10000 }}
          className="fixed inset-0 flex items-end sm:items-center justify-center bg-black/50 px-0 sm:px-4"
          onClick={e => { if (e.target === e.currentTarget) setAbierta(false) }}
        >
          <div className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
            {/* Header del modal */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#534AB7] flex items-center justify-center">
                  <span className="text-white font-black text-[10px]">CC</span>
                </div>
                <span className="font-black text-gray-800">Calculadora</span>
              </div>
              <button type="button" onClick={() => setAbierta(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
                <svg viewBox="0 0 20 20" className="w-4 h-4" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100 px-5 pt-3 gap-1">
              {TABS.map(t => (
                <button key={t.key} type="button"
                  onClick={() => setTab(t.key)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-t-xl text-sm font-bold transition-all border-b-2 -mb-px ${
                    tab === t.key
                      ? "border-[#534AB7] text-[#534AB7]"
                      : "border-transparent text-gray-400 hover:text-gray-600"
                  }`}>
                  <span>{t.emoji}</span> {t.label}
                </button>
              ))}
            </div>

            {/* Contenido del tab */}
            <div className="flex-1 overflow-y-auto p-5">
              {tab === "general" && <CalcGeneral />}
              {tab === "dividir" && <CalcDividir />}
              {tab === "propina" && <CalcPropina />}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
