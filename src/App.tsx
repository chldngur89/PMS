import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Home } from './components/Home';
import PMSApp from './PMSApp';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PMSApp defaultView="sales" />} />
      <Route path="/pms/*" element={<PMSApp />} />
      <Route path="/gantt" element={<PMSApp defaultView="gantt" />} />
      <Route path="/portal" element={<Home />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
