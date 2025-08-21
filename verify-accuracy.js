const { WebsiteScanner } = require('./scanner/index(1)');
const fs = require('fs');

/**
 * Comprehensive Scanner Accuracy Verification
 * Tests against various websites with known security characteristics
 */

const testTargets = [
  {
    name: "OWASP Juice Shop",
    url: "https://juice-shop.herokuapp.com",
    category: "Intentionally Vulnerable",
    description: "OWASP's intentionally vulnerable web application",
    expectedFindings: {
      "Broken Access Control": "High - Multiple admin bypasses",
      "Injection": "Critical - SQL injection, XSS vulnerabilities", 
      "Cryptographic Failures": "High - Weak password hashing",
      "Insecure Design": "High - Business logic flaws",
      "Security Misconfiguration": "Medium - Missing security headers",
      "Vulnerable Components": "High - Outdated dependencies",
      "Authentication Failures": "High - Weak authentication"
    },
    expectedIssueCount: "50-100+ issues",
    testPurpose: "Verify detection of intentional vulnerabilities"
  },
  {
    name: "WebGoat",
    url: "https://webgoat.herokuapp.com",
    category: "Educational Platform",
    description: "OWASP WebGoat educational platform",
    expectedFindings: {
      "Injection": "Critical - Teaching SQL injection",
      "Broken Access Control": "High - Access control lessons",
      "Security Misconfiguration": "Medium - Demo misconfigurations"
    },
    expectedIssueCount: "30-60 issues",
    testPurpose: "Educational vulnerability verification"
  },
  {
    name: "Damn Vulnerable Web Application",
    url: "http://dvwa.co.uk",
    category: "Penetration Testing",
    description: "Popular vulnerable web application for testing",
    expectedFindings: {
      "Injection": "Critical - SQL injection examples",
      "Broken Access Control": "High - File inclusion",
      "Cryptographic Failures": "Medium - Weak crypto implementations"
    },
    expectedIssueCount: "20-40 issues",
    testPurpose: "Classic penetration testing scenarios"
  },
  {
    name: "HTTPBin.org",
    url: "https://httpbin.org",
    category: "API Testing Service",
    description: "HTTP testing service with various endpoints",
    expectedFindings: {
      "Security Misconfiguration": "Medium - Missing security headers",
      "Insecure Design": "Low - No rate limiting",
      "Software & Data Integrity": "Low - External resources"
    },
    expectedIssueCount: "10-20 issues",
    testPurpose: "Real-world API security assessment"
  },
  {
    name: "BadSSL.com",
    url: "https://badssl.com",
    category: "SSL/TLS Testing",
    description: "SSL/TLS misconfiguration examples",
    expectedFindings: {
      "Cryptographic Failures": "Critical - Various SSL issues",
      "Security Misconfiguration": "High - SSL misconfigurations"
    },
    expectedIssueCount: "5-15 issues",
    testPurpose: "SSL/TLS vulnerability detection"
  },
  {
    name: "TestFire Demo",
    url: "https://demo.testfire.net",
    category: "Banking Demo",
    description: "Altoro Mutual vulnerable banking application",
    expectedFindings: {
      "Injection": "Critical - SQL injection vulnerabilities",
      "Broken Access Control": "High - Authentication bypasses",
      "Insecure Design": "High - Business logic flaws"
    },
    expectedIssueCount: "25-50 issues",
    testPurpose: "Financial application security testing"
  },
  {
    name: "Example.com",
    url: "https://example.com",
    category: "Minimal Test Site",
    description: "Simple static page for baseline testing",
    expectedFindings: {
      "Security Misconfiguration": "Medium - Basic header issues",
      "Insecure Design": "Low - Minimal functionality"
    },
    expectedIssueCount: "5-15 issues",
    testPurpose: "Baseline security assessment"
  },
  {
    name: "GitHub.com",
    url: "https://github.com",
    category: "Well-Secured Site",
    description: "Example of a well-secured modern website",
    expectedFindings: {
      "Security Misconfiguration": "Low - Minor header optimizations",
      "Software & Data Integrity": "Low - External resources"
    },
    expectedIssueCount: "2-8 issues",
    testPurpose: "Verify scanner doesn't create false positives"
  }
];

