/**
 * URL utility functions
 */
class URLUtils {
  /**
   * Normalize URL
   * @param {string} url - URL to normalize
   * @returns {string} Normalized URL
   */
  static normalize(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.href;
    } catch {
      return url;
    }
  }

  /**
   * Get domain from URL
   * @param {string} url - URL
   * @returns {string} Domain
   */
  static getDomain(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return '';
    }
  }

  /**
   * Get base URL
   * @param {string} url - URL
   * @returns {string} Base URL
   */
  static getBase(url) {
    try {
      const urlObj = new URL(url);
      return `${urlObj.protocol}//${urlObj.host}`;
    } catch {
      return url;
    }
  }

  /**
   * Resolve relative URL
   * @param {string} baseUrl - Base URL
   * @param {string} relativeUrl - Relative URL
   * @returns {string} Absolute URL
   */
  static resolve(baseUrl, relativeUrl) {
    try {
      return new URL(relativeUrl, baseUrl).href;
    } catch {
      return relativeUrl;
    }
  }

  /**
   * Check if URL is external
   * @param {string} baseUrl - Base URL
   * @param {string} url - URL to check
   * @returns {boolean} True if external
   */
  static isExternal(baseUrl, url) {
    try {
      const baseDomain = new URL(baseUrl).hostname;
      const urlDomain = new URL(url, baseUrl).hostname;
      return baseDomain !== urlDomain;
    } catch {
      return false;
    }
  }

  /**
   * Check if URL uses HTTPS
   * @param {string} url - URL to check
   * @returns {boolean} True if HTTPS
   */
  static isSecure(url) {
    try {
      return new URL(url).protocol === 'https:';
    } catch {
      return false;
    }
  }
}

module.exports = URLUtils;
