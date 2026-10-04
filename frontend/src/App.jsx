import { Routes, Route } from 'react-router-dom';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CheckTransaction from './pages/CheckTransaction';
import Transactions from './pages/Transactions';
import FraudAlerts from './pages/FraudAlerts';
import UploadTransaction from './pages/UploadTransaction';
import Reports from './pages/Reports';
import Profile from './pages/Profile';

import AdminRoute from './components/AdminRoute';
import AdminLayout from './components/admin/AdminLayout';
import AdminOverview from './pages/admin/AdminOverview';

// Placeholder for admin pages that are not built yet
function AdminComingSoon() {
  return (
    <AdminLayout>
      <h1 className="font-serif text-2xl text-ink mb-1">Coming soon</h1>
      <p className="text-ink-muted">This admin page has not been built yet.</p>
    </AdminLayout>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/check" element={<CheckTransaction />} />
      <Route path="/transactions" element={<Transactions />} />
      <Route path="/alerts" element={<FraudAlerts />} />
      <Route path="/upload" element={<UploadTransaction />} />
      <Route path="/reports" element={<Reports />} />
      <Route path="/profile" element={<Profile />} />

      <Route element={<AdminRoute />}>
        <Route path="/admin" element={<AdminOverview />} />
        <Route path="/admin/*" element={<AdminComingSoon />} />
      </Route>
    </Routes>
  );
}