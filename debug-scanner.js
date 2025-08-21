const { WebsiteScanner } = require('./scanner/index(1)');

async function debugScanner() {
  console.log('🔧 DEBUGGING SCANNER ISSUES');
  console.log('===========================\n');

  const scanner = new WebsiteScanner();
  const targetUrl = 'https://example.com';

  console.log(`🎯 Testing: ${targetUrl}`);

  try {
    console.log('1. Testing basic HTTP client...');
    const HttpClient = require('./scanner/utils/httpClient');
    const httpClient = new HttpClient();
    
    const response = await httpClient.fetchWithDetails(targetUrl);
    console.log(`✅ HTTP Client OK: ${response.status} ${response.statusText}`);
    console.log(`   Headers count: ${Object.keys(response.headers).length}`);
    console.log(`   Data size: ${response.data ? response.data.length : 0} bytes`);

    console.log('\n2. Testing basic security scanner...');
    const SecurityScanner = require('./scanner/modules/securityScanner');
    const secScanner = new SecurityScanner();
    
    const secResults = await secScanner.scan(targetUrl);
    console.log(`✅ Basic Security Scanner OK: ${secResults.length} findings`);
    
    secResults.slice(0, 5).forEach((finding, i) => {
      console.log(`   ${i+1}. [${finding.severity.toUpperCase()}] ${finding.issue}`);
    });

    console.log('\n3. Testing advanced security scanner...');
    const AdvancedSecurityScanner = require('./scanner/modules/advancedSecurityScanner');
    const advScanner = new AdvancedSecurityScanner();
    
    const advResults = await advScanner.scan(targetUrl);
    console.log(`✅ Advanced Security Scanner OK: ${advResults.length} findings`);
    
    advResults.slice(0, 5).forEach((finding, i) => {
      console.log(`   ${i+1}. [${finding.category}] ${finding.issue}`);
    });

    console.log('\n4. Testing full scanner integration...');
    const fullResults = await scanner.runScan(targetUrl, {
      security: true,
      performance: false,
      seo: false,
      accessibility: false
    });

    console.log(`✅ Full Scanner Integration:`);
    console.log(`   Basic Security: ${fullResults.security ? fullResults.security.length : 0} findings`);
    console.log(`   Advanced Security: ${fullResults.advancedSecurity ? fullResults.advancedSecurity.length : 0} findings`);
    console.log(`   Total: ${(fullResults.security || []).length + (fullResults.advancedSecurity || []).length}`);

    if (fullResults.errors && fullResults.errors.length > 0) {
      console.log(`   ❌ Errors: ${fullResults.errors.length}`);
      fullResults.errors.forEach((error, i) => {
        console.log(`      ${i+1}. ${error.category}: ${error.error}`);
      });
    }

    // Show actual findings
    const allFindings = [
      ...(fullResults.security || []),
      ...(fullResults.advancedSecurity || [])
    ];

    console.log('\n📋 ACTUAL FINDINGS:');
    console.log('─'.repeat(20));
    allFindings.forEach((finding, i) => {
      const icon = finding.severity === 'high' ? '🔴' : 
                   finding.severity === 'medium' ? '🟡' : '🟢';
      console.log(`${i+1}. ${icon} [${finding.category}] ${finding.issue}`);
      if (finding.description) {
        console.log(`   Description: ${finding.description.substring(0, 80)}...`);
      }
    });

  } catch (error) {
    console.error(`❌ Debug failed: ${error.message}`);
    console.error('Stack:', error.stack);
  }

  console.log('\n✅ Debug completed!');
}

debugScanner().catch(console.error);
