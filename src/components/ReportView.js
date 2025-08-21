import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

const ReportView = () => {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/report/${id}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch report: ${response.statusText}`);
        }
        const data = await response.json();
        setReport(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [id]);

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'high':
        return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
      case 'medium':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'low':
        return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'info':
        return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
      default:
        return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dark-accent"></div>
        <p className="text-dark-muted">Loading security report...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6">
        <h3 className="text-red-400 font-semibold text-lg mb-2">Error Loading Report</h3>
        <p className="text-red-300 mb-4">{error}</p>
        <div className="flex space-x-4">
          <button 
            onClick={() => window.location.reload()}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors duration-200"
          >
            Retry
          </button>
          <Link 
            to="/"
            className="border border-red-500 text-red-400 hover:bg-red-500/10 px-4 py-2 rounded-lg transition-colors duration-200"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-12">
        <span className="text-6xl mb-4 block">📄</span>
        <h3 className="text-xl font-semibold text-dark-text mb-2">Report not found</h3>
        <p className="text-dark-muted mb-6">The requested security report could not be found.</p>
        <Link 
          to="/"
          className="bg-dark-accent hover:bg-dark-accent/80 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'vulnerabilities', name: 'Vulnerabilities', icon: '🚨' },
    { id: 'details', name: 'Technical Details', icon: '🔧' },
    { id: 'raw', name: 'Raw Data', icon: '📋' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Link to="/" className="text-dark-muted hover:text-dark-accent transition-colors duration-200">
              Dashboard
            </Link>
            <span className="text-dark-muted">/</span>
            <span className="text-dark-text">Security Report</span>
          </div>
          <h1 className="text-3xl font-bold text-dark-text mb-2">
            {report.target || `Report #${id}`}
          </h1>
          <p className="text-dark-muted">
            Scanned on {formatDate(report.createdAt || new Date())}
          </p>
        </div>
        <div className="flex space-x-3">
          <button className="bg-dark-surface border border-dark-card text-dark-text px-4 py-2 rounded-lg hover:bg-dark-card transition-colors duration-200">
            📥 Export
          </button>
          <button className="bg-dark-surface border border-dark-card text-dark-text px-4 py-2 rounded-lg hover:bg-dark-card transition-colors duration-200">
            🔄 Re-scan
          </button>
        </div>
      </div>

      {/* Status Banner */}
      <div className={`rounded-lg p-4 border ${
        report.status === 'completed' 
          ? 'bg-green-500/10 border-green-500/20 text-green-400'
          : report.status === 'failed'
          ? 'bg-red-500/10 border-red-500/20 text-red-400'
          : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
      }`}>
        <div className="flex items-center space-x-2">
          <span>{report.status === 'completed' ? '✅' : report.status === 'failed' ? '❌' : '⏳'}</span>
          <span className="font-medium">
            Scan {report.status || 'completed'}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-dark-card">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === tab.id
                  ? 'border-dark-accent text-dark-accent'
                  : 'border-transparent text-dark-muted hover:text-dark-text'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-dark-surface border border-dark-card rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-dark-muted text-sm font-medium">Critical</p>
                    <p className="text-2xl font-bold text-red-400">{report.summary?.critical || 0}</p>
                  </div>
                  <span className="text-red-400 text-2xl">🚨</span>
                </div>
              </div>
              
              <div className="bg-dark-surface border border-dark-card rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-dark-muted text-sm font-medium">High</p>
                    <p className="text-2xl font-bold text-orange-400">{report.summary?.high || 0}</p>
                  </div>
                  <span className="text-orange-400 text-2xl">⚠️</span>
                </div>
              </div>
              
              <div className="bg-dark-surface border border-dark-card rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-dark-muted text-sm font-medium">Medium</p>
                    <p className="text-2xl font-bold text-yellow-400">{report.summary?.medium || 0}</p>
                  </div>
                  <span className="text-yellow-400 text-2xl">🔶</span>
                </div>
              </div>
              
              <div className="bg-dark-surface border border-dark-card rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-dark-muted text-sm font-medium">Low</p>
                    <p className="text-2xl font-bold text-blue-400">{report.summary?.low || 0}</p>
                  </div>
                  <span className="text-blue-400 text-2xl">ℹ️</span>
                </div>
              </div>
            </div>

            {/* Risk Score */}
            <div className="bg-dark-surface border border-dark-card rounded-lg p-6">
              <h3 className="text-lg font-semibold text-dark-text mb-4">Risk Assessment</h3>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <div className="flex justify-between text-sm text-dark-muted mb-2">
                    <span>Risk Score</span>
                    <span>{report.riskScore || 75}/100</span>
                  </div>
                  <div className="w-full bg-dark-card rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-green-400 via-yellow-400 to-red-400 h-3 rounded-full"
                      style={{ width: `${report.riskScore || 75}%` }}
                    ></div>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    (report.riskScore || 75) > 80 ? 'bg-red-500/10 text-red-400' :
                    (report.riskScore || 75) > 60 ? 'bg-yellow-500/10 text-yellow-400' :
                    'bg-green-500/10 text-green-400'
                  }`}>
                    {(report.riskScore || 75) > 80 ? 'High Risk' :
                     (report.riskScore || 75) > 60 ? 'Medium Risk' : 'Low Risk'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'vulnerabilities' && (
          <div className="space-y-4">
            {report.vulnerabilities && report.vulnerabilities.length > 0 ? (
              report.vulnerabilities.map((vuln, index) => (
                <div key={index} className="bg-dark-surface border border-dark-card rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-dark-text">{vuln.title}</h3>
                      <p className="text-dark-muted">{vuln.description}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getSeverityColor(vuln.severity)}`}>
                      {vuln.severity}
                    </span>
                  </div>
                  {vuln.location && (
                    <div className="mb-2">
                      <span className="text-dark-muted text-sm">Location: </span>
                      <code className="bg-dark-card px-2 py-1 rounded text-dark-text text-sm">{vuln.location}</code>
                    </div>
                  )}
                  {vuln.recommendation && (
                    <div>
                      <span className="text-dark-muted text-sm">Recommendation: </span>
                      <span className="text-dark-text text-sm">{vuln.recommendation}</span>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <span className="text-6xl mb-4 block">🛡️</span>
                <h3 className="text-xl font-semibold text-dark-text mb-2">No vulnerabilities found</h3>
                <p className="text-dark-muted">Great! No security issues were detected in this scan.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'details' && (
          <div className="bg-dark-surface border border-dark-card rounded-lg p-6">
            <h3 className="text-lg font-semibold text-dark-text mb-4">Technical Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-dark-text mb-2">Scan Configuration</h4>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-dark-muted">Target:</dt>
                    <dd className="text-dark-text">{report.target}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-dark-muted">Scan Type:</dt>
                    <dd className="text-dark-text">{report.scanType || 'Basic'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-dark-muted">Duration:</dt>
                    <dd className="text-dark-text">{report.duration || '2m 34s'}</dd>
                  </div>
                </dl>
              </div>
              <div>
                <h4 className="font-medium text-dark-text mb-2">Target Information</h4>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-dark-muted">IP Address:</dt>
                    <dd className="text-dark-text">{report.targetInfo?.ip || 'N/A'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-dark-muted">Server:</dt>
                    <dd className="text-dark-text">{report.targetInfo?.server || 'N/A'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-dark-muted">SSL/TLS:</dt>
                    <dd className="text-dark-text">{report.targetInfo?.ssl ? 'Enabled' : 'Disabled'}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'raw' && (
          <div className="bg-dark-surface border border-dark-card rounded-lg p-6">
            <h3 className="text-lg font-semibold text-dark-text mb-4">Raw JSON Data</h3>
            <pre className="bg-dark-card p-4 rounded-lg overflow-auto max-h-96 text-sm text-dark-text">
              {JSON.stringify(report, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportView;
