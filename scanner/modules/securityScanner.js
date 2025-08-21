const HttpClient = require('../utils/httpClient');
const DOMParser = require('../utils/domParser');
const URLUtils = require('../utils/urlUtils');

/**
 * Security scanning module - OWASP Top 10 focused checks
 */
class SecurityScanner {
  constructor() {
    this.httpClient = new HttpClient();
    this.securityHeaders = [
      'strict-transport-security',
      'content-security-policy',
      'x-frame-options',
      'x-content-type-options',
      'x-xss-protection',
      'referrer-policy',
      'permissions-policy'
    ];
  }

  /**
   * Run complete security scan
   * @param {string} url - Target URL
   * @returns {Promise<Array>} Security findings
   */
  async scan(url) {
    const findings = [];

    try {
      // Fetch main page
      const response = await this.httpClient.fetchWithDetails(url);
      
      if (!response.data) {
        findings.push({
          category: 'Connection',
          severity: 'high',
          issue: 'Unable to fetch website content',
          description: 'The website could not be accessed for security analysis',
          recommendation: 'Verify URL and server availability'
        });
        return findings;
      }

      const $ = DOMParser.parse(response.data);

      // 1. Security Headers Analysis
      findings.push(...this.checkSecurityHeaders(response.headers));

      // 2. HTTPS Usage
      findings.push(...this.checkHTTPS(url, response));

      // 3. Form Security
      findings.push(...this.checkFormSecurity($, url));

      // 4. Mixed Content
      findings.push(...this.checkMixedContent($, url));

      // 5. Sensitive Information Exposure
      findings.push(...this.checkSensitiveInfo($));

      // 6. Cookie Security
      findings.push(...this.checkCookieSecurity(response.headers));

      // 7. Input Validation Patterns
      findings.push(...this.checkInputValidation($));

      // 8. XSS Protection
      findings.push(...this.checkXSSProtection($));

      // 9. Clickjacking Protection
      findings.push(...this.checkClickjacking(response.headers));

      // 10. Information Disclosure
      findings.push(...this.checkInformationDisclosure(response.headers, $));

    } catch (error) {
      findings.push({
        category: 'Error',
        severity: 'medium',
        issue: 'Security scan error',
        description: `Error during security analysis: ${error.message}`,
        recommendation: 'Review website accessibility and retry scan'
      });
    }

    return findings;
  }

  /**
   * Check security headers
   */
  checkSecurityHeaders(headers) {
    const findings = [];
    const headerKeys = Object.keys(headers).map(h => h.toLowerCase());

    this.securityHeaders.forEach(header => {
      if (!headerKeys.includes(header)) {
        const severity = this.getHeaderSeverity(header);
        findings.push({
          category: 'Security Headers',
          severity,
          issue: `Missing ${header} header`,
          description: `The ${header} security header is not present`,
          recommendation: this.getHeaderRecommendation(header)
        });
      }
    });

    // Check for insecure header values
    if (headers['x-frame-options'] === 'ALLOWALL') {
      findings.push({
        category: 'Security Headers',
        severity: 'high',
        issue: 'Insecure X-Frame-Options',
        description: 'X-Frame-Options is set to ALLOWALL, allowing clickjacking',
        recommendation: 'Set X-Frame-Options to DENY or SAMEORIGIN'
      });
    }

    return findings;
  }

  /**
   * Check HTTPS usage
   */
  checkHTTPS(url, response) {
    const findings = [];

    if (!URLUtils.isSecure(url)) {
      findings.push({
        category: 'Transport Security',
        severity: 'high',
        issue: 'HTTP instead of HTTPS',
        description: 'Website is not using HTTPS encryption',
        recommendation: 'Implement SSL/TLS certificate and redirect HTTP to HTTPS'
      });
    }

    // Check HSTS header
    const hsts = response.headers['strict-transport-security'];
    if (URLUtils.isSecure(url) && !hsts) {
      findings.push({
        category: 'Transport Security',
        severity: 'medium',
        issue: 'Missing HSTS header',
        description: 'HTTPS site without HTTP Strict Transport Security',
        recommendation: 'Add Strict-Transport-Security header with appropriate max-age'
      });
    }

    return findings;
  }

