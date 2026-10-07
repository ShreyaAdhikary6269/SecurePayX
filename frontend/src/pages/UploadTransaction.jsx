import React, { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from './Dashboardlayout'
import creditcardSamples from '../data/creditcardSamples.json'

const API = 'http://localhost:5000'
const MAX_BYTES = 5 * 1024 * 1024
const PAGE_SIZE = 25
const ALLOWED = ['.csv', '.txt', '.tsv', '.xlsx', '.xlsm']
const CARD_SHADOW = '0 1px 2px rgba(6,40,28,.05), 0 10px 30px -14px rgba(6,40,28,.16)'

const TYPE_OPTIONS = [
  { value: 'auto', label: 'Detect automatically' },
  { value: 'creditcard', label: 'Credit / debit card' },
  { value: 'paysim', label: 'Mobile wallet / UPI' },
  { value: 'banksim', label: 'Banking' },
]

const FORMATS = [
  {
    title: 'Credit / debit card',
    columns: 'Time, V1 to V28, Amount',
    note: 'Optional label column: Class (0 or 1)',
  },
  {
    title: 'Mobile wallet / UPI',
    columns: 'type, amount, oldbalanceOrg, newbalanceOrig, oldbalanceDest, newbalanceDest',
    note: 'type is TRANSFER, CASH_OUT, CASH_IN, PAYMENT or DEBIT. Optional label column: isFraud',
  },
  {
    title: 'Banking',
    columns: 'age, gender, category, amount',
    note: 'age is a bracket 0 to 6, category like es_travel. Optional label column: fraud',
  },
]

// Illustrative rows (no labels), so you can test the wallet and banking models quickly
const PAYSIM_SAMPLE = [
  ['TRANSFER', 181000, 181000, 0, 0, 0],
  ['CASH_OUT', 181000, 181000, 0, 21182, 0],
  ['PAYMENT', 1500, 20000, 18500, 0, 0],
  ['PAYMENT', 320.5, 5400, 5079.5, 0, 0],
  ['CASH_IN', 25000, 10000, 35000, 500000, 475000],
  ['TRANSFER', 9500, 50000, 40500, 12000, 21500],
  ['CASH_OUT', 250000, 250000, 0, 0, 250000],
  ['DEBIT', 800, 12000, 11200, 0, 0],
]
const BANKSIM_SAMPLE = [
  [3, 'F', 'es_travel', 2500],
  [3, 'F', 'es_transportation', 25],
  [2, 'M', 'es_leisure', 1800],
  [4, 'F', 'es_food', 45.2],
  [5, 'M', 'es_hotelservices', 950],
  [3, 'M', 'es_health', 120],
  [2, 'F', 'es_sportsandtoys', 640],
  [4, 'M', 'es_wellnessandbeauty', 300],
]

/* ---------- helpers ---------- */
function csvCell(value) {
  let s = value == null ? '' : String(value)
  if (/^[=+\-@]/.test(s)) s = `'${s}`
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function toCsv(header, rows) {
  return [header.map(csvCell).join(','), ...rows.map((r) => r.map(csvCell).join(','))].join('\n')
}

function downloadText(filename, text) {
  const blob = new Blob([text], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function formatPercent(p) {
  if (p == null || Number.isNaN(Number(p))) return '-'
  const pct = Number(p) * 100
  if (pct < 0.01) return '<0.01%'
  if (pct > 99.99) return '>99.99%'
  return `${pct.toFixed(2)}%`
}

function formatValue(v) {
  if (v == null) return '-'
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : v.toFixed(2)
  return String(v)
}

function formatSize(bytes) {
  return bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(0)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function creditSampleCsv() {
  const pool =
    creditcardSamples.mixed && creditcardSamples.mixed.length
      ? creditcardSamples.mixed
      : [...(creditcardSamples.fraud || []), ...(creditcardSamples.safe || [])]
  const vNames = Array.from({ length: 28 }, (_, i) => `V${i + 1}`)
  const header = ['Time', ...vNames, 'Amount', 'Class']
  const rows = pool.map((r) => [r.Time, ...vNames.map((v) => r[v]), r.Amount, r._actual ?? ''])
  return toCsv(header, rows)
}

const RISK_STYLES = {
  low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  high: 'bg-rose-50 text-rose-700 border-rose-200',
}

function Pill({ className, children }) {
  return <span className={`inline-block px-2 py-0.5 text-xs font-medium border rounded-full ${className}`}>{children}</span>
}

function StatCard({ label, value, hint, tone }) {
  const color = tone === 'danger' ? 'text-rose-600' : 'text-ink'
  return (
    <div className="rounded-2xl border border-line bg-white/85 p-5 backdrop-blur" style={{ boxShadow: CARD_SHADOW }}>
      <div className="text-xs font-medium text-ink-muted mb-2">{label}</div>
      <div className={`font-serif text-3xl font-semibold ${color}`}>{value}</div>
      {hint && <div className="text-xs text-ink-muted mt-1">{hint}</div>}
    </div>
  )
}

/* ---------- page ---------- */
export default function UploadTransaction() {
  const navigate = useNavigate()
  const inputRef = useRef(null)

  const [file, setFile] = useState(null)
  const [paymentType, setPaymentType] = useState('auto')
  const [saveFlagged, setSaveFlagged] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(1)

  const pickFile = (f) => {
    if (!f) return
    const ext = `.${f.name.split('.').pop().toLowerCase()}`
    if (!ALLOWED.includes(ext)) {
      setError('Unsupported file type. Upload a .csv or .xlsx file.')
      return
    }
    if (f.size > MAX_BYTES) {
      setError('The file is too large. The maximum is 5 MB.')
      return
    }
    setFile(f)
    setError('')
    setResult(null)
  }

  const analyze = async () => {
    if (!file || loading) return
    setLoading(true)
    setError('')
    setResult(null)

    const token = localStorage.getItem('token')
    const form = new FormData()
    form.append('file', file)
    form.append('paymentType', paymentType)
    form.append('saveFlagged', saveFlagged ? 'true' : 'false')

    try {
      const res = await fetch(`${API}/api/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      })

      if (res.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        navigate('/login')
        return
      }

      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.message || 'Could not analyse this file')

      setResult(data)
      setFilter('all')
      setPage(1)
    } catch (err) {
      setError(
        err instanceof TypeError ? 'Could not reach the server. Make sure the backend is running.' : err.message
      )
    } finally {
      setLoading(false)
    }
  }

  const rows = result ? result.rows : []
  const filtered = useMemo(() => {
    if (filter === 'flagged') return rows.filter((r) => r.isFraud)
    if (filter === 'invalid') return rows.filter((r) => !r.valid)
    return rows
  }, [rows, filter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const shown = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const fieldKeys = rows.length ? Object.keys(rows[0].fields) : []
  const hasActual = rows.some((r) => r.actual != null)

  const downloadResults = () => {
    const header = [
      'Row',
      ...fieldKeys,
      'Fraud probability (%)',
      'Risk',
      'Verdict',
      ...(hasActual ? ['Actual label'] : []),
      'Note',
    ]
    const body = rows.map((r) => [
      r.row,
      ...fieldKeys.map((k) => (r.fields[k] == null ? '' : r.fields[k])),
      r.probability == null ? '' : (r.probability * 100).toFixed(4),
      r.risk || '',
      r.valid ? (r.isFraud ? 'Flagged' : 'Cleared') : 'Skipped',
      ...(hasActual ? [r.actual == null ? '' : r.actual === 1 ? 'Fraud' : 'Legitimate'] : []),
      r.valid ? '' : 'Row could not be read',
    ])
    const base = (result.fileName || 'results').replace(/\.[^.]+$/, '')
    downloadText(`${base}-fraud-results.csv`, toCsv(header, body))
  }

  const s = result ? result.summary : null
  const m = s ? s.metrics : null

  return (
    <DashboardLayout>
      <h1 className="font-serif text-2xl text-ink mb-1">Batch upload</h1>
      <p className="text-ink-muted mb-6 max-w-2xl">
        Upload a spreadsheet with many transactions. Your trained model scores every row, and you can download the
        results. No model is perfect: it will miss some fraud and flag some good transactions, which is why each row
        shows a probability.
      </p>

      {/* Upload card */}
      <div className="rounded-2xl border border-line bg-white/85 p-6 backdrop-blur mb-6" style={{ boxShadow: CARD_SHADOW }}>
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            pickFile(e.dataTransfer.files && e.dataTransfer.files[0])
          }}
          onClick={() => inputRef.current && inputRef.current.click()}
          className={`cursor-pointer rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-all duration-200 ${
            dragging ? 'border-green bg-green-soft scale-[1.01]' : 'border-line hover:border-green/50 hover:bg-green-soft/40'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.txt,.tsv,.xlsx,.xlsm"
            className="hidden"
            onChange={(e) => {
              pickFile(e.target.files && e.target.files[0])
              e.target.value = ''
            }}
          />
          <div className="mx-auto mb-3 w-12 h-12 rounded-2xl bg-green-soft text-green flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 16V4" />
              <path d="m7 9 5-5 5 5" />
              <path d="M4 20h16" />
            </svg>
          </div>
          {file ? (
            <>
              <p className="text-sm font-medium text-ink">{file.name}</p>
              <p className="text-xs text-ink-muted mt-1">{formatSize(file.size)} · click to choose a different file</p>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-ink">Drop a file here, or click to browse</p>
              <p className="text-xs text-ink-muted mt-1">.csv or .xlsx, up to 5 MB and 5,000 rows</p>
            </>
          )}
        </div>

        <div className="mt-5 flex flex-wrap items-end gap-5">
          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1.5">Payment type</label>
            <select
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value)}
              className="px-3 py-2 text-sm border border-line rounded-lg bg-white focus:outline-none focus:border-green"
            >
              {TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm text-ink cursor-pointer select-none pb-2">
            <input
              type="checkbox"
              checked={saveFlagged}
              onChange={(e) => setSaveFlagged(e.target.checked)}
              className="w-4 h-4 accent-emerald-600"
            />
            Save flagged rows to my alerts (up to 200)
          </label>

          <button
            onClick={analyze}
            disabled={!file || loading}
            className="ml-auto px-6 py-2.5 text-sm font-medium text-white bg-green hover:bg-green-strong rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Analysing…' : 'Analyse file'}
          </button>
        </div>

        {error && (
          <div role="alert" className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg">
            {error}
          </div>
        )}
      </div>

      {/* Formats and samples */}
      {!result && (
        <div className="rounded-2xl border border-line bg-white/85 p-6 backdrop-blur mb-6" style={{ boxShadow: CARD_SHADOW }}>
          <h2 className="font-serif text-lg font-semibold text-ink mb-1">What the file should contain</h2>
          <p className="text-xs text-ink-muted mb-4">
            The first row holds the column names. Column names are not case sensitive.
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            {FORMATS.map((f) => (
              <div key={f.title} className="rounded-xl border border-line p-4 bg-white/70">
                <div className="text-sm font-semibold text-ink mb-1">{f.title}</div>
                <div className="text-xs text-ink mb-2 break-words">{f.columns}</div>
                <div className="text-xs text-ink-muted">{f.note}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 mt-5">
            <span className="text-xs text-ink-muted self-center mr-1">Try a sample file:</span>
            <button
              onClick={() => downloadText('sample-creditcard.csv', creditSampleCsv())}
              className="px-3 py-1.5 text-xs font-medium text-green border border-green/30 bg-white hover:bg-green hover:text-white rounded-full transition-colors"
            >
              Credit card (with true labels)
            </button>
            <button
              onClick={() =>
                downloadText(
                  'sample-wallet.csv',
                  toCsv(['type', 'amount', 'oldbalanceOrg', 'newbalanceOrig', 'oldbalanceDest', 'newbalanceDest'], PAYSIM_SAMPLE)
                )
              }
              className="px-3 py-1.5 text-xs font-medium text-green border border-green/30 bg-white hover:bg-green hover:text-white rounded-full transition-colors"
            >
              Wallet / UPI
            </button>
            <button
              onClick={() => downloadText('sample-banking.csv', toCsv(['age', 'gender', 'category', 'amount'], BANKSIM_SAMPLE))}
              className="px-3 py-1.5 text-xs font-medium text-green border border-green/30 bg-white hover:bg-green hover:text-white rounded-full transition-colors"
            >
              Banking
            </button>
          </div>
          <p className="text-xs text-ink-muted mt-3">
            The wallet and banking samples are illustrative rows made for testing. The credit card sample comes from
            real test data and includes the true answers.
          </p>
          <p className="text-xs text-ink-muted mt-3">Screenshots and images are not supported yet; they are the next step.</p>
        </div>
      )}

      {/* Results */}
      {result && s && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="font-serif text-lg font-semibold text-ink">Results for {result.fileName}</h2>
              <p className="text-xs text-ink-muted">
                {result.label} · threshold {s.threshold}
                {s.calibrated ? ' (calibrated)' : ''}
                {result.saved > 0 ? ` · ${result.saved} flagged rows saved to your alerts` : ''}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={downloadResults}
                className="px-4 py-2 text-sm font-medium text-white bg-green hover:bg-green-strong rounded-xl transition-colors"
              >
                Download results
              </button>
              <button
                onClick={() => {
                  setResult(null)
                  setFile(null)
                }}
                className="px-4 py-2 text-sm font-medium text-ink border border-line rounded-xl hover:border-green hover:text-green transition-colors"
              >
                New file
              </button>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              label="Rows analysed"
              value={s.validRows}
              hint={s.invalidRows > 0 ? `${s.invalidRows} skipped (could not be read)` : 'All rows were readable'}
            />
            <StatCard label="Flagged as fraud" value={s.flagged} tone="danger" hint={`${s.flagRate}% of rows`} />
            <StatCard label="Average probability" value={formatPercent(s.avgProbability)} />
            <StatCard label="Threshold used" value={s.threshold} hint={s.calibrated ? 'Calibrated model' : 'Tuned threshold'} />
          </div>

          {m && (
            <div className="rounded-2xl border border-line bg-white/85 p-6 backdrop-blur mb-6" style={{ boxShadow: CARD_SHADOW }}>
              <h3 className="font-serif text-lg font-semibold text-ink mb-1">How the model did on your file</h3>
              <p className="text-xs text-ink-muted mb-4">
                Your file included the true answers, so the model's verdicts were compared against them.
              </p>
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    ['Precision', m.precision],
                    ['Recall', m.recall],
                    ['F1 score', m.f1],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl border border-line p-3 text-center">
                      <div className="text-[11px] text-ink-muted mb-1">{label}</div>
                      <div className="font-serif text-xl font-semibold text-ink">{Number(value).toFixed(3)}</div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-xl bg-green-soft p-3 text-center">
                    <div className="font-serif text-lg font-semibold text-green">{m.tp}</div>
                    <div className="text-ink-muted">fraud caught</div>
                  </div>
                  <div className="rounded-xl bg-rose-50 p-3 text-center">
                    <div className="font-serif text-lg font-semibold text-rose-600">{m.fn}</div>
                    <div className="text-ink-muted">fraud missed</div>
                  </div>
                  <div className="rounded-xl bg-amber-50 p-3 text-center">
                    <div className="font-serif text-lg font-semibold text-amber-700">{m.fp}</div>
                    <div className="text-ink-muted">false alarms</div>
                  </div>
                  <div className="rounded-xl bg-green-soft p-3 text-center">
                    <div className="font-serif text-lg font-semibold text-green">{m.tn}</div>
                    <div className="text-ink-muted">correctly cleared</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2 mb-4">
            {[
              ['all', `All rows (${rows.length})`],
              ['flagged', `Flagged (${s.flagged})`],
              ...(s.invalidRows > 0 ? [['invalid', `Skipped (${s.invalidRows})`]] : []),
            ].map(([id, label]) => (
              <button
                key={id}
                onClick={() => {
                  setFilter(id)
                  setPage(1)
                }}
                className={`px-3.5 py-1.5 text-sm border rounded-full transition-colors ${
                  filter === id ? 'border-green text-green bg-green-soft' : 'border-line text-ink-muted hover:text-ink'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-line bg-white/85 backdrop-blur overflow-hidden" style={{ boxShadow: CARD_SHADOW }}>
            {shown.length === 0 ? (
              <p className="text-sm text-ink-muted text-center py-12">No rows match this filter.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line text-left text-ink-muted bg-bg-subtle/60">
                      <th className="px-4 py-3 font-normal">Row</th>
                      {fieldKeys.map((k) => (
                        <th key={k} className="px-4 py-3 font-normal">
                          {k}
                        </th>
                      ))}
                      <th className="px-4 py-3 font-normal">Probability</th>
                      <th className="px-4 py-3 font-normal">Risk</th>
                      <th className="px-4 py-3 font-normal">Verdict</th>
                      {hasActual && <th className="px-4 py-3 font-normal">Actual</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {shown.map((r) => (
                      <tr key={r.row} className="hover:bg-green-soft/30 transition-colors">
                        <td className="px-4 py-3 text-ink-muted">{r.row}</td>
                        {fieldKeys.map((k) => (
                          <td key={k} className="px-4 py-3 text-ink">
                            {formatValue(r.fields[k])}
                          </td>
                        ))}
                        <td className="px-4 py-3 text-ink-muted">{formatPercent(r.probability)}</td>
                        <td className="px-4 py-3">
                          {r.risk ? <Pill className={RISK_STYLES[r.risk]}>{r.risk}</Pill> : <span className="text-ink-muted">-</span>}
                        </td>
                        <td className="px-4 py-3">
                          {!r.valid ? (
                            <Pill className="bg-bg-subtle text-ink-muted border-line">Skipped</Pill>
                          ) : r.isFraud ? (
                            <Pill className="bg-rose-50 text-rose-700 border-rose-200">Flagged</Pill>
                          ) : (
                            <Pill className="bg-green-soft text-green border-green/20">Cleared</Pill>
                          )}
                        </td>
                        {hasActual && (
                          <td className="px-4 py-3 text-ink-muted">
                            {r.actual == null ? '-' : r.actual === 1 ? 'Fraud' : 'Legitimate'}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {filtered.length > PAGE_SIZE && (
              <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-line text-sm">
                <span className="text-ink-muted">
                  Page {page} of {totalPages} · {filtered.length} rows
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="px-3 py-1.5 text-xs font-medium text-ink border border-line rounded-md hover:border-green hover:text-green disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="px-3 py-1.5 text-xs font-medium text-ink border border-line rounded-md hover:border-green hover:text-green disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </DashboardLayout>
  )
}