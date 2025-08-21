const puppeteer = require('puppeteer');
const HttpClient = require('../utils/httpClient');
const DOMParser = require('../utils/domParser');
const URLUtils = require('../utils/urlUtils');

/**
 * Performance scanning module - Lighthouse-style checks
 */
class PerformanceScanner {
  constructor() {
    this.httpClient = new HttpClient();
  }

  /**
   * Run complete performance scan
   * @param {string} url - Target URL
   * @returns {Promise<Array>} Performance findings
   */
  async scan(url) {
    const findings = [];

    try {
      // Basic HTTP performance check
      const start = Date.now();
      const response = await this.httpClient.fetch(url);
      const responseTime = Date.now() - start;

      if (!response.data) {
        findings.push({
          category: 'Connection',
          severity: 'high',
          issue: 'Unable to fetch website',
          description: 'Website could not be loaded for performance analysis',
          recommendation: 'Check website availability and network connectivity'
        });
        return findings;
      }

      const $ = DOMParser.parse(response.data);

      // 1. Response Time Analysis
      findings.push(...this.analyzeResponseTime(responseTime));

      // 2. Resource Analysis
      findings.push(...this.analyzeResources($, url));

      // 3. Image Optimization
      findings.push(...this.analyzeImages($, url));

      // 4. CSS Analysis
      findings.push(...this.analyzeCSS($));

      // 5. JavaScript Analysis
      findings.push(...this.analyzeJavaScript($));

      // 6. HTML Structure Analysis
      findings.push(...this.analyzeHTMLStructure($));

      // 7. Caching Headers
      findings.push(...this.analyzeCaching(response.headers));

      // 8. Compression
      findings.push(...this.analyzeCompression(response.headers, response.data));

      // 9. Browser Performance with Puppeteer (if available)
      try {
        const browserFindings = await this.runBrowserPerformanceTest(url);
        findings.push(...browserFindings);
      } catch (error) {
        findings.push({
          category: 'Browser Performance',
          severity: 'low',
          issue: 'Browser performance test unavailable',
          description: `Could not run detailed browser performance analysis: ${error.message}`,
          recommendation: 'Install Chrome/Chromium for detailed performance metrics'
        });
      }

    } catch (error) {
      findings.push({
        category: 'Error',
        severity: 'medium',
        issue: 'Performance scan error',
        description: `Error during performance analysis: ${error.message}`,
        recommendation: 'Review website accessibility and retry scan'
      });
    }

    return findings;
  }

  /**
   * Analyze response time
   */
  analyzeResponseTime(responseTime) {
    const findings = [];

    if (responseTime > 3000) {
      findings.push({
        category: 'Response Time',
        severity: 'high',
        issue: 'Slow server response',
        description: `Server response time: ${responseTime}ms (>3s)`,
        recommendation: 'Optimize server performance, use CDN, or upgrade hosting'
      });
    } else if (responseTime > 1000) {
      findings.push({
        category: 'Response Time',
        severity: 'medium',
        issue: 'Moderate server response time',
        description: `Server response time: ${responseTime}ms (>1s)`,
        recommendation: 'Consider server optimization or CDN implementation'
      });
    } else {
      findings.push({
        category: 'Response Time',
        severity: 'info',
        issue: 'Good server response time',
        description: `Server response time: ${responseTime}ms`,
        recommendation: 'Server response time is within acceptable range'
      });
    }

    return findings;
  }

  /**
   * Analyze resources
   */
  analyzeResources($, baseUrl) {
    const findings = [];

    // Count external resources
    let externalCSS = 0;
    let externalJS = 0;
    let externalImages = 0;

    $('link[rel="stylesheet"]').each((i, el) => {
      const href = $(el).attr('href');
      if (href && URLUtils.isExternal(baseUrl, href)) {
        externalCSS++;
      }
    });

    $('script[src]').each((i, el) => {
      const src = $(el).attr('src');
      if (src && URLUtils.isExternal(baseUrl, src)) {
        externalJS++;
      }
    });

    $('img[src]').each((i, el) => {
      const src = $(el).attr('src');
      if (src && URLUtils.isExternal(baseUrl, src)) {
        externalImages++;
      }
    });

    // Check for too many external resources
    const totalExternal = externalCSS + externalJS + externalImages;
    if (totalExternal > 20) {
      findings.push({
        category: 'Resource Loading',
        severity: 'medium',
        issue: 'Many external resources',
        description: `${totalExternal} external resources detected`,
        recommendation: 'Consider consolidating or hosting resources locally'
      });
    }

    // Check for inline styles
    const inlineStyles = $('[style]').length;
    if (inlineStyles > 10) {
      findings.push({
        category: 'CSS Optimization',
        severity: 'low',
        issue: 'Excessive inline styles',
        description: `${inlineStyles} elements with inline styles`,
        recommendation: 'Move inline styles to external CSS files'
      });
    }

    return findings;
  }

