const { runScan } = require('../index(1)');

/**
 * Basic usage example of the Website Audit Scanner
 */
async function basicScanExample() {
  console.log('🔍 Starting Website Audit Scanner...\n');

  try {
    // Example URLs to scan
    const testUrls = [
      'https://example.com',
      'https://github.com',
      'https://google.com'
    ];

    // Pick the first URL for the example
    const targetUrl = process.argv[2] || testUrls[0];
    
    console.log(`Scanning: ${targetUrl}`);
    console.log('⏳ Running comprehensive audit...\n');

    // Run the scan with all modules enabled
    const results = await runScan(targetUrl, {
      security: true,
      performance: true,
      seo: true,
      accessibility: true
    });

    // Display summary
    console.log('📊 SCAN RESULTS SUMMARY');
    console.log('========================');
    console.log(`URL: ${results.url}`);
    console.log(`Scan Duration: ${results.scanDuration}ms`);
    console.log(`Overall Score: ${results.summary.overallScore}/100`);
    console.log(`Total Issues: ${results.summary.totalIssues}`);
    console.log();

    // Display findings by category
    const categories = ['security', 'performance', 'seo', 'accessibility'];
    categories.forEach(category => {
      const categoryResults = results[category] || [];
      const categoryStats = results.summary.categories[category];
      
      console.log(`${category.toUpperCase()} (${categoryStats.total} findings)`);
      console.log(`  High: ${categoryStats.high} | Medium: ${categoryStats.medium} | Low: ${categoryStats.low} | Info: ${categoryStats.info}`);
      
      // Show top 3 high-severity issues for each category
      const highSeverityIssues = categoryResults.filter(f => f.severity === 'high').slice(0, 3);
      if (highSeverityIssues.length > 0) {
        console.log('  Top Issues:');
        highSeverityIssues.forEach((issue, index) => {
          console.log(`    ${index + 1}. ${issue.issue}`);
          console.log(`       ${issue.recommendation}`);
        });
      }
      console.log();
    });

    // Display top recommendations
    if (results.summary.topRecommendations.length > 0) {
      console.log('🎯 TOP RECOMMENDATIONS');
      console.log('======================');
      results.summary.topRecommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`);
      });
      console.log();
    }

    // Display errors if any
    if (results.errors.length > 0) {
      console.log('⚠️ ERRORS DURING SCAN');
      console.log('=====================');
      results.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.category}: ${error.error}`);
      });
      console.log();
    }

    console.log('✅ Scan completed successfully!');
    console.log('💡 Full results available in the returned JSON object');

    // Optionally save results to file
    if (process.argv.includes('--save')) {
      const fs = require('fs');
      const filename = `scan-results-${Date.now()}.json`;
      fs.writeFileSync(filename, JSON.stringify(results, null, 2));
      console.log(`📁 Results saved to ${filename}`);
    }

    return results;

  } catch (error) {
    console.error('❌ Error during scan:', error.message);
    process.exit(1);
  }
}

/**
 * Example of running specific scans only
 */
async function specificScanExample() {
  console.log('🔍 Running Security + Performance Scan Only...\n');

  try {
    const results = await runScan('https://example.com', {
      security: true,
      performance: true,
      seo: false,
      accessibility: false
    });

    console.log('Security Issues:', results.security.length);
    console.log('Performance Issues:', results.performance.length);
    console.log('Overall Score:', results.summary.overallScore);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run the example
if (require.main === module) {
  // Check command line arguments
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log('Website Audit Scanner - Usage Examples');
    console.log('=====================================');
    console.log('node basic-scan.js [URL] [--save]');
    console.log('');
    console.log('Examples:');
    console.log('  node basic-scan.js https://example.com');
    console.log('  node basic-scan.js https://github.com --save');
    console.log('  node basic-scan.js --help');
    process.exit(0);
  }

  if (args.includes('--specific')) {
    specificScanExample();
  } else {
    basicScanExample();
  }
}

module.exports = {
  basicScanExample,
  specificScanExample
};
