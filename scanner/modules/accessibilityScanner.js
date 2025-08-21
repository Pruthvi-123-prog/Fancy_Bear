const HttpClient = require('../utils/httpClient');
const DOMParser = require('../utils/domParser');

/**
 * Accessibility scanning module - WCAG compliance checks
 */
class AccessibilityScanner {
  constructor() {
    this.httpClient = new HttpClient();
    this.colorContrasts = {
      normal: 4.5,
      large: 3,
      aa: 4.5,
      aaa: 7
    };
  }

  /**
   * Run complete accessibility scan
   * @param {string} url - Target URL
   * @returns {Promise<Array>} Accessibility findings
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
          description: 'Website could not be accessed for accessibility analysis',
          recommendation: 'Verify URL and server availability'
        });
        return findings;
      }

      const $ = DOMParser.parse(response.data);

      // 1. Image Accessibility
      findings.push(...this.analyzeImages($));

      // 2. Form Accessibility
      findings.push(...this.analyzeForms($));

      // 3. Link Accessibility
      findings.push(...this.analyzeLinks($));

      // 4. Heading Structure
      findings.push(...this.analyzeHeadings($));

      // 5. ARIA Attributes
      findings.push(...this.analyzeARIA($));

      // 6. Color and Contrast (basic checks)
      findings.push(...this.analyzeColorContrast($));

      // 7. Keyboard Navigation
      findings.push(...this.analyzeKeyboardNavigation($));

      // 8. Language Declaration
      findings.push(...this.analyzeLanguage($));

      // 9. Page Structure
      findings.push(...this.analyzePageStructure($));

      // 10. Media Accessibility
      findings.push(...this.analyzeMedia($));

      // 11. Tables Accessibility
      findings.push(...this.analyzeTables($));

      // 12. Focus Management
      findings.push(...this.analyzeFocusManagement($));

    } catch (error) {
      findings.push({
        category: 'Error',
        severity: 'medium',
        issue: 'Accessibility scan error',
        description: `Error during accessibility analysis: ${error.message}`,
        recommendation: 'Review website accessibility and retry scan'
      });
    }

    return findings;
  }

  /**
   * Analyze image accessibility
   */
  analyzeImages($) {
    const findings = [];
    const images = DOMParser.getImages($);

    if (images.length === 0) {
      return findings;
    }

    // Check for missing alt attributes
    const imagesWithoutAlt = images.filter(img => img.alt === undefined);
    const imagesWithEmptyAlt = images.filter(img => img.alt === '');
    const imagesWithAlt = images.filter(img => img.alt && img.alt.trim().length > 0);

    if (imagesWithoutAlt.length > 0) {
      findings.push({
        category: 'Images',
        severity: 'high',
        issue: 'Images missing alt attributes',
        description: `${imagesWithoutAlt.length} out of ${images.length} images missing alt attributes`,
        recommendation: 'Add alt attributes to all images for screen reader compatibility'
      });
    }

    // Check for potentially decorative images with alt text
    const potentiallyDecorativeImages = images.filter(img => 
      img.alt && (img.alt.toLowerCase().includes('decoration') || 
                  img.alt.toLowerCase().includes('spacer') ||
                  img.src && img.src.includes('spacer'))
    );

    if (potentiallyDecorativeImages.length > 0) {
      findings.push({
        category: 'Images',
        severity: 'low',
        issue: 'Potentially decorative images with alt text',
        description: `${potentiallyDecorativeImages.length} decorative images may have unnecessary alt text`,
        recommendation: 'Use empty alt="" for purely decorative images'
      });
    }

    // Check for images with poor alt text
    const imagesWithPoorAlt = images.filter(img => 
      img.alt && (img.alt.toLowerCase().startsWith('image') ||
                  img.alt.toLowerCase().startsWith('picture') ||
                  img.alt.toLowerCase().startsWith('photo') ||
                  img.alt.length < 3)
    );

    if (imagesWithPoorAlt.length > 0) {
      findings.push({
        category: 'Images',
        severity: 'medium',
        issue: 'Images with non-descriptive alt text',
        description: `${imagesWithPoorAlt.length} images have generic or very short alt text`,
        recommendation: 'Use descriptive alt text that explains the image content and purpose'
      });
    }

    // Positive feedback
    const wellDescribedImages = images.filter(img => 
      img.alt && img.alt.length > 10 && !imagesWithPoorAlt.includes(img)
    );

    if (wellDescribedImages.length === images.length) {
      findings.push({
        category: 'Images',
        severity: 'info',
        issue: 'Good image accessibility',
        description: 'All images have descriptive alt text',
        recommendation: 'Image accessibility is well implemented'
      });
    }

    return findings;
  }