async function verifyAccuracy() {
  console.log('🔍 SCANNER ACCURACY VERIFICATION');
  console.log('===============================\n');

  const scanner = new WebsiteScanner();
  const results = [];

  console.log('🎯 Test Targets Overview:');
  console.log('─'.repeat(50));
  
  testTargets.forEach((target, index) => {
    console.log(`${index + 1}. ${target.name}`);
    console.log(`   Category: ${target.category}`);
    console.log(`   Expected Issues: ${target.expectedIssueCount}`);
    console.log(`   Purpose: ${target.testPurpose}\n`);
  });

  console.log('🚀 Starting Verification Scans...\n');

  for (const [index, target] of testTargets.entries()) {
    console.log(`\n📍 [${index + 1}/${testTargets.length}] Testing: ${target.name}`);
    console.log(`🌐 URL: ${target.url}`);
    console.log(`📋 Category: ${target.category}`);
    console.log('─'.repeat(60));

    try {
      const startTime = Date.now();
      
      const scanResults = await scanner.runScan(target.url, {
        security: true,
        performance: false, // Focus on security for accuracy verification
        seo: false,
        accessibility: false
      });

      const duration = Date.now() - startTime;
      
      // Analyze results
      const basicIssues = scanResults.security ? scanResults.security.length : 0;
      const advancedIssues = scanResults.advancedSecurity ? scanResults.advancedSecurity.length : 0;
      const totalIssues = basicIssues + advancedIssues;

      // Count OWASP categories found
      const owaspCategories = new Set();
      if (scanResults.advancedSecurity) {
        scanResults.advancedSecurity.forEach(finding => {
          owaspCategories.add(finding.category);
        });
      }

      // Count severity levels
      const severityCount = {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
      };

      const allFindings = [
        ...(scanResults.security || []),
        ...(scanResults.advancedSecurity || [])
      ];

      allFindings.forEach(finding => {
        if (severityCount[finding.severity] !== undefined) {
          severityCount[finding.severity]++;
        }
      });

      // Store results
      const testResult = {
        target: target.name,
        url: target.url,
        category: target.category,
        duration: duration,
        totalIssues: totalIssues,
        basicIssues: basicIssues,
        advancedIssues: advancedIssues,
        owaspCategoriesFound: owaspCategories.size,
        owaspCategories: Array.from(owaspCategories),
        severityBreakdown: severityCount,
        expectedRange: target.expectedIssueCount,
        findings: allFindings.slice(0, 10), // Top 10 findings for analysis
        accuracy: calculateAccuracy(target, totalIssues, owaspCategories)
      };

      results.push(testResult);

      // Display results
      console.log(`\n📊 Results Summary:`);
      console.log(`   ⏱️  Scan Duration: ${duration}ms`);
      console.log(`   🎯 Total Issues: ${totalIssues}`);
      console.log(`   🔒 Basic Security: ${basicIssues} issues`);
      console.log(`   🛡️  Advanced Security: ${advancedIssues} issues`);
      console.log(`   📋 OWASP Categories: ${owaspCategories.size}/10`);
      console.log(`   🚨 Critical: ${severityCount.critical}`);
      console.log(`   🔴 High: ${severityCount.high}`);
      console.log(`   🟡 Medium: ${severityCount.medium}`);
      console.log(`   🟢 Low: ${severityCount.low}`);

      // Show OWASP categories found
      if (owaspCategories.size > 0) {
        console.log(`\n🛡️  OWASP Categories Detected:`);
        Array.from(owaspCategories).forEach(category => {
          const expectedSeverity = target.expectedFindings[category];
          const status = expectedSeverity ? '✅' : '➕';
          console.log(`   ${status} ${category} ${expectedSeverity ? `(Expected: ${expectedSeverity})` : '(Unexpected finding)'}`);
        });
      }

      // Show top findings
      console.log(`\n🔍 Top Security Findings:`);
      allFindings.slice(0, 5).forEach((finding, i) => {
        const severityIcon = finding.severity === 'critical' ? '🚨' :
                             finding.severity === 'high' ? '🔴' :
                             finding.severity === 'medium' ? '🟡' : '🟢';
        console.log(`   ${i+1}. ${severityIcon} [${finding.category}] ${finding.issue}`);
      });

      console.log(`\n📈 Accuracy Assessment: ${testResult.accuracy}`);

    } catch (error) {
      console.error(`❌ Scan failed: ${error.message}`);
      results.push({
        target: target.name,
        url: target.url,
        category: target.category,
        error: error.message,
        accuracy: 'SCAN_FAILED'
      });
    }

    console.log('\n' + '═'.repeat(60));
  }

  // Generate comprehensive report
  generateAccuracyReport(results);
}

