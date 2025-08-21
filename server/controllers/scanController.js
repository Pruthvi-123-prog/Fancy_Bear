const { scanWebsite } = require('../../scanner-entry');

// Store scan results in memory (in production, use a database)
const scanResults = new Map();
let scanIdCounter = 1;

/**
 * Trigger a security scan
 * POST /api/scan
 */
const triggerScan = async (req, res) => {
  try {
    const { url } = req.body;

    // Validate URL
    if (!url) {
      return res.status(400).json({
        error: 'URL is required',
        message: 'Please provide a valid URL to scan'
      });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (error) {
      return res.status(400).json({
        error: 'Invalid URL format',
        message: 'Please provide a valid URL (e.g., https://example.com)'
      });
    }

    // Generate scan ID
    const scanId = scanIdCounter++;

    // Initialize scan result
    scanResults.set(scanId, {
      id: scanId,
      url,
      status: 'in_progress',
      startTime: new Date(),
      result: null,
      error: null
    });

    // Start scan asynchronously
    scanWebsite(url)
      .then(result => {
        scanResults.set(scanId, {
          ...scanResults.get(scanId),
          status: 'completed',
          endTime: new Date(),
          result
        });
      })
      .catch(error => {
        scanResults.set(scanId, {
          ...scanResults.get(scanId),
          status: 'failed',
          endTime: new Date(),
          error: error.message
        });
      });

    // Return scan ID immediately
    res.status(202).json({
      message: 'Scan initiated successfully',
      scanId,
      status: 'in_progress',
      url
    });

  } catch (error) {
    console.error('Error triggering scan:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to initiate scan'
    });
  }
};

/**
 * Get scan report by ID
 * GET /api/report/:id
 */
const getScanReport = async (req, res) => {
  try {
    const { id } = req.params;
    const scanId = parseInt(id);

    // Validate scan ID
    if (isNaN(scanId) || scanId <= 0) {
      return res.status(400).json({
        error: 'Invalid scan ID',
        message: 'Scan ID must be a positive number'
      });
    }

    // Check if scan exists
    const scanResult = scanResults.get(scanId);
    if (!scanResult) {
      return res.status(404).json({
        error: 'Scan not found',
        message: `No scan found with ID: ${scanId}`
      });
    }

    // Return scan result
    res.json({
      scanId: scanResult.id,
      url: scanResult.url,
      status: scanResult.status,
      startTime: scanResult.startTime,
      endTime: scanResult.endTime,
      result: scanResult.result,
      error: scanResult.error
    });

  } catch (error) {
    console.error('Error fetching scan report:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch scan report'
    });
  }
};

/**
 * Get all scan reports (bonus endpoint for debugging)
 * GET /api/reports
 */
const getAllScanReports = async (req, res) => {
  try {
    const allScans = Array.from(scanResults.values());
    res.json({
      total: allScans.length,
      scans: allScans
    });
  } catch (error) {
    console.error('Error fetching all scan reports:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch scan reports'
    });
  }
};

module.exports = {
  triggerScan,
  getScanReport,
  getAllScanReports
};