  /**
   * Analyze form accessibility
   */
  analyzeForms($) {
    const findings = [];
    const forms = DOMParser.getForms($);

    if (forms.length === 0) {
      return findings;
    }

    forms.forEach((form, formIndex) => {
      // Check for form labels
      let inputsWithoutLabels = 0;
      let inputsWithPlaceholderOnly = 0;

      form.inputs.forEach(input => {
        if (input.type === 'hidden' || input.type === 'submit' || input.type === 'button') {
          return; // Skip these input types
        }

        const hasLabel = input.id && $(`label[for="${input.id}"]`).length > 0;
        const hasAriaLabel = $(`input[name="${input.name}"]`).attr('aria-label');
        const hasAriaLabelledBy = $(`input[name="${input.name}"]`).attr('aria-labelledby');
        
        if (!hasLabel && !hasAriaLabel && !hasAriaLabelledBy) {
          inputsWithoutLabels++;
        }

        if (!hasLabel && !hasAriaLabel && !hasAriaLabelledBy && input.placeholder) {
          inputsWithPlaceholderOnly++;
        }
      });

      if (inputsWithoutLabels > 0) {
        findings.push({
          category: 'Forms',
          severity: 'high',
          issue: `Form ${formIndex + 1} has unlabeled inputs`,
          description: `${inputsWithoutLabels} form inputs lack proper labels`,
          recommendation: 'Add proper labels or aria-label attributes to all form inputs'
        });
      }

      if (inputsWithPlaceholderOnly > 0) {
        findings.push({
          category: 'Forms',
          severity: 'medium',
          issue: `Form ${formIndex + 1} relies on placeholders as labels`,
          description: `${inputsWithPlaceholderOnly} inputs use only placeholder text`,
          recommendation: 'Use proper labels instead of relying solely on placeholder text'
        });
      }

      // Check for fieldsets in complex forms
      if (form.inputs.length > 5) {
        const hasFieldsets = $('fieldset').length > 0;
        if (!hasFieldsets) {
          findings.push({
            category: 'Forms',
            severity: 'low',
            issue: `Form ${formIndex + 1} could benefit from fieldsets`,
            description: 'Complex form without fieldset grouping',
            recommendation: 'Use fieldsets to group related form fields'
          });
        }
      }

      // Check for form validation messages
      const hasErrorHandling = form.inputs.some(input => 
        $(`input[name="${input.name}"]`).attr('aria-describedby') ||
        $(`input[name="${input.name}"]`).attr('aria-invalid')
      );

      if (!hasErrorHandling && form.inputs.some(input => input.required)) {
        findings.push({
          category: 'Forms',
          severity: 'medium',
          issue: `Form ${formIndex + 1} missing error handling`,
          description: 'Required fields without accessible error handling',
          recommendation: 'Implement accessible form validation and error messages'
        });
      }
    });

    return findings;
  }

