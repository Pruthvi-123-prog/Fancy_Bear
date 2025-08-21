const HttpClient = require('../utils/httpClient');
const DOMParser = require('../utils/domParser');
const URLUtils = require('../utils/urlUtils');

/**
 * SEO scanning module - Meta tags, headings, sitemap analysis
 */
class SEOScanner {
  constructor() {
    this.httpClient = new HttpClient();
    this.essentialMetaTags = [
      'title',
      'description',
      'viewport'
    ];
    this.socialMetaTags = [
      'og:title',
      'og:description', 
      'og:image',
      'og:url',
      'og:type',
      'twitter:card',
      'twitter:title',
      'twitter:description',
      'twitter:image'
    ];
  }

  /**
   * Run complete SEO scan
   * @param {string} url - Target URL
   * @returns {Promise<Array>} SEO findings
   */
  async scan(url) {
    const findings = [];

    try {
      // Fetch main page
      const response = await this.httpClient.fetch(url);
      
      if (!response.data) {
        findings.push({
          category: 'Connection',
          severity: 'high',
          issue: 'Unable to fetch website',
          description: 'Website could not be accessed for SEO analysis',
          recommendation: 'Verify URL and server availability'
        });
        return findings;
      }

      const $ = DOMParser.parse(response.data);

      // 1. Title Tag Analysis
      findings.push(...this.analyzeTitleTag($));

      // 2. Meta Description Analysis
      findings.push(...this.analyzeMetaDescription($));

      // 3. Heading Structure Analysis
      findings.push(...this.analyzeHeadingStructure($));

      // 4. Meta Tags Analysis
      findings.push(...this.analyzeMetaTags($));

      // 5. Social Media Meta Tags
      findings.push(...this.analyzeSocialMetaTags($));

      // 6. Image SEO
      findings.push(...this.analyzeImageSEO($));

      // 7. Internal Links
      findings.push(...this.analyzeLinks($, url));

      // 8. URL Structure
      findings.push(...this.analyzeURLStructure(url));

      // 9. Robots.txt and Sitemap
      findings.push(...await this.analyzeRobotsAndSitemap(url));

      // 10. Content Analysis
      findings.push(...this.analyzeContent($));

      // 11. Schema Markup
      findings.push(...this.analyzeSchemaMarkup($));

      // 12. Canonical URL
      findings.push(...this.analyzeCanonicalURL($, url));

    } catch (error) {
      findings.push({
        category: 'Error',
        severity: 'medium',
        issue: 'SEO scan error',
        description: `Error during SEO analysis: ${error.message}`,
        recommendation: 'Review website accessibility and retry scan'
      });
    }

    return findings;
  }

  /**
   * Analyze title tag
   */
  analyzeTitleTag($) {
    const findings = [];
    const title = $('title').first().text().trim();

    if (!title) {
      findings.push({
        category: 'Title Tag',
        severity: 'high',
        issue: 'Missing title tag',
        description: 'No title tag found on the page',
        recommendation: 'Add a descriptive title tag to every page'
      });
    } else {
      if (title.length < 30) {
        findings.push({
          category: 'Title Tag',
          severity: 'medium',
          issue: 'Short title tag',
          description: `Title is only ${title.length} characters`,
          recommendation: 'Title should be 30-60 characters for optimal SEO'
        });
      }

      if (title.length > 60) {
        findings.push({
          category: 'Title Tag',
          severity: 'medium',
          issue: 'Long title tag',
          description: `Title is ${title.length} characters (may be truncated)`,
          recommendation: 'Keep title under 60 characters to avoid truncation'
        });
      }

      // Check for multiple title tags
      if ($('title').length > 1) {
        findings.push({
          category: 'Title Tag',
          severity: 'high',
          issue: 'Multiple title tags',
          description: `Found ${$('title').length} title tags`,
          recommendation: 'Use only one title tag per page'
        });
      }

      // Check for optimal title (if within range)
      if (title.length >= 30 && title.length <= 60) {
        findings.push({
          category: 'Title Tag',
          severity: 'info',
          issue: 'Good title length',
          description: `Title length: ${title.length} characters`,
          recommendation: 'Title length is optimal for SEO'
        });
      }
    }

    return findings;
  }

