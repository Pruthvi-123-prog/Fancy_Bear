/**
 * Website Audit Scanner - Main Export
 * 
 * This file provides the main export for backend integration.
 * Import this in your server controllers to access scanning functionality.
 */

// Main scanner exports
const { runScan, WebsiteScanner } = require('./scanner/index(1).js');

// Individual scanner modules (for advanced usage)
const SecurityScanner = require('./scanner/modules/securityScanner');
const PerformanceScanner = require('./scanner/modules/performanceScanner');
const SEOScanner = require('./scanner/modules/seoScanner');
const AccessibilityScanner = require('./scanner/modules/accessibilityScanner');

// Utility modules (for custom implementations)
const HttpClient = require('./scanner/utils/httpClient');
const DOMParser = require('./scanner/utils/domParser');
const URLUtils = require('./scanner/utils/urlUtils');

/**
 * Quick scan function - primary interface for backend controllers
 * 
 * @param {string} url - Target URL to scan
 * @param {Object} options - Scan configuration options
 * @param {boolean} options.security - Include security analysis (default: true)
 * @param {boolean} options.performance - Include performance analysis (default: true)
 * @param {boolean} options.seo - Include SEO analysis (default: true)
 * @param {boolean} options.accessibility - Include accessibility analysis (default: true)
 * @returns {Promise<Object>} Comprehensive scan results
 * 
 * @example
 * // Basic usage in Express controller
 * const { scanWebsite } = require('../scanner-entry');
 * 
 * app.post('/api/scan', async (req, res) => {
 *   try {
 *     const results = await scanWebsite(req.body.url);
 *     res.json({ success: true, data: results });
 *   } catch (error) {
 *     res.status(400).json({ success: false, error: error.message });
 *   }
 * });
 */
async function scanWebsite(url, options = {}) {
  return await runScan(url, options);
}

/**
 * Get scanner information and capabilities
 * 
 * @returns {Object} Scanner metadata and capabilities
 */
function getScannerInfo() {
  const scanner = new WebsiteScanner();
  return scanner.getInfo();
}

/**
 * Validate URL format before scanning
 * 
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid, false otherwise
 */
function isValidUrl(url) {
  try {
    new URL(url.startsWith('http') ? url : `https://${url}`);
    return true;
  } catch {
    return false;
  }
}

/**
 * Normalize URL for consistent processing
 * 
 * @param {string} url - URL to normalize
 * @returns {string} Normalized URL
 */
function normalizeUrl(url) {
  const scanner = new WebsiteScanner();
  return scanner.normalizeUrl(url);
}

// Export main functions for backend integration
module.exports = {
  // Primary functions
  scanWebsite,
  runScan,
  getScannerInfo,
  isValidUrl,
  normalizeUrl,
  
  // Classes
  WebsiteScanner,
  
  // Individual scanners (for custom usage)
  SecurityScanner,
  PerformanceScanner,
  SEOScanner,
  AccessibilityScanner,
  
  // Utilities (for advanced custom implementations)
  HttpClient,
  DOMParser,
  URLUtils
};

/**
 * Example backend controller integration:
 * 
 * const { scanWebsite, isValidUrl, getScannerInfo } = require('./scanner-entry');
 * 
 * // Scan endpoint
 * exports.scanWebsite = async (req, res) => {
 *   try {
 *     const { url, options } = req.body;
 *     
 *     if (!isValidUrl(url)) {
 *       return res.status(400).json({ 
 *         success: false, 
 *         error: 'Invalid URL format' 
 *       });
 *     }
 *     
 *     const results = await scanWebsite(url, options);
 *     
 *     res.json({
 *       success: true,
 *       data: results
 *     });
 *     
 *   } catch (error) {
 *     res.status(500).json({
 *       success: false,
 *       error: error.message
 *     });
 *   }
 * };
 * 
 * // Scanner info endpoint
 * exports.getScannerInfo = (req, res) => {
 *   res.json({
 *     success: true,
 *     data: getScannerInfo()
 *   });
 * };
 */