  /**
   * Analyze link accessibility
   */
  analyzeLinks($) {
    const findings = [];
    const links = DOMParser.getLinks($);

    if (links.length === 0) {
      return findings;
    }

    // Check for links without accessible text
    const linksWithoutText = links.filter(link => 
      (!link.text || link.text.trim().length === 0) && 
      !$(`a[href="${link.href}"]`).attr('aria-label') &&
      !$(`a[href="${link.href}"]`).attr('aria-labelledby')
    );

    if (linksWithoutText.length > 0) {
      findings.push({
        category: 'Links',
        severity: 'high',
        issue: 'Links without accessible text',
        description: `${linksWithoutText.length} links have no accessible text`,
        recommendation: 'Provide visible text, aria-label, or aria-labelledby for all links'
      });
    }

    // Check for generic link text
    const genericLinkTexts = ['click here', 'read more', 'more', 'link', 'here', 'view'];
    const genericLinks = links.filter(link => 
      link.text && genericLinkTexts.some(generic => 
        link.text.toLowerCase().trim() === generic
      )
    );

    if (genericLinks.length > 0) {
      findings.push({
        category: 'Links',
        severity: 'medium',
        issue: 'Generic link text',
        description: `${genericLinks.length} links use non-descriptive text`,
        recommendation: 'Use descriptive link text that indicates the link destination or purpose'
      });
    }

    // Check for links that open in new windows without indication
    $('a[target="_blank"]').each((i, el) => {
      const $el = $(el);
      const text = $el.text();
      const title = $el.attr('title');
      const ariaLabel = $el.attr('aria-label');
      
      const hasIndicator = (text && text.includes('new window')) ||
                          (text && text.includes('opens in')) ||
                          (title && title.includes('new')) ||
                          (ariaLabel && ariaLabel.includes('new'));

      if (!hasIndicator) {
        findings.push({
          category: 'Links',
          severity: 'medium',
          issue: 'Links opening in new windows without indication',
          description: 'Links open in new windows without informing users',
          recommendation: 'Indicate when links open in new windows (visually and for screen readers)'
        });
      }
    });

    return findings;
  }

  /**
   * Analyze heading structure
   */
  analyzeHeadings($) {
    const findings = [];
    const headings = DOMParser.getHeadings($);

    if (headings.length === 0) {
      findings.push({
        category: 'Headings',
        severity: 'high',
        issue: 'No headings found',
        description: 'No heading structure for screen reader navigation',
        recommendation: 'Use proper heading hierarchy (h1-h6) for page structure'
      });
      return findings;
    }

    // Check for H1
    const h1Count = headings.filter(h => h.level === 1).length;
    if (h1Count === 0) {
      findings.push({
        category: 'Headings',
        severity: 'high',
        issue: 'Missing H1 heading',
        description: 'No main heading (H1) found for page identification',
        recommendation: 'Add one H1 heading as the main page title'
      });
    } else if (h1Count > 1) {
      findings.push({
        category: 'Headings',
        severity: 'medium',
        issue: 'Multiple H1 headings',
        description: `Found ${h1Count} H1 headings`,
        recommendation: 'Use only one H1 heading per page'
      });
    }

    // Check heading hierarchy
    let previousLevel = 0;
    let skippedLevels = [];

    headings.forEach((heading, index) => {
      if (index === 0 && heading.level !== 1) {
        skippedLevels.push(`First heading is H${heading.level}, not H1`);
      } else if (index > 0 && heading.level > previousLevel + 1) {
        skippedLevels.push(`H${heading.level} follows H${previousLevel}`);
      }
      previousLevel = heading.level;
    });

    if (skippedLevels.length > 0) {
      findings.push({
        category: 'Headings',
        severity: 'medium',
        issue: 'Heading hierarchy skips levels',
        description: 'Heading structure jumps levels, confusing screen reader users',
        recommendation: 'Use sequential heading levels (H1 → H2 → H3, etc.)'
      });
    }

    // Check for empty headings
    const emptyHeadings = headings.filter(h => !h.text || h.text.trim().length === 0);
    if (emptyHeadings.length > 0) {
      findings.push({
        category: 'Headings',
        severity: 'high',
        issue: 'Empty heading tags',
        description: `${emptyHeadings.length} heading tags are empty`,
        recommendation: 'Remove empty headings or add descriptive text'
      });
    }

    return findings;
  }

