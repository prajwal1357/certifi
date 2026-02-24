const fs = require("fs")
const path = require("path")
const { PDFDocument, rgb, StandardFonts } = require("pdf-lib")

// Map font names to pdf-lib standard fonts
const FONT_MAP = {
  Helvetica: StandardFonts.Helvetica,
  "Helvetica-Bold": StandardFonts.HelveticaBold,
  "Times-Roman": StandardFonts.TimesRoman,
  "Times-Bold": StandardFonts.TimesRomanBold,
  Courier: StandardFonts.Courier,
  "Courier-Bold": StandardFonts.CourierBold,
}

function hexToRgb(hex) {
  if (!hex || hex === "black") return rgb(0, 0, 0)
  if (hex === "white") return rgb(1, 1, 1)
  if (hex === "red") return rgb(1, 0, 0)

  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (result) {
    return rgb(
      parseInt(result[1], 16) / 255,
      parseInt(result[2], 16) / 255,
      parseInt(result[3], 16) / 255
    )
  }
  return rgb(0, 0, 0)
}

async function generateCertificate(template, studentData) {
  // Read the template PDF - handle both relative and absolute paths
  let pdfPath = template.pdfPath
  if (!path.isAbsolute(pdfPath)) {
    pdfPath = path.join(__dirname, "..", pdfPath)
  }

  const existingPdfBytes = fs.readFileSync(pdfPath)
  const pdfDoc = await PDFDocument.load(existingPdfBytes)
  const pages = pdfDoc.getPages()
  const page = pages[0]
  const { width: pageWidth, height: pageHeight } = page.getSize()

  // The canvas in the frontend uses scale 1.5, so we need to convert
  // Fabric.js coordinates (canvas pixels) back to PDF points
  const CANVAS_SCALE = 1.5

  for (const field of template.fields) {
    const value = studentData[field.type] || ""
    if (!value) continue

    // Get font
    let fontKey = field.fontFamily || "Helvetica"
    const fontEnum = FONT_MAP[fontKey] || StandardFonts.Helvetica
    const font = await pdfDoc.embedFont(fontEnum)

    const fontSize = (field.fontSize || 40) / CANVAS_SCALE
    const color = hexToRgb(field.color || "black")

    // Convert canvas coordinates to PDF coordinates:
    // Canvas: origin = top-left, Y increases downward
    // PDF: origin = bottom-left, Y increases upward
    const x = field.x / CANVAS_SCALE
    const y = pageHeight - (field.y / CANVAS_SCALE) - fontSize

    page.drawText(value, {
      x,
      y,
      size: fontSize,
      font,
      color,
    })
  }

  const pdfBytes = await pdfDoc.save()
  return pdfBytes
}

module.exports = generateCertificate