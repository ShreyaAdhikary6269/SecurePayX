import React, { useState } from 'react';
import Dashboardlayout from './Dashboardlayout';

const PAYMENT_TYPES = [
  { id: 'creditcard', label: 'Credit / Debit card', desc: 'Card-present or card-not-present transactions.' },
  { id: 'paysim', label: 'Mobile wallet / UPI', desc: 'Wallet transfers, cash-out, and UPI-style payments.' },
  { id: 'banksim', label: 'Banking', desc: 'Bank transactions across different merchant categories.' },
];

function CreditCardForm({ values, onChange }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm mb-1.5 text-ink-muted">Amount</label>
        <input
          type="number"
          step="0.01"
          value={values.Amount}
          onChange={(e) => onChange('Amount', e.target.value)}
          className="w-full px-3.5 py-2.5 bg-bg border border-line text-ink text-sm focus:outline-none focus:border-green"
          placeholder="149.62"
        />
      </div>
      <div>
        <label className="block text-sm mb-1.5 text-ink-muted">
          Time (seconds since first transaction)
        </label>
        <input
          type="number"
          value={values.Time}
          onChange={(e) => onChange('Time', e.target.value)}
          className="w-full px-3.5 py-2.5 bg-bg border border-line text-ink text-sm focus:outline-none focus:border-green"
          placeholder="0"
        />
      </div>
      <p className="text-xs text-ink-muted border-t border-line pt-4">
        This model also uses 28 anonymized behavioral features (V1-V28) that
        aren't meaningful to enter by hand. Use "Load sample transaction" to
        test with a real example from the test set.
      </p>
    </div>
  );
}

function WalletForm({ values, onChange }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm mb-1.5 text-ink-muted">Transaction type</label>
        <select
          value={values.type}
          onChange={(e) => onChange('type', e.target.value)}
          className="w-full px-3.5 py-2.5 bg-bg border border-line text-ink text-sm focus:outline-none focus:border-green"
        >
          <option value="TRANSFER">Transfer</option>
          <option value="CASH_OUT">Cash out</option>
          <option value="CASH_IN">Cash in</option>
          <option value="PAYMENT">Payment</option>
          <option value="DEBIT">Debit</option>
        </select>
      </div>
      <div>
        <label className="block text-sm mb-1.5 text-ink-muted">Amount</label>
        <input
          type="number"
          step="0.01"
          value={values.amount}
          onChange={(e) => onChange('amount', e.target.value)}
          className="w-full px-3.5 py-2.5 bg-bg border border-line text-ink text-sm focus:outline-none focus:border-green"
          placeholder="5000.00"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-1.5 text-ink-muted">Sender balance before</label>
          <input
            type="number"
            step="0.01"
            value={values.oldbalanceOrg}
            onChange={(e) => onChange('oldbalanceOrg', e.target.value)}
            className="w-full px-3.5 py-2.5 bg-bg border border-line text-ink text-sm focus:outline-none focus:border-green"
          />
        </div>
        <div>
          <label className="block text-sm mb-1.5 text-ink-muted">Sender balance after</label>
          <input
            type="number"
            step="0.01"
            value={values.newbalanceOrig}
            onChange={(e) => onChange('newbalanceOrig', e.target.value)}
            className="w-full px-3.5 py-2.5 bg-bg border border-line text-ink text-sm focus:outline-none focus:border-green"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-1.5 text-ink-muted">Receiver balance before</label>
          <input
            type="number"
            step="0.01"
            value={values.oldbalanceDest}
            onChange={(e) => onChange('oldbalanceDest', e.target.value)}
            className="w-full px-3.5 py-2.5 bg-bg border border-line text-ink text-sm focus:outline-none focus:border-green"
          />
        </div>
        <div>
          <label className="block text-sm mb-1.5 text-ink-muted">Receiver balance after</label>
          <input
            type="number"
            step="0.01"
            value={values.newbalanceDest}
            onChange={(e) => onChange('newbalanceDest', e.target.value)}
            className="w-full px-3.5 py-2.5 bg-bg border border-line text-ink text-sm focus:outline-none focus:border-green"
          />
        </div>
      </div>
    </div>
  );
}

