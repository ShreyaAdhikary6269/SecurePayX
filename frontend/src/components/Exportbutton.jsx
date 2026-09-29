function DownloadIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <path d="M12 3v12m0 0 4.5-4.5M12 15 7.5 10.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function toCsv(rows, columns) {
  const cols = columns || (rows[0] ? Object.keys(rows[0]).map((key) => ({ key, label: key })) : [])
  const escape = (val) => {
    const s = val == null ? '' : String(val)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const header = cols.map((c) => escape(c.label)).join(',')
  const body = rows.map((row) => cols.map((c) => escape(row[c.key])).join(',')).join('\n')
  return `${header}\n${body}`
}

/**
 * "Download report" button — exports the given rows as a CSV file, entirely
 * client-side (no backend endpoint needed).
 *
 * Usage:
 *   <ExportButton
 *     data={transactions}
 *     filename="transactions"
 *     columns={[
 *       { key: 'id', label: 'Transaction ID' },
 *       { key: 'amount', label: 'Amount' },
 *       { key: 'paymentType', label: 'Payment type' },
 *       { key: 'fraudProbability', label: 'Fraud probability' },
 *       { key: 'isFraud', label: 'Flagged' },
 *       { key: 'createdAt', label: 'Date' },
 *     ]}
 *   />
 *
 * `columns` is optional — omit it to export every key found on the first row,
 * using the raw key names as headers.
 */
export default function ExportButton({ data = [], filename = 'report', columns, label = 'Download report' }) {
  const handleExport = () => {
    if (!data.length) return
    const csv = toCsv(data, columns)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const stamp = new Date().toISOString().slice(0, 10)
    link.href = url
    link.download = `${filename}-${stamp}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <button
      onClick={handleExport}
      disabled={!data.length}
      className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-ink border border-line rounded-lg hover:border-green hover:text-green disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-200"
    >
      <DownloadIcon />
      {label}
    </button>
  )
}