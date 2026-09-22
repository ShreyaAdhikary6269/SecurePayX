import React from 'react';
import { Link } from 'react-router-dom';
import Dashboardlayout from './Dashboardlayout';

const OTHER_PAGES = [
  { to: '/dashboard', label: 'Overview' },
  { to: '/check', label: 'Check transaction' },
  { to: '/transactions', label: 'Transactions' },
  { to: '/alerts', label: 'Fraud alerts' },
  { to: '/upload', label: 'Batch upload' },
  { to: '/reports', label: 'Reports' },
  { to: '/profile', label: 'Profile' },
].filter((p) => p.label !== 'Profile');

export default function Profile() {
  return (
    <Dashboardlayout>
      <h1 className="font-serif text-2xl text-ink mb-1">Profile</h1>
      <p className="text-ink-muted mb-8">Account settings and preferences.</p>

      <div className="border border-line border-dashed p-10 text-center mb-8">
        <p className="text-sm text-ink-muted">This page is being built next.</p>
      </div>

      <div>
        <p className="text-xs text-ink-muted mb-3">Go to another section</p>
        <div className="flex flex-wrap gap-2">
          {OTHER_PAGES.map((p) => (
            <Link
              key={p.to}
              to={p.to}
              className="px-3.5 py-2 text-sm border border-line text-ink hover:border-green hover:text-green transition-colors"
            >
              {p.label}
            </Link>
          ))}
        </div>
      </div>
    </Dashboardlayout>
  );
}