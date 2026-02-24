const express = require("express");
const Template = require("../models/Template");
const generateCertificate = require("../services/pdfGenerator");

const router = express.Router();

router.post("/preview", async (req, res) => {
  try {
    const { templateId, studentData } = req.body;

    const template = await Template.findById(templateId);
    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }

    const pdfBytes = await generateCertificate(template, studentData);

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": "inline; filename=preview.pdf"
    });

    res.send(pdfBytes);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const { sendCertificateEmail } = require("../services/mailService")

// Send single certificate
router.post("/send", async (req, res) => {
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
    res.status(500).json({ error: err.message })
  }
})


// Bulk send
router.post("/send-bulk", async (req, res) => {
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
    res.status(500).json({ error: err.message })
  }
})

module.exports = router;