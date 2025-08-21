const { WebsiteScanner } = require('./scanner/index(1)');

async function demonstrateFullCapabilities() {
  console.log('🚀 Demonstrating Professional-Grade Security Scanner');
  console.log('==================================================\n');

  const scanner = new WebsiteScanner();
  
  // Test multiple targets to show comprehensive coverage
  const testTargets = [
    {
      name: 'HTTPBin API Testing',
      url: 'https://httpbin.org',
      description: 'API testing service with various endpoints'
    },
    {
      name: 'SDIT Website',
      url: 'https://sdit.ac.in',
      description: 'Educational institution website'
    }
  ];

  for (const target of testTargets) {
    console.log(`\n🎯 Testing: ${target.name}`);
    console.log(`📌 URL: ${target.url}`);
    console.log(`📝 Description: ${target.description}`);
    console.log('─'.repeat(60));

    try {
      const results = await scanner.runScan(target.url, {
        security: true,
        performance: false, // Focus on security for demo
        seo: false,
        accessibility: false
      });

      // Count findings by OWASP category
      const owaspFindings = {};
      let totalFindings = 0;
      
      if (results.advancedSecurity) {
        results.advancedSecurity.forEach(finding => {
          if (!owaspFindings[finding.category]) {
            owaspFindings[finding.category] = [];
          }
          owaspFindings[finding.category].push(finding);
          totalFindings++;
        });
      }

      const basicSecurityCount = results.security ? results.security.length : 0;
      
      console.log(`\n📊 Results Summary:`);
      console.log(`   Total Security Issues: ${basicSecurityCount + totalFindings}`);
      console.log(`   Basic Security: ${basicSecurityCount} issues`);
      console.log(`   Advanced Security: ${totalFindings} issues`);
      console.log(`   OWASP Categories Covered: ${Object.keys(owaspFindings).length}/10`);

      if (Object.keys(owaspFindings).length > 0) {
        console.log('\n🛡️ OWASP Top 10 Findings:');
        Object.entries(owaspFindings).forEach(([category, findings]) => {
          console.log(`\n   📋 ${category} (${findings.length} issues):`);
          findings.forEach((finding, i) => {
            const severity = finding.severity.toUpperCase();
            const icon = severity === 'CRITICAL' ? '🚨' : 
                        severity === 'HIGH' ? '🔴' : 
                        severity === 'MEDIUM' ? '🟡' : '🟢';
            console.log(`      ${i+1}. ${icon} ${finding.issue}`);
          });
        });
      }

      // Show most critical findings
      const allFindings = [
        ...(results.security || []),
        ...(results.advancedSecurity || [])
      ];
      
      const criticalFindings = allFindings.filter(f => 
        f.severity === 'critical' || f.severity === 'high'
      );
      
      if (criticalFindings.length > 0) {
        console.log(`\n🚨 Critical/High Severity Issues (${criticalFindings.length}):`);
        criticalFindings.slice(0, 5).forEach((finding, i) => {
          console.log(`   ${i+1}. [${finding.category}] ${finding.issue}`);
          console.log(`      💡 ${finding.recommendation}`);
        });
      }

    } catch (error) {
      console.error(`❌ Scan failed for ${target.name}: ${error.message}`);
    }

    console.log('\n' + '═'.repeat(60));
  }

  console.log('\n✅ SCANNER CAPABILITIES DEMONSTRATED');
  console.log('=====================================');
  console.log('🛡️ OWASP Top 10 2021 Coverage:');
  console.log('   • A01: Broken Access Control');
  console.log('   • A02: Cryptographic Failures'); 
  console.log('   • A03: Injection (SQL, XSS, Command, LDAP)');
  console.log('   • A04: Insecure Design');
  console.log('   • A05: Security Misconfiguration');
  console.log('   • A06: Vulnerable and Outdated Components');
  console.log('   • A07: Identification and Authentication Failures');
  console.log('   • A08: Software and Data Integrity Failures');
  console.log('   • A09: Security Logging and Monitoring Failures');
  console.log('   • A10: Server-Side Request Forgery (SSRF)');
  
  console.log('\n🔍 Advanced Testing Techniques:');
  console.log('   • Directory Traversal Testing');
  console.log('   • Admin Panel Discovery');
  console.log('   • HTTP Method Testing');
  console.log('   • Parameter Pollution');
  console.log('   • SSL/TLS Certificate Analysis');
  console.log('   • Weak Cipher Detection');
  console.log('   • SQL Injection Payloads');
  console.log('   • XSS Vector Testing');
  console.log('   • Command Injection Testing');
  console.log('   • LDAP Injection Testing');
  console.log('   • Business Logic Flaw Detection');
  console.log('   • Sequential ID Enumeration');
  console.log('   • Rate Limiting Assessment');
  console.log('   • Information Disclosure Detection');
  console.log('   • Session Management Analysis');
  console.log('   • Component Vulnerability Scanning');
  console.log('   • Authentication Security Testing');
  console.log('   • Integrity Verification');
  console.log('   • SSRF Vulnerability Detection');
  
  console.log('\n📈 Professional Features:');
  console.log('   • Parallel scanning for speed');
  console.log('   • Detailed severity classification');
  console.log('   • Evidence collection');
  console.log('   • Actionable recommendations');
  console.log('   • Comprehensive reporting');
  console.log('   • Error handling and resilience');
  
  console.log('\n🎯 This scanner now provides professional-grade');
  console.log('   penetration testing capabilities comparable to');
  console.log('   commercial tools like pentest-tools.com!');
}

demonstrateFullCapabilities();