  /**
   * Analyze meta description
   */
  analyzeMetaDescription($) {
    const findings = [];
    const metaDesc = $('meta[name="description"]').attr('content');

    if (!metaDesc) {
      findings.push({
        category: 'Meta Description',
        severity: 'high',
        issue: 'Missing meta description',
        description: 'No meta description found',
        recommendation: 'Add a compelling meta description (150-160 characters)'
      });
    } else {
      const descLength = metaDesc.trim().length;

      if (descLength < 120) {
        findings.push({
          category: 'Meta Description',
          severity: 'medium',
          issue: 'Short meta description',
          description: `Meta description is only ${descLength} characters`,
          recommendation: 'Meta description should be 120-160 characters'
        });
      }

      if (descLength > 160) {
        findings.push({
          category: 'Meta Description',
          severity: 'medium',
          issue: 'Long meta description',
          description: `Meta description is ${descLength} characters (may be truncated)`,
          recommendation: 'Keep meta description under 160 characters'
        });
      }

      // Check for duplicate meta descriptions
      if ($('meta[name="description"]').length > 1) {
        findings.push({
          category: 'Meta Description',
          severity: 'high',
          issue: 'Multiple meta descriptions',
          description: `Found ${$('meta[name="description"]').length} meta description tags`,
          recommendation: 'Use only one meta description per page'
        });
      }

      // Optimal description
      if (descLength >= 120 && descLength <= 160) {
        findings.push({
          category: 'Meta Description',
          severity: 'info',
          issue: 'Good meta description length',
          description: `Meta description length: ${descLength} characters`,
          recommendation: 'Meta description length is optimal'
        });
      }
    }

    return findings;
  }

  /**
   * Analyze heading structure
   */
  analyzeHeadingStructure($) {
    const findings = [];
    const headings = DOMParser.getHeadings($);

    if (headings.length === 0) {
      findings.push({
        category: 'Headings',
        severity: 'high',
        issue: 'No headings found',
        description: 'No heading tags (h1-h6) found on the page',
        recommendation: 'Use proper heading structure for better SEO and accessibility'
      });
      return findings;
    }

    // Check for H1
    const h1Tags = headings.filter(h => h.level === 1);
    if (h1Tags.length === 0) {
      findings.push({
        category: 'Headings',
        severity: 'high',
        issue: 'Missing H1 tag',
        description: 'No H1 heading found on the page',
        recommendation: 'Add one H1 tag as the main page heading'
      });
    } else if (h1Tags.length > 1) {
      findings.push({
        category: 'Headings',
        severity: 'medium',
        issue: 'Multiple H1 tags',
        description: `Found ${h1Tags.length} H1 tags`,
        recommendation: 'Use only one H1 tag per page'
      });
    }

    // Check heading hierarchy
    let previousLevel = 0;
    let hierarchyIssues = 0;
    
    headings.forEach((heading, index) => {
      if (index > 0 && heading.level > previousLevel + 1) {
        hierarchyIssues++;
      }
      previousLevel = heading.level;
    });

    if (hierarchyIssues > 0) {
      findings.push({
        category: 'Headings',
        severity: 'medium',
        issue: 'Poor heading hierarchy',
        description: 'Heading levels skip numbers in the hierarchy',
        recommendation: 'Use proper heading hierarchy (H1 → H2 → H3, etc.)'
      });
    }

    // Check for empty headings
    const emptyHeadings = headings.filter(h => !h.text || h.text.length === 0);
    if (emptyHeadings.length > 0) {
      findings.push({
        category: 'Headings',
        severity: 'medium',
        issue: 'Empty heading tags',
        description: `${emptyHeadings.length} empty heading tags found`,
        recommendation: 'Remove empty headings or add descriptive text'
      });
    }

    // Positive feedback
    if (h1Tags.length === 1 && hierarchyIssues === 0) {
      findings.push({
        category: 'Headings',
        severity: 'info',
        issue: 'Good heading structure',
        description: `Proper heading structure with ${headings.length} headings`,
        recommendation: 'Heading structure follows SEO best practices'
      });
    }

    return findings;
  }

