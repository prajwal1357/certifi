const fs = require("fs")
const path = require("path")
const { PDFDocument, rgb, StandardFonts } = require("pdf-lib")

// Map font combinations to pdf-lib standard fonts
const FONT_MAP = {
  "Helvetica": StandardFonts.Helvetica,
  "Helvetica-Bold": StandardFonts.HelveticaBold,
  "Helvetica-Italic": StandardFonts.HelveticaOblique,
  "Helvetica-BoldItalic": StandardFonts.HelveticaBoldOblique,
  "Times-Roman": StandardFonts.TimesRoman,
  "Times-Bold": StandardFonts.TimesRomanBold,
  "Times-Italic": StandardFonts.TimesRomanItalic,
  "Times-BoldItalic": StandardFonts.TimesRomanBoldItalic,
  "Courier": StandardFonts.Courier,
  "Courier-Bold": StandardFonts.CourierBold,
  "Courier-Italic": StandardFonts.CourierOblique,
  "Courier-BoldItalic": StandardFonts.CourierBoldOblique,
}

function getFontKey(fontFamily, bold, italic) {
  const base = fontFamily || "Helvetica"

  // Normalize base font name
  let normalizedBase = "Helvetica"
  if (base.includes("Times")) normalizedBase = "Times"
  else if (base.includes("Courier")) normalizedBase = "Courier"

  if (normalizedBase === "Times") {
    if (bold && italic) return "Times-BoldItalic"
    if (bold) return "Times-Bold"
    if (italic) return "Times-Italic"
    return "Times-Roman"
  }

  if (normalizedBase === "Courier") {
    if (bold && italic) return "Courier-BoldItalic"
    if (bold) return "Courier-Bold"
    if (italic) return "Courier-Italic"
    return "Courier"
  }

  // Helvetica (default)
  if (bold && italic) return "Helvetica-BoldItalic"
  if (bold) return "Helvetica-Bold"
  if (italic) return "Helvetica-Italic"
  return "Helvetica"
}

function hexToRgb(hex) {
  if (!hex || hex === "black") return rgb(0, 0, 0)
  if (hex === "white") return rgb(1, 1, 1)
  if (hex === "red") return rgb(1, 0, 0)
  if (hex === "blue") return rgb(0, 0, 1)

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
  let pdfPath = template.pdfPath
  if (!path.isAbsolute(pdfPath)) {
    pdfPath = path.join(__dirname, "..", pdfPath)
  }

  const existingPdfBytes = fs.readFileSync(pdfPath)
  const pdfDoc = await PDFDocument.load(existingPdfBytes)
  const pages = pdfDoc.getPages()
  const page = pages[0]
  const { width: pageWidth, height: pageHeight } = page.getSize()

  const CANVAS_SCALE = 1.5

  console.log(`[PDF] Template: "${template.name}" | Fields: ${template.fields.length} | Student: ${JSON.stringify(studentData)}`)

  for (const field of template.fields) {
    const value = studentData[field.type] || ""
    console.log(`[PDF] Field type="${field.type}" bold=${field.bold} italic=${field.italic} -> value="${value}" | x=${field.x}, y=${field.y}, fontSize=${field.fontSize}`)
    if (!value) continue

    // Get the right font variant based on bold/italic
    const fontKey = getFontKey(field.fontFamily, field.bold, field.italic)
    const fontEnum = FONT_MAP[fontKey] || StandardFonts.Helvetica
    const font = await pdfDoc.embedFont(fontEnum)

    const fontSize = (field.fontSize || 40) / CANVAS_SCALE
    const color = hexToRgb(field.color || "black")

    // Convert canvas coordinates to PDF coordinates
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