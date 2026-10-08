import { Routes, Route, Navigate } from 'react-router-dom';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import { DashboardShell } from './pages/Dashboardlayout';
import Dashboard from './pages/Dashboard';
import CheckTransaction from './pages/CheckTransaction';
import Transactions from './pages/Transactions';
import FraudAlerts from './pages/FraudAlerts';
import Feedback from './pages/Feedback';
import UploadTransaction from './pages/UploadTransaction';
import Reports from './pages/Reports';
import Profile from './pages/Profile';

import AdminRoute from './components/AdminRoute';
import AdminOverview from './pages/admin/AdminOverview';
import AdminUsers from './pages/admin/AdminUsers';
import AdminTransactions from './pages/admin/AdminTransactions';
import AdminFeedback from './pages/admin/AdminFeedback';
import AdminModels from './pages/admin/AdminModels';
import AdminAuditLog from './pages/admin/AdminAuditLog';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<DashboardShell />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/check" element={<CheckTransaction />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/alerts" element={<FraudAlerts />} />
        <Route path="/feedback" element={<Feedback />} />
        <Route path="/upload" element={<UploadTransaction />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      <Route element={<AdminRoute />}>
        <Route path="/admin" element={<AdminOverview />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/transactions" element={<AdminTransactions />} />
        <Route path="/admin/feedback" element={<AdminFeedback />} />
        <Route path="/admin/models" element={<AdminModels />} />
        <Route path="/admin/audit-log" element={<AdminAuditLog />} />
        <Route path="/admin/*" element={<Navigate to="/admin" replace />} />
      </Route>
    </Routes>
  );
}