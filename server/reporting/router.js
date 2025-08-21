const express = require('express');
const mongoose = require('mongoose');
const Report = require('./model');
const { getReportById } = require('./utils');
const { generateReportPdf } = require('./pdf');

const router = express.Router();

// GET /api/report/:id - return saved report data
router.get('/api/report/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    const report = await getReportById(id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    return res.json(report);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

// GET /api/report/:id.pdf - return PDF export of the report
router.get('/api/report/:id.pdf', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    const report = await Report.findById(id).lean();
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="report-${id}.pdf"`);

    generateReportPdf(report, res);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

module.exports = router;


