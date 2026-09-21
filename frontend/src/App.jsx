import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

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
      </Routes>
  
  );
}