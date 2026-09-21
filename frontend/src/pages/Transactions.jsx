import React from 'react';
import  Dashboardlayout from './Dashboardlayout';

export default function Transactions() {
  return (
    <Dashboardlayout>
      <h1 className="font-serif text-2xl text-ink mb-1">Transactions</h1>
      <p className="text-ink-muted mb-8">All transactions you have checked, across every payment type.</p>

      <div className="border border-line border-dashed p-10 text-center opacity-0 animate-fade-in-up">
        <p className="text-sm text-ink-muted">This page is being built next.</p>
      </div>
    </Dashboardlayout>
  );
}