  /**
   * Analyze ARIA attributes
   */
  analyzeARIA($) {
    const findings = [];

    // Check for ARIA landmarks
    const landmarkRoles = ['banner', 'navigation', 'main', 'complementary', 'contentinfo'];
    const presentLandmarks = [];

    landmarkRoles.forEach(role => {
      if ($(`[role="${role}"]`).length > 0 || $(`${role}`).length > 0) {
        presentLandmarks.push(role);
      }
    });

    // Check for main landmark
    if (!presentLandmarks.includes('main') && $('main').length === 0) {
      findings.push({
        category: 'ARIA',
        severity: 'medium',
        issue: 'Missing main landmark',
        description: 'No main content area identified',
        recommendation: 'Use <main> element or role="main" to identify main content'
      });
    }

    // Check for navigation landmarks
    if ($('nav').length === 0 && $('[role="navigation"]').length === 0) {
      findings.push({
        category: 'ARIA',
        severity: 'low',
        issue: 'No navigation landmarks',
        description: 'Navigation areas not identified with landmarks',
        recommendation: 'Use <nav> elements or role="navigation" for navigation areas'
      });
    }

    // Check for improper ARIA usage
    $('[aria-labelledby]').each((i, el) => {
      const $el = $(el);
      const labelledBy = $el.attr('aria-labelledby');
      if (labelledBy && !$(`#${labelledBy}`).length) {
        findings.push({
          category: 'ARIA',
          severity: 'medium',
          issue: 'Broken aria-labelledby reference',
          description: `aria-labelledby="${labelledBy}" points to non-existent element`,
          recommendation: 'Ensure aria-labelledby references existing element IDs'
        });
      }
    });

    $('[aria-describedby]').each((i, el) => {
      const $el = $(el);
      const describedBy = $el.attr('aria-describedby');
      if (describedBy && !$(`#${describedBy}`).length) {
        findings.push({
          category: 'ARIA',
          severity: 'medium',
          issue: 'Broken aria-describedby reference',
          description: `aria-describedby="${describedBy}" points to non-existent element`,
          recommendation: 'Ensure aria-describedby references existing element IDs'
        });
      }
    });

    // Check for redundant ARIA labels
    $('button[aria-label]').each((i, el) => {
      const $el = $(el);
      const ariaLabel = $el.attr('aria-label');
      const buttonText = $el.text().trim();
      
      if (buttonText && ariaLabel === buttonText) {
        findings.push({
          category: 'ARIA',
          severity: 'low',
          issue: 'Redundant aria-label',
          description: 'Button has identical aria-label and visible text',
          recommendation: 'Remove redundant aria-label when visible text is sufficient'
        });
      }
    });

    return findings;
  }

  /**
   * Analyze color and contrast (basic checks)
   */
  analyzeColorContrast($) {
    const findings = [];

    // Check for color-only information
    const colorIndicators = $('*').filter((i, el) => {
      const $el = $(el);
      const text = $el.text().toLowerCase();
      return text.includes('red') || text.includes('green') || 
             text.includes('blue') || text.includes('click the red') ||
             text.includes('green button') || text.includes('red text');
    });

    if (colorIndicators.length > 0) {
      findings.push({
        category: 'Color and Contrast',
        severity: 'medium',
        issue: 'Possible color-only information',
        description: 'Content may rely solely on color to convey information',
        recommendation: 'Ensure information is conveyed through multiple means, not just color'
      });
    }

    // Check for inline styles that might indicate color usage
    const elementsWithInlineColors = $('[style*="color"]');
    if (elementsWithInlineColors.length > 5) {
      findings.push({
        category: 'Color and Contrast',
        severity: 'low',
        issue: 'Many inline color styles',
        description: 'Multiple elements use inline color styles',
        recommendation: 'Review color contrast ratios and consider using CSS classes'
      });
    }

    // Note about manual testing
    findings.push({
      category: 'Color and Contrast',
      severity: 'info',
      issue: 'Manual contrast testing recommended',
      description: 'Automated tools cannot fully assess color contrast',
      recommendation: 'Use tools like WebAIM Contrast Checker to verify color contrast ratios'
    });

    return findings;
  }

  /**
   * Analyze keyboard navigation
   */
  analyzeKeyboardNavigation($) {
    const findings = [];

    // Check for skip links
    const skipLinks = $('a[href^="#"]').filter((i, el) => {
      const text = $(el).text().toLowerCase();
      return text.includes('skip') || text.includes('jump');
    });

    if (skipLinks.length === 0) {
      findings.push({
        category: 'Keyboard Navigation',
        severity: 'medium',
        issue: 'Missing skip links',
        description: 'No skip links found for keyboard navigation',
        recommendation: 'Add skip links to allow keyboard users to bypass repetitive navigation'
      });
    }

    // Check for elements with tabindex
    const tabindexElements = $('[tabindex]');
    const positiveTabindex = tabindexElements.filter((i, el) => {
      const tabindex = parseInt($(el).attr('tabindex'));
      return tabindex > 0;
    });

    if (positiveTabindex.length > 0) {
      findings.push({
        category: 'Keyboard Navigation',
        severity: 'medium',
        issue: 'Positive tabindex values',
        description: `${positiveTabindex.length} elements use positive tabindex values`,
        recommendation: 'Avoid positive tabindex values; use 0 or -1, or rely on natural tab order'
      });
    }

    // Check for interactive elements without keyboard support
    const interactiveElements = $('div[onclick], span[onclick]');
    if (interactiveElements.length > 0) {
      findings.push({
        category: 'Keyboard Navigation',
        severity: 'high',
        issue: 'Non-focusable interactive elements',
        description: `${interactiveElements.length} elements have click handlers but may not be keyboard accessible`,
        recommendation: 'Use button/link elements or add tabindex and keyboard event handlers'
      });
    }

    return findings;
  }