  /**
   * Check form security
   */
  checkFormSecurity($, baseUrl) {
    const findings = [];
    const forms = DOMParser.getForms($);

    forms.forEach((form, index) => {
      // Check for HTTPS form submission
      if (form.action && form.action.startsWith('http://')) {
        findings.push({
          category: 'Form Security',
          severity: 'high',
          issue: `Form ${index + 1} submits over HTTP`,
          description: 'Form data transmitted without encryption',
          recommendation: 'Use HTTPS for form submissions'
        });
      }

      // Check for password fields without proper attributes
      const passwordFields = form.inputs.filter(input => input.type === 'password');
      passwordFields.forEach((field, fieldIndex) => {
        if (!field.name || field.name.length < 3) {
          findings.push({
            category: 'Form Security',
            severity: 'low',
            issue: `Weak password field naming`,
            description: 'Password field has weak or missing name attribute',
            recommendation: 'Use descriptive names for password fields'
          });
        }
      });

      // Check for forms without CSRF protection indicators
      const hasCSRFToken = form.inputs.some(input => 
        input.name && input.name.toLowerCase().includes('csrf') ||
        input.name && input.name.toLowerCase().includes('token')
      );

      if (form.method === 'POST' && !hasCSRFToken) {
        findings.push({
          category: 'Form Security',
          severity: 'medium',
          issue: `Form ${index + 1} may lack CSRF protection`,
          description: 'POST form without apparent CSRF token',
          recommendation: 'Implement CSRF protection for all state-changing forms'
        });
      }
    });

    return findings;
  }

  /**
   * Check for mixed content
   */
  checkMixedContent($, baseUrl) {
    const findings = [];
    
    if (!URLUtils.isSecure(baseUrl)) {
      return findings; // Only relevant for HTTPS sites
    }

    // Check images
    $('img[src]').each((i, el) => {
      const src = $(el).attr('src');
      if (src && src.startsWith('http://')) {
        findings.push({
          category: 'Mixed Content',
          severity: 'low',
          issue: 'Mixed content in images',
          description: 'HTTP images loaded on HTTPS page',
          recommendation: 'Use HTTPS URLs for all resources'
        });
      }
    });

    // Check scripts
    $('script[src]').each((i, el) => {
      const src = $(el).attr('src');
      if (src && src.startsWith('http://')) {
        findings.push({
          category: 'Mixed Content',
          severity: 'high',
          issue: 'Mixed content in scripts',
          description: 'HTTP scripts loaded on HTTPS page',
          recommendation: 'Use HTTPS URLs for all JavaScript resources'
        });
      }
    });

    return findings;
  }

