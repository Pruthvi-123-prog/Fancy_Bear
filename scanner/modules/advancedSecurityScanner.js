const HttpClient = require('../utils/httpClient');
const DOMParser = require('../utils/domParser');
const URLUtils = require('../utils/urlUtils');
const retire = require('retire');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * Advanced Security Scanner - 100% OWASP Top 10 Coverage
 * Implements professional-grade vulnerability detection
 */
class AdvancedSecurityScanner {
  constructor() {
    this.httpClient = new HttpClient();
    this.vulnerabilityDatabase = this.loadVulnerabilityDB();
    this.payloads = this.loadSecurityPayloads();
    this.userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
    ];
  }

  /**
   * Run comprehensive advanced security scan
   * @param {string} url - Target URL
   * @returns {Promise<Array>} Advanced security findings
   */
  async scan(url) {
    const findings = [];
    const baseUrl = URLUtils.getBase(url);

    try {
      console.log('🔍 Starting Advanced Security Scan...');
      
      // Initial reconnaissance
      const response = await this.httpClient.fetchWithDetails(url);
      if (!response.data) {
        throw new Error('Unable to fetch target website');
      }

      const $ = DOMParser.parse(response.data);

      // A01: Broken Access Control
      findings.push(...await this.scanBrokenAccessControl(url, $, response));
      
      // A02: Cryptographic Failures  
      findings.push(...await this.scanCryptographicFailures(url, response));
      
      // A03: Injection
      findings.push(...await this.scanInjectionVulnerabilities(url, $, response));
      
      // A04: Insecure Design
      findings.push(...await this.scanInsecureDesign(url, $, response));
      
      // A05: Security Misconfiguration
      findings.push(...await this.scanSecurityMisconfiguration(url, response));
      
      // A06: Vulnerable Components
      findings.push(...await this.scanVulnerableComponents(url, $, response));
      
      // A07: Authentication Failures
      findings.push(...await this.scanAuthenticationFailures(url, $, response));
      
      // A08: Software & Data Integrity
      findings.push(...await this.scanSoftwareIntegrityFailures(url, $, response));
      
      // A09: Logging & Monitoring
      findings.push(...await this.scanLoggingMonitoringFailures(url, response));
      
      // A10: Server-Side Request Forgery
      findings.push(...await this.scanSSRFVulnerabilities(url, $, response));

      console.log(`✅ Advanced scan completed: ${findings.length} findings`);
      
    } catch (error) {
      findings.push({
        category: 'Advanced Scan Error',
        severity: 'medium',
        issue: 'Advanced security scan error',
        description: `Error during advanced analysis: ${error.message}`,
        recommendation: 'Review target accessibility and retry scan'
      });
    }

    return findings;
  }

  /**
   * A01: Broken Access Control
   */
  async scanBrokenAccessControl(url, $, response) {
    const findings = [];
    console.log('🔍 Scanning A01: Broken Access Control...');

    try {
      // 1. Directory Traversal Testing
      const traversalPayloads = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32\\drivers\\etc\\hosts',
        '%2e%2e%2f%2e%2e%2f%2e%2e%2f',
        '....//....//....//etc/passwd'
      ];

      for (const payload of traversalPayloads) {
        try {
          const testUrl = `${url}${url.includes('?') ? '&' : '?'}file=${payload}`;
          const testResponse = await this.httpClient.fetchWithDetails(testUrl);
          
          if (testResponse.data && 
              (testResponse.data.includes('root:') || 
               testResponse.data.includes('[drivers]') ||
               testResponse.data.includes('# hosts'))) {
            findings.push({
              category: 'Broken Access Control',
              severity: 'critical',
              issue: 'Directory Traversal Vulnerability',
              description: `Path traversal detected with payload: ${payload}`,
              recommendation: 'Implement proper input validation and file access controls',
              evidence: testResponse.data.substring(0, 200)
            });
          }
        } catch (e) { /* Continue testing other payloads */ }
      }

      // 2. Admin Panel Discovery
      const adminPaths = [
        '/admin', '/admin/', '/administrator', '/admin.php', '/admin.html',
        '/wp-admin', '/cpanel', '/control', '/manager', '/dashboard',
        '/backend', '/adminpanel', '/admin-console', '/admin_area'
      ];

      let accessibleAdminPaths = 0;
      for (const adminPath of adminPaths) {
        try {
          const adminUrl = URLUtils.resolve(url, adminPath);
          const adminResponse = await this.httpClient.fetchWithDetails(adminUrl);
          
          if (adminResponse.status === 200 && 
              !adminResponse.data.includes('login') && 
              !adminResponse.data.includes('unauthorized')) {
            accessibleAdminPaths++;
            findings.push({
              category: 'Broken Access Control',
              severity: 'high',
              issue: 'Accessible Admin Interface',
              description: `Admin panel accessible without authentication: ${adminPath}`,
              recommendation: 'Implement proper authentication for admin interfaces'
            });
          }
        } catch (e) { /* Continue testing */ }
      }

      // 3. HTTP Method Testing
      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS', 'TRACE'];
      const allowedMethods = [];
      
      for (const method of methods) {
        try {
          const response = await this.httpClient.client.request({
            method: method,
            url: url,
            validateStatus: () => true
          });
          
          if (response.status !== 405 && response.status !== 501) {
            allowedMethods.push(method);
          }
        } catch (e) { /* Continue */ }
      }

      if (allowedMethods.includes('PUT') || allowedMethods.includes('DELETE')) {
        findings.push({
          category: 'Broken Access Control',
          severity: 'high',
          issue: 'Dangerous HTTP Methods Enabled',
          description: `Potentially dangerous methods allowed: ${allowedMethods.join(', ')}`,
          recommendation: 'Disable unnecessary HTTP methods on the server'
        });
      }

      // 4. Parameter Pollution Testing
      const forms = DOMParser.getForms($);
      for (const form of forms) {
        for (const input of form.inputs) {
          if (input.name) {
            try {
              const pollutionUrl = `${url}${url.includes('?') ? '&' : '?'}${input.name}=value1&${input.name}=value2`;
              const pollutionResponse = await this.httpClient.fetchWithDetails(pollutionUrl);
              
              // Check for different behavior indicating parameter pollution
              const normalUrl = `${url}${url.includes('?') ? '&' : '?'}${input.name}=value1`;
              const normalResponse = await this.httpClient.fetchWithDetails(normalUrl);
              
              if (pollutionResponse.status !== normalResponse.status ||
                  pollutionResponse.data.length !== normalResponse.data.length) {
                findings.push({
                  category: 'Broken Access Control',
                  severity: 'medium',
                  issue: 'HTTP Parameter Pollution',
                  description: `Parameter pollution detected on parameter: ${input.name}`,
                  recommendation: 'Implement proper parameter handling and validation'
                });
              }
            } catch (e) { /* Continue */ }
          }
        }
      }

    } catch (error) {
      findings.push({
        category: 'Broken Access Control',
        severity: 'low',
        issue: 'Access control scan error',
        description: `Error during access control testing: ${error.message}`,
        recommendation: 'Manual testing recommended for access control issues'
      });
    }

    return findings;
  }

  /**
   * A02: Cryptographic Failures
   */
  async scanCryptographicFailures(url, response) {
    const findings = [];
    console.log('🔍 Scanning A02: Cryptographic Failures...');

    try {
      const urlObj = new URL(url);
      
      // 1. SSL/TLS Analysis
      if (urlObj.protocol === 'https:') {
        try {
          const https = require('https');
          const options = {
            hostname: urlObj.hostname,
            port: urlObj.port || 443,
            path: '/',
            method: 'GET',
            rejectUnauthorized: false // Allow self-signed for analysis
          };

          await new Promise((resolve, reject) => {
            const req = https.request(options, (res) => {
              const cert = res.connection.getPeerCertificate();
              
              if (cert) {
                // Check certificate expiration
                const expiryDate = new Date(cert.valid_to);
                const now = new Date();
                const daysUntilExpiry = (expiryDate - now) / (1000 * 60 * 60 * 24);
                
                if (daysUntilExpiry < 30) {
                  findings.push({
                    category: 'Cryptographic Failures',
                    severity: daysUntilExpiry < 0 ? 'critical' : 'high',
                    issue: 'SSL Certificate Expiring Soon',
                    description: `Certificate expires in ${Math.floor(daysUntilExpiry)} days`,
                    recommendation: 'Renew SSL certificate before expiration'
                  });
                }

                // Check for weak cipher suites
                const cipher = res.connection.getCipher();
                if (cipher && cipher.name) {
                  const weakCiphers = ['RC4', 'DES', 'MD5', 'SHA1'];
                  if (weakCiphers.some(weak => cipher.name.includes(weak))) {
                    findings.push({
                      category: 'Cryptographic Failures',
                      severity: 'high',
                      issue: 'Weak Cipher Suite',
                      description: `Weak cipher detected: ${cipher.name}`,
                      recommendation: 'Configure server to use strong cipher suites only'
                    });
                  }
                }
              }
              resolve();
            });
            
            req.on('error', reject);
            req.setTimeout(5000, () => reject(new Error('Timeout')));
            req.end();
          });
        } catch (e) {
          findings.push({
            category: 'Cryptographic Failures',
            severity: 'medium',
            issue: 'SSL Analysis Error',
            description: 'Unable to analyze SSL certificate details',
            recommendation: 'Manually verify SSL configuration'
          });
        }
      } else {
        findings.push({
          category: 'Cryptographic Failures',
          severity: 'critical',
          issue: 'No HTTPS Encryption',
          description: 'Website uses HTTP instead of HTTPS',
          recommendation: 'Implement SSL/TLS encryption for all connections'
        });
      }

      // 2. Sensitive Data in URLs/Headers
      const sensitivePatterns = [
        { pattern: /[&?]password=[^&\s]+/gi, type: 'Password in URL' },
        { pattern: /[&?]api[_-]?key=[^&\s]+/gi, type: 'API Key in URL' },
        { pattern: /[&?]token=[^&\s]+/gi, type: 'Token in URL' },
        { pattern: /[&?]secret=[^&\s]+/gi, type: 'Secret in URL' }
      ];

      sensitivePatterns.forEach(({ pattern, type }) => {
        if (pattern.test(url)) {
          findings.push({
            category: 'Cryptographic Failures',
            severity: 'high',
            issue: 'Sensitive Data in URL',
            description: `${type} detected in URL parameters`,
            recommendation: 'Use POST requests and secure storage for sensitive data'
          });
        }
      });

      // 3. Weak Random Number Generation Detection
      const randomPatterns = [
        /Math\.random\(\)/gi,
        /new Date\(\)\.getTime\(\)/gi,
        /timestamp/gi
      ];

      if (response.data) {
        randomPatterns.forEach(pattern => {
          if (pattern.test(response.data)) {
            findings.push({
              category: 'Cryptographic Failures',
              severity: 'medium',
              issue: 'Potentially Weak Random Generation',
              description: 'Client-side code may use weak random number generation',
              recommendation: 'Use cryptographically secure random number generators'
            });
          }
        });
      }

    } catch (error) {
      findings.push({
        category: 'Cryptographic Failures',
        severity: 'low',
        issue: 'Cryptographic scan error',
        description: `Error during cryptographic analysis: ${error.message}`,
        recommendation: 'Manual cryptographic security assessment recommended'
      });
    }

    return findings;
  }

  /**
   * A03: Injection Vulnerabilities
   */
  async scanInjectionVulnerabilities(url, $, response) {
    const findings = [];
    console.log('🔍 Scanning A03: Injection Vulnerabilities...');

    try {
      // 1. SQL Injection Testing
      const sqlPayloads = [
        "' OR '1'='1",
        "' OR 1=1--",
        "' UNION SELECT NULL--",
        "'; DROP TABLE users--",
        "' AND (SELECT * FROM (SELECT COUNT(*),CONCAT(version(),FLOOR(RAND(0)*2))x FROM information_schema.tables GROUP BY x)a)--"
      ];

      // Test GET parameters
      const urlParams = new URLSearchParams(new URL(url).search);
      for (const [param, value] of urlParams.entries()) {
        for (const payload of sqlPayloads) {
          try {
            const testUrl = new URL(url);
            testUrl.searchParams.set(param, payload);
            const testResponse = await this.httpClient.fetchWithDetails(testUrl.href);
            
            // Check for SQL error patterns
            const sqlErrorPatterns = [
              /mysql_fetch_array/gi,
              /warning.*mysql/gi,
              /valid mysql result/gi,
              /postgresql.*error/gi,
              /warning.*pg_/gi,
              /valid postgresql result/gi,
              /microsoft.*odbc.*sql server.*driver/gi,
              /syntax error.*line/gi
            ];

            if (testResponse.data) {
              sqlErrorPatterns.forEach(pattern => {
                if (pattern.test(testResponse.data)) {
                  findings.push({
                    category: 'Injection',
                    severity: 'critical',
                    issue: 'SQL Injection Vulnerability',
                    description: `SQL injection detected in parameter: ${param}`,
                    recommendation: 'Use parameterized queries and input validation',
                    evidence: payload
                  });
                }
              });
            }
          } catch (e) { /* Continue testing */ }
        }
      }

      // Test POST forms for SQL injection
      const forms = DOMParser.getForms($);
      for (const form of forms) {
        if (form.method.toUpperCase() === 'POST' && form.action) {
          for (const input of form.inputs) {
            if (input.name && input.type !== 'hidden') {
              for (const payload of sqlPayloads.slice(0, 2)) { // Limit for safety
                try {
                  const formData = new URLSearchParams();
                  form.inputs.forEach(inp => {
                    if (inp.name === input.name) {
                      formData.append(inp.name, payload);
                    } else {
                      formData.append(inp.name, 'test');
                    }
                  });

                  const actionUrl = URLUtils.resolve(url, form.action);
                  const testResponse = await this.httpClient.client.post(actionUrl, formData);
                  
                  if (testResponse.data && 
                      (testResponse.data.includes('mysql_') || 
                       testResponse.data.includes('postgres') ||
                       testResponse.data.includes('sqlite'))) {
                    findings.push({
                      category: 'Injection',
                      severity: 'critical',
                      issue: 'SQL Injection in Form',
                      description: `SQL injection detected in form field: ${input.name}`,
                      recommendation: 'Implement parameterized queries and server-side validation'
                    });
                  }
                } catch (e) { /* Continue */ }
              }
            }
          }
        }
      }

      // 2. XSS Testing
      const xssPayloads = [
        "<script>alert('XSS')</script>",
        "<img src=x onerror=alert('XSS')>",
        "'><script>alert('XSS')</script>",
        "javascript:alert('XSS')",
        "<svg onload=alert('XSS')>",
        "';alert('XSS');//"
      ];

      // Test reflected XSS
      for (const [param, value] of urlParams.entries()) {
        for (const payload of xssPayloads.slice(0, 3)) { // Limit for safety
          try {
            const testUrl = new URL(url);
            testUrl.searchParams.set(param, payload);
            const testResponse = await this.httpClient.fetchWithDetails(testUrl.href);
            
            if (testResponse.data && testResponse.data.includes(payload)) {
              findings.push({
                category: 'Injection',
                severity: 'high',
                issue: 'Reflected XSS Vulnerability',
                description: `Reflected XSS detected in parameter: ${param}`,
                recommendation: 'Implement proper input validation and output encoding',
                evidence: payload
              });
            }
          } catch (e) { /* Continue */ }
        }
      }

      // 3. Command Injection Testing
      const cmdPayloads = [
        "; ls",
        "| dir",
        "&& whoami",
        "; cat /etc/passwd",
        "| type c:\\windows\\system32\\drivers\\etc\\hosts"
      ];

      for (const [param, value] of urlParams.entries()) {
        for (const payload of cmdPayloads.slice(0, 2)) {
          try {
            const testUrl = new URL(url);
            testUrl.searchParams.set(param, `test${payload}`);
            const testResponse = await this.httpClient.fetchWithDetails(testUrl.href);
            
            // Check for command output patterns
            if (testResponse.data && 
                (testResponse.data.includes('root:') || 
                 testResponse.data.includes('# hosts') ||
                 testResponse.data.includes('Volume in drive'))) {
              findings.push({
                category: 'Injection',
                severity: 'critical',
                issue: 'Command Injection Vulnerability',
                description: `Command injection detected in parameter: ${param}`,
                recommendation: 'Avoid system calls with user input; use allowlists',
                evidence: payload
              });
            }
          } catch (e) { /* Continue */ }
        }
      }

      // 4. LDAP Injection Testing
      const ldapPayloads = [
        "*)(uid=*))(|(uid=*",
        "*)(|(password=*))",
        "admin*",
        "admin*)((|userpassword=*))"
      ];

      for (const [param, value] of urlParams.entries()) {
        if (param.toLowerCase().includes('user') || param.toLowerCase().includes('login')) {
          for (const payload of ldapPayloads.slice(0, 2)) {
            try {
              const testUrl = new URL(url);
              testUrl.searchParams.set(param, payload);
              const testResponse = await this.httpClient.fetchWithDetails(testUrl.href);
              
              if (testResponse.data && testResponse.data.includes('ldap')) {
                findings.push({
                  category: 'Injection',
                  severity: 'high',
                  issue: 'Potential LDAP Injection',
                  description: `LDAP injection may be possible in parameter: ${param}`,
                  recommendation: 'Use proper LDAP query escaping and validation'
                });
              }
            } catch (e) { /* Continue */ }
          }
        }
      }

    } catch (error) {
      findings.push({
        category: 'Injection',
        severity: 'low',
        issue: 'Injection scan error',
        description: `Error during injection testing: ${error.message}`,
        recommendation: 'Manual penetration testing recommended for injection vulnerabilities'
      });
    }

    return findings;
  }

  /**
   * A04: Insecure Design
   */
  async scanInsecureDesign(url, $, response) {
    const findings = [];
    console.log('🔍 Scanning A04: Insecure Design...');

    try {
      // 1. Rate Limiting Check (align with PentestTools detection)
      let rateLimitTest = false;
      try {
        const testRequests = [];
        const testUrl = url;
        
        // Send multiple requests quickly
        for (let i = 0; i < 5; i++) { // Reduced from 10 to be less aggressive
          testRequests.push(this.httpClient.fetchWithDetails(testUrl));
        }
        
        const responses = await Promise.allSettled(testRequests);
        const successfulResponses = responses.filter(r => r.status === 'fulfilled' && r.value.status === 200);
        
        // If most requests succeed without rate limiting responses
        if (successfulResponses.length >= 4) {
          // Check if any response indicates rate limiting
          const hasRateLimiting = responses.some(r => 
            r.status === 'fulfilled' && 
            (r.value.status === 429 || 
             r.value.status === 503 ||
             (r.value.headers && (r.value.headers['x-ratelimit-remaining'] || r.value.headers['retry-after'])))
          );
          
          if (!hasRateLimiting) {
            findings.push({
              category: 'Insecure Design',
              severity: 'low', // More conservative severity
              issue: 'Missing rate limiting',
              description: 'No rate limiting detected on rapid requests',
              recommendation: 'Implement rate limiting to prevent abuse and DoS attacks'
            });
          }
        }
      } catch (e) { 
        // If requests fail, rate limiting might be present
      }

      // 2. Business Logic Flaws Detection - more targeted
      const forms = DOMParser.getForms($);
      
      // Check for price manipulation possibilities (only if forms exist)
      if (forms.length > 0) {
        forms.forEach((form, index) => {
          form.inputs.forEach(input => {
            if (input.name && input.type === 'hidden' &&
                (input.name.toLowerCase().includes('price') ||
                 input.name.toLowerCase().includes('amount') ||
                 input.name.toLowerCase().includes('cost') ||
                 input.name.toLowerCase().includes('total'))) {
              findings.push({
                category: 'Insecure Design',
                severity: 'medium',
                issue: 'Business logic flaw: price parameter in form',
                description: `Price/amount field exposed in client-side form: ${input.name}`,
                recommendation: 'Calculate prices server-side; never trust client-side values'
              });
            }
          });
        });
      }

      // 3. Sequential ID Detection - more conservative approach
      const links = DOMParser.getLinks($);
      const idPatterns = [
        /[?&]id=(\d+)/gi,
        /[?&]user_id=(\d+)/gi,
        /[?&]product_id=(\d+)/gi,
        /\/(\d{1,6})(?:\/|$)/gi // Limit to reasonable ID ranges
      ];

      let sequentialIds = [];
      links.forEach(link => {
        if (link.href) {
          idPatterns.forEach(pattern => {
            const matches = [...link.href.matchAll(pattern)];
            matches.forEach(match => {
              const id = parseInt(match[1]);
              if (!isNaN(id) && id > 0 && id < 1000000) { // Reasonable range
                sequentialIds.push(id);
              }
            });
          });
        }
      });

      // Only report if we have enough data and clear sequential pattern
      if (sequentialIds.length >= 10) {
        sequentialIds.sort((a, b) => a - b);
        let sequential = 0;
        for (let i = 1; i < sequentialIds.length; i++) {
          if (sequentialIds[i] === sequentialIds[i-1] + 1) {
            sequential++;
          }
        }

        // Higher threshold for reporting
        if (sequential > sequentialIds.length * 0.5) {
          findings.push({
            category: 'Insecure Design',
            severity: 'low', // More conservative
            issue: 'Sequential identifier usage detected',
            description: `Sequential IDs detected in ${sequential} cases, enabling enumeration attacks`,
            recommendation: 'Use UUIDs or non-sequential identifiers for sensitive resources'
          });
        }
      }

      // 4. Information Leakage in Error Messages - more targeted
      const errorUrls = [
        `${url}/nonexistent-endpoint-test-12345`,
      ];

      for (const errorUrl of errorUrls) {
        try {
          const errorResponse = await this.httpClient.fetchWithDetails(errorUrl);
          if (errorResponse.data && errorResponse.data.length > 100) { // Only significant responses
            const infoLeaks = [
              /stack trace/gi,
              /fatal error.*line \d+/gi,
              /database.*error.*query/gi,
              /warning.*mysql.*line/gi,
              /exception.*at.*line/gi
            ];

            let leakDetected = false;
            infoLeaks.forEach(pattern => {
              if (pattern.test(errorResponse.data)) {
                leakDetected = true;
              }
            });

            if (leakDetected) {
              findings.push({
                category: 'Insecure Design',
                severity: 'low',
                issue: 'Information disclosure in error messages',
                description: 'Error messages contain sensitive system information',
                recommendation: 'Implement custom error pages that don\'t reveal system details'
              });
              break; // Only report once
            }
          }
        } catch (e) { /* Continue */ }
      }

      // 5. Session Management Design Issues - enhanced detection
      const cookies = response.headers['set-cookie'] || [];
      cookies.forEach(cookie => {
        const cookieLower = cookie.toLowerCase();
        
        // Check for session-related cookies
        if (cookieLower.includes('sessionid') || 
            cookieLower.includes('jsessionid') || 
            cookieLower.includes('phpsessid') ||
            cookieLower.includes('aspsessionid')) {
          
          // Extract session ID value
          const sessionMatch = cookie.match(/=([^;]+)/);
          if (sessionMatch && sessionMatch[1]) {
            const sessionId = sessionMatch[1];
            
            // More sophisticated session ID analysis
            const isNumericOnly = /^\d+$/.test(sessionId);
            const isShort = sessionId.length < 16;
            const hasLowEntropy = /^(.)\1+$/.test(sessionId) || // Repeated characters
                                 /^(..)\1+$/.test(sessionId) || // Repeated pairs
                                 sessionId === 'test' || 
                                 sessionId === 'admin';
            
            if (isNumericOnly || isShort || hasLowEntropy) {
              findings.push({
                category: 'Insecure Design',
                severity: 'medium', // Higher severity for session issues
                issue: 'Weak session identifier generation',
                description: `Session ID appears predictable or has low entropy: ${sessionId.substring(0, 10)}...`,
                recommendation: 'Use cryptographically strong session ID generation (minimum 128-bit entropy)'
              });
            }
          }
        }
      });

    } catch (error) {
      findings.push({
        category: 'Insecure Design',
        severity: 'low',
        issue: 'Insecure design scan error',
        description: `Error during design analysis: ${error.message}`,
        recommendation: 'Manual security architecture review recommended'
      });
    }

    return findings;
  }

  /**
   * Load vulnerability database (simplified version)
   */
  loadVulnerabilityDB() {
    return {
      javascript: {
        'jquery': {
          '1.0.0-3.6.3': 'XSS vulnerabilities in various versions',
          '1.0.0-1.11.3': 'Multiple XSS and prototype pollution issues'
        },
        'lodash': {
          '4.0.0-4.17.20': 'Prototype pollution vulnerability'
        },
        'angular': {
          '1.0.0-1.7.8': 'Various XSS and expression injection vulnerabilities'
        }
      }
    };
  }

  /**
   * Load security testing payloads
   */
  loadSecurityPayloads() {
    return {
      sql: [
        "' OR '1'='1", "' OR 1=1--", "' UNION SELECT NULL--",
        "'; DROP TABLE users--", "' AND SLEEP(5)--"
      ],
      xss: [
        "<script>alert('XSS')</script>", "<img src=x onerror=alert('XSS')>",
        "'><script>alert('XSS')</script>", "javascript:alert('XSS')"
      ],
      command: [
        "; ls", "| dir", "&& whoami", "; cat /etc/passwd"
      ],
      ldap: [
        "*)(uid=*))(|(uid=*", "*)(|(password=*))", "admin*"
      ]
    };
  }

  /**
   * A05: Security Misconfiguration
   */
  async scanSecurityMisconfiguration(url, response) {
    const findings = [];
    console.log('🔍 Scanning A05: Security Misconfiguration...');

    try {
      const headers = response.headers || {};

      // Enhanced Security headers check with PentestTools alignment
      const securityHeaders = {
        'strict-transport-security': {
          description: 'HSTS header missing - allows HTTP downgrade attacks',
          severity: 'medium', // Align with PentestTools rating
          recommendation: 'Add Strict-Transport-Security: max-age=31536000; includeSubDomains'
        },
        'content-security-policy': {
          description: 'Content Security Policy missing - XSS vulnerabilities easier to exploit',
          severity: 'medium', // More conservative rating
          recommendation: 'Implement CSP header with appropriate directives'
        },
        'x-frame-options': {
          description: 'X-Frame-Options header missing - clickjacking attacks possible',
          severity: 'medium',
          recommendation: 'Add X-Frame-Options: DENY or SAMEORIGIN'
        },
        'x-content-type-options': {
          description: 'X-Content-Type-Options header missing - MIME sniffing attacks possible',
          severity: 'low', // Align with PentestTools
          recommendation: 'Add X-Content-Type-Options: nosniff'
        },
        'x-xss-protection': {
          description: 'X-XSS-Protection header missing',
          severity: 'low',
          recommendation: 'Add X-XSS-Protection: 1; mode=block'
        },
        'referrer-policy': {
          description: 'Referrer-Policy header missing - information leakage possible',
          severity: 'low', // Align with PentestTools
          recommendation: 'Add Referrer-Policy: strict-origin-when-cross-origin'
        }
      };

      Object.entries(securityHeaders).forEach(([header, config]) => {
        if (!headers[header] && !headers[header.toUpperCase()]) {
          findings.push({
            category: 'Security Misconfiguration',
            severity: config.severity,
            issue: `Missing security header: ${header}`,
            description: config.description,
            recommendation: config.recommendation
          });
        }
      });

      // Server information disclosure (align with PentestTools finding)
      if (headers.server) {
        findings.push({
          category: 'Security Misconfiguration',
          severity: 'info', // Align with PentestTools severity
          issue: 'Server software and technology found',
          description: `Server header reveals: ${headers.server}`,
          recommendation: 'Remove or modify server header to hide version information'
        });
      }

      // Check for powered-by headers (additional info disclosure)
      if (headers['x-powered-by']) {
        findings.push({
          category: 'Security Misconfiguration',
          severity: 'info',
          issue: 'Technology stack disclosure',
          description: `X-Powered-By header reveals: ${headers['x-powered-by']}`,
          recommendation: 'Remove X-Powered-By header to reduce information disclosure'
        });
      }

      // Security.txt file check (align with PentestTools)
      try {
        const securityTxtUrl = URLUtils.resolve(url, '/.well-known/security.txt');
        const securityTxtResponse = await this.httpClient.fetchWithDetails(securityTxtUrl);
        
        if (securityTxtResponse.status === 404) {
          findings.push({
            category: 'Security Misconfiguration',
            severity: 'info', // Align with PentestTools
            issue: 'Security.txt file is missing',
            description: 'No security.txt file found at /.well-known/security.txt',
            recommendation: 'Implement security.txt file according to RFC 9116 for vulnerability disclosure'
          });
        }
      } catch (e) {
        // If we can't check, don't report it as missing
      }

      // Default pages check with more conservative reporting
      const sensitivePages = [
        '/.env',
        '/config.php', 
        '/phpinfo.php',
        '/admin.php'
      ];

      const infoPages = [
        '/robots.txt',
        '/.htaccess', 
        '/web.config',
        '/crossdomain.xml',
        '/sitemap.xml'
      ];

      // Check sensitive pages (higher severity)
      for (const page of sensitivePages) {
        try {
          const pageUrl = URLUtils.resolve(url, page);
          const pageResponse = await this.httpClient.fetchWithDetails(pageUrl);
          
          if (pageResponse.status === 200 && pageResponse.data) {
            findings.push({
              category: 'Security Misconfiguration',
              severity: 'high',
              issue: 'Sensitive configuration file accessible',
              description: `Sensitive file accessible: ${page}`,
              recommendation: 'Restrict access to sensitive configuration files'
            });
          }
        } catch (e) { /* Continue */ }
      }

      // Check info pages (lower severity, align with PentestTools approach)
      for (const page of infoPages) {
        try {
          const pageUrl = URLUtils.resolve(url, page);
          const pageResponse = await this.httpClient.fetchWithDetails(pageUrl);
          
          if (pageResponse.status === 200 && pageResponse.data && pageResponse.data.length > 10) {
            findings.push({
              category: 'Security Misconfiguration',
              severity: 'info',
              issue: 'Information disclosure file accessible',
              description: `Information file accessible: ${page}`,
              recommendation: 'Review if this file should be publicly accessible'
            });
          }
        } catch (e) { /* Continue */ }
      }

      // Enhanced HTTP methods testing
      const dangerousMethods = ['PUT', 'DELETE', 'PATCH', 'TRACE'];
      const allowedDangerousMethods = [];
      
      for (const method of dangerousMethods) {
        try {
          const response = await this.httpClient.client.request({
            method: method,
            url: url,
            validateStatus: () => true,
            timeout: 5000
          });
          
          // Only report if method is actually allowed (not just returning error page)
          if (response.status < 400 && response.status !== 405 && response.status !== 501) {
            allowedDangerousMethods.push(method);
          }
        } catch (e) { /* Continue */ }
      }

      if (allowedDangerousMethods.length > 0) {
        findings.push({
          category: 'Security Misconfiguration',
          severity: 'medium',
          issue: 'Potentially dangerous HTTP methods enabled',
          description: `Methods allowed: ${allowedDangerousMethods.join(', ')}`,
          recommendation: 'Disable unnecessary HTTP methods on the server'
        });
      }

    } catch (error) {
      findings.push({
        category: 'Security Misconfiguration',
        severity: 'low',
        issue: 'Configuration scan error',
        description: `Error during configuration analysis: ${error.message}`,
        recommendation: 'Manual security configuration review recommended'
      });
    }

    return findings;
  }

  /**
   * A06: Vulnerable and Outdated Components
   */
  async scanVulnerableComponents(url, $, response) {
    const findings = [];
    console.log('🔍 Scanning A06: Vulnerable Components...');

    try {
      // JavaScript library detection
      const scripts = $('script[src]').map((i, el) => $(el).attr('src')).get();
      const libraryPatterns = {
        jquery: /jquery[.-](\d+\.\d+\.\d+)/i,
        angular: /angular[.-](\d+\.\d+\.\d+)/i,
        react: /react[.-](\d+\.\d+\.\d+)/i,
        bootstrap: /bootstrap[.-](\d+\.\d+\.\d+)/i,
        lodash: /lodash[.-](\d+\.\d+\.\d+)/i
      };

      scripts.forEach(src => {
        if (src) {
          Object.entries(libraryPatterns).forEach(([lib, pattern]) => {
            const match = src.match(pattern);
            if (match) {
              const version = match[1];
              // Check against known vulnerabilities
              if (this.vulnerabilityDatabase.javascript[lib] && 
                  this.vulnerabilityDatabase.javascript[lib][version]) {
                findings.push({
                  category: 'Vulnerable Components',
                  severity: 'high',
                  issue: `Vulnerable ${lib} Library`,
                  description: `${lib} ${version} has known vulnerabilities`,
                  recommendation: `Update ${lib} to the latest secure version`,
                  evidence: src
                });
              }
            }
          });
        }
      });

      // Check for known vulnerable patterns in HTML
      const vulnerablePatterns = [
        { pattern: /jquery-1\.[0-6]/gi, issue: 'Very old jQuery version detected' },
        { pattern: /angular\.js\/1\.[0-4]/gi, issue: 'Vulnerable AngularJS version' },
        { pattern: /bootstrap\/[23]\./gi, issue: 'Potentially outdated Bootstrap' }
      ];

      vulnerablePatterns.forEach(({ pattern, issue }) => {
        if (response.data && pattern.test(response.data)) {
          findings.push({
            category: 'Vulnerable Components',
            severity: 'medium',
            issue: 'Outdated JavaScript Library',
            description: issue,
            recommendation: 'Update to latest secure versions of all libraries'
          });
        }
      });

    } catch (error) {
      findings.push({
        category: 'Vulnerable Components',
        severity: 'low',
        issue: 'Component scan error',
        description: `Error during component analysis: ${error.message}`,
        recommendation: 'Manual dependency audit recommended'
      });
    }

    return findings;
  }

  /**
   * A07: Identification and Authentication Failures
   */
  async scanAuthenticationFailures(url, $, response) {
    const findings = [];
    console.log('🔍 Scanning A07: Authentication Failures...');

    try {
      // Login form detection and analysis
      const forms = DOMParser.getForms($);
      const loginForms = forms.filter(form => 
        form.inputs.some(input => 
          input.name && (
            input.name.toLowerCase().includes('password') ||
            input.name.toLowerCase().includes('login') ||
            input.name.toLowerCase().includes('user')
          )
        )
      );

      loginForms.forEach((form, index) => {
        // Check for password requirements indication
        const passwordFields = form.inputs.filter(input => 
          input.type === 'password' || 
          (input.name && input.name.toLowerCase().includes('password'))
        );

        if (passwordFields.length > 0) {
          // Check if form has password strength indicators
          const formHtml = $.html($(`form:eq(${index})`));
          const hasStrengthIndicator = /password.*strength|strong.*password|password.*requirements/gi.test(formHtml);
          
          if (!hasStrengthIndicator) {
            findings.push({
              category: 'Authentication Failures',
              severity: 'medium',
              issue: 'Missing Password Strength Requirements',
              description: 'Login form lacks visible password strength requirements',
              recommendation: 'Implement and display password complexity requirements'
            });
          }
        }

        // Check for remember me functionality
        const rememberMeField = form.inputs.find(input => 
          input.name && (
            input.name.toLowerCase().includes('remember') ||
            input.name.toLowerCase().includes('persistent')
          )
        );

        if (rememberMeField) {
          findings.push({
            category: 'Authentication Failures',
            severity: 'low',
            issue: 'Persistent Login Option',
            description: 'Form includes "remember me" functionality',
            recommendation: 'Ensure persistent logins use secure tokens with limited lifetime'
          });
        }
      });

      // Session cookie analysis
      const cookies = response.headers['set-cookie'] || [];
      cookies.forEach(cookie => {
        const cookieLower = cookie.toLowerCase();
        
        if (cookieLower.includes('session') || cookieLower.includes('auth')) {
          // Check for secure flag
          if (!cookieLower.includes('secure')) {
            findings.push({
              category: 'Authentication Failures',
              severity: 'high',
              issue: 'Insecure Session Cookie',
              description: 'Authentication cookie missing Secure flag',
              recommendation: 'Set Secure flag on all authentication cookies'
            });
          }

          // Check for HttpOnly flag
          if (!cookieLower.includes('httponly')) {
            findings.push({
              category: 'Authentication Failures',
              severity: 'medium',
              issue: 'Session Cookie Accessible via JavaScript',
              description: 'Authentication cookie missing HttpOnly flag',
              recommendation: 'Set HttpOnly flag to prevent XSS cookie theft'
            });
          }
        }
      });

      // Check for default credentials hints
      const defaultCredPatterns = [
        /admin.*admin/gi,
        /username.*admin.*password.*admin/gi,
        /default.*login/gi,
        /test.*test/gi
      ];

      if (response.data) {
        defaultCredPatterns.forEach(pattern => {
          if (pattern.test(response.data)) {
            findings.push({
              category: 'Authentication Failures',
              severity: 'high',
              issue: 'Default Credentials Reference',
              description: 'Page contains references to default credentials',
              recommendation: 'Remove default credentials and ensure all accounts use strong passwords'
            });
          }
        });
      }

    } catch (error) {
      findings.push({
        category: 'Authentication Failures',
        severity: 'low',
        issue: 'Authentication scan error',
        description: `Error during authentication analysis: ${error.message}`,
        recommendation: 'Manual authentication security review recommended'
      });
    }

    return findings;
  }

  /**
   * A08: Software and Data Integrity Failures
   */
  async scanSoftwareIntegrityFailures(url, $, response) {
    const findings = [];
    console.log('🔍 Scanning A08: Software & Data Integrity Failures...');

    try {
      // Check for unsigned external scripts
      const scripts = $('script[src]').map((i, el) => $(el).attr('src')).get();
      const externalScripts = scripts.filter(src => 
        src && (src.startsWith('http') || src.startsWith('//')));

      externalScripts.forEach(src => {
        // Check if script has integrity attribute
        const scriptElement = $(`script[src="${src}"]`);
        const hasIntegrity = scriptElement.attr('integrity');
        
        if (!hasIntegrity) {
          findings.push({
            category: 'Software & Data Integrity',
            severity: 'medium',
            issue: 'External Script Without Integrity Check',
            description: `External script loaded without integrity verification: ${src}`,
            recommendation: 'Add integrity attributes (SRI) to all external scripts'
          });
        }
      });

      // Check for external stylesheets without integrity
      const stylesheets = $('link[rel="stylesheet"][href]').map((i, el) => $(el).attr('href')).get();
      const externalStyles = stylesheets.filter(href => 
        href && (href.startsWith('http') || href.startsWith('//')));

      externalStyles.forEach(href => {
        const linkElement = $(`link[href="${href}"]`);
        const hasIntegrity = linkElement.attr('integrity');
        
        if (!hasIntegrity) {
          findings.push({
            category: 'Software & Data Integrity',
            severity: 'low',
            issue: 'External Stylesheet Without Integrity Check',
            description: `External stylesheet loaded without integrity verification: ${href}`,
            recommendation: 'Add integrity attributes to external stylesheets'
          });
        }
      });

      // Check for auto-update mechanisms
      const autoUpdatePatterns = [
        /auto.*update/gi,
        /automatic.*upgrade/gi,
        /update.*check/gi
      ];

      if (response.data) {
        autoUpdatePatterns.forEach(pattern => {
          if (pattern.test(response.data)) {
            findings.push({
              category: 'Software & Data Integrity',
              severity: 'medium',
              issue: 'Automatic Update Mechanism Detected',
              description: 'Application may have automatic update functionality',
              recommendation: 'Ensure automatic updates use signed packages and secure channels'
            });
          }
        });
      }

    } catch (error) {
      findings.push({
        category: 'Software & Data Integrity',
        severity: 'low',
        issue: 'Integrity scan error',
        description: `Error during integrity analysis: ${error.message}`,
        recommendation: 'Manual software integrity review recommended'
      });
    }

    return findings;
  }

  /**
   * A09: Security Logging and Monitoring Failures
   */
  async scanLoggingMonitoringFailures(url, response) {
    const findings = [];
    console.log('🔍 Scanning A09: Logging & Monitoring Failures...');

    try {
      // Check for debug information leakage
      const debugPatterns = [
        /debug.*true/gi,
        /development.*mode/gi,
        /console\.log/gi,
        /var_dump/gi,
        /print_r/gi,
        /debug.*info/gi
      ];

      if (response.data) {
        debugPatterns.forEach(pattern => {
          if (pattern.test(response.data)) {
            findings.push({
              category: 'Logging & Monitoring',
              severity: 'medium',
              issue: 'Debug Information Exposed',
              description: 'Debug information or development mode indicators found',
              recommendation: 'Disable debug mode and remove debug output in production'
            });
          }
        });
      }

      // Check for error handling that might not be logged
      const testUrls = [
        `${url}/admin`,
        `${url}/login?user=admin&pass=wrong`,
        `${url}${url.includes('?') ? '&' : '?'}id=999999`
      ];

      for (const testUrl of testUrls) {
        try {
          const testResponse = await this.httpClient.fetchWithDetails(testUrl);
          
          // Check if errors return detailed information (indicating poor logging practices)
          if (testResponse.status === 403 || testResponse.status === 401) {
            if (testResponse.data && testResponse.data.length > 1000) {
              findings.push({
                category: 'Logging & Monitoring',
                severity: 'low',
                issue: 'Verbose Error Messages',
                description: 'Detailed error messages may indicate insufficient security logging',
                recommendation: 'Implement proper error logging without exposing details to users'
              });
            }
          }
        } catch (e) { /* Continue */ }
      }

    } catch (error) {
      findings.push({
        category: 'Logging & Monitoring',
        severity: 'low',
        issue: 'Logging scan error',
        description: `Error during logging analysis: ${error.message}`,
        recommendation: 'Manual logging and monitoring assessment recommended'
      });
    }

    return findings;
  }

  /**
   * A10: Server-Side Request Forgery (SSRF)
   */
  async scanSSRFVulnerabilities(url, $, response) {
    const findings = [];
    console.log('🔍 Scanning A10: Server-Side Request Forgery...');

    try {
      // Look for URL parameters that might be vulnerable to SSRF
      const urlParams = new URLSearchParams(new URL(url).search);
      const ssrfParams = ['url', 'link', 'src', 'source', 'target', 'redirect', 'proxy'];

      for (const [param, value] of urlParams.entries()) {
        if (ssrfParams.some(ssrfParam => param.toLowerCase().includes(ssrfParam))) {
          // Test with internal IP ranges
          const ssrfPayloads = [
            'http://127.0.0.1',
            'http://localhost',
            'http://169.254.169.254', // AWS metadata
            'http://[::1]',
            'file:///etc/passwd'
          ];

          for (const payload of ssrfPayloads.slice(0, 2)) { // Limit for safety
            try {
              const testUrl = new URL(url);
              testUrl.searchParams.set(param, payload);
              const testResponse = await this.httpClient.fetchWithDetails(testUrl.href);
              
              // Check response time (internal requests might be faster)
              const startTime = Date.now();
              await this.httpClient.fetchWithDetails(testUrl.href);
              const responseTime = Date.now() - startTime;
              
              if (responseTime < 100 && testResponse.status === 200) {
                findings.push({
                  category: 'Server-Side Request Forgery',
                  severity: 'high',
                  issue: 'Potential SSRF Vulnerability',
                  description: `Parameter ${param} might be vulnerable to SSRF attacks`,
                  recommendation: 'Validate and whitelist allowed URLs/IPs; block internal ranges',
                  evidence: payload
                });
              }
            } catch (e) { /* Continue testing */ }
          }
        }
      }

      // Check forms for URL inputs
      const forms = DOMParser.getForms($);
      forms.forEach(form => {
        form.inputs.forEach(input => {
          if (input.name && ssrfParams.some(param => 
              input.name.toLowerCase().includes(param))) {
            findings.push({
              category: 'Server-Side Request Forgery',
              severity: 'medium',
              issue: 'Potential SSRF Vector in Form',
              description: `Form field '${input.name}' accepts URL input`,
              recommendation: 'Implement strict URL validation and IP whitelisting'
            });
          }
        });
      });

    } catch (error) {
      findings.push({
        category: 'Server-Side Request Forgery',
        severity: 'low',
        issue: 'SSRF scan error',
        description: `Error during SSRF testing: ${error.message}`,
        recommendation: 'Manual SSRF testing recommended'
      });
    }

    return findings;
  }
}

module.exports = AdvancedSecurityScanner;
