/**
 * Express.js API Routes for Website Scanning
 * This shows how to integrate the scanner with your MERN backend
 */

const express = require('express');
const { scanWebsite, isValidUrl, getScannerInfo } = require('./scanner-entry');

const router = express.Router();

// POST /api/scan - Full website audit
router.post('/scan', async (req, res) => {
  try {
    const { url, options = {} } = req.body;
    
    // Validate input
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required'
      });
    }
    
    if (!isValidUrl(url)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid URL format'
      });
    }
    
    console.log(`🔍 Starting scan for: ${url}`);
    const startTime = Date.now();
    
    // Run the scan
    const results = await scanWebsite(url, options);
    
    const duration = Date.now() - startTime;
    console.log(`✅ Scan completed in ${duration}ms - Found ${results.summary.totalIssues} issues`);
    
    // Return results
    res.json({
      success: true,
      data: results,
      meta: {
        requestId: Date.now(),
        processingTime: duration
      }
    });
    
  } catch (error) {
    console.error('❌ Scan failed:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'SCAN_FAILED'
    });
  }
});

// POST /api/quick-scan - Security + SEO only (faster)
router.post('/quick-scan', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!isValidUrl(url)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid URL format'
      });
    }
    
    // Quick scan - security and SEO only
    const results = await scanWebsite(url, {
      security: true,
      performance: false,  // Skip for speed
      seo: true,
      accessibility: false  // Skip for speed
    });
    
    res.json({
      success: true,
      data: results,
      meta: {
        scanType: 'quick',
        categories: ['security', 'seo']
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'QUICK_SCAN_FAILED'
    });
  }
});

// POST /api/security-scan - Security only
router.post('/security-scan', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!isValidUrl(url)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid URL format'
      });
    }
    
    const results = await scanWebsite(url, {
      security: true,
      performance: false,
      seo: false,
      accessibility: false
    });
    
    // Extract only security findings with additional processing
    const securitySummary = {
      url: results.url,
      timestamp: results.timestamp,
      scanDuration: results.scanDuration,
      security: results.security,
      summary: {
        totalSecurityIssues: results.security.length,
        criticalIssues: results.security.filter(i => i.severity === 'high').length,
        mediumIssues: results.security.filter(i => i.severity === 'medium').length,
        lowIssues: results.security.filter(i => i.severity === 'low').length,
        securityScore: Math.max(0, 100 - (results.security.filter(i => i.severity === 'high').length * 20 + 
                                          results.security.filter(i => i.severity === 'medium').length * 10 + 
                                          results.security.filter(i => i.severity === 'low').length * 5)),
        topRecommendations: results.security
          .filter(i => i.severity === 'high')
          .slice(0, 3)
          .map(i => i.recommendation)
      }
    };
    
    res.json({
      success: true,
      data: securitySummary,
      meta: {
        scanType: 'security-only',
        focus: 'OWASP Top 10 Security Analysis'
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'SECURITY_SCAN_FAILED'
    });
  }
});

// GET /api/scanner-info - Scanner capabilities
router.get('/scanner-info', (req, res) => {
  try {
    const info = getScannerInfo();
    
    res.json({
      success: true,
      data: {
        ...info,
        endpoints: {
          fullScan: 'POST /api/scan',
          quickScan: 'POST /api/quick-scan', 
          securityScan: 'POST /api/security-scan',
          info: 'GET /api/scanner-info'
        },
        usage: {
          fullScan: 'Complete audit (all categories)',
          quickScan: 'Security + SEO only (faster)',
          securityScan: 'Security vulnerabilities only'
        }
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Demo endpoint - scan sdit.ac.in
router.get('/demo/sdit', async (req, res) => {
  try {
    console.log('🎓 Running demo scan on SDIT website...');
    
    const results = await scanWebsite('https://sdit.ac.in', {
      security: true,
      performance: false, // Skip for demo speed
      seo: true,
      accessibility: true
    });
    
    res.json({
      success: true,
      data: results,
      meta: {
        demo: true,
        university: 'SDIT (Sri Dharmasthala Manjunatheshwara Institute of Technology)',
        analysisDate: new Date().toISOString()
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'DEMO_FAILED'
    });
  }
});

module.exports = router;

/**
 * USAGE EXAMPLES:
 * 
 * // In your main Express app (app.js or server.js):
 * const scannerRoutes = require('./api-routes');
 * app.use('/api', scannerRoutes);
 * 
 * // Frontend usage:
 * 
 * // 1. Full scan
 * fetch('/api/scan', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ url: 'https://sdit.ac.in' })
 * });
 * 
 * // 2. Quick scan
 * fetch('/api/quick-scan', {
 *   method: 'POST', 
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ url: 'https://sdit.ac.in' })
 * });
 * 
 * // 3. Security only
 * fetch('/api/security-scan', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ url: 'https://sdit.ac.in' })
 * });
 * 
 * // 4. Demo endpoint
 * fetch('/api/demo/sdit')
 */
