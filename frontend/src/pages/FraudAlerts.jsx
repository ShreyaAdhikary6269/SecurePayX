import React from 'react';
import Dashboardlayout from './Dashboardlayout';

export default function FraudAlerts() {
  return (
    <Dashboardlayout>
      <h1 className="font-serif text-2xl text-ink mb-1">Fraud alerts</h1>
      <p className="text-ink-muted mb-8">Transactions that were flagged as fraud, filterable by payment type.</p>

      <div className="border border-line border-dashed p-10 text-center opacity-0 animate-fade-in-up">
        <p className="text-sm text-ink-muted">This page is being built next.</p>
      </div>
    </Dashboardlayout>
  );
}