function BankingForm({ values, onChange }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-1.5 text-ink-muted">Age bracket</label>
          <input
            type="number"
            value={values.age}
            onChange={(e) => onChange('age', e.target.value)}
            className="w-full px-3.5 py-2.5 bg-bg border border-line text-ink text-sm focus:outline-none focus:border-green"
            placeholder="3"
          />
        </div>
        <div>
          <label className="block text-sm mb-1.5 text-ink-muted">Gender</label>
          <select
            value={values.gender}
            onChange={(e) => onChange('gender', e.target.value)}
            className="w-full px-3.5 py-2.5 bg-bg border border-line text-ink text-sm focus:outline-none focus:border-green"
          >
            <option value="M">M</option>
            <option value="F">F</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm mb-1.5 text-ink-muted">Merchant category</label>
        <input
          type="text"
          value={values.category}
          onChange={(e) => onChange('category', e.target.value)}
          className="w-full px-3.5 py-2.5 bg-bg border border-line text-ink text-sm focus:outline-none focus:border-green"
          placeholder="es_transportation"
        />
      </div>
      <div>
        <label className="block text-sm mb-1.5 text-ink-muted">Amount</label>
        <input
          type="number"
          step="0.01"
          value={values.amount}
          onChange={(e) => onChange('amount', e.target.value)}
          className="w-full px-3.5 py-2.5 bg-bg border border-line text-ink text-sm focus:outline-none focus:border-green"
          placeholder="35.44"
        />
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

  const handleChange = (field, value) => {
    setValues((prev) => ({
      ...prev,
      [selectedType]: { ...prev[selectedType], [field]: value },
    }));
  };

  const handleSelectType = (typeId) => {
    setSelectedType(typeId);
    setResult(null);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);

    const token = localStorage.getItem('token');

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
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dashboardlayout>
      <h1 className="font-serif text-2xl text-ink mb-1">Check a transaction</h1>
      <p className="text-ink-muted mb-8">
        Pick a payment type, enter the transaction details, and get a fraud probability.
      </p>

      {/* Step 1: payment type selector */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {PAYMENT_TYPES.map((type) => (
          <button
            key={type.id}
            onClick={() => handleSelectType(type.id)}
            className={`text-left border p-5 transition-colors ${
              selectedType === type.id
                ? 'border-green bg-green-soft'
                : 'border-line hover:border-green'
            }`}
          >
            <h3 className="font-serif text-lg text-ink mb-1">{type.label}</h3>
            <p className="text-xs text-ink-muted">{type.desc}</p>
          </button>
        ))}
      </div>

      {/* Step 2: dynamic form */}
      {selectedType && (
        <form onSubmit={handleSubmit} className="border border-line p-6 max-w-lg mb-8">
          <h2 className="font-serif text-lg text-ink mb-5">
            {PAYMENT_TYPES.find((t) => t.id === selectedType)?.label} details
          </h2>

          {selectedType === 'creditcard' && (
            <CreditCardForm values={values.creditcard} onChange={handleChange} />
          )}
          {selectedType === 'paysim' && (
            <WalletForm values={values.paysim} onChange={handleChange} />
          )}
          {selectedType === 'banksim' && (
            <BankingForm values={values.banksim} onChange={handleChange} />
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full py-2.5 text-sm text-white bg-green hover:bg-green-strong transition-colors disabled:opacity-50"
          >
            {loading ? 'Checking...' : 'Check for fraud'}
          </button>
        </form>
      )}

      {/* Step 3: result */}
      {result && (
        <div
          className={`border p-6 max-w-lg ${
            result.is_fraud ? 'border-red-300 bg-red-50' : 'border-line bg-green-soft'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className={`w-2 h-2 rounded-full ${result.is_fraud ? 'bg-red-600' : 'bg-green'}`} />
            <h3 className={`font-serif text-lg ${result.is_fraud ? 'text-red-700' : 'text-green'}`}>
              {result.is_fraud ? 'Fraud detected' : 'Transaction looks safe'}
            </h3>
          </div>
          <p className="text-sm text-ink-muted">
            Fraud probability: <span className="text-ink">{(result.fraud_probability * 100).toFixed(2)}%</span>
          </p>
          <p className="text-xs text-ink-muted mt-1">
            Threshold used: {result.threshold_used}
          </p>
        </div>
      )}
    </Dashboardlayout>
  );
}