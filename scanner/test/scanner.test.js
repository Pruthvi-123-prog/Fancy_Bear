const { runScan, WebsiteScanner } = require('../index(1)');

/**
 * Simple test suite for the Website Audit Scanner
 */
class ScannerTest {
  constructor() {
    this.testResults = [];
  }

  async runTests() {
    console.log('🧪 Running Website Audit Scanner Tests');
    console.log('======================================\n');

    const tests = [
      this.testBasicScan,
      this.testInvalidUrl,
      this.testSpecificScans,
      this.testScannerInfo,
      this.testUrlNormalization
    ];

    for (const test of tests) {
      try {
        await test.call(this);
      } catch (error) {
        this.fail(`${test.name} - ${error.message}`);
      }
    }

    this.displayResults();
  }

  async testBasicScan() {
    console.log('⏳ Testing basic scan functionality...');
    
    const results = await runScan('example.com'); // Should normalize to https://example.com
    
    this.assert(results.url === 'https://example.com/', 'URL normalization failed');
    this.assert(typeof results.timestamp === 'string', 'Timestamp missing');
    this.assert(typeof results.scanDuration === 'number', 'Scan duration missing');
    this.assert(Array.isArray(results.security), 'Security results not array');
    this.assert(Array.isArray(results.performance), 'Performance results not array');
    this.assert(Array.isArray(results.seo), 'SEO results not array');
    this.assert(Array.isArray(results.accessibility), 'Accessibility results not array');
    this.assert(typeof results.summary === 'object', 'Summary missing');
    this.assert(typeof results.summary.overallScore === 'number', 'Overall score missing');
    
    this.pass('Basic scan functionality');
  }

  async testInvalidUrl() {
    console.log('⏳ Testing invalid URL handling...');
    
    try {
      await runScan('not-a-valid-url');
      this.fail('Should throw error for invalid URL');
    } catch (error) {
      this.assert(error.message.includes('Invalid URL format'), 'Wrong error message for invalid URL');
      this.pass('Invalid URL handling');
    }
  }

  async testSpecificScans() {
    console.log('⏳ Testing specific scan modules...');
    
    // Test security-only scan
    const securityOnly = await runScan('https://httpbin.org', {
      security: true,
      performance: false,
      seo: false,
      accessibility: false
    });

    this.assert(Array.isArray(securityOnly.security), 'Security scan failed');
    this.assert(securityOnly.performance.length === 0, 'Performance should be empty');
    this.assert(securityOnly.seo.length === 0, 'SEO should be empty');
    this.assert(securityOnly.accessibility.length === 0, 'Accessibility should be empty');

    this.pass('Specific scan modules');
  }

  async testScannerInfo() {
    console.log('⏳ Testing scanner information...');
    
    const scanner = new WebsiteScanner();
    const info = scanner.getInfo();
    
    this.assert(typeof info.name === 'string', 'Scanner name missing');
    this.assert(typeof info.version === 'string', 'Scanner version missing');
    this.assert(Array.isArray(info.capabilities), 'Capabilities not array');
    this.assert(info.capabilities.length > 0, 'No capabilities listed');
    
    this.pass('Scanner information');
  }

  async testUrlNormalization() {
    console.log('⏳ Testing URL normalization...');
    
    const scanner = new WebsiteScanner();
    
    const testCases = [
      { input: 'example.com', expected: 'https://example.com/' },
      { input: 'http://example.com', expected: 'http://example.com/' },
      { input: 'https://example.com/path', expected: 'https://example.com/path' }
    ];

    testCases.forEach(({ input, expected }) => {
      const normalized = scanner.normalizeUrl(input);
      this.assert(normalized === expected, `URL normalization failed for ${input}: got ${normalized}, expected ${expected}`);
    });

    this.pass('URL normalization');
  }

  // Test helper methods
  assert(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  }

  pass(testName) {
    this.testResults.push({ name: testName, status: 'PASS' });
    console.log(`✅ ${testName} - PASSED\n`);
  }

  fail(testName) {
    this.testResults.push({ name: testName, status: 'FAIL' });
    console.log(`❌ ${testName} - FAILED\n`);
  }

  displayResults() {
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('=======================');
    
    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const total = this.testResults.length;
    
    console.log(`Tests Passed: ${passed}/${total}`);
    
    if (passed === total) {
      console.log('🎉 All tests passed!');
    } else {
      console.log('⚠️ Some tests failed:');
      this.testResults.filter(r => r.status === 'FAIL').forEach(test => {
        console.log(`  - ${test.name}`);
      });
    }
  }
}

/**
 * Run quick smoke test
 */
async function smokeTest(url = 'https://httpbin.org') {
  console.log(`🔥 Running smoke test on ${url}...`);
  
  try {
    const start = Date.now();
    const results = await runScan(url, {
      security: true,
      performance: false, // Skip performance to avoid Puppeteer dependencies
      seo: true,
      accessibility: true
    });
    
    const duration = Date.now() - start;
    
    console.log(`✅ Smoke test completed in ${duration}ms`);
    console.log(`   Found ${results.summary.totalIssues} total issues`);
    console.log(`   Overall score: ${results.summary.overallScore}/100`);
    
    return results;
    
  } catch (error) {
    console.error(`❌ Smoke test failed: ${error.message}`);
    throw error;
  }
}

// Run tests if called directly
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--smoke')) {
    smokeTest(args[1]);
  } else if (args.includes('--help')) {
    console.log('Website Audit Scanner - Test Suite');
    console.log('==================================');
    console.log('node scanner.test.js           # Run full test suite');
    console.log('node scanner.test.js --smoke   # Run quick smoke test');
    console.log('node scanner.test.js --smoke [URL]  # Smoke test with custom URL');
  } else {
    const tester = new ScannerTest();
    tester.runTests();
  }
}

module.exports = {
  ScannerTest,
  smokeTest
};
