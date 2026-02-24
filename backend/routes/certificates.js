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

module.exports = router;