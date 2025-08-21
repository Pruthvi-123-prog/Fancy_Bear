const SecurityScanner = require('./modules/securityScanner');
const AdvancedSecurityScanner = require('./modules/advancedSecurityScanner');
const PerformanceScanner = require('./modules/performanceScanner');
const SEOScanner = require('./modules/seoScanner');
const AccessibilityScanner = require('./modules/accessibilityScanner');

/**
 * Main scanner orchestrator
 * Coordinates all scanning modules and returns structured results
 */
class WebsiteScanner {
  constructor() {
    this.securityScanner = new SecurityScanner();
    this.advancedSecurityScanner = new AdvancedSecurityScanner();
    this.performanceScanner = new PerformanceScanner();
    this.seoScanner = new SEOScanner();
    this.accessibilityScanner = new AccessibilityScanner();
  }

  /**
   * Run comprehensive website audit
   * @param {string} url - Target URL to scan
   * @param {Object} options - Scanning options
   * @param {boolean} options.security - Include security scan (default: true)
   * @param {boolean} options.performance - Include performance scan (default: true)
   * @param {boolean} options.seo - Include SEO scan (default: true)
   * @param {boolean} options.accessibility - Include accessibility scan (default: true)
   * @returns {Promise<Object>} Structured scan results
   */
  async runScan(url, options = {}) {
    // Default options
    const config = {
      security: true,
      performance: true,
      seo: true,
      accessibility: true,
      ...options
    };

    // Validate URL
    if (!url || typeof url !== 'string') {
      throw new Error('Valid URL is required for scanning');
    }

    // Normalize URL
    const normalizedUrl = this.normalizeUrl(url);
    
    const results = {
      url: normalizedUrl,
      timestamp: new Date().toISOString(),
      scanDuration: 0,
      security: [],
      advancedSecurity: [],
      performance: [],
      seo: [],
      accessibility: [],
      summary: {
        totalIssues: 0,
        highSeverityIssues: 0,
        mediumSeverityIssues: 0,
        lowSeverityIssues: 0,
        infoItems: 0,
        categories: {
          security: { total: 0, high: 0, medium: 0, low: 0, info: 0 },
          advancedSecurity: { total: 0, high: 0, medium: 0, low: 0, info: 0 },
          performance: { total: 0, high: 0, medium: 0, low: 0, info: 0 },
          seo: { total: 0, high: 0, medium: 0, low: 0, info: 0 },
          accessibility: { total: 0, high: 0, medium: 0, low: 0, info: 0 }
        }
      },
      errors: []
    };

    const startTime = Date.now();

    try {
      // Run scans in parallel for better performance
      const scanPromises = [];

      if (config.security) {
        scanPromises.push(
          this.runSingleScan('security', this.securityScanner, normalizedUrl)
        );
        scanPromises.push(
          this.runSingleScan('advancedSecurity', this.advancedSecurityScanner, normalizedUrl)
        );
      }

      if (config.performance) {
        scanPromises.push(
          this.runSingleScan('performance', this.performanceScanner, normalizedUrl)
        );
      }

      if (config.seo) {
        scanPromises.push(
          this.runSingleScan('seo', this.seoScanner, normalizedUrl)
        );
      }

      if (config.accessibility) {
        scanPromises.push(
          this.runSingleScan('accessibility', this.accessibilityScanner, normalizedUrl)
        );
      }

      // Wait for all scans to complete
      const scanResults = await Promise.allSettled(scanPromises);

      // Process results
      scanResults.forEach((result, index) => {
        const scanType = this.getScanTypeByIndex(index, config);
        
        if (result.status === 'fulfilled') {
          results[scanType] = result.value.findings;
        } else {
          results.errors.push({
            category: scanType,
            error: result.reason.message || 'Unknown error during scan'
          });
          
          // Add error finding to the category
          results[scanType] = [{
            category: 'Error',
            severity: 'high',
            issue: `${scanType.charAt(0).toUpperCase() + scanType.slice(1)} scan failed`,
            description: result.reason.message || 'Unknown error during scan',
            recommendation: 'Review network connectivity and target website availability'
          }];
        }
      });

      // Generate summary
      this.generateSummary(results);

      results.scanDuration = Date.now() - startTime;

    } catch (error) {
      results.errors.push({
        category: 'General',
        error: error.message || 'Unknown error during scan'
      });
      
      results.scanDuration = Date.now() - startTime;
    }

    return results;
  }