  /**
   * Analyze images
   */
  analyzeImages($, baseUrl) {
    const findings = [];
    const images = DOMParser.getImages($);

    let imagesWithoutAlt = 0;
    let largeImages = 0;

    images.forEach(img => {
      if (!img.alt) {
        imagesWithoutAlt++;
      }

      // Check for potentially large images (rough estimation)
      if (img.src && !img.src.includes('thumb') && !img.src.includes('small')) {
        const ext = img.src.split('.').pop()?.toLowerCase();
        if (['jpg', 'jpeg', 'png', 'bmp'].includes(ext) && !img.width) {
          largeImages++;
        }
      }
    });

    if (images.length > 20) {
      findings.push({
        category: 'Image Optimization',
        severity: 'medium',
        issue: 'Many images on page',
        description: `${images.length} images detected`,
        recommendation: 'Consider lazy loading, image optimization, or pagination'
      });
    }

    if (largeImages > 5) {
      findings.push({
        category: 'Image Optimization',
        severity: 'medium',
        issue: 'Potentially unoptimized images',
        description: `${largeImages} images may be unoptimized`,
        recommendation: 'Optimize images, use WebP format, and specify dimensions'
      });
    }

    if (imagesWithoutAlt > 0) {
      findings.push({
        category: 'Image Optimization',
        severity: 'low',
        issue: 'Images without alt attributes',
        description: `${imagesWithoutAlt} images missing alt text`,
        recommendation: 'Add alt attributes for better accessibility and SEO'
      });
    }

    return findings;
  }

  /**
   * Analyze CSS
   */
  analyzeCSS($) {
    const findings = [];

    // Count CSS files
    const cssLinks = $('link[rel="stylesheet"]').length;
    const inlineStyles = $('style').length;

    if (cssLinks > 5) {
      findings.push({
        category: 'CSS Optimization',
        severity: 'medium',
        issue: 'Multiple CSS files',
        description: `${cssLinks} CSS files detected`,
        recommendation: 'Consider bundling CSS files to reduce HTTP requests'
      });
    }

    if (inlineStyles > 3) {
      findings.push({
        category: 'CSS Optimization',
        severity: 'low',
        issue: 'Multiple inline style blocks',
        description: `${inlineStyles} inline style blocks found`,
        recommendation: 'Move styles to external CSS files for better caching'
      });
    }

    // Check for CSS in head
    let cssInBody = 0;
    $('body link[rel="stylesheet"], body style').each(() => {
      cssInBody++;
    });

    if (cssInBody > 0) {
      findings.push({
        category: 'CSS Optimization',
        severity: 'medium',
        issue: 'CSS in body',
        description: `${cssInBody} CSS resources found in body instead of head`,
        recommendation: 'Move CSS resources to the head section for better performance'
      });
    }

    return findings;
  }

  /**
   * Analyze JavaScript
   */
  analyzeJavaScript($) {
    const findings = [];
    const scripts = DOMParser.getScripts($);

    const externalScripts = scripts.filter(s => s.src).length;
    const inlineScripts = scripts.filter(s => !s.src).length;
    const asyncScripts = scripts.filter(s => s.async).length;
    const deferScripts = scripts.filter(s => s.defer).length;

    if (externalScripts > 10) {
      findings.push({
        category: 'JavaScript Optimization',
        severity: 'medium',
        issue: 'Many JavaScript files',
        description: `${externalScripts} external JavaScript files`,
        recommendation: 'Consider bundling JavaScript files'
      });
    }

    if (inlineScripts > 5) {
      findings.push({
        category: 'JavaScript Optimization',
        severity: 'low',
        issue: 'Multiple inline scripts',
        description: `${inlineScripts} inline script blocks`,
        recommendation: 'Consider moving scripts to external files'
      });
    }

    // Check for blocking scripts in head
    let blockingScriptsInHead = 0;
    $('head script[src]').each((i, el) => {
      const $el = $(el);
      if (!$el.prop('async') && !$el.prop('defer')) {
        blockingScriptsInHead++;
      }
    });

    if (blockingScriptsInHead > 0) {
      findings.push({
        category: 'JavaScript Optimization',
        severity: 'high',
        issue: 'Blocking scripts in head',
        description: `${blockingScriptsInHead} blocking scripts in head section`,
        recommendation: 'Add async or defer attributes, or move scripts to end of body'
      });
    }

    const totalAsyncDefer = asyncScripts + deferScripts;
    if (externalScripts > 0 && totalAsyncDefer === 0) {
      findings.push({
        category: 'JavaScript Optimization',
        severity: 'medium',
        issue: 'No async/defer attributes',
        description: 'JavaScript files are loading synchronously',
        recommendation: 'Add async or defer attributes to non-critical scripts'
      });
    }

    return findings;
  }

  /**
   * Analyze HTML structure
   */
  analyzeHTMLStructure($) {
    const findings = [];

    // Check DOM depth
    let maxDepth = 0;
    function calculateDepth(element, depth = 0) {
      maxDepth = Math.max(maxDepth, depth);
      $(element).children().each((i, child) => {
        calculateDepth(child, depth + 1);
      });
    }
    calculateDepth($('body')[0]);

    if (maxDepth > 15) {
      findings.push({
        category: 'HTML Structure',
        severity: 'medium',
        issue: 'Deep DOM nesting',
        description: `DOM depth: ${maxDepth} levels`,
        recommendation: 'Simplify HTML structure to improve rendering performance'
      });
    }

    // Check total DOM size
    const totalElements = $('*').length;
    if (totalElements > 1500) {
      findings.push({
        category: 'HTML Structure',
        severity: 'medium',
        issue: 'Large DOM size',
        description: `${totalElements} DOM elements`,
        recommendation: 'Reduce DOM complexity, consider pagination or lazy loading'
      });
    }

    return findings;
  }

