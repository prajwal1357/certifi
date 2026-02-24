const express = require("express")
const Template = require("../models/Template")
const generateCertificate = require("../services/pdfGenerator")
const { sendCertificateEmail } = require("../services/mailService")

const router = express.Router()

// Middleware to verify send password
const verifySendPassword = (req, res, next) => {
  const { password } = req.body
  const correctPassword = process.env.SEND_PASSWORD

  if (!correctPassword) {
    return res.status(500).json({ error: "SEND_PASSWORD not configured in .env" })
  }

  if (!password || password !== correctPassword) {
    return res.status(403).json({ error: "Invalid password" })
  }

  next()
}

// Preview certificate (no password needed)
router.post("/preview", async (req, res) => {
  try {
    const { templateId, studentData } = req.body

    const template = await Template.findById(templateId)
    if (!template) {
      return res.status(404).json({ error: "Template not found" })
    }

    const pdfBytes = await generateCertificate(template, studentData)

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": "inline; filename=preview.pdf",
    })

    res.send(Buffer.from(pdfBytes))
  } catch (error) {
    console.error("Preview error:", error)
    res.status(500).json({ error: error.message })
  }
})

// Send single certificate (password required)
router.post("/send", verifySendPassword, async (req, res) => {
  try {
    const { templateId, studentData } = req.body

    const template = await Template.findById(templateId)
    if (!template)
      return res.status(404).json({ error: "Template not found" })

    const pdfBytes = await generateCertificate(template, studentData)

    await sendCertificateEmail({
      to: studentData.email,
      studentName: studentData.name,
      pdfBuffer: Buffer.from(pdfBytes),
    })

    res.json({ message: "Certificate sent successfully" })
  } catch (err) {
    console.error("Send error:", err)
    res.status(500).json({ error: err.message })
  }
})

// Bulk send (password required)
router.post("/send-bulk", verifySendPassword, async (req, res) => {
  try {
    const { templateId, students } = req.body

    const template = await Template.findById(templateId)
    if (!template)
      return res.status(404).json({ error: "Template not found" })

    const results = []

    for (const student of students) {
      try {
        const pdfBytes = await generateCertificate(template, student)

        await sendCertificateEmail({
          to: student.email,
          studentName: student.name,
          pdfBuffer: Buffer.from(pdfBytes),
        })

        results.push({ email: student.email, success: true })
      } catch (err) {
        results.push({
          email: student.email,
          success: false,
          error: err.message,
        })
      }
    }

    res.json({ results })
  } catch (err) {
    console.error("Bulk send error:", err)
    res.status(500).json({ error: err.message })
  }
})

module.exports = router