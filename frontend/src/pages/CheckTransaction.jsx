
import React, { useState } from 'react';
import DashboardLayout from './Dashboardlayout';
import RiskGauge from '../components/Riskgauge';
import creditcardSamples from '../data/creditcardSamples.json';

const PAYMENT_TYPES = [
  { 
    id: 'creditcard', 
    label: 'Credit / Debit card', 
    desc: 'Card-present or card-not-present transactions.' 
  },
  { 
    id: 'paysim', 
    label: 'Mobile wallet / UPI', 
    desc: 'Wallet transfers, cash-out, and UPI-style payments.' 
  },
  { 
    id: 'banksim', 
    label: 'Banking', 
    desc: 'Bank transactions across different merchant categories.' 
  },
];

const SAMPLE_BUTTONS = [
  {
    kind: 'mixed',
    label: 'Load random real transaction',
    info: 'Random real test transaction loaded.',
    className: 'text-slate-700 bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm',
  },
  {
    kind: 'fraud',
    label: 'Load sample fraud transaction',
    info: 'Fraud sample loaded.',
    className: 'text-rose-700 bg-rose-50/80 border-rose-200 hover:bg-rose-100 shadow-sm',
  },
  {
    kind: 'borderline',
    label: 'Load sample borderline transaction',
    info: 'Borderline sample loaded (the model is unsure).',
    className: 'text-amber-700 bg-amber-50/80 border-amber-200 hover:bg-amber-100 shadow-sm',
  },
  {
    kind: 'safe',
    label: 'Load sample safe transaction',
    info: 'Safe sample loaded.',
    className: 'text-emerald-700 bg-emerald-50/80 border-emerald-200 hover:bg-emerald-100 shadow-sm',
  },
];