  /**
   * Run a single scan module with error handling
   * @param {string} type - Scan type
   * @param {Object} scanner - Scanner instance
   * @param {string} url - URL to scan
   * @returns {Promise<Object>} Scan results
   */
  async runSingleScan(type, scanner, url) {
    try {
      const findings = await scanner.scan(url);
      return { type, findings };
    } catch (error) {
      throw new Error(`${type} scan error: ${error.message}`);
    }
  }

  /**
   * Get scan type by index (for parallel processing)
   * @param {number} index - Promise index
   * @param {Object} config - Configuration
   * @returns {string} Scan type
   */
  getScanTypeByIndex(index, config) {
    const enabledScans = [];
    if (config.security) {
      enabledScans.push('security');
      enabledScans.push('advancedSecurity');
    }
    if (config.performance) enabledScans.push('performance');
    if (config.seo) enabledScans.push('seo');
    if (config.accessibility) enabledScans.push('accessibility');
    
    return enabledScans[index] || 'unknown';
  }

  /**
   * Generate summary statistics
   * @param {Object} results - Scan results
   */
  generateSummary(results) {
    const categories = ['security', 'advancedSecurity', 'performance', 'seo', 'accessibility'];
    
    categories.forEach(category => {
      const findings = results[category] || [];
      
      findings.forEach(finding => {
        const severity = finding.severity || 'info';
        
        // Update category counts
        if (results.summary.categories[category]) {
          results.summary.categories[category].total++;
          results.summary.categories[category][severity]++;
        }
        
        // Update overall counts
        results.summary.totalIssues++;
        switch (severity) {
          case 'high':
            results.summary.highSeverityIssues++;
            break;
          case 'medium':
            results.summary.mediumSeverityIssues++;
            break;
          case 'low':
            results.summary.lowSeverityIssues++;
            break;
          case 'info':
            results.summary.infoItems++;
            break;
        }
      });
    });

    // Generate overall score (0-100)
    results.summary.overallScore = this.calculateScore(results.summary);

    // Generate recommendations
    results.summary.topRecommendations = this.getTopRecommendations(results);
  }

  /**
   * Calculate overall score based on findings
   * @param {Object} summary - Summary object
   * @returns {number} Score (0-100)
   */
  calculateScore(summary) {
    const maxDeduction = 100;
    let deductions = 0;

    // Deduct points based on severity
    deductions += summary.highSeverityIssues * 10;
    deductions += summary.mediumSeverityIssues * 5;
    deductions += summary.lowSeverityIssues * 2;

    // Don't deduct for info items (they're often positive findings)
    
    const score = Math.max(0, maxDeduction - deductions);
    return Math.round(score);
  }

  /**
   * Get top recommendations based on high severity issues
   * @param {Object} results - Scan results
   * @returns {Array<string>} Top recommendations
   */
  getTopRecommendations(results) {
    const recommendations = [];
    const categories = ['security', 'performance', 'seo', 'accessibility'];
    
    categories.forEach(category => {
      const findings = results[category] || [];
      const highSeverityFindings = findings.filter(f => f.severity === 'high');
      
      highSeverityFindings.slice(0, 2).forEach(finding => {
        if (finding.recommendation && !recommendations.includes(finding.recommendation)) {
          recommendations.push(finding.recommendation);
        }
      });
    });

    return recommendations.slice(0, 5); // Top 5 recommendations
  }

  /**
   * Normalize URL for consistency
   * @param {string} url - Raw URL
   * @returns {string} Normalized URL
   */
  normalizeUrl(url) {
    try {
      // Add protocol if missing
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }

      const urlObj = new URL(url);
      return urlObj.href;
    } catch (error) {
      throw new Error(`Invalid URL format: ${url}`);
    }
  }

  /**
   * Get scanner version and info
   * @returns {Object} Scanner information
   */
  getInfo() {
    return {
      name: 'Website Audit Tool Scanner',
      version: '1.0.0',
      description: 'Comprehensive website security, performance, SEO, and accessibility scanner',
      capabilities: [
        'OWASP Top 10 Security Checks',
        'Performance Analysis (Lighthouse-style)',
        'SEO Optimization Review',
        'WCAG Accessibility Compliance',
        'Structured JSON Reports',
        'Parallel Scanning for Speed'
      ],
      supportedProtocols: ['http', 'https'],
      maxConcurrentScans: 4
    };
  }
}

// Export the main function for backend integration
async function runScan(url, options = {}) {
  const scanner = new WebsiteScanner();
  return await scanner.runScan(url, options);
}

module.exports = {
  WebsiteScanner,
  runScan
};