  /**
   * Analyze meta tags
   */
  analyzeMetaTags($) {
    const findings = [];
    const metaTags = DOMParser.getMetaTags($);

    // Check viewport meta tag
    const viewportMeta = metaTags.find(tag => tag.name === 'viewport');
    if (!viewportMeta) {
      findings.push({
        category: 'Meta Tags',
        severity: 'high',
        issue: 'Missing viewport meta tag',
        description: 'No viewport meta tag found',
        recommendation: 'Add viewport meta tag for mobile responsiveness'
      });
    }

    // Check robots meta tag
    const robotsMeta = metaTags.find(tag => tag.name === 'robots');
    if (robotsMeta && robotsMeta.content) {
      if (robotsMeta.content.includes('noindex')) {
        findings.push({
          category: 'Meta Tags',
          severity: 'high',
          issue: 'Page set to noindex',
          description: 'Robots meta tag prevents page indexing',
          recommendation: 'Remove noindex directive if page should be indexed'
        });
      }

      if (robotsMeta.content.includes('nofollow')) {
        findings.push({
          category: 'Meta Tags',
          severity: 'medium',
          issue: 'Page set to nofollow',
          description: 'Robots meta tag prevents link following',
          recommendation: 'Review nofollow directive necessity'
        });
      }
    }

    // Check charset
    const charsetMeta = metaTags.find(tag => tag.charset);
    if (!charsetMeta) {
      findings.push({
        category: 'Meta Tags',
        severity: 'medium',
        issue: 'Missing charset declaration',
        description: 'No character encoding specified',
        recommendation: 'Add charset meta tag (preferably UTF-8)'
      });
    }

    return findings;
  }

  /**
   * Analyze social media meta tags
   */
  analyzeSocialMetaTags($) {
    const findings = [];
    const metaTags = DOMParser.getMetaTags($);

    // Check Open Graph tags
    const ogTags = metaTags.filter(tag => tag.property && tag.property.startsWith('og:'));
    const twitterTags = metaTags.filter(tag => tag.name && tag.name.startsWith('twitter:'));

    if (ogTags.length === 0) {
      findings.push({
        category: 'Social Media',
        severity: 'medium',
        issue: 'Missing Open Graph tags',
        description: 'No Open Graph meta tags found',
        recommendation: 'Add Open Graph tags for better social media sharing'
      });
    } else {
      // Check essential OG tags
      const essentialOG = ['og:title', 'og:description', 'og:image', 'og:url'];
      essentialOG.forEach(tag => {
        const found = ogTags.find(meta => meta.property === tag);
        if (!found || !found.content) {
          findings.push({
            category: 'Social Media',
            severity: 'low',
            issue: `Missing ${tag}`,
            description: `${tag} meta tag not found or empty`,
            recommendation: `Add ${tag} for complete Open Graph implementation`
          });
        }
      });
    }

    if (twitterTags.length === 0) {
      findings.push({
        category: 'Social Media',
        severity: 'low',
        issue: 'Missing Twitter Card tags',
        description: 'No Twitter Card meta tags found',
        recommendation: 'Add Twitter Card tags for Twitter sharing optimization'
      });
    }

    return findings;
  }

