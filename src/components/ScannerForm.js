import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ScannerForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    url: '',
    scanType: 'basic',
    depth: 2,
    includeSubdomains: false,
    checkSSL: true,
    checkHeaders: true,
    checkCookies: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validateUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validate URL
    if (!formData.url.trim()) {
      setError('Please enter a URL to scan');
      return;
    }

    if (!validateUrl(formData.url)) {
      setError('Please enter a valid URL (including http:// or https://)');
      return;
    }

    try {
      setLoading(true);
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      const response = await fetch(`${apiUrl}/api/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`Failed to start scan: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Redirect to report page or dashboard
      if (result.scanId) {
        navigate(`/report/${result.scanId}`);
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-dark-text mb-2">New Security Scan</h1>
        <p className="text-dark-muted">Configure and start a comprehensive security scan of your target.</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <span className="text-red-400">❌</span>
            <p className="text-red-300">{error}</p>
          </div>
        </div>
      )}

      {/* Scan Form */}
      <form onSubmit={handleSubmit} className="bg-dark-surface border border-dark-card rounded-lg p-6 space-y-6">
        {/* Target URL */}
        <div>
          <label htmlFor="url" className="block text-sm font-medium text-dark-text mb-2">
            Target URL *
          </label>
          <input
            type="url"
            id="url"
            name="url"
            value={formData.url}
            onChange={handleInputChange}
            placeholder="https://example.com"
            className="w-full px-4 py-3 bg-dark-card border border-dark-primary rounded-lg text-dark-text placeholder-dark-muted focus:outline-none focus:ring-2 focus:ring-dark-accent focus:border-transparent transition-colors duration-200"
            required
          />
          <p className="mt-1 text-sm text-dark-muted">Enter the full URL including protocol (http:// or https://)</p>
        </div>

        {/* Scan Type */}
        <div>
          <label htmlFor="scanType" className="block text-sm font-medium text-dark-text mb-2">
            Scan Type
          </label>
          <select
            id="scanType"
            name="scanType"
            value={formData.scanType}
            onChange={handleInputChange}
            className="w-full px-4 py-3 bg-dark-card border border-dark-primary rounded-lg text-dark-text focus:outline-none focus:ring-2 focus:ring-dark-accent focus:border-transparent transition-colors duration-200"
          >
            <option value="basic">Basic Scan</option>
            <option value="deep">Deep Scan</option>
            <option value="comprehensive">Comprehensive Scan</option>
          </select>
        </div>

        {/* Scan Depth */}
        <div>
          <label htmlFor="depth" className="block text-sm font-medium text-dark-text mb-2">
            Scan Depth: {formData.depth}
          </label>
          <input
            type="range"
            id="depth"
            name="depth"
            min="1"
            max="5"
            value={formData.depth}
            onChange={handleInputChange}
            className="w-full h-2 bg-dark-card rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-sm text-dark-muted mt-1">
            <span>Surface</span>
            <span>Deep</span>
          </div>
        </div>

        {/* Options */}
        <div>
          <h3 className="text-lg font-medium text-dark-text mb-4">Scan Options</h3>
          <div className="space-y-3">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                name="includeSubdomains"
                checked={formData.includeSubdomains}
                onChange={handleInputChange}
                className="w-4 h-4 text-dark-accent bg-dark-card border-dark-primary rounded focus:ring-dark-accent focus:ring-2"
              />
              <span className="text-dark-text">Include subdomains</span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                name="checkSSL"
                checked={formData.checkSSL}
                onChange={handleInputChange}
                className="w-4 h-4 text-dark-accent bg-dark-card border-dark-primary rounded focus:ring-dark-accent focus:ring-2"
              />
              <span className="text-dark-text">SSL/TLS Analysis</span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                name="checkHeaders"
                checked={formData.checkHeaders}
                onChange={handleInputChange}
                className="w-4 h-4 text-dark-accent bg-dark-card border-dark-primary rounded focus:ring-dark-accent focus:ring-2"
              />
              <span className="text-dark-text">Security Headers Check</span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                name="checkCookies"
                checked={formData.checkCookies}
                onChange={handleInputChange}
                className="w-4 h-4 text-dark-accent bg-dark-card border-dark-primary rounded focus:ring-dark-accent focus:ring-2"
              />
              <span className="text-dark-text">Cookie Security Analysis</span>
            </label>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4 pt-6">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-6 py-3 border border-dark-primary text-dark-text rounded-lg hover:bg-dark-card transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-dark-accent hover:bg-dark-accent/80 disabled:bg-dark-accent/50 text-white rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Starting Scan...</span>
              </>
            ) : (
              <>
                <span>🚀</span>
                <span>Start Scan</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Info Cards */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-dark-surface border border-dark-card rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-blue-400">ℹ️</span>
            <h4 className="font-medium text-dark-text">Basic Scan</h4>
          </div>
          <p className="text-sm text-dark-muted">Quick security check covering common vulnerabilities and misconfigurations.</p>
        </div>

        <div className="bg-dark-surface border border-dark-card rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-yellow-400">🔍</span>
            <h4 className="font-medium text-dark-text">Deep Scan</h4>
          </div>
          <p className="text-sm text-dark-muted">Thorough analysis including advanced vulnerability detection and enumeration.</p>
        </div>

        <div className="bg-dark-surface border border-dark-card rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-red-400">🎯</span>
            <h4 className="font-medium text-dark-text">Comprehensive</h4>
          </div>
          <p className="text-sm text-dark-muted">Complete security assessment with detailed reporting and recommendations.</p>
        </div>
      </div>
    </div>
  );
};

export default ScannerForm;
