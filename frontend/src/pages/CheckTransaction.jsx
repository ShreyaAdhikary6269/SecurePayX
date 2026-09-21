import React from 'react';
import Dashboard from './Dashboard';

export default function CheckTransaction() {
  return (
    <DashboardLayout>
      <h1 className="font-serif text-2xl text-ink mb-1">Check a transaction</h1>
      <p className="text-ink-muted mb-8">Pick a payment type and submit details to check for fraud.</p>

      <div className="border border-line border-dashed p-10 text-center opacity-0 animate-fade-in-up">
        <p className="text-sm text-ink-muted">This page is being built next.</p>
      </div>
    </DashboardLayout>
  );
}