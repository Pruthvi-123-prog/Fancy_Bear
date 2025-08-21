# Website Audit Scanner

A comprehensive website security, performance, SEO, and accessibility scanner built for the MERN hackathon project. This module provides fast, accurate, and modular scanning capabilities designed to integrate with backend APIs.

## 🎯 Features

### Security Analysis (OWASP Top 10 Focused)
- **Security Headers**: CSP, HSTS, X-Frame-Options, etc.
- **HTTPS/TLS**: SSL implementation and configuration
- **Form Security**: CSRF protection, secure transmission
- **Mixed Content**: HTTP resources on HTTPS pages
- **Information Disclosure**: Sensitive data exposure
- **Cookie Security**: Secure, HttpOnly, SameSite attributes
- **Input Validation**: Client-side validation patterns
- **XSS Protection**: Dangerous JavaScript patterns
- **Clickjacking**: Frame-options protection

### Performance Analysis (Lighthouse-Style)
- **Response Time**: Server response performance
- **Resource Analysis**: CSS, JS, image optimization
- **Browser Metrics**: FCP, Load time with Puppeteer
- **Caching**: Cache headers and strategies
- **Compression**: Gzip/Brotli compression
- **HTML Structure**: DOM complexity analysis
- **Memory Usage**: JavaScript heap analysis

### SEO Optimization
- **Meta Tags**: Title, description, viewport
- **Social Media**: Open Graph, Twitter Cards
- **Heading Structure**: H1-H6 hierarchy
- **Image SEO**: Alt text, optimization
- **URL Structure**: Clean URLs, HTTPS
- **Robots.txt**: Crawlability analysis
- **Sitemap**: XML sitemap detection
- **Schema Markup**: Structured data
- **Canonical URLs**: Duplicate content prevention

### Accessibility (WCAG Compliance)
- **Images**: Alt text, decorative images
- **Forms**: Labels, ARIA attributes
- **Links**: Accessible link text
- **Headings**: Semantic structure
- **ARIA**: Landmarks, roles, properties
- **Keyboard Navigation**: Focus management
- **Color Contrast**: Basic contrast checks
- **Media**: Captions, transcripts
- **Tables**: Headers, scope attributes

## 📁 Project Structure

```
scanner/
├── index.js                    # Main entry point and orchestrator
├── package.json               # Dependencies and metadata
├── modules/                   # Individual scanner modules
│   ├── securityScanner.js     # Security analysis
│   ├── performanceScanner.js  # Performance analysis
│   ├── seoScanner.js         # SEO optimization
│   └── accessibilityScanner.js # Accessibility compliance
├── utils/                     # Utility functions
│   ├── httpClient.js         # HTTP request handling
│   ├── domParser.js          # HTML parsing utilities
│   └── urlUtils.js           # URL manipulation
├── examples/                  # Usage examples
│   └── basic-scan.js         # Basic implementation example
└── test/                     # Test files
    └── scanner.test.js       # Test suite
```

## 🚀 Quick Start

### Installation

The scanner is designed to work within your existing project structure:

```bash
# Dependencies are already installed in the main project
# No additional installation needed
```

### Basic Usage

```javascript
const { runScan } = require('./scanner');

// Run comprehensive scan
async function scanWebsite() {
  try {
    const results = await runScan('https://example.com');
    
    console.log(`Overall Score: ${results.summary.overallScore}/100`);
    console.log(`Total Issues: ${results.summary.totalIssues}`);
    
    // Access specific categories
    console.log(`Security Issues: ${results.security.length}`);
    console.log(`Performance Issues: ${results.performance.length}`);
    console.log(`SEO Issues: ${results.seo.length}`);
    console.log(`Accessibility Issues: ${results.accessibility.length}`);
    
  } catch (error) {
    console.error('Scan failed:', error.message);
  }
}

scanWebsite();
```

### Selective Scanning

```javascript
// Run only specific scans for faster results
const results = await runScan('https://example.com', {
  security: true,
  performance: false,  // Skip performance scan
  seo: true,
  accessibility: true
});
```

### Backend Integration

For integration with Express.js controllers:

```javascript
// In your scan controller
const { runScan } = require('../scanner');

async function handleScanRequest(req, res) {
  try {
    const { url, options } = req.body;
    const results = await runScan(url, options);
    
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
}
```

## 📊 Result Structure

The scanner returns a structured JSON object:

