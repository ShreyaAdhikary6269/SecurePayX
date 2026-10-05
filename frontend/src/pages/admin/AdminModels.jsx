import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout'
import { adminGet } from '../../components/admin/AdminApi'
import { Badge, TYPE_LABELS, fmtDateTime } from '../../components/admin/AdminUi'

const ORDER = ['creditcard', 'paysim', 'banksim']

const fmt = (v) => (v == null ? '-' : Number(v).toFixed(3))

function Metric({ label, value }) {
  return (
    <div className="border border-line rounded-lg p-3 text-center">
      <div className="text-[11px] text-ink-muted mb-1">{label}</div>
      <div className="font-serif text-xl font-semibold text-ink">{fmt(value)}</div>
    </div>
  )
}

function ConfusionMatrix({ cm }) {
  const cell = 'p-3 rounded-lg text-center'
  return (
    <div className="grid grid-cols-3 gap-2 text-xs">
      <div />
      <div className="text-center text-ink-muted self-end">Predicted: cleared</div>
      <div className="text-center text-ink-muted self-end">Predicted: fraud</div>

      <div className="text-ink-muted self-center">Actual: legitimate</div>
      <div className={`${cell} bg-green-soft`}>
        <div className="font-serif text-lg font-semibold text-green">{cm.tn}</div>
        <div className="text-ink-muted">correct</div>
      </div>
      <div className={`${cell} bg-amber-50`}>
        <div className="font-serif text-lg font-semibold text-amber-700">{cm.fp}</div>
        <div className="text-ink-muted">false alarms</div>
      </div>

      <div className="text-ink-muted self-center">Actual: fraud</div>
      <div className={`${cell} bg-red-50`}>
        <div className="font-serif text-lg font-semibold text-red-700">{cm.fn}</div>
        <div className="text-ink-muted">missed</div>
      </div>
      <div className={`${cell} bg-green-soft`}>
        <div className="font-serif text-lg font-semibold text-green">{cm.tp}</div>
        <div className="text-ink-muted">caught</div>
      </div>
    </div>
  )
}

function ModelCard({ name, info }) {
  const m = info.metrics
  const hasMetrics = m && m.available
  const topMax = hasMetrics && m.top_features.length ? Math.max(...m.top_features.map((f) => f.importance), 0.0001) : 1

  return (
    <div className="bg-white border border-line rounded-xl shadow-sm p-6 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="font-serif text-lg font-semibold text-ink">{TYPE_LABELS[name] || name}</h2>
        <div className="flex flex-wrap gap-2">
          <Badge tone={info.trained ? 'green' : 'red'}>{info.trained ? 'Trained' : 'Not trained'}</Badge>
          {info.trained && (
            <Badge tone={info.calibrated ? 'green' : 'amber'}>{info.calibrated ? 'Calibrated' : 'Not calibrated'}</Badge>
          )}
          <Badge>Threshold {info.threshold}</Badge>
        </div>
      </div>

      {!info.trained && (
        <p className="text-sm text-ink-muted">
          This model has not been trained yet. Run <code className="px-1 bg-bg-subtle rounded">python main.py</code> in
          the ai-model folder. Checks for this payment type return an error until then.
        </p>
      )}

      {info.trained && !hasMetrics && (
        <p className="text-sm text-ink-muted">
          No saved metrics yet. Run <code className="px-1 bg-bg-subtle rounded">python export_metrics.py</code> in the
          ai-model folder, then refresh this page.
        </p>
      )}

      {hasMetrics && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-2">
            <Metric label="Precision" value={m.precision} />
            <Metric label="Recall" value={m.recall} />
            <Metric label="F1 score" value={m.f1} />
            <Metric label="PR-AUC" value={m.pr_auc} />
            <Metric label="ROC-AUC" value={m.roc_auc} />
          </div>
          <p className="text-xs text-ink-muted mb-6">
            {m.model} · measured on the {m.evaluated_on}: {m.test_rows} transactions, {m.test_frauds} frauds.
            {m.trained_at ? ` Model file saved ${fmtDateTime(m.trained_at)}.` : ''}
          </p>

          <div className="grid lg:grid-cols-2 gap-8">
            <div>
              <h3 className="text-sm font-medium text-ink mb-3">Confusion matrix</h3>
              <ConfusionMatrix cm={m.confusion_matrix} />
            </div>

            <div>
              <h3 className="text-sm font-medium text-ink mb-3">Most important features</h3>
              {m.top_features.length === 0 ? (
                <p className="text-sm text-ink-muted">Not available.</p>
              ) : (
                <div className="space-y-2">
                  {m.top_features.map((f) => (
                    <div key={f.feature}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-ink">{f.feature}</span>
                        <span className="text-ink-muted">{f.importance.toFixed(3)}</span>
                      </div>
                      <div className="h-1.5 bg-bg-subtle rounded-full overflow-hidden">
                        <div className="h-full bg-green rounded-full" style={{ width: `${(f.importance / topMax) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default function AdminModels() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const result = await adminGet('models', null, navigate)
      if (result) setData(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    load()
  }, [load])

  const names = data ? ORDER.filter((n) => data.models && data.models[n]) : []
  const running = data && data.status === 'running'

  return (
    <AdminLayout>
      <div className="flex items-start justify-between gap-4 mb-1">
        <h1 className="font-serif text-2xl text-ink">Models</h1>
        <button
          onClick={load}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-ink border border-line rounded-lg hover:border-green hover:text-green disabled:opacity-40 transition-colors"
        >
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>
      <p className="text-ink-muted mb-6">
        Status of the fraud models and their saved test results. Precision and recall are measured at the threshold
        the app really uses.
      </p>

      {error && <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>}

      {loading && !data && <p className="text-sm text-ink-muted">Loading model information…</p>}

      {data && (
        <div
          className={`mb-6 p-3 text-sm rounded-lg border flex flex-wrap items-center gap-2 ${
            running ? 'bg-green-soft border-green/20 text-green' : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${running ? 'bg-green' : 'bg-red-600'}`} />
          {running ? 'Model service is running.' : data.message || 'The model service is not reachable.'}
          {running && data.metrics_generated_at && (
            <span className="text-ink-muted">Metrics saved {fmtDateTime(data.metrics_generated_at)}.</span>
          )}
        </div>
      )}

      {names.map((name) => (
        <ModelCard key={name} name={name} info={data.models[name]} />
      ))}

      {data && !running && names.length === 0 && (
        <p className="text-sm text-ink-muted">
          Start the model service with <code className="px-1 bg-bg-subtle rounded">python api\app.py</code> in the
          ai-model folder, then refresh.
        </p>
      )}
    </AdminLayout>
  )
}