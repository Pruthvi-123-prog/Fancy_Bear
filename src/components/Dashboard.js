import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    failed: 0
  });

  useEffect(() => {
    fetchScans();
  }, []);

  const fetchScans = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      const response = await fetch(`${apiUrl}/api/reports`);
      if (!response.ok) {
        throw new Error('Failed to fetch scans');
      }
      const data = await response.json();
      const scanList = data.scans || [];
      setScans(scanList);
      
      // Calculate stats
      const stats = scanList.reduce((acc, scan) => {
        acc.total++;
        switch (scan.status) {
          case 'completed':
            acc.completed++;
            break;
          case 'pending':
          case 'running':
            acc.pending++;
            break;
          case 'failed':
            acc.failed++;
            break;
          default:
            break;
        }
        return acc;
      }, { total: 0, completed: 0, pending: 0, failed: 0 });
      
      setStats(stats);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-400 bg-green-400/10';
      case 'pending':
      case 'running':
        return 'text-yellow-400 bg-yellow-400/10';
      case 'failed':
        return 'text-red-400 bg-red-400/10';
      default:
        return 'text-gray-400 bg-gray-400/10';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dark-accent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
        <h3 className="text-red-400 font-semibold">Error Loading Dashboard</h3>
        <p className="text-red-300 mt-2">{error}</p>
        <button 
          onClick={fetchScans}
          className="mt-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors duration-200"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-dark-text">Security Dashboard</h1>
        <Link 
          to="/scan"
          className="bg-dark-accent hover:bg-dark-accent/80 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
        >
          <span>🔍</span>
          <span>New Scan</span>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-dark-surface border border-dark-card rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-dark-muted text-sm font-medium">Total Scans</p>
              <p className="text-2xl font-bold text-dark-text">{stats.total}</p>
            </div>
            <div className="bg-blue-500/10 p-3 rounded-lg">
              <span className="text-blue-400 text-xl">📊</span>
            </div>
          </div>
        </div>

        <div className="bg-dark-surface border border-dark-card rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-dark-muted text-sm font-medium">Completed</p>
              <p className="text-2xl font-bold text-green-400">{stats.completed}</p>
            </div>
            <div className="bg-green-500/10 p-3 rounded-lg">
              <span className="text-green-400 text-xl">✅</span>
            </div>
          </div>
        </div>

        <div className="bg-dark-surface border border-dark-card rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-dark-muted text-sm font-medium">Pending</p>
              <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
            </div>
            <div className="bg-yellow-500/10 p-3 rounded-lg">
              <span className="text-yellow-400 text-xl">⏳</span>
            </div>
          </div>
        </div>

        <div className="bg-dark-surface border border-dark-card rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-dark-muted text-sm font-medium">Failed</p>
              <p className="text-2xl font-bold text-red-400">{stats.failed}</p>
            </div>
            <div className="bg-red-500/10 p-3 rounded-lg">
              <span className="text-red-400 text-xl">❌</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Scans Table */}
      <div className="bg-dark-surface border border-dark-card rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-dark-card">
          <h2 className="text-xl font-semibold text-dark-text">Recent Scans</h2>
        </div>
        
        {scans.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-6xl mb-4 block">🔍</span>
            <h3 className="text-xl font-semibold text-dark-text mb-2">No scans yet</h3>
            <p className="text-dark-muted mb-6">Start your first security scan to see results here.</p>
            <Link 
              to="/scan"
              className="bg-dark-accent hover:bg-dark-accent/80 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
            >
              Start Scanning
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-dark-card">
              <thead className="bg-dark-card">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-muted uppercase tracking-wider">
                    Target
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-muted uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-muted uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-muted uppercase tracking-wider">
                    Vulnerabilities
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-muted uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-card">
                {scans.map((scan) => (
                  <tr key={scan.id} className="hover:bg-dark-card/50 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-dark-text">{scan.target}</div>
                      <div className="text-sm text-dark-muted">{scan.scanType || 'Full Scan'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(scan.status)}`}>
                        {scan.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-muted">
                      {formatDate(scan.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-text">
                      {scan.vulnerabilityCount || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {scan.status === 'completed' ? (
                        <Link
                          to={`/report/${scan.id}`}
                          className="text-dark-accent hover:text-dark-accent/80 transition-colors duration-200"
                        >
                          View Report
                        </Link>
                      ) : (
                        <span className="text-dark-muted">Processing...</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
