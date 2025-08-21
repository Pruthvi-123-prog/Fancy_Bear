const { WebsiteScanner } = require('./scanner/index(1)');

async function testOWASPCoverage() {
  console.log('🛡️ Testing OWASP Top 10 Coverage');
  console.log('================================\n');

  const scanner = new WebsiteScanner();
  
  // Test with a local test page or a reliable target
  const testUrl = 'https://httpbin.org/html';
  
  console.log(`🎯 Testing OWASP coverage on: ${testUrl}`);
  
  try {
    const results = await scanner.runScan(testUrl, {
      security: true,
      performance: false, // Skip to focus on security
      seo: false,
      accessibility: false
    });

    console.log('\n📊 SECURITY SCAN RESULTS');
    console.log('='.repeat(50));
    
    // Show basic security findings
    if (results.security && results.security.length > 0) {
      console.log('\n🔒 Basic Security Issues:');
      results.security.forEach((finding, i) => {
        console.log(`${i+1}. ${finding.severity.toUpperCase()}: ${finding.issue}`);
      });
    }
    
    // Show advanced security findings with OWASP mapping
    if (results.advancedSecurity && results.advancedSecurity.length > 0) {
      console.log('\n🛡️ Advanced Security Issues (OWASP Top 10):');
      
      const owaspMapping = {};
      results.advancedSecurity.forEach(finding => {
        if (!owaspMapping[finding.category]) {
          owaspMapping[finding.category] = [];
        }
        owaspMapping[finding.category].push(finding);
      });
      
      console.log(`\nFound issues in ${Object.keys(owaspMapping).length} OWASP categories:\n`);
      
      Object.entries(owaspMapping).forEach(([category, findings]) => {
        console.log(`📋 ${category}`);
        findings.forEach((finding, i) => {
          console.log(`   ${i+1}. ${finding.severity.toUpperCase()}: ${finding.issue}`);
          console.log(`      ${finding.description}`);
        });
        console.log('');
      });
      
      // Show OWASP Top 10 coverage
      const owaspTop10 = [
        'Broken Access Control',
        'Cryptographic Failures', 
        'Injection',
        'Insecure Design',
        'Security Misconfiguration',
        'Vulnerable Components',
        'Authentication Failures',
        'Software & Data Integrity',
        'Logging & Monitoring',
        'Server-Side Request Forgery'
      ];
      
      console.log('📈 OWASP TOP 10 COVERAGE:');
      console.log('='.repeat(30));
      
      owaspTop10.forEach((category, index) => {
        const found = owaspMapping[category] ? '✅' : '❌';
        const count = owaspMapping[category] ? owaspMapping[category].length : 0;
        console.log(`A0${index + 1}: ${category} ${found} (${count} issues)`);
      });
      
      const coverageCount = Object.keys(owaspMapping).length;
      const coveragePercent = Math.round((coverageCount / 10) * 100);
      
      console.log('\n📊 SUMMARY:');
      console.log(`Coverage: ${coverageCount}/10 categories (${coveragePercent}%)`);
      console.log(`Total security issues: ${(results.security?.length || 0) + (results.advancedSecurity?.length || 0)}`);
      
    } else {
      console.log('\n❌ No advanced security findings - scanner may need debugging');
      
      // Let's manually test one OWASP category
      console.log('\n🔧 Manual OWASP Test:');
      const AdvancedSecurityScanner = require('./scanner/modules/advancedSecurityScanner');
      const advScanner = new AdvancedSecurityScanner();
      
      try {
        const testResults = await advScanner.scan(testUrl);
        console.log(`✅ Manual test found ${testResults.length} issues`);
        
        if (testResults.length > 0) {
          testResults.slice(0, 5).forEach((finding, i) => {
            console.log(`${i+1}. [${finding.category}] ${finding.severity.toUpperCase()}: ${finding.issue}`);
          });
        }
        
      } catch (error) {
        console.log(`❌ Manual test failed: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
  }
}

// Run the coverage test
testOWASPCoverage();