function CreditCardForm({ values, onChange, onLoadSample, sampleInfo }) {
  return (
    <div className="space-y-5">
      <div>
        <label className="block text-xs font-normal uppercase tracking-wider text-slate-400 mb-2.5">
          Test Datasets & Samples
        </label>
        <div className="flex flex-wrap gap-2.5">
          {SAMPLE_BUTTONS.filter((b) => (creditcardSamples[b.kind] || []).length > 0).map((b) => (
            <button
              key={b.kind}
              type="button"
              onClick={() => onLoadSample(b)}
              className={`px-3.5 py-2 text-xs font-normal border rounded-xl transition-all duration-200 active:scale-[0.98] ${b.className}`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {sampleInfo && (
        <div className="flex items-start gap-2.5 px-4 py-3 bg-emerald-50/60 border border-emerald-200/80 rounded-xl text-xs text-emerald-900 leading-relaxed font-normal">
          <svg className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
          <div><span className="font-medium">{sampleInfo}</span> V1–V28 were filled in from real test data.</div>
        </div>
      )}

      <div>
        <label className="block text-sm font-normal text-slate-700 mb-1.5">Amount</label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
          <input
            type="number"
            step="0.01"
            value={values.Amount}
            onChange={(e) => onChange('Amount', e.target.value)}
            className="w-full pl-8 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm font-normal focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 transition-all shadow-sm"
            placeholder="149.62"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-normal text-slate-700 mb-1.5">
          Time <span className="text-xs font-normal text-slate-400">(seconds since first transaction)</span>
        </label>
        <input
          type="number"
          value={values.Time}
          onChange={(e) => onChange('Time', e.target.value)}
          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm font-normal focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 transition-all shadow-sm"
          placeholder="0"
        />
      </div>

      <div className="p-4 bg-slate-50/80 border border-slate-200/60 rounded-xl text-xs text-slate-500 leading-relaxed font-normal">
        <span className="font-medium text-slate-700">Note:</span> This model also uses 28 anonymized behavioral features (V1-V28) that aren't meaningful to enter by hand. Without a sample, they are set to 0, so every manual check looks like an average transaction. Use the sample buttons above to test with real examples from the test set.
      </div>
    </div>
  );
}

function WalletForm({ values, onChange }) {
  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-normal text-slate-700 mb-1.5">Transaction type</label>
        <select
          value={values.type}
          onChange={(e) => onChange('type', e.target.value)}
          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm font-normal focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 transition-all shadow-sm cursor-pointer"
        >
          <option value="TRANSFER">Transfer</option>
          <option value="CASH_OUT">Cash out</option>
          <option value="CASH_IN">Cash in</option>
          <option value="PAYMENT">Payment</option>
          <option value="DEBIT">Debit</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-normal text-slate-700 mb-1.5">Amount</label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
          <input
            type="number"
            step="0.01"
            value={values.amount}
            onChange={(e) => onChange('amount', e.target.value)}
            className="w-full pl-8 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm font-normal focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 transition-all shadow-sm"
            placeholder="5000.00"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-normal text-slate-700 mb-1.5">Sender balance before</label>
          <input
            type="number"
            step="0.01"
            value={values.oldbalanceOrg}
            onChange={(e) => onChange('oldbalanceOrg', e.target.value)}
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm font-normal focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 transition-all shadow-sm"
            placeholder="0.00"
          />
        </div>
        <div>
          <label className="block text-sm font-normal text-slate-700 mb-1.5">Sender balance after</label>
          <input
            type="number"
            step="0.01"
            value={values.newbalanceOrig}
            onChange={(e) => onChange('newbalanceOrig', e.target.value)}
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm font-normal focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 transition-all shadow-sm"
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-normal text-slate-700 mb-1.5">Receiver balance before</label>
          <input
            type="number"
            step="0.01"
            value={values.oldbalanceDest}
            onChange={(e) => onChange('oldbalanceDest', e.target.value)}
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm font-normal focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 transition-all shadow-sm"
            placeholder="0.00"
          />
        </div>
        <div>
          <label className="block text-sm font-normal text-slate-700 mb-1.5">Receiver balance after</label>
          <input
            type="number"
            step="0.01"
            value={values.newbalanceDest}
            onChange={(e) => onChange('newbalanceDest', e.target.value)}
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm font-normal focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 transition-all shadow-sm"
            placeholder="0.00"
          />
        </div>
      </div>
    </div>
  );
}

function BankingForm({ values, onChange }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-normal text-slate-700 mb-1.5">Age bracket</label>
          <input
            type="number"
            value={values.age}
            onChange={(e) => onChange('age', e.target.value)}
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm font-normal focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 transition-all shadow-sm"
            placeholder="3"
          />
        </div>
        <div>
          <label className="block text-sm font-normal text-slate-700 mb-1.5">Gender</label>
          <select
            value={values.gender}
            onChange={(e) => onChange('gender', e.target.value)}
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm font-normal focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 transition-all shadow-sm cursor-pointer"
          >
            <option value="M">M</option>
            <option value="F">F</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-normal text-slate-700 mb-1.5">Merchant category</label>
        <input
          type="text"
          value={values.category}
          onChange={(e) => onChange('category', e.target.value)}
          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm font-normal focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 transition-all shadow-sm"
          placeholder="es_transportation"
        />
      </div>

      <div>
        <label className="block text-sm font-normal text-slate-700 mb-1.5">Amount</label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
          <input
            type="number"
            step="0.01"
            value={values.amount}
            onChange={(e) => onChange('amount', e.target.value)}
            className="w-full pl-8 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm font-normal focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 transition-all shadow-sm"
            placeholder="35.44"
          />
        </div>
      </div>
    </div>
  );
}

const DEFAULT_VALUES = {
  creditcard: { Amount: '', Time: '' },
  paysim: {
    type: 'TRANSFER',
    amount: '',
    oldbalanceOrg: '',
    newbalanceOrig: '',
    oldbalanceDest: '',
    newbalanceDest: '',
  },
  banksim: { age: '', gender: 'M', category: '', amount: '' },
};

export default function CheckTransaction() {
  const [selectedType, setSelectedType] = useState(null);
  const [values, setValues] = useState(DEFAULT_VALUES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [sampleInfo, setSampleInfo] = useState('');
  const [sampleMeta, setSampleMeta] = useState(null);
  const [resultMeta, setResultMeta] = useState(null);

  const handleChange = (field, value) => {
    setValues((prev) => ({
      ...prev,
      [selectedType]: { ...prev[selectedType], [field]: value },
    }));
    setSampleMeta(null);
  };

  const handleSelectType = (typeId) => {
    setSelectedType(typeId);
    setResult(null);
    setError('');
  };

  const handleLoadSample = (button) => {
    const list = creditcardSamples[button.kind] || [];
    if (list.length === 0) {
      setError('No sample transactions found. Run export_samples.py in the ai-model folder first.');
      return;
    }
    const sample = list[Math.floor(Math.random() * list.length)];
    const { _actual, ...features } = sample;
    setValues((prev) => ({ ...prev, creditcard: features }));
    setSampleMeta(_actual === undefined ? null : { actual: _actual });
    setSampleInfo(button.info);
    setResult(null);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);

    const token = localStorage.getItem('token');
    const metaForThisCheck = selectedType === 'creditcard' ? sampleMeta : null;

    try {
      const response = await fetch(`http://localhost:5000/api/fraud/predict/${selectedType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(values[selectedType]),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Could not check this transaction');
      }

      setResult(data);
      setResultMeta(metaForThisCheck);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  let truthPanel = null;
  if (result && resultMeta) {
    const actualFraud = resultMeta.actual === 1;
    const correct = actualFraud === result.is_fraud;
    const message = correct
      ? 'The model got this one right.'
      : actualFraud
      ? 'The model missed this fraud (a false negative).'
      : 'The model flagged a legitimate transaction (a false alarm).';

    truthPanel = (
      <div
        className={`mt-6 p-4 rounded-xl border text-sm font-normal transition-all ${
          correct ? 'bg-white/80 border-emerald-200/80' : 'bg-amber-50/50 border-amber-200'
        }`}
      >
        <div className="text-slate-800 font-normal">
          Actual label in the dataset:{' '}
          <span className="font-medium">{actualFraud ? 'Fraud' : 'Legitimate'}</span>
        </div>
        <div className={`mt-1 text-xs font-normal flex items-center gap-1.5 ${correct ? 'text-emerald-700' : 'text-amber-700'}`}>
          <span>{correct ? '✓' : '✗'}</span>
          <span>{message}</span>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl">
        {/* Emerald green header with hover effect */}
        <div className="mb-8 cursor-default inline-block transition-transform duration-300 hover:translate-x-1.5 hover:scale-[1.01]">
          <h1 className="text-3xl font-normal text-emerald-900 tracking-tight mb-2">
            Check a transaction
          </h1>
          <p className="text-emerald-700/80 text-base font-normal">
            Select a payment channel, input transaction telemetry, and evaluate real-time fraud risk probability.
          </p>
        </div>

        {/* Step 1: payment type selector */}
        <div className="grid sm:grid-cols-3 gap-6 mb-10">
          {PAYMENT_TYPES.map((type) => {
            const isSelected = selectedType === type.id;
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => handleSelectType(type.id)}
                className={`text-left p-7 rounded-3xl border transition-all duration-200 relative group flex flex-col justify-between ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50/50 shadow-lg shadow-emerald-500/10 ring-2 ring-emerald-500/20 scale-[1.02]'
                    : 'border-slate-200/80 bg-white hover:border-emerald-300 hover:shadow-md hover:scale-[1.01]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 group-hover:bg-emerald-50 group-hover:text-emerald-600'}`}>
                      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>
                    </div>
                    <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300'}`}>
                      {isSelected && <span className="w-2 h-2 rounded-full bg-white" />}
                    </span>
                  </div>
                  <h3 className="text-lg font-normal text-slate-900 mb-2">{type.label}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed font-normal">{type.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Step 2: dynamic form */}
        {selectedType && (
          <form onSubmit={handleSubmit} className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-8 mb-8 animate-fade-in-up">
            <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-100">
              <h2 className="text-xl font-normal text-slate-900">
                {PAYMENT_TYPES.find((t) => t.id === selectedType)?.label} telemetry
              </h2>
              <span className="text-xs font-normal px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Secure AI Scanner Active
              </span>
            </div>

            {selectedType === 'creditcard' && (
              <CreditCardForm
                values={values.creditcard}
                onChange={handleChange}
                onLoadSample={handleLoadSample}
                sampleInfo={sampleInfo}
              />
            )}
            {selectedType === 'paysim' && (
              <WalletForm values={values.paysim} onChange={handleChange} />
            )}
            {selectedType === 'banksim' && (
              <BankingForm values={values.banksim} onChange={handleChange} />
            )}

            {error && (
              <div className="mt-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm font-normal flex items-center gap-2.5">
                <svg className="w-5 h-5 shrink-0 text-rose-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-8 w-full py-3.5 px-6 text-sm font-normal text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] rounded-xl transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                  <span>Analyzing Transaction...</span>
                </>
              ) : (
                <span>Check for fraud</span>
              )}
            </button>
          </form>
        )}

        {/* Step 3: result with risk gauge */}
        {result && (
          <div
            className={`border rounded-2xl p-8 shadow-sm transition-all animate-fade-in-up ${
              result.is_fraud ? 'border-rose-300 bg-rose-50/60' : 'border-emerald-200/80 bg-emerald-50/40'
            }`}
          >
            <div className="flex items-center gap-3 mb-6">
              <span className={`w-3 h-3 rounded-full animate-pulse ${result.is_fraud ? 'bg-rose-600' : 'bg-emerald-500'}`} />
              <h3 className={`text-xl font-normal ${result.is_fraud ? 'text-rose-800' : 'text-emerald-900'}`}>
                {result.is_fraud ? 'Fraud detected' : 'Transaction looks safe'}
              </h3>
            </div>

            <div className="bg-white/80 rounded-xl p-6 border border-slate-200/60 shadow-sm mb-4">
              <RiskGauge
                probability={result.fraud_probability}
                isFraud={result.is_fraud}
                threshold={result.threshold_used}
              />
            </div>

            <p className="text-xs font-normal text-slate-500 text-center">
              Decision threshold applied: <span className="text-slate-800 font-medium">{result.threshold_used}</span>
            </p>

            {truthPanel}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}