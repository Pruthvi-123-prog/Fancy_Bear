const express = require('express');
const { triggerScan, getScanReport, getAllScanReports } = require('../controllers/scanController');

const router = express.Router();

/**
 * POST /api/scan
 * Trigger a security scan for a given URL
 * 
 * Body:
 * {
 *   "url": "https://example.com"
 * }
 * 
 * Response:
 * {
 *   "message": "Scan initiated successfully",
 *   "scanId": 1,
 *   "status": "in_progress",
 *   "url": "https://example.com"
 * }
 */
router.post('/scan', triggerScan);

/**
 * GET /api/report/:id
 * Get scan report by scan ID
 * 
 * Params:
 * - id: scan ID (number)
 * 
 * Response:
 * {
 *   "scanId": 1,
 *   "url": "https://example.com",
 *   "status": "completed|in_progress|failed",
 *   "startTime": "2025-08-21T11:30:00.000Z",
 *   "endTime": "2025-08-21T11:31:00.000Z",
 *   "result": { ... scan results ... },
 *   "error": null
 * }
 */
router.get('/report/:id', getScanReport);

/**
 * GET /api/reports
 * Get all scan reports (bonus endpoint for debugging)
 * 
 * Response:
 * {
 *   "total": 2,
 *   "scans": [...]
 * }
 */
router.get('/reports', getAllScanReports);

module.exports = router;
