const express = require("express");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const Template = require("../models/Template");

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

router.post("/upload", upload.single("template"), async (req, res) => {
  try {
    const newTemplate = new Template({
      name: req.body.name,
      pdfPath: req.file.path,
      fields: []
    });

    await newTemplate.save();

    res.json({ message: "Template uploaded", template: newTemplate });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/", async (req, res) => {
  const templates = await Template.find();
  res.json(templates);
});

router.post("/:id/layout", async (req, res) => {
  try {
    const { fields } = req.body;

    const updatedTemplate = await Template.findByIdAndUpdate(
      req.params.id,
      { fields },
      { new: true }
    );

    res.json({
      message: "Layout saved successfully",
      template: updatedTemplate
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;