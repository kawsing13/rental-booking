const { Parser: CsvParser } = require('json2csv');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

// Three export formats, one shared shape: an array of flat row objects plus
// the column list. Controllers build the rows (from whatever aggregation
// query they need) and just call one of these to stream the response.

function toCsv(rows, fields) {
  const parser = new CsvParser({ fields });
  return parser.parse(rows);
}

async function toExcelBuffer(rows, fields, sheetName = 'Report') {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);
  sheet.columns = fields.map((f) => ({ header: f, key: f, width: 22 }));
  sheet.getRow(1).font = { bold: true };
  rows.forEach((row) => sheet.addRow(row));
  return workbook.xlsx.writeBuffer();
}

function streamPdf(res, title, rows, fields) {
  const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
  doc.pipe(res);

  doc.fontSize(16).text(title, { align: 'center' });
  doc.moveDown();

  const colWidth = (doc.page.width - 60) / fields.length;
  doc.fontSize(9).font('Helvetica-Bold');
  fields.forEach((f, i) => doc.text(f, 30 + i * colWidth, doc.y, { width: colWidth, continued: false }));
  doc.moveDown(0.5);
  doc.font('Helvetica');

  rows.forEach((row) => {
    const y = doc.y;
    fields.forEach((f, i) => {
      doc.text(String(row[f] ?? ''), 30 + i * colWidth, y, { width: colWidth });
    });
    doc.moveDown(0.8);
    if (doc.y > doc.page.height - 50) doc.addPage();
  });

  doc.end();
}

module.exports = { toCsv, toExcelBuffer, streamPdf };
