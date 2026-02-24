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

  let normalizedBase = "Helvetica"
  if (base.toLowerCase().includes("times")) normalizedBase = "Times"
  else if (base.toLowerCase().includes("courier")) normalizedBase = "Courier"

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

  // The canvas in the frontend uses scale 1.5
  const CANVAS_SCALE = 1.5

  console.log(`[PDF Gen] Printing for: ${studentData.name} on ${template.name}`)

  for (const field of template.fields) {
    const value = studentData[field.type] || ""
    if (!value) continue

    const fontKey = getFontKey(field.fontFamily, field.bold, field.italic)
    const fontEnum = FONT_MAP[fontKey] || StandardFonts.Helvetica
    const font = await pdfDoc.embedFont(fontEnum)

    const fontSize = (field.fontSize || 40) / CANVAS_SCALE
    const color = hexToRgb(field.color || "#000000")

    // POSITIONING REFINEMENT:
    // field.x and field.y are from Fabric.js (top-left origin, Y down)
    // PDF x,y are from bottom-left origin, Y up.
    
    // X is simple scale
    const x = field.x / CANVAS_SCALE
    
    // Y Refinement:
    // Distance from top in points:
    const topOffset = field.y / CANVAS_SCALE
    
    // Fabric text objects have a small amount of "ascent" space even at y=0.
    // Standard fonts in drawText use the BASELINE.
    // To match Fabric's 'top' origin, we need to subtract roughly 0.8 * fontSize from the top point.
    // (Helps alignment with visual center/top of characters)
    const y = pageHeight - topOffset - (fontSize * 0.8)

    page.drawText(String(value), {
      x,
      y,
      size: fontSize,
      font,
      color,
    })
  }

  return await pdfDoc.save()
}

module.exports = generateCertificate