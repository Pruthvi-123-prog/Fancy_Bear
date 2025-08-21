const cheerio = require('cheerio');

/**
 * DOM parsing utilities
 */
class DOMParser {
  /**
   * Parse HTML content
   * @param {string} html - HTML content
   * @returns {CheerioAPI} Cheerio instance
   */
  static parse(html) {
    return cheerio.load(html);
  }

  /**
   * Extract meta tags
   * @param {CheerioAPI} $ - Cheerio instance
   * @returns {Array<Object>} Meta tags array
   */
  static getMetaTags($) {
    const metaTags = [];
    $('meta').each((i, el) => {
      const $el = $(el);
      const tag = {
        name: $el.attr('name'),
        property: $el.attr('property'),
        content: $el.attr('content'),
        charset: $el.attr('charset'),
        httpEquiv: $el.attr('http-equiv')
      };
      metaTags.push(tag);
    });
    return metaTags;
  }

  /**
   * Extract all links
   * @param {CheerioAPI} $ - Cheerio instance
   * @returns {Array<Object>} Links array
   */
  static getLinks($) {
    const links = [];
    $('a[href]').each((i, el) => {
      const $el = $(el);
      links.push({
        href: $el.attr('href'),
        text: $el.text().trim(),
        title: $el.attr('title'),
        rel: $el.attr('rel')
      });
    });
    return links;
  }

  /**
   * Extract images
   * @param {CheerioAPI} $ - Cheerio instance
   * @returns {Array<Object>} Images array
   */
  static getImages($) {
    const images = [];
    $('img').each((i, el) => {
      const $el = $(el);
      images.push({
        src: $el.attr('src'),
        alt: $el.attr('alt'),
        title: $el.attr('title'),
        width: $el.attr('width'),
        height: $el.attr('height')
      });
    });
    return images;
  }

  /**
   * Extract forms
   * @param {CheerioAPI} $ - Cheerio instance
   * @returns {Array<Object>} Forms array
   */
  static getForms($) {
    const forms = [];
    $('form').each((i, el) => {
      const $el = $(el);
      const inputs = [];
      $el.find('input, select, textarea').each((j, input) => {
        const $input = $(input);
        inputs.push({
          type: $input.attr('type') || $input.prop('tagName').toLowerCase(),
          name: $input.attr('name'),
          id: $input.attr('id'),
          required: $input.prop('required'),
          placeholder: $input.attr('placeholder')
        });
      });
      
      forms.push({
        method: $el.attr('method') || 'GET',
        action: $el.attr('action') || '',
        enctype: $el.attr('enctype'),
        inputs
      });
    });
    return forms;
  }

  /**
   * Get heading structure
   * @param {CheerioAPI} $ - Cheerio instance
   * @returns {Array<Object>} Headings array
   */
  static getHeadings($) {
    const headings = [];
    $('h1, h2, h3, h4, h5, h6').each((i, el) => {
      const $el = $(el);
      headings.push({
        level: parseInt(el.tagName[1]),
        text: $el.text().trim(),
        id: $el.attr('id')
      });
    });
    return headings;
  }

  /**
   * Extract scripts
   * @param {CheerioAPI} $ - Cheerio instance
   * @returns {Array<Object>} Scripts array
   */
  static getScripts($) {
    const scripts = [];
    $('script').each((i, el) => {
      const $el = $(el);
      scripts.push({
        src: $el.attr('src'),
        type: $el.attr('type') || 'text/javascript',
        async: $el.prop('async'),
        defer: $el.prop('defer'),
        inline: !$el.attr('src'),
        content: $el.attr('src') ? null : $el.html()
      });
    });
    return scripts;
  }
}

module.exports = DOMParser;
