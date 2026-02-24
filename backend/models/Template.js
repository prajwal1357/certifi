const mongoose = require("mongoose");

const fieldSchema = new mongoose.Schema({
  type: String,
  x: Number,
  y: Number,
  fontSize: Number,
  fontFamily: String,
  color: String
});

const templateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  pdfPath: { type: String, required: true },
  fields: [fieldSchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Template", templateSchema);