function calculateAccuracy(target, totalIssues, owaspCategories) {
  // Simple accuracy calculation based on expected findings
  const expectedCount = parseInt(target.expectedIssueCount.split('-')[0]);
  const maxExpected = parseInt(target.expectedIssueCount.split('-')[1]?.replace('+', '')) || expectedCount * 2;
  
  let score = 0;
  
  // Issue count accuracy (40% weight)
  if (totalIssues >= expectedCount && totalIssues <= maxExpected) {
    score += 40;
  } else if (totalIssues >= expectedCount * 0.5) {
    score += 20;
  }
  
  // OWASP category accuracy (60% weight)
  const expectedCategories = Object.keys(target.expectedFindings).length;
  const categoryAccuracy = Math.min(owaspCategories.size / expectedCategories, 1);
  score += categoryAccuracy * 60;
  
  if (score >= 80) return 'EXCELLENT';
  if (score >= 60) return 'GOOD';
  if (score >= 40) return 'FAIR';
  return 'NEEDS_IMPROVEMENT';
}

function generateAccuracyReport(results) {
  console.log('\n📋 COMPREHENSIVE ACCURACY REPORT');
  console.log('================================\n');

  const report = {
    timestamp: new Date().toISOString(),
    totalTargets: results.length,
    successfulScans: results.filter(r => !r.error).length,
    failedScans: results.filter(r => r.error).length,
    averageIssuesFound: 0,
    averageOWASPCoverage: 0,
    accuracyDistribution: {
      EXCELLENT: 0,
      GOOD: 0,
      FAIR: 0,
      NEEDS_IMPROVEMENT: 0,
      SCAN_FAILED: 0
    },
    findings: results
  };

  const successfulResults = results.filter(r => !r.error);
  
  if (successfulResults.length > 0) {
    report.averageIssuesFound = Math.round(
      successfulResults.reduce((sum, r) => sum + r.totalIssues, 0) / successfulResults.length
    );
    
    report.averageOWASPCoverage = Math.round(
      successfulResults.reduce((sum, r) => sum + r.owaspCategoriesFound, 0) / successfulResults.length
    );
  }

  results.forEach(result => {
    if (report.accuracyDistribution[result.accuracy] !== undefined) {
      report.accuracyDistribution[result.accuracy]++;
    }
  });

  console.log('📊 Summary Statistics:');
  console.log(`   🎯 Total Targets Tested: ${report.totalTargets}`);
  console.log(`   ✅ Successful Scans: ${report.successfulScans}`);
  console.log(`   ❌ Failed Scans: ${report.failedScans}`);
  console.log(`   📈 Average Issues Found: ${report.averageIssuesFound}`);
  console.log(`   🛡️  Average OWASP Coverage: ${report.averageOWASPCoverage}/10`);

  console.log('\n🎯 Accuracy Distribution:');
  Object.entries(report.accuracyDistribution).forEach(([level, count]) => {
    const percentage = Math.round((count / report.totalTargets) * 100);
    const bar = '█'.repeat(Math.floor(percentage / 5));
    console.log(`   ${level.padRight ? level.padEnd(20) : level.padEnd(20, ' ')}: ${count} (${percentage}%) ${bar}`);
  });

  // Save detailed report
  const reportPath = './accuracy-verification-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`\n💾 Detailed report saved to: ${reportPath}`);
  console.log('\n✅ Accuracy verification completed!');
  console.log('\n📋 Recommendations for improving accuracy:');
  
  if (report.accuracyDistribution.EXCELLENT >= report.totalTargets * 0.7) {
    console.log('   🎉 Excellent performance! Scanner is highly accurate.');
  } else {
    console.log('   🔧 Consider tuning detection thresholds for better accuracy.');
    console.log('   📚 Review false positives/negatives in the detailed report.');
    console.log('   🛠️  Add more specific payloads for targeted vulnerabilities.');
  }
}

// Run accuracy verification
verifyAccuracy().catch(console.error);
