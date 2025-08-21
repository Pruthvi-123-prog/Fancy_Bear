import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import ScannerForm from './components/ScannerForm';
import ReportView from './components/ReportView';
import './App.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-dark-bg text-dark-text">
        {/* Navigation Header */}
        <nav className="bg-dark-surface border-b border-dark-card">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-4">
                <h1 className="text-2xl font-bold text-dark-accent">🐻 Fancy Bear</h1>
                <span className="text-dark-muted">Security Scanner</span>
              </div>
              <div className="flex space-x-6">
                <Link 
                  to="/" 
                  className="text-dark-text hover:text-dark-accent transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-dark-card"
                >
                  Dashboard
                </Link>
                <Link 
                  to="/scan" 
                  className="text-dark-text hover:text-dark-accent transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-dark-card"
                >
                  New Scan
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/scan" element={<ScannerForm />} />
            <Route path="/report/:id" element={<ReportView />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
