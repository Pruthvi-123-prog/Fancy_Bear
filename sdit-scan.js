/**
 * Custom scan script for sdit.ac.in
 * Demonstrates different ways to scan the website
 */

const { scanWebsite, getScannerInfo } = require('./scanner-entry');

async function scanSDIT() {
  console.log('🎓 Scanning SDIT Website (https://sdit.ac.in)');
  console.log('==============================================\n');

  try {
    // 1. Full comprehensive scan
    console.log('🔍 Running comprehensive audit...');
    const fullScan = await scanWebsite('https://sdit.ac.in');
    
    console.log('📊 COMPREHENSIVE SCAN RESULTS:');
    console.log(`   Overall Score: ${fullScan.summary.overallScore}/100`);
    console.log(`   Total Issues: ${fullScan.summary.totalIssues}`);
    console.log(`   Scan Duration: ${fullScan.scanDuration}ms`);
    console.log('   Category Breakdown:');
    console.log(`     🔒 Security: ${fullScan.summary.categories.security.total} issues (${fullScan.summary.categories.security.high} high)`);
    console.log(`     ⚡ Performance: ${fullScan.summary.categories.performance.total} issues (${fullScan.summary.categories.performance.high} high)`);
    console.log(`     📈 SEO: ${fullScan.summary.categories.seo.total} issues (${fullScan.summary.categories.seo.high} high)`);
    console.log(`     ♿ Accessibility: ${fullScan.summary.categories.accessibility.total} issues (${fullScan.summary.categories.accessibility.high} high)`);
    console.log();

    // 2. Security-focused scan
    console.log('🔒 Running security-focused scan...');
    const securityScan = await scanWebsite('https://sdit.ac.in', {
      security: true,
      performance: false,
      seo: false,
      accessibility: false
    });

    console.log('🛡️ TOP SECURITY ISSUES:');
    const highSecurityIssues = securityScan.security.filter(issue => issue.severity === 'high');
    highSecurityIssues.forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue.issue}`);
      console.log(`      💡 ${issue.recommendation}`);
    });
    console.log();

    // 3. SEO-focused scan
    console.log('📈 Running SEO-focused scan...');
    const seoScan = await scanWebsite('https://sdit.ac.in', {
      security: false,
      performance: false,
      seo: true,
      accessibility: false
    });

    console.log('📊 TOP SEO ISSUES:');
    const highSEOIssues = seoScan.seo.filter(issue => issue.severity === 'high');
    highSEOIssues.forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue.issue}`);
      console.log(`      💡 ${issue.recommendation}`);
    });
    console.log();

    // 4. Quick scan comparison
    console.log('⚡ Quick scan vs Full scan comparison:');
    const quickScan = await scanWebsite('https://sdit.ac.in', {
      security: true,
      performance: false, // Skip performance for speed
      seo: true,
      accessibility: false
    });

    console.log(`   Full Scan:  ${fullScan.scanDuration}ms - ${fullScan.summary.totalIssues} issues`);
    console.log(`   Quick Scan: ${quickScan.scanDuration}ms - ${quickScan.summary.totalIssues} issues`);
    console.log(`   Speed gain: ${Math.round((fullScan.scanDuration - quickScan.scanDuration) / fullScan.scanDuration * 100)}% faster`);
    console.log();

    // 5. Top recommendations summary
    console.log('🎯 PRIORITY RECOMMENDATIONS FOR SDIT:');
    console.log('=====================================');
    fullScan.summary.topRecommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });
    console.log();

    // 6. Export results
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `sdit-audit-${timestamp}.json`;
    
    require('fs').writeFileSync(filename, JSON.stringify(fullScan, null, 2));
    console.log(`📁 Full results saved to: ${filename}`);
    
    return fullScan;

  } catch (error) {
    console.error('❌ Scan failed:', error.message);
  }
}

// Additional utility functions
async function quickSecurityCheck(url = 'https://sdit.ac.in') {
  console.log(`🔒 Quick Security Check for ${url}`);
  
  const results = await scanWebsite(url, { 
    security: true, 
    performance: false, 
    seo: false, 
    accessibility: false 
  });
  
  const criticalIssues = results.security.filter(issue => issue.severity === 'high');
  
  console.log(`Found ${criticalIssues.length} critical security issues:`);
  criticalIssues.forEach((issue, i) => {
    console.log(`  ${i+1}. ${issue.issue}`);
  });
  
  return results;
}

async function seoHealthCheck(url = 'https://sdit.ac.in') {
  console.log(`📈 SEO Health Check for ${url}`);
  
  const results = await scanWebsite(url, { 
    security: false, 
    performance: false, 
    seo: true, 
    accessibility: false 
  });
  
  const criticalSEOIssues = results.seo.filter(issue => issue.severity === 'high');
  
  console.log(`SEO Score Impact: ${criticalSEOIssues.length} critical issues found`);
  criticalSEOIssues.forEach((issue, i) => {
    console.log(`  ${i+1}. ${issue.issue}`);
  });
  
  return results;
}

// Export functions
module.exports = {
  scanSDIT,
  quickSecurityCheck,
  seoHealthCheck
};

// Run if called directly
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--security')) {
    quickSecurityCheck();
  } else if (args.includes('--seo')) {
    seoHealthCheck();
  } else if (args.includes('--help')) {
    console.log('SDIT Website Scanner');
    console.log('===================');
    console.log('node sdit-scan.js            # Full comprehensive scan');
    console.log('node sdit-scan.js --security # Security-only scan');
    console.log('node sdit-scan.js --seo      # SEO-only scan');
    console.log('node sdit-scan.js --help     # Show this help');
  } else {
    scanSDIT();
  }
}