  /**
   * Analyze image SEO
   */
  analyzeImageSEO($) {
    const findings = [];
    const images = DOMParser.getImages($);

    if (images.length === 0) {
      return findings;
    }

    const imagesWithoutAlt = images.filter(img => !img.alt || img.alt.trim() === '');
    const imagesWithGenericAlt = images.filter(img => 
      img.alt && (img.alt.includes('image') || img.alt.includes('photo') || img.alt.includes('picture'))
    );

    if (imagesWithoutAlt.length > 0) {
      findings.push({
        category: 'Image SEO',
        severity: 'medium',
        issue: 'Images missing alt text',
        description: `${imagesWithoutAlt.length} out of ${images.length} images missing alt attributes`,
        recommendation: 'Add descriptive alt text to all images for SEO and accessibility'
      });
    }

    if (imagesWithGenericAlt.length > 0) {
      findings.push({
        category: 'Image SEO',
        severity: 'low',
        issue: 'Generic alt text',
        description: `${imagesWithGenericAlt.length} images with generic alt text`,
        recommendation: 'Use more descriptive alt text instead of generic terms'
      });
    }

    // Check for images with good alt text
    const imagesWithGoodAlt = images.filter(img => 
      img.alt && img.alt.length > 5 && !imagesWithGenericAlt.includes(img)
    );

    if (imagesWithGoodAlt.length === images.length) {
      findings.push({
        category: 'Image SEO',
        severity: 'info',
        issue: 'Good image optimization',
        description: 'All images have descriptive alt text',
        recommendation: 'Image SEO is well optimized'
      });
    }

    return findings;
  }

  /**
   * Analyze links
   */
  analyzeLinks($, baseUrl) {
    const findings = [];
    const links = DOMParser.getLinks($);

    if (links.length === 0) {
      findings.push({
        category: 'Internal Links',
        severity: 'medium',
        issue: 'No links found',
        description: 'No internal or external links found on the page',
        recommendation: 'Add relevant internal and external links for better SEO'
      });
      return findings;
    }

    const internalLinks = links.filter(link => 
      link.href && !URLUtils.isExternal(baseUrl, link.href)
    );
    
    const externalLinks = links.filter(link => 
      link.href && URLUtils.isExternal(baseUrl, link.href)
    );

    // Check for internal linking
    if (internalLinks.length === 0) {
      findings.push({
        category: 'Internal Links',
        severity: 'medium',
        issue: 'No internal links',
        description: 'No internal links found on the page',
        recommendation: 'Add internal links to improve site navigation and SEO'
      });
    }

    // Check for links without anchor text
    const linksWithoutText = links.filter(link => !link.text || link.text.trim() === '');
    if (linksWithoutText.length > 0) {
      findings.push({
        category: 'Link Quality',
        severity: 'medium',
        issue: 'Links without anchor text',
        description: `${linksWithoutText.length} links have no anchor text`,
        recommendation: 'Add descriptive anchor text to all links'
      });
    }

    // Check for generic link text
    const genericTexts = ['click here', 'read more', 'more', 'link', 'here'];
    const genericLinks = links.filter(link => 
      link.text && genericTexts.some(generic => 
        link.text.toLowerCase().includes(generic)
      )
    );

    if (genericLinks.length > 0) {
      findings.push({
        category: 'Link Quality',
        severity: 'low',
        issue: 'Generic link text',
        description: `${genericLinks.length} links use generic anchor text`,
        recommendation: 'Use descriptive anchor text that indicates link destination'
      });
    }

    // Check external links without nofollow/noopener
    const unsafeExternalLinks = externalLinks.filter(link => 
      !link.rel || (!link.rel.includes('noopener') && !link.rel.includes('nofollow'))
    );

    if (unsafeExternalLinks.length > 0) {
      findings.push({
        category: 'Link Security',
        severity: 'low',
        issue: 'External links without security attributes',
        description: `${unsafeExternalLinks.length} external links missing rel="noopener" or rel="nofollow"`,
        recommendation: 'Add rel="noopener" to external links for security'
      });
    }

    return findings;
  }