```json
{
  "url": "https://example.com",
  "timestamp": "2025-01-01T12:00:00.000Z",
  "scanDuration": 2500,
  "security": [...],      // Security findings
  "performance": [...],   // Performance findings
  "seo": [...],          // SEO findings
  "accessibility": [...], // Accessibility findings
  "summary": {
    "totalIssues": 15,
    "highSeverityIssues": 3,
    "mediumSeverityIssues": 8,
    "lowSeverityIssues": 4,
    "infoItems": 2,
    "overallScore": 75,
    "categories": {
      "security": { "total": 5, "high": 1, "medium": 3, "low": 1, "info": 0 },
      "performance": { "total": 4, "high": 0, "medium": 2, "low": 2, "info": 0 },
      "seo": { "total": 3, "high": 1, "medium": 1, "low": 1, "info": 0 },
      "accessibility": { "total": 3, "high": 1, "medium": 2, "low": 0, "info": 0 }
    },
    "topRecommendations": [
      "Implement HTTPS for better SEO and security",
      "Add proper alt text to images",
      "Fix heading hierarchy"
    ]
  },
  "errors": []
}
```

### Finding Structure

Each finding follows this structure:

```json
{
  "category": "Security Headers",
  "severity": "high",          // high, medium, low, info
  "issue": "Missing CSP header",
  "description": "Content Security Policy header not found",
  "recommendation": "Add CSP header to prevent XSS attacks"
}
```

## 🧪 Testing

### Run Test Suite

```bash
cd scanner
node test/scanner.test.js
```

### Run Smoke Test

```bash
# Quick test with default URL
node test/scanner.test.js --smoke

# Test with custom URL
node test/scanner.test.js --smoke https://github.com
```

### Run Examples

```bash
# Basic scan example
node examples/basic-scan.js https://example.com

# Save results to file
node examples/basic-scan.js https://example.com --save
```

## ⚙️ Configuration Options

### Scan Options

```javascript
const options = {
  security: true,        // Enable security scanning
  performance: true,     // Enable performance scanning
  seo: true,            // Enable SEO scanning
  accessibility: true   // Enable accessibility scanning
};
```

### Performance Considerations

- **Parallel Execution**: All scans run in parallel for speed
- **Timeout Handling**: 30-second timeout for Puppeteer operations
- **Error Isolation**: Individual scan failures don't break the entire process
- **Memory Management**: Puppeteer browser instances are properly closed

## 🔧 Dependencies

- **axios**: HTTP client for web requests
- **cheerio**: Server-side HTML parsing
- **puppeteer**: Headless Chrome for performance metrics
- **lighthouse**: Performance analysis (indirect usage)

## 🎯 Integration with Backend

The scanner is designed to be consumed by `/server/controllers/scanController.js`:

```javascript
// Example controller integration
const { runScan } = require('../../scanner');

exports.scanWebsite = async (req, res) => {
  try {
    const { url } = req.body;
    const results = await runScan(url);
    
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
```

## 🚫 Limitations

- **Static Analysis**: Some security issues require dynamic testing
- **Color Contrast**: Basic detection only; manual verification needed
- **Performance**: Puppeteer requires Chrome/Chromium installation
- **Rate Limiting**: No built-in rate limiting (implement in controller)
- **Authentication**: Cannot scan pages requiring login

## 🔍 Troubleshooting

### Common Issues

1. **Puppeteer Installation**: Ensure Chrome/Chromium is available
2. **Network Timeouts**: Increase timeout for slow websites
3. **Memory Usage**: Monitor heap usage with large websites
4. **CORS Issues**: Some websites block automated requests

### Error Handling

The scanner includes comprehensive error handling:
- Network connection errors
- Invalid URL formats
- Timeout handling
- Graceful degradation when modules fail

## 📝 Example Output

```
🔍 Starting Website Audit Scanner...

Scanning: https://example.com
⏳ Running comprehensive audit...

📊 SCAN RESULTS SUMMARY
========================
URL: https://example.com/
Scan Duration: 2500ms
Overall Score: 78/100
Total Issues: 12

SECURITY (5 findings)
  High: 1 | Medium: 3 | Low: 1 | Info: 0
  Top Issues:
    1. Missing Content Security Policy header
       Add CSP header to prevent XSS attacks

PERFORMANCE (3 findings)  
  High: 0 | Medium: 2 | Low: 1 | Info: 0
  Top Issues:
    1. Multiple CSS files detected
       Consider bundling CSS files to reduce HTTP requests

SEO (2 findings)
  High: 0 | Medium: 1 | Low: 1 | Info: 0

ACCESSIBILITY (2 findings)
  High: 1 | Medium: 1 | Low: 0 | Info: 0
  Top Issues:
    1. Images missing alt attributes
       Add alt attributes to all images

🎯 TOP RECOMMENDATIONS
======================
1. Add CSP header to prevent XSS attacks
2. Add alt attributes to all images
3. Consider bundling CSS files to reduce HTTP requests

✅ Scan completed successfully!
```

## 🤝 Contributing

This scanner is built for the hackathon project. To extend functionality:

1. Add new check functions to existing scanners
2. Create new scanner modules following the same pattern
3. Update the main orchestrator to include new modules
4. Add corresponding tests

## 📄 License

MIT License - Built for educational and hackathon purposes.
