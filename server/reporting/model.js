const mongoose = require('mongoose');

// Report schema: { url, date, results }
const ReportSchema = new mongoose.Schema(
  {
    url: { type: String, required: false, default: null },
    date: { type: Date, required: true, default: Date.now },
    results: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  {
    minimize: false,
    versionKey: false,
  }
);

// Reuse model if it already exists (avoids OverwriteModelError in watch/hot-reload)
module.exports = mongoose.models.Report || mongoose.model('Report', ReportSchema);