  /**
   * Analyze URL structure
   */
  analyzeURLStructure(url) {
    const findings = [];

    try {
      const urlObj = new URL(url);
      
      // Check HTTPS
      if (urlObj.protocol !== 'https:') {
        findings.push({
          category: 'URL Structure',
          severity: 'high',
          issue: 'Non-HTTPS URL',
          description: 'URL uses HTTP instead of HTTPS',
          recommendation: 'Implement HTTPS for better SEO and security'
        });
      }

      // Check URL length
      if (url.length > 100) {
        findings.push({
          category: 'URL Structure',
          severity: 'low',
          issue: 'Long URL',
          description: `URL is ${url.length} characters long`,
          recommendation: 'Keep URLs under 100 characters when possible'
        });
      }

      // Check for URL parameters
      if (urlObj.search) {
        findings.push({
          category: 'URL Structure',
          severity: 'low',
          issue: 'URL parameters present',
          description: 'URL contains query parameters',
          recommendation: 'Consider using clean URLs without parameters'
        });
      }

      // Check for underscores in URL
      if (url.includes('_')) {
        findings.push({
          category: 'URL Structure',
          severity: 'low',
          issue: 'Underscores in URL',
          description: 'URL contains underscores',
          recommendation: 'Use hyphens instead of underscores in URLs'
        });
      }

      // Check for www
      if (urlObj.hostname.startsWith('www.')) {
        findings.push({
          category: 'URL Structure',
          severity: 'info',
          issue: 'WWW subdomain used',
          description: 'URL uses www subdomain',
          recommendation: 'Ensure consistent www/non-www redirects'
        });
      }

    } catch (error) {
      findings.push({
        category: 'URL Structure',
        severity: 'medium',
        issue: 'Invalid URL format',
        description: 'URL format could not be parsed',
        recommendation: 'Review URL structure for validity'
      });
    }

    return findings;
  }

  /**
   * Analyze robots.txt and sitemap
   */
  async analyzeRobotsAndSitemap(url) {
    const findings = [];
    const baseUrl = URLUtils.getBase(url);

    try {
      // Check robots.txt
      const robotsUrl = `${baseUrl}/robots.txt`;
      const robotsResponse = await this.httpClient.fetchWithDetails(robotsUrl);
      
      if (robotsResponse.status === 404) {
        findings.push({
          category: 'Crawlability',
          severity: 'medium',
          issue: 'Missing robots.txt',
          description: 'No robots.txt file found',
          recommendation: 'Create a robots.txt file to guide search engine crawlers'
        });
      } else if (robotsResponse.status === 200 && robotsResponse.data) {
        // Check if robots.txt blocks everything
        if (robotsResponse.data.includes('Disallow: /')) {
          findings.push({
            category: 'Crawlability',
            severity: 'high',
            issue: 'Robots.txt blocks all crawlers',
            description: 'Robots.txt contains "Disallow: /"',
            recommendation: 'Review robots.txt to allow search engine crawling'
          });
        }

        // Check for sitemap declaration
        if (!robotsResponse.data.toLowerCase().includes('sitemap:')) {
          findings.push({
            category: 'Crawlability',
            severity: 'low',
            issue: 'No sitemap in robots.txt',
            description: 'Robots.txt does not reference sitemap',
            recommendation: 'Add sitemap URL to robots.txt'
          });
        }
      }

      // Check sitemap.xml
      const sitemapUrl = `${baseUrl}/sitemap.xml`;
      const sitemapResponse = await this.httpClient.fetchWithDetails(sitemapUrl);
      
      if (sitemapResponse.status === 404) {
        findings.push({
          category: 'Sitemap',
          severity: 'medium',
          issue: 'Missing XML sitemap',
          description: 'No sitemap.xml found',
          recommendation: 'Create an XML sitemap to help search engines discover pages'
        });
      } else if (sitemapResponse.status === 200) {
        findings.push({
          category: 'Sitemap',
          severity: 'info',
          issue: 'XML sitemap found',
          description: 'sitemap.xml is accessible',
          recommendation: 'Sitemap is properly configured'
        });
      }

    } catch (error) {
      findings.push({
        category: 'Crawlability',
        severity: 'low',
        issue: 'Unable to check robots.txt/sitemap',
        description: `Error checking robots.txt and sitemap: ${error.message}`,
        recommendation: 'Manually verify robots.txt and sitemap accessibility'
      });
    }

    return findings;
  }

