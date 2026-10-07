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
      <div className="max-w-6xl">
        {/* Header with emerald theme and smooth hover effect */}
        <div className="mb-8 cursor-default inline-block transition-transform duration-300 hover:translate-x-1.5 hover:scale-[1.01]">
          <h1 className="text-3xl font-normal text-emerald-800 tracking-tight mb-2">
            Profile
          </h1>
          <p className="text-emerald-700/80 text-base font-normal">
            Account settings and preferences.
          </p>
        </div>

        {/* Account Details Card */}
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm max-w-xl overflow-hidden mb-8">
          <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100">
            <h2 className="text-base font-normal text-slate-900">Account</h2>
          </div>
          <div className="divide-y divide-slate-100 text-sm">
            <div className="flex items-center justify-between px-6 py-4">
              <span className="text-slate-500 font-normal">Email</span>
              <span className="text-slate-900 font-normal">{user?.email || 'Not available'}</span>
            </div>
            <div className="flex items-center justify-between px-6 py-4">
              <span className="text-slate-500 font-normal">Account ID</span>
              <span className="text-slate-500 font-normal">{user?.id || '-'}</span>
            </div>
          </div>
        </div>

        {/* Sign out button */}
        <div className="max-w-xl">
          <button
            onClick={handleLogout}
            className="px-5 py-3 text-sm font-normal text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100/70 rounded-xl transition-all shadow-sm active:scale-[0.98]"
          >
            Sign out
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}