const router = require('./router');
const Report = require('./model');
const { saveReport, getReportById } = require('./utils');
const { generateReportPdf } = require('./pdf');

module.exports = {
  router,
  Report,
  saveReport,
  getReportById,
  generateReportPdf,
};


