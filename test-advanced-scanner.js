const { WebsiteScanner } = require('./scanner/index(1)');

async function testAdvancedScanner() {
  console.log('🚀 Testing Advanced Website Security Scanner');
  console.log('============================================\n');

  const scanner = new WebsiteScanner();
  
  // Test URLs - Choose one to scan
  const testUrls = [
    'https://example.com',           // Basic test site
    'https://httpbin.org',          // API testing site with various endpoints
    'https://demo.testfire.net',    // Intentionally vulnerable test site
    'https://juice-shop.herokuapp.com', // OWASP Juice Shop
    'https://sdit.ac.in'           // Previous test target
  ];

  console.log('Available test targets:');
  testUrls.forEach((url, index) => {
    console.log(`${index + 1}. ${url}`);
  });

  // Default to example.com for faster testing
  const targetUrl = testUrls[0]; // example.com
  
  console.log(`\n🎯 Scanning: ${targetUrl}`);
  console.log('─'.repeat(50));

  try {
    const startTime = Date.now();
    
    const results = await scanner.runScan(targetUrl, {
      security: true,
      performance: true,
      seo: true,
      accessibility: true
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log('\n📊 SCAN RESULTS');
    console.log('='.repeat(50));
    console.log(`🌐 URL: ${results.url}`);
    console.log(`⏱️ Duration: ${duration}ms`);
    console.log(`📅 Timestamp: ${results.timestamp}`);
    
    console.log('\n📈 SUMMARY');
    console.log('─'.repeat(30));
    console.log(`Total Issues: ${results.summary.totalIssues}`);
    console.log(`🔴 High Severity: ${results.summary.highSeverityIssues}`);
    console.log(`🟡 Medium Severity: ${results.summary.mediumSeverityIssues}`);
    console.log(`🟢 Low Severity: ${results.summary.lowSeverityIssues}`);
    console.log(`ℹ️ Info Items: ${results.summary.infoItems}`);

    console.log('\n🔍 DETAILED FINDINGS BY CATEGORY');
    console.log('='.repeat(50));

    // Basic Security Findings
    if (results.security && results.security.length > 0) {
      console.log('\n🔒 BASIC SECURITY SCAN');
      console.log('─'.repeat(25));
      results.security.forEach((finding, index) => {
        const severityIcon = getSeverityIcon(finding.severity);
        console.log(`${index + 1}. ${severityIcon} ${finding.issue}`);
        console.log(`   Category: ${finding.category}`);
        console.log(`   Description: ${finding.description}`);
        console.log(`   Recommendation: ${finding.recommendation}`);
        if (finding.evidence) {
          console.log(`   Evidence: ${finding.evidence}`);
        }
        console.log('');
      });
    }

    // Advanced Security Findings
    console.log(`\n🛡️ ADVANCED SECURITY SCAN (OWASP Top 10)`);
    console.log(`Advanced security findings: ${results.advancedSecurity ? results.advancedSecurity.length : 0}`);
    
    if (results.advancedSecurity && results.advancedSecurity.length > 0) {
      console.log('─'.repeat(45));
      
      // Group by OWASP category
      const owaspCategories = {};
      results.advancedSecurity.forEach(finding => {
        if (!owaspCategories[finding.category]) {
          owaspCategories[finding.category] = [];
        }
        owaspCategories[finding.category].push(finding);
      });

      console.log(`Found ${Object.keys(owaspCategories).length} OWASP categories`);

      Object.entries(owaspCategories).forEach(([category, findings]) => {
        console.log(`\n📋 ${category.toUpperCase()}`);
        console.log('   ' + '─'.repeat(category.length + 2));
        
        findings.forEach((finding, index) => {
          const severityIcon = getSeverityIcon(finding.severity);
          console.log(`   ${index + 1}. ${severityIcon} ${finding.issue}`);
          console.log(`      ${finding.description}`);
          console.log(`      💡 ${finding.recommendation}`);
          if (finding.evidence) {
            console.log(`      🔍 Evidence: ${finding.evidence.substring(0, 100)}...`);
          }
          console.log('');
        });
      });
    } else {
      console.log('No advanced security findings or scan failed to run properly');
    }

    // Performance Findings
    if (results.performance && results.performance.length > 0) {
      console.log('\n⚡ PERFORMANCE ANALYSIS');
      console.log('─'.repeat(25));
      results.performance.forEach((finding, index) => {
        const severityIcon = getSeverityIcon(finding.severity);
        console.log(`${index + 1}. ${severityIcon} ${finding.issue}`);
        console.log(`   ${finding.description}`);
        console.log(`   💡 ${finding.recommendation}`);
        console.log('');
      });
    }

    // SEO Findings
    if (results.seo && results.seo.length > 0) {
      console.log('\n🔍 SEO ANALYSIS');
      console.log('─'.repeat(15));
      results.seo.forEach((finding, index) => {
        const severityIcon = getSeverityIcon(finding.severity);
        console.log(`${index + 1}. ${severityIcon} ${finding.issue}`);
        console.log(`   ${finding.description}`);
        console.log(`   💡 ${finding.recommendation}`);
        console.log('');
      });
    }

    // Accessibility Findings
    if (results.accessibility && results.accessibility.length > 0) {
      console.log('\n♿ ACCESSIBILITY ANALYSIS');
      console.log('─'.repeat(25));
      results.accessibility.forEach((finding, index) => {
        const severityIcon = getSeverityIcon(finding.severity);
        console.log(`${index + 1}. ${severityIcon} ${finding.issue}`);
        console.log(`   ${finding.description}`);
        console.log(`   💡 ${finding.recommendation}`);
        console.log('');
      });
    }

    // Error reporting
    if (results.errors && results.errors.length > 0) {
      console.log('\n❌ SCAN ERRORS');
      console.log('─'.repeat(15));
      results.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.category}: ${error.error}`);
      });
    }

    console.log('\n✅ Advanced security scan completed successfully!');
    console.log(`🎯 Total vulnerabilities found: ${results.summary.totalIssues}`);
    
    // Calculate OWASP coverage
    const owaspCategories = new Set();
    if (results.advancedSecurity) {
      results.advancedSecurity.forEach(finding => {
        owaspCategories.add(finding.category);
      });
    }
    
    const coveragePercentage = Math.round((owaspCategories.size / 10) * 100);
    console.log(`🛡️ OWASP Top 10 Coverage: ${coveragePercentage}% (${owaspCategories.size}/10 categories)`);

  } catch (error) {
    console.error('❌ Scan failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

function getSeverityIcon(severity) {
  const icons = {
    'critical': '🚨',
    'high': '🔴',
    'medium': '🟡',
    'low': '🟢',
    'info': 'ℹ️'
  };
  return icons[severity] || '❓';
}

// Run the test
testAdvancedScanner();
