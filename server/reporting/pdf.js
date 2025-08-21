const PDFDocument = require('pdfkit');

/**
 * Generate a PDF from a report document and pipe to a writable stream.
 * @param {object} report - The report document (lean/plain object is fine).
 * @param {import('stream').Writable} outStream - Writable stream to pipe PDF to (e.g., Express res).
 */
function generateReportPdf(report, outStream) {
  const doc = new PDFDocument({ autoFirstPage: true, margin: 50 });

  doc.on('error', (err) => {
    // Surface errors so Express can catch them.
    if (outStream && typeof outStream.emit === 'function') {
      outStream.emit('error', err);
    }
  });

  doc.pipe(outStream);

  // Title
  doc.fontSize(20).text('Scan Report', { align: 'center' });
  doc.moveDown();

  // Metadata
  const url = report?.url || report?.results?.url || 'N/A';
  const date = report?.date || report?.results?.date || report?.createdAt || new Date();

  doc.fontSize(12).text(`URL: ${url}`);
  doc.text(`Date: ${new Date(date).toLocaleString()}`);
  doc.moveDown();

  // Results block
  const results = report?.results ?? report;
  const pretty = JSON.stringify(results, null, 2);
  doc.font('Courier').fontSize(10).text(pretty, { align: 'left' });

  doc.end();
}

module.exports = { generateReportPdf };


