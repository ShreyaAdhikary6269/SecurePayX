import React from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from './Dashboardlayout';

export default function Profile() {
  const navigate = useNavigate();

  let user = null;
  try {
    user = JSON.parse(localStorage.getItem('user'));
  } catch (err) {
    user = null;
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <DashboardLayout>
      <h1 className="font-serif text-2xl text-ink mb-1">Profile</h1>
      <p className="text-ink-muted mb-8">Account settings and preferences.</p>

      <div className="border border-line max-w-lg">
        <div className="border-b border-line px-5 py-4">
          <h2 className="font-serif text-lg text-ink">Account</h2>
        </div>
        <div className="divide-y divide-line">
          <div className="flex items-center justify-between px-5 py-4 text-sm">
            <span className="text-ink-muted">Email</span>
            <span className="text-ink">{user?.email || 'Not available'}</span>
          </div>
          <div className="flex items-center justify-between px-5 py-4 text-sm">
            <span className="text-ink-muted">Account ID</span>
            <span className="text-ink-muted">{user?.id || '-'}</span>
          </div>
        </div>
      </div>

      <div className="mt-8 max-w-lg">
        <button
          onClick={handleLogout}
          className="px-4 py-2 text-sm border border-line text-ink hover:border-red-300 hover:text-red-700 transition-colors"
        >
          Sign out
        </button>
      </div>
    </DashboardLayout>
  );
}