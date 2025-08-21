const mongoose = require('mongoose');
const Report = require('./model');

/**
 * Save a report document.
 * @param {object} results - The "results" payload. May include url/date but those are optional.
 * @returns {Promise<object>} The saved report document (plain object via toObject).
 */
async function saveReport(results) {
  if (!results || typeof results !== 'object') {
    throw new Error('results must be a non-empty object');
  }

  const { url = null, date = new Date(), ...rest } = results;
  const report = new Report({ url, date, results: { url, date, ...rest } });
  const saved = await report.save();
  return saved.toObject();
}

/**
 * Get a report by id.
 * @param {string} id - Mongo ObjectId string.
 * @returns {Promise<object|null>} Report object or null if not found.
 */
async function getReportById(id) {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw new Error('Invalid id');
  }
  const doc = await Report.findById(id).lean();
  return doc;
}

module.exports = { saveReport, getReportById };


