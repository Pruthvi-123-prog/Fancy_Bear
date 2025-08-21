/**
 * Demo: Backend Integration Example
 * 
 * This demonstrates how the scanner would be integrated into 
 * a backend controller (e.g., /server/controllers/scanController.js)
 */

const { scanWebsite, isValidUrl, getScannerInfo } = require('./scanner-entry');

/**
 * Example Express.js controller methods
 * These would typically be in /server/controllers/scanController.js
 */

/**
 * POST /api/scan
 * Scan a website and return comprehensive audit results
 */
async function handleScanRequest(req, res) {
  try {
    const { url, options = {} } = req.body;
    
    // Validate input
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required'
      });
    }
    
    if (!isValidUrl(url)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid URL format'
      });
    }
    
    console.log(`🔍 Starting scan for: ${url}`);
    
    // Run the scan
    const results = await scanWebsite(url, options);
    
    console.log(`✅ Scan completed in ${results.scanDuration}ms`);
    console.log(`📊 Found ${results.summary.totalIssues} issues`);
    
    // Return results
    res.json({
      success: true,
      data: results
    });
    
  } catch (error) {
    console.error('❌ Scan failed:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * GET /api/scanner-info
 * Get information about the scanner capabilities
 */
function handleInfoRequest(req, res) {
  try {
    const info = getScannerInfo();
    
    res.json({
      success: true,
      data: info
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * POST /api/quick-scan
 * Run a quick security + SEO scan only (faster results)
 */
async function handleQuickScan(req, res) {
  try {
    const { url } = req.body;
    
    if (!isValidUrl(url)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid URL format'
      });
    }
    
    // Quick scan - security and SEO only
    const results = await scanWebsite(url, {
      security: true,
      performance: false,  // Skip for speed
      seo: true,
      accessibility: false  // Skip for speed
    });
    
    res.json({
      success: true,
      data: results
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * Demo function - shows how the integration would work
 */
async function runDemo() {
  console.log('🎯 Backend Integration Demo');
  console.log('===========================\n');
  
  // Simulate a request object
  const mockRequest = {
    body: {
      url: 'example.com',
      options: {
        security: true,
        performance: false,  // Skip puppeteer for demo
        seo: true,
        accessibility: true
      }
    }
  };
  
  // Simulate a response object
  const mockResponse = {
    json: (data) => {
      console.log('📤 Response sent:');
      console.log(JSON.stringify(data, null, 2));
    },
    status: (code) => ({
      json: (data) => {
        console.log(`❌ Error response (${code}):`);
        console.log(JSON.stringify(data, null, 2));
      }
    })
  };
  
  // Run the demo
  console.log('📥 Received request:', JSON.stringify(mockRequest.body, null, 2));
  console.log();
  
  await handleScanRequest(mockRequest, mockResponse);
}

/**
 * Express.js route setup example
 * This is how you would set up routes in your Express app
 */
function setupRoutes(app) {
  // Main scan endpoint
  app.post('/api/scan', handleScanRequest);
  
  // Scanner info endpoint  
  app.get('/api/scanner-info', handleInfoRequest);
  
  // Quick scan endpoint
  app.post('/api/quick-scan', handleQuickScan);
  
  console.log('✅ Scanner routes configured:');
  console.log('   POST /api/scan - Full website audit');
  console.log('   POST /api/quick-scan - Quick security + SEO scan');
  console.log('   GET  /api/scanner-info - Scanner capabilities');
}

// Export for use in actual controllers
module.exports = {
  handleScanRequest,
  handleInfoRequest,
  handleQuickScan,
  setupRoutes
};

// Run demo if called directly
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help')) {
    console.log('Backend Integration Demo');
    console.log('=======================');
    console.log('node backend-integration-demo.js        # Run integration demo');
    console.log('node backend-integration-demo.js --help  # Show this help');
  } else {
    runDemo().catch(console.error);
  }
}

/**
 * INTEGRATION INSTRUCTIONS FOR BACKEND:
 * 
 * 1. Copy /scanner/ folder to your project root
 * 2. Copy scanner-entry.js to your project root  
 * 3. In /server/controllers/scanController.js:
 * 
 *    const { scanWebsite, isValidUrl } = require('../../scanner-entry');
 *    
 *    exports.scanWebsite = async (req, res) => {
 *      try {
 *        const { url, options } = req.body;
 *        
 *        if (!isValidUrl(url)) {
 *          return res.status(400).json({ 
 *            success: false, 
 *            error: 'Invalid URL' 
 *          });
 *        }
 *        
 *        const results = await scanWebsite(url, options);
 *        res.json({ success: true, data: results });
 *        
 *      } catch (error) {
 *        res.status(500).json({ 
 *          success: false, 
 *          error: error.message 
 *        });
 *      }
 *    };
 * 
 * 4. Set up routes in your Express app to call these controllers
 * 
 * 5. Frontend can then POST to /api/scan with { url: "example.com" }
 */
