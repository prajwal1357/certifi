const express = require("express")
const multer = require("multer")
const xlsx = require("xlsx")

const router = express.Router()

const upload = multer({ dest: "uploads/" })

router.post("/upload", upload.single("file"), (req, res) => {
  try {
    const workbook = xlsx.readFile(req.file.path)
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]

    const data = xlsx.utils.sheet_to_json(sheet)

    // Expecting columns: name, email
    const formatted = data.map(row => ({
      name: row.name || row.Name,
      email: row.email || row.Email
    }))

    res.json(formatted)

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router