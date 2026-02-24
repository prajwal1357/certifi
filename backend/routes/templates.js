const express = require("express");
const multer = require("multer");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

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

router.post("/upload", upload.single("template"), (req, res) => {
  const templateId = uuidv4();

  const newTemplate = {
    id: templateId,
    name: req.body.name,
    pdfPath: req.file.path,
    fields: []
  };

  const templates = JSON.parse(fs.readFileSync("templates.json"));
  templates.push(newTemplate);

  fs.writeFileSync("templates.json", JSON.stringify(templates, null, 2));

  res.json({ message: "Template uploaded", template: newTemplate });
});

router.get("/", (req, res) => {
  const templates = JSON.parse(fs.readFileSync("templates.json"));
  res.json(templates);
});

module.exports = router;