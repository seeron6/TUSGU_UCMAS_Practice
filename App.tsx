import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { ListeningPractice } from './pages/ListeningPractice';
import { FlashPractice } from './pages/FlashPractice';
import { NewsBoard } from './pages/NewsBoard';
import { AdminNews } from './pages/AdminNews';
import { Stats } from './pages/Stats';
import { AbacusPractice } from './pages/AbacusPractice';
import { Layout } from './components/Layout';
import { ThemeProvider } from './contexts/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/listening" element={<ListeningPractice />} />
          <Route path="/flash" element={<FlashPractice />} />
          <Route path="/news" element={<NewsBoard />} />
          <Route path="/admin/news" element={<AdminNews />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/abacus" element={<AbacusPractice />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;