  /**
   * Analyze caching headers
   */
  analyzeCaching(headers) {
    const findings = [];

    const cacheControl = headers['cache-control'];
    const expires = headers['expires'];
    const lastModified = headers['last-modified'];
    const etag = headers['etag'];

    if (!cacheControl && !expires) {
      findings.push({
        category: 'Caching',
        severity: 'medium',
        issue: 'No caching headers',
        description: 'No Cache-Control or Expires headers found',
        recommendation: 'Implement proper caching headers to improve performance'
      });
    }

    if (cacheControl && cacheControl.includes('no-cache')) {
      findings.push({
        category: 'Caching',
        severity: 'low',
        issue: 'Aggressive no-cache policy',
        description: 'Cache-Control set to no-cache',
        recommendation: 'Consider allowing caching for static resources'
      });
    }

    if (!etag && !lastModified) {
      findings.push({
        category: 'Caching',
        severity: 'low',
        issue: 'No validation headers',
        description: 'No ETag or Last-Modified headers',
        recommendation: 'Add ETag or Last-Modified headers for conditional requests'
      });
    }

    return findings;
  }

  /**
   * Analyze compression
   */
  analyzeCompression(headers, content) {
    const findings = [];

    const contentEncoding = headers['content-encoding'];
    const contentLength = headers['content-length'];
    
    if (!contentEncoding || !contentEncoding.includes('gzip')) {
      const contentSize = content ? content.length : 0;
      if (contentSize > 1024) { // If content is larger than 1KB
        findings.push({
          category: 'Compression',
          severity: 'medium',
          issue: 'No compression detected',
          description: 'Content appears to be uncompressed',
          recommendation: 'Enable gzip or brotli compression on the server'
        });
      }
    }

    if (contentLength && parseInt(contentLength) > 500000) { // > 500KB
      findings.push({
        category: 'Compression',
        severity: 'medium',
        issue: 'Large content size',
        description: `Content size: ${Math.round(parseInt(contentLength) / 1024)}KB`,
        recommendation: 'Optimize content size and ensure compression is enabled'
      });
    }

    return findings;
  }

  /**
   * Run browser performance test with Puppeteer
   */
  async runBrowserPerformanceTest(url) {
    const findings = [];

    try {
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();
      
      // Enable performance metrics
      await page.setCacheEnabled(false);
      
      const start = Date.now();
      
      // Navigate and wait for network idle
      await page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      
      const loadTime = Date.now() - start;

      // Get performance metrics
      const metrics = await page.metrics();
      
      // Get performance entries
      const performanceEntries = await page.evaluate(() => {
        const entries = performance.getEntriesByType('navigation')[0];
        return {
          domContentLoaded: entries.domContentLoadedEventEnd - entries.domContentLoadedEventStart,
          loadComplete: entries.loadEventEnd - entries.loadEventStart,
          firstPaint: performance.getEntriesByType('paint').find(p => p.name === 'first-paint')?.startTime || 0,
          firstContentfulPaint: performance.getEntriesByType('paint').find(p => p.name === 'first-contentful-paint')?.startTime || 0
        };
      });

      await browser.close();

      // Analyze results
      if (loadTime > 5000) {
        findings.push({
          category: 'Page Load Performance',
          severity: 'high',
          issue: 'Slow page load',
          description: `Page load time: ${loadTime}ms`,
          recommendation: 'Optimize resources, enable caching, and reduce page complexity'
        });
      }

      if (performanceEntries.firstContentfulPaint > 2500) {
        findings.push({
          category: 'Page Load Performance',
          severity: 'medium',
          issue: 'Slow First Contentful Paint',
          description: `FCP: ${Math.round(performanceEntries.firstContentfulPaint)}ms`,
          recommendation: 'Optimize critical rendering path and reduce render-blocking resources'
        });
      }

      if (metrics.JSHeapUsedSize > 50 * 1024 * 1024) { // > 50MB
        findings.push({
          category: 'Memory Usage',
          severity: 'medium',
          issue: 'High memory usage',
          description: `JavaScript heap: ${Math.round(metrics.JSHeapUsedSize / 1024 / 1024)}MB`,
          recommendation: 'Optimize JavaScript code and reduce memory leaks'
        });
      }

      // Positive findings
      if (loadTime < 2000) {
        findings.push({
          category: 'Page Load Performance',
          severity: 'info',
          issue: 'Good page load time',
          description: `Page load time: ${loadTime}ms`,
          recommendation: 'Page loads quickly, maintain current performance'
        });
      }

    } catch (error) {
      throw error;
    }

    return findings;
  }
}

module.exports = PerformanceScanner;
