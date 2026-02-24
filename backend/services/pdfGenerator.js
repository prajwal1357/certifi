const fs = require("fs");
const { PDFDocument, rgb, StandardFonts } = require("pdf-lib");

async function generateCertificate(template, studentData) {
  const existingPdfBytes = fs.readFileSync(template.pdfPath);

  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  const pages = pdfDoc.getPages();
  const page = pages[0];

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  template.fields.forEach(field => {
    const value = studentData[field.type] || "";

    page.drawText(value, {
      x: field.x,
      y: field.y,
      size: field.fontSize,
      font,
      color: rgb(0, 0, 0)
    });
  });

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

module.exports = generateCertificate;