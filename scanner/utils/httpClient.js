const axios = require('axios');

/**
 * HTTP client utility for making web requests
 */
class HttpClient {
  constructor() {
    this.client = axios.create({
      timeout: 30000,
      maxRedirects: 5,
      headers: {
        'User-Agent': 'WebAuditTool/1.0 (Security Scanner)'
      }
    });
  }

  /**
   * Fetch URL with full response details
   * @param {string} url - Target URL
   * @returns {Promise<Object>} Response object with headers, status, data
   */
  async fetchWithDetails(url) {
    try {
      const response = await this.client.get(url, {
        validateStatus: () => true, // Don't throw on 4xx/5xx
        maxRedirects: 0 // Handle redirects manually
      });
      
      return {
        url,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data,
        redirected: false,
        finalUrl: url
      };
    } catch (error) {
      if (error.response) {
        return {
          url,
          status: error.response.status,
          statusText: error.response.statusText,
          headers: error.response.headers,
          data: error.response.data,
          error: error.message
        };
      }
      throw error;
    }
  }

  /**
   * Fetch URL following redirects
   * @param {string} url - Target URL
   * @returns {Promise<Object>} Response object
   */
  async fetch(url) {
    try {
      const response = await this.client.get(url);
      return {
        url,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data,
        finalUrl: response.request.res.responseUrl || url
      };
    } catch (error) {
      if (error.response) {
        return {
          url,
          status: error.response.status,
          statusText: error.response.statusText,
          headers: error.response.headers,
          data: error.response.data,
          error: error.message
        };
      }
      throw error;
    }
  }

  /**
   * Check if URL is accessible
   * @param {string} url - Target URL
   * @returns {Promise<boolean>} True if accessible
   */
  async isAccessible(url) {
    try {
      const response = await this.client.head(url);
      return response.status >= 200 && response.status < 400;
    } catch {
      return false;
    }
  }
}

module.exports = HttpClient;