  /**
   * Check for sensitive information exposure
   */
  checkSensitiveInfo($) {
    const findings = [];
    const sensitivePatterns = [
      { pattern: /password\s*[:=]\s*['"][^'"]+['"]/gi, type: 'Password' },
      { pattern: /api[_\-]?key\s*[:=]\s*['"][^'"]+['"]/gi, type: 'API Key' },
      { pattern: /secret\s*[:=]\s*['"][^'"]+['"]/gi, type: 'Secret' },
      { pattern: /token\s*[:=]\s*['"][^'"]+['"]/gi, type: 'Token' },
      { pattern: /(?:mysql|postgres|mongodb):\/\/[^\s'"]+/gi, type: 'Database Connection' }
    ];

    const pageContent = $.html();
    
    sensitivePatterns.forEach(({ pattern, type }) => {
      const matches = pageContent.match(pattern);
      if (matches && matches.length > 0) {
        findings.push({
          category: 'Information Disclosure',
          severity: 'high',
          issue: `${type} exposed in page content`,
          description: `Potential ${type.toLowerCase()} found in HTML source`,
          recommendation: `Remove ${type.toLowerCase()} from client-side code`
        });
      }
    });

    return findings;
  }

  /**
   * Check cookie security
   */
  checkCookieSecurity(headers) {
    const findings = [];
    const cookies = headers['set-cookie'] || [];

    if (typeof cookies === 'string') {
      cookies = [cookies];
    }

    cookies.forEach((cookie, index) => {
      const cookieLower = cookie.toLowerCase();
      
      if (!cookieLower.includes('secure')) {
        findings.push({
          category: 'Cookie Security',
          severity: 'medium',
          issue: `Cookie ${index + 1} without Secure flag`,
          description: 'Cookie can be transmitted over HTTP',
          recommendation: 'Add Secure flag to all cookies'
        });
      }

      if (!cookieLower.includes('httponly')) {
        findings.push({
          category: 'Cookie Security',
          severity: 'medium',
          issue: `Cookie ${index + 1} without HttpOnly flag`,
          description: 'Cookie accessible via JavaScript',
          recommendation: 'Add HttpOnly flag to prevent XSS cookie theft'
        });
      }

      if (!cookieLower.includes('samesite')) {
        findings.push({
          category: 'Cookie Security',
          severity: 'low',
          issue: `Cookie ${index + 1} without SameSite attribute`,
          description: 'Cookie vulnerable to CSRF attacks',
          recommendation: 'Add SameSite attribute to cookies'
        });
      }
    });

    return findings;
  }

  /**
   * Check input validation patterns
   */
  checkInputValidation($) {
    const findings = [];
    const forms = DOMParser.getForms($);

    forms.forEach((form, formIndex) => {
      form.inputs.forEach((input, inputIndex) => {
        if (input.type === 'text' || input.type === 'email' || !input.type) {
          // Check for client-side validation
          const hasValidation = input.required || 
                               $(`input[name="${input.name}"]`).attr('pattern') ||
                               $(`input[name="${input.name}"]`).attr('maxlength');

          if (!hasValidation) {
            findings.push({
              category: 'Input Validation',
              severity: 'low',
              issue: `Input field without validation`,
              description: `Form ${formIndex + 1}, field ${inputIndex + 1} lacks client-side validation`,
              recommendation: 'Implement proper input validation (client and server-side)'
            });
          }
        }
      });
    });

    return findings;
  }

  /**
   * Check XSS protection
   */
  checkXSSProtection($) {
    const findings = [];
    
    // Check for user input reflection patterns
    const scripts = DOMParser.getScripts($);
    const suspiciousPatterns = [
      /document\.write\s*\(/gi,
      /innerHTML\s*=\s*[^;]+\+/gi,
      /eval\s*\(/gi,
      /setTimeout\s*\(\s*['"]/gi
    ];

    scripts.forEach((script, index) => {
      if (script.inline && script.content) {
        suspiciousPatterns.forEach(pattern => {
          if (pattern.test(script.content)) {
            findings.push({
              category: 'XSS Protection',
              severity: 'medium',
              issue: 'Potentially dangerous JavaScript pattern',
              description: `Script ${index + 1} contains patterns that may be XSS-vulnerable`,
              recommendation: 'Review and sanitize dynamic content generation'
            });
          }
        });
      }
    });

    return findings;
  }

  /**
   * Check clickjacking protection
   */
  checkClickjacking(headers) {
    const findings = [];
    const xFrameOptions = headers['x-frame-options'];
    const csp = headers['content-security-policy'];

    if (!xFrameOptions && !csp?.includes('frame-ancestors')) {
      findings.push({
        category: 'Clickjacking',
        severity: 'medium',
        issue: 'No clickjacking protection',
        description: 'Page can be embedded in frames/iframes',
        recommendation: 'Add X-Frame-Options or CSP frame-ancestors directive'
      });
    }

    return findings;
  }

  /**
   * Check information disclosure
   */
  checkInformationDisclosure(headers, $) {
    const findings = [];

    // Check server header
    const server = headers.server;
    if (server && server.includes('/')) {
      findings.push({
        category: 'Information Disclosure',
        severity: 'low',
        issue: 'Server version disclosure',
        description: `Server header reveals version: ${server}`,
        recommendation: 'Hide server version information'
      });
    }

    // Check for error messages or stack traces
    const pageContent = $.html();
    const errorPatterns = [
      /stack trace/gi,
      /error at line/gi,
      /mysql error/gi,
      /postgresql error/gi,
      /warning.*line \d+/gi
    ];

    errorPatterns.forEach(pattern => {
      if (pattern.test(pageContent)) {
        findings.push({
          category: 'Information Disclosure',
          severity: 'medium',
          issue: 'Error information in page content',
          description: 'Page contains error messages or debug information',
          recommendation: 'Remove debug information from production pages'
        });
      }
    });

    return findings;
  }

  /**
   * Get header severity - aligned with PentestTools ratings
   */
  getHeaderSeverity(header) {
    // Align with PentestTools severity levels (they use mostly 'low' ratings)
    const highSeverityHeaders = [
      'content-security-policy', // Critical for XSS protection
      'strict-transport-security' // Critical for HTTPS security
    ];

    const mediumSeverityHeaders = [
      'x-frame-options' // Important for clickjacking
    ];

    if (highSeverityHeaders.includes(header)) {
      return 'high';
    } else if (mediumSeverityHeaders.includes(header)) {
      return 'medium'; 
    } else {
      return 'medium'; // PentestTools often rates missing headers as 'low', but we'll use medium for consistency
    }
  }

  /**
   * Get header recommendation
   */
  getHeaderRecommendation(header) {
    const recommendations = {
      'strict-transport-security': 'Add HSTS header: Strict-Transport-Security: max-age=31536000; includeSubDomains',
      'content-security-policy': 'Implement CSP header to prevent XSS attacks',
      'x-frame-options': 'Add X-Frame-Options: DENY or SAMEORIGIN',
      'x-content-type-options': 'Add X-Content-Type-Options: nosniff',
      'x-xss-protection': 'Add X-XSS-Protection: 1; mode=block',
      'referrer-policy': 'Add Referrer-Policy: strict-origin-when-cross-origin',
      'permissions-policy': 'Add Permissions-Policy to control browser features'
    };

    return recommendations[header] || `Implement ${header} security header`;
  }
}

module.exports = SecurityScanner;
