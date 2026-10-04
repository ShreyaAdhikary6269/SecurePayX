import { useEffect, useState } from 'react'

const TIERS = [
  { key: 'low', label: 'Low risk', from: 0, to: 0.3, color: '#059669' },
  { key: 'medium', label: 'Medium risk', from: 0.3, to: 0.7, color: '#F59E0B' },
  { key: 'high', label: 'High risk', from: 0.7, to: 1, color: '#DC2626' },
]

const CX = 100
const CY = 100
const R = 80

// Point on the half circle: p = 0 is the far left, p = 1 the far right.
function point(p, radius) {
  const angle = Math.PI * (1 - p)
  return [CX + radius * Math.cos(angle), CY - radius * Math.sin(angle)]
}

function arcPath(from, to) {
  const [x1, y1] = point(from, R)
  const [x2, y2] = point(to, R)
  return `M ${x1} ${y1} A ${R} ${R} 0 0 1 ${x2} ${y2}`
}

function toProbability(value) {
  if (value == null || Number.isNaN(Number(value))) return null
  return Math.min(Math.max(Number(value), 0), 1)
}

// Two decimals, with readable labels at the extreme ends
function formatPercent(p) {
  const pct = p * 100
  if (pct < 0.01) return '<0.01%'
  if (pct > 99.99) return '>99.99%'
  return `${pct.toFixed(2)}%`
}

/**
 * Half-circle risk meter.
 *   probability: fraud probability from 0 to 1 (the value the backend returns)
 *   isFraud:     optional boolean, shows the model's verdict under the meter
 *   threshold:   optional number from 0 to 1, the model's tuned fraud cutoff
 */
export default function RiskGauge({ probability, isFraud, threshold, className = '' }) {
  const p = toProbability(probability)
  const cutoff = toProbability(threshold)

  const [shown, setShown] = useState(0) // starts at 0 so the needle swings in

  useEffect(() => {
    const t = setTimeout(() => setShown(p ?? 0), 50)
    return () => clearTimeout(t)
  }, [p])

  if (p == null) return null

  const tier = TIERS.find((t) => p < t.to) || TIERS[2]
  const hasVerdict = typeof isFraud === 'boolean'
  const highButCleared = hasVerdict && !isFraud && tier.key === 'high'

  const cutoffText = cutoff != null ? `${(cutoff * 100).toFixed(1)}%` : null
  const [tickX1, tickY1] = cutoff != null ? point(cutoff, R - 11) : [0, 0]
  const [tickX2, tickY2] = cutoff != null ? point(cutoff, R + 9) : [0, 0]

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <svg
        viewBox="0 0 200 118"
        className="w-full max-w-[280px]"
        role="img"
        aria-label={`${tier.label}, ${formatPercent(p)}`}
      >
        <path d={arcPath(0, 1)} fill="none" stroke="#F0F0F0" strokeWidth="16" />
        {TIERS.map((t) => (
          <path key={t.key} d={arcPath(t.from, t.to)} fill="none" stroke={t.color} strokeWidth="14" />
        ))}

        {cutoff != null && (
          <line x1={tickX1} y1={tickY1} x2={tickX2} y2={tickY2} stroke="#111827" strokeWidth="2.5" strokeLinecap="round" />
        )}

        <g
          style={{
            transform: `rotate(${shown * 180}deg)`,
            transformOrigin: '100px 100px',
            transformBox: 'view-box',
            transition: 'transform 900ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          <line x1="100" y1="100" x2="32" y2="100" stroke="#1F2937" strokeWidth="3" strokeLinecap="round" />
        </g>
        <circle cx="100" cy="100" r="7" fill="#1F2937" />

        <text x="20" y="114" fontSize="9" textAnchor="middle" fill="#6B7280">0%</text>
        <text x="180" y="114" fontSize="9" textAnchor="middle" fill="#6B7280">100%</text>
      </svg>

      <div className="font-serif text-3xl font-semibold text-ink -mt-1">{formatPercent(p)}</div>
      <div className="text-sm font-semibold mt-1" style={{ color: tier.color }}>
        {tier.label}
      </div>

      {hasVerdict && (
        <div
          className={`mt-3 inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full ${
            isFraud ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-soft text-green border border-green/20'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${isFraud ? 'bg-red-600' : 'bg-green'}`} />
          {isFraud ? 'Flagged as fraud' : 'Cleared'}
        </div>
      )}

      {(hasVerdict || cutoff != null) && (
        <p className="mt-3 max-w-[280px] text-center text-xs text-ink-muted leading-relaxed">
          {cutoffText
            ? `Flagged only at or above the model's tuned threshold of ${cutoffText}.`
            : "Flagged only at or above the model's tuned threshold."}
          {highButCleared && ' This score is in the High zone but below that cutoff, so it was cleared.'}
        </p>
      )}

      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-4 text-[11px] text-ink-muted">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green" />Low under 30%</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" />Medium 30–70%</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-600" />High 70%+</span>
        {cutoff != null && (
          <span className="flex items-center gap-1.5"><span className="w-0.5 h-3 bg-gray-900" />Model threshold</span>
        )}
      </div>
    </div>
  )
}