  /**
   * Analyze language declaration
   */
  analyzeLanguage($) {
    const findings = [];

    const htmlLang = $('html').attr('lang');
    
    if (!htmlLang) {
      findings.push({
        category: 'Language',
        severity: 'high',
        issue: 'Missing language declaration',
        description: 'No lang attribute on html element',
        recommendation: 'Add lang attribute to html element (e.g., lang="en")'
      });
    } else if (htmlLang.length !== 2 && htmlLang.length !== 5) {
      findings.push({
        category: 'Language',
        severity: 'medium',
        issue: 'Invalid language code format',
        description: `Language code "${htmlLang}" may be invalid`,
        recommendation: 'Use valid language codes (e.g., "en", "en-US", "fr", "es")'
      });
    }

    // Check for text in different languages without lang attributes
    const textElements = $('p, h1, h2, h3, h4, h5, h6, li, td, th, div, span').filter((i, el) => {
      const text = $(el).text().trim();
      return text.length > 20; // Only check substantial text content
    });

    // This is a basic check - in reality, language detection would be more sophisticated
    if (textElements.length > 0) {
      findings.push({
        category: 'Language',
        severity: 'info',
        issue: 'Language attributes should be reviewed',
        description: 'Review if any content is in a different language than the page default',
        recommendation: 'Add lang attributes to content in different languages'
      });
    }

    return findings;
  }

  /**
   * Analyze page structure
   */
  analyzePageStructure($) {
    const findings = [];

    // Check for proper page structure
    const hasHeader = $('header').length > 0 || $('[role="banner"]').length > 0;
    const hasMain = $('main').length > 0 || $('[role="main"]').length > 0;
    const hasFooter = $('footer').length > 0 || $('[role="contentinfo"]').length > 0;

    if (!hasHeader) {
      findings.push({
        category: 'Page Structure',
        severity: 'medium',
        issue: 'Missing header landmark',
        description: 'No header element or banner role found',
        recommendation: 'Use <header> element or role="banner" for page header'
      });
    }

    if (!hasMain) {
      findings.push({
        category: 'Page Structure',
        severity: 'high',
        issue: 'Missing main content landmark',
        description: 'No main element or main role found',
        recommendation: 'Use <main> element or role="main" to identify main content'
      });
    }

    if (!hasFooter) {
      findings.push({
        category: 'Page Structure',
        severity: 'low',
        issue: 'Missing footer landmark',
        description: 'No footer element or contentinfo role found',
        recommendation: 'Use <footer> element or role="contentinfo" for page footer'
      });
    }

    // Check for proper document structure
    if (hasHeader && hasMain && hasFooter) {
      findings.push({
        category: 'Page Structure',
        severity: 'info',
        issue: 'Good page structure',
        description: 'Page has proper landmark structure',
        recommendation: 'Page structure follows accessibility best practices'
      });
    }

    return findings;
  }

  /**
   * Analyze media accessibility
   */
  analyzeMedia($) {
    const findings = [];

    // Check videos
    const videos = $('video');
    if (videos.length > 0) {
      let videosWithoutCaptions = 0;
      videos.each((i, el) => {
        const $el = $(el);
        const hasCaptions = $el.find('track[kind="captions"], track[kind="subtitles"]').length > 0;
        if (!hasCaptions) {
          videosWithoutCaptions++;
        }
      });

      if (videosWithoutCaptions > 0) {
        findings.push({
          category: 'Media',
          severity: 'high',
          issue: 'Videos without captions',
          description: `${videosWithoutCaptions} videos may lack captions`,
          recommendation: 'Provide captions or subtitles for all video content'
        });
      }
    }

    // Check audio
    const audios = $('audio');
    if (audios.length > 0) {
      findings.push({
        category: 'Media',
        severity: 'medium',
        issue: 'Audio content present',
        description: `${audios.length} audio elements found`,
        recommendation: 'Ensure transcripts are available for audio content'
      });
    }

    // Check for autoplay media
    const autoplayMedia = $('video[autoplay], audio[autoplay]');
    if (autoplayMedia.length > 0) {
      findings.push({
        category: 'Media',
        severity: 'high',
        issue: 'Autoplay media detected',
        description: `${autoplayMedia.length} media elements set to autoplay`,
        recommendation: 'Avoid autoplay or provide user controls to stop/pause media'
      });
    }

    return findings;
  }

  /**
   * Analyze table accessibility
   */
  analyzeTables($) {
    const findings = [];
    const tables = $('table');

    if (tables.length === 0) {
      return findings;
    }

    tables.each((i, table) => {
      const $table = $(table);
      const tableIndex = i + 1;

      // Check for table headers
      const hasThElements = $table.find('th').length > 0;
      const hasHeaderScope = $table.find('th[scope]').length > 0;
      
      if (!hasThElements) {
        findings.push({
          category: 'Tables',
          severity: 'high',
          issue: `Table ${tableIndex} missing headers`,
          description: 'Data table without proper header cells',
          recommendation: 'Use <th> elements for table headers'
        });
      }

      // Check for complex tables
      const rows = $table.find('tr').length;
      const hasSpannedCells = $table.find('[colspan], [rowspan]').length > 0;
      
      if ((rows > 3 || hasSpannedCells) && !hasHeaderScope) {
        findings.push({
          category: 'Tables',
          severity: 'medium',
          issue: `Table ${tableIndex} may need scope attributes`,
          description: 'Complex table without scope attributes',
          recommendation: 'Add scope="col" or scope="row" to header cells in complex tables'
        });
      }

      // Check for table caption
      const hasCaption = $table.find('caption').length > 0;
      if (!hasCaption) {
        findings.push({
          category: 'Tables',
          severity: 'low',
          issue: `Table ${tableIndex} missing caption`,
          description: 'Table without descriptive caption',
          recommendation: 'Add <caption> element to describe table purpose'
        });
      }

      // Check if table is used for layout
      if (!hasThElements && rows < 3) {
        findings.push({
          category: 'Tables',
          severity: 'low',
          issue: `Table ${tableIndex} may be used for layout`,
          description: 'Simple table without headers may be for layout',
          recommendation: 'Use CSS for layout instead of tables, or add proper table structure'
        });
      }
    });

    return findings;
  }

  /**
   * Analyze focus management
   */
  analyzeFocusManagement($) {
    const findings = [];

    // Check for focus indicators (this is limited in static analysis)
    const focusableElements = $('a, button, input, select, textarea, [tabindex]');
    
    if (focusableElements.length === 0) {
      findings.push({
        category: 'Focus Management',
        severity: 'high',
        issue: 'No focusable elements found',
        description: 'Page appears to have no interactive elements',
        recommendation: 'Ensure page has focusable interactive elements'
      });
    }

    // Check for elements that should be focusable but aren't
    const clickableNonFocusable = $('[onclick]:not(a):not(button):not(input):not([tabindex])');
    if (clickableNonFocusable.length > 0) {
      findings.push({
        category: 'Focus Management',
        severity: 'high',
        issue: 'Interactive elements not focusable',
        description: `${clickableNonFocusable.length} clickable elements cannot receive keyboard focus`,
        recommendation: 'Make interactive elements focusable with tabindex or use proper semantic elements'
      });
    }

    // Check for hidden focusable elements
    const hiddenFocusable = focusableElements.filter((i, el) => {
      const $el = $(el);
      return $el.css('display') === 'none' || $el.css('visibility') === 'hidden';
    });

    if (hiddenFocusable.length > 0) {
      findings.push({
        category: 'Focus Management',
        severity: 'medium',
        issue: 'Hidden focusable elements',
        description: `${hiddenFocusable.length} focusable elements are hidden`,
        recommendation: 'Ensure hidden focusable elements are properly removed from tab order'
      });
    }

    return findings;
  }
}

module.exports = AccessibilityScanner;