  /**
   * Analyze content
   */
  analyzeContent($) {
    const findings = [];

    // Get text content
    const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
    const wordCount = bodyText.split(' ').length;

    if (wordCount < 200) {
      findings.push({
        category: 'Content',
        severity: 'medium',
        issue: 'Thin content',
        description: `Page has only ${wordCount} words`,
        recommendation: 'Add more quality content (aim for 300+ words)'
      });
    } else if (wordCount < 300) {
      findings.push({
        category: 'Content',
        severity: 'low',
        issue: 'Limited content',
        description: `Page has ${wordCount} words`,
        recommendation: 'Consider adding more content for better SEO'
      });
    }

    // Check for duplicate content indicators
    const paragraphs = $('p').toArray().map(p => $(p).text().trim());
    const duplicateParagraphs = paragraphs.filter((paragraph, index) => 
      paragraphs.indexOf(paragraph) !== index && paragraph.length > 50
    );

    if (duplicateParagraphs.length > 0) {
      findings.push({
        category: 'Content',
        severity: 'low',
        issue: 'Potentially duplicate content',
        description: `${duplicateParagraphs.length} duplicate paragraphs found`,
        recommendation: 'Review content for uniqueness'
      });
    }

    return findings;
  }

  /**
   * Analyze schema markup
   */
  analyzeSchemaMarkup($) {
    const findings = [];

    // Check for JSON-LD
    const jsonLdScripts = $('script[type="application/ld+json"]');
    
    // Check for microdata
    const microdataElements = $('[itemtype], [itemscope], [itemprop]');
    
    // Check for RDFa
    const rdfaElements = $('[typeof], [property], [resource]');

    const hasStructuredData = jsonLdScripts.length > 0 || 
                             microdataElements.length > 0 || 
                             rdfaElements.length > 0;

    if (!hasStructuredData) {
      findings.push({
        category: 'Structured Data',
        severity: 'medium',
        issue: 'No structured data found',
        description: 'No JSON-LD, microdata, or RDFa markup detected',
        recommendation: 'Add structured data markup for better search results'
      });
    } else {
      findings.push({
        category: 'Structured Data',
        severity: 'info',
        issue: 'Structured data present',
        description: 'Page contains structured data markup',
        recommendation: 'Validate structured data for correctness'
      });
    }

    return findings;
  }

  /**
   * Analyze canonical URL
   */
  analyzeCanonicalURL($, currentUrl) {
    const findings = [];
    
    const canonicalLink = $('link[rel="canonical"]').attr('href');
    
    if (!canonicalLink) {
      findings.push({
        category: 'Canonical URL',
        severity: 'medium',
        issue: 'Missing canonical URL',
        description: 'No canonical link tag found',
        recommendation: 'Add canonical link tag to prevent duplicate content issues'
      });
    } else {
      // Check if canonical is different from current URL
      const normalizedCurrent = URLUtils.normalize(currentUrl);
      const normalizedCanonical = URLUtils.normalize(canonicalLink);
      
      if (normalizedCurrent !== normalizedCanonical) {
        findings.push({
          category: 'Canonical URL',
          severity: 'low',
          issue: 'Canonical URL differs from current URL',
          description: 'Canonical URL points to a different page',
          recommendation: 'Verify canonical URL is correct'
        });
      }
    }

    return findings;
  }
}

module.exports = SEOScanner;
