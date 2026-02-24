import { useEffect, useRef, useState } from "react"
import axios from "axios"
import * as fabric from "fabric"
import * as pdfjsLib from "pdfjs-dist"

pdfjsLib.GlobalWorkerOptions.workerSrc =
  `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

const FONT_FAMILIES = ["Helvetica", "Times-Roman", "Courier"]
const FONT_SIZES = [16, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72]
const COLORS = [
  "#000000", "#ffffff", "#ef4444", "#f97316", "#eab308",
  "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8d6",
]

export default function TemplateDesigner() {
  const pdfCanvasRef = useRef(null)
  const fabricContainerRef = useRef(null)
  const fabricInstance = useRef(null)

  const [templates, setTemplates] = useState([])
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [students, setStudents] = useState([])
  const [canvasReady, setCanvasReady] = useState(false)
  const [uploadName, setUploadName] = useState("")
  const [uploadFile, setUploadFile] = useState(null)

  // Text styling state
  const [fontSize, setFontSize] = useState(40)
  const [fontFamily, setFontFamily] = useState("Helvetica")
  const [fontColor, setFontColor] = useState("#000000")
  const [isBold, setIsBold] = useState(false)
  const [isItalic, setIsItalic] = useState(false)

  // Password modal
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [sendPassword, setSendPassword] = useState("")
  const [pendingSend, setPendingSend] = useState(null) // { type: 'single' | 'bulk', data }
  const [sending, setSending] = useState(false)

  useEffect(() => {
    fetchTemplates()
  }, [])

  useEffect(() => {
    if (selectedTemplate) renderPDF()
  }, [selectedTemplate])

  // Sync styling state when a Fabric object is selected
  useEffect(() => {
    if (!fabricInstance.current) return

    const canvas = fabricInstance.current
    const handleSelection = () => {
      const obj = canvas.getActiveObject()
      if (obj) {
        setFontSize(obj.fontSize || 40)
        setFontFamily(obj.fontFamily || "Helvetica")
        setFontColor(obj.fill || "#000000")
        setIsBold(obj.fontWeight === "bold")
        setIsItalic(obj.fontStyle === "italic")
      }
    }

    canvas.on("selection:created", handleSelection)
    canvas.on("selection:updated", handleSelection)

    return () => {
      canvas.off("selection:created", handleSelection)
      canvas.off("selection:updated", handleSelection)
    }
  }, [canvasReady])

  const fetchTemplates = async () => {
    const res = await axios.get("http://localhost:5000/templates")
    setTemplates(res.data)
  }

  const handleTemplateUpload = async () => {
    if (!uploadFile) return alert("Select a PDF file first")
    if (!uploadName.trim()) return alert("Enter a template name")

    const formData = new FormData()
    formData.append("template", uploadFile)
    formData.append("name", uploadName.trim())

    try {
      const res = await axios.post("http://localhost:5000/templates/upload", formData)
      setTemplates((prev) => [...prev, res.data.template])
      setUploadName("")
      setUploadFile(null)
    } catch (err) {
      console.error("Upload failed:", err)
      alert("Failed to upload template")
    }
  }

  const renderPDF = async () => {
    try {
      const pdfUrl = `http://localhost:5000/${selectedTemplate.pdfPath.replace(/\\/g, "/")}`
      const loadingTask = pdfjsLib.getDocument(pdfUrl)
      const pdf = await loadingTask.promise
      const page = await pdf.getPage(1)

      const viewport = page.getViewport({ scale: 1.5 })
      const canvas = pdfCanvasRef.current
      const context = canvas.getContext("2d")

      canvas.height = viewport.height
      canvas.width = viewport.width

      await page.render({ canvasContext: context, viewport }).promise
      initializeFabric(viewport.width, viewport.height)
    } catch (err) {
      console.error("PDF render failed:", err)
    }
  }

  const initializeFabric = (width, height) => {
    if (fabricInstance.current) {
      fabricInstance.current.dispose()
      fabricInstance.current = null
    }

    const container = fabricContainerRef.current
    container.innerHTML = ""
    const newCanvas = document.createElement("canvas")
    container.appendChild(newCanvas)

    fabricInstance.current = new fabric.Canvas(newCanvas, {
      width,
      height,
      selection: true,
    })

    setCanvasReady(true)

    // Load saved fields
    if (selectedTemplate.fields?.length > 0) {
      selectedTemplate.fields.forEach((field) => {
        const text = new fabric.FabricText(field.type || "Name", {
          left: field.x,
          top: field.y,
          fontSize: field.fontSize || 40,
          fill: field.color || "#000000",
          fontFamily: field.fontFamily || "Helvetica",
          fontWeight: field.bold ? "bold" : "normal",
          fontStyle: field.italic ? "italic" : "normal",
        })
        text.fieldType = field.type || "name"
        fabricInstance.current.add(text)
      })
      fabricInstance.current.renderAll()
    }
  }

  const addNameField = () => {
    if (!fabricInstance.current) return alert("Select a template first!")

    fabricInstance.current.clear()

    const text = new fabric.FabricText("Name", {
      left: 200,
      top: 200,
      fontSize,
      fill: fontColor,
      fontFamily,
      fontWeight: isBold ? "bold" : "normal",
      fontStyle: isItalic ? "italic" : "normal",
    })

    text.fieldType = "name"
    fabricInstance.current.add(text)
    fabricInstance.current.setActiveObject(text)
    fabricInstance.current.renderAll()
  }

  // Apply style changes to selected object
  const applyStyle = (prop, value) => {
    if (!fabricInstance.current) return
    const obj = fabricInstance.current.getActiveObject()
    if (!obj) return

    obj.set(prop, value)
    fabricInstance.current.renderAll()
  }

  const handleBoldToggle = () => {
    const newBold = !isBold
    setIsBold(newBold)
    applyStyle("fontWeight", newBold ? "bold" : "normal")
  }

  const handleItalicToggle = () => {
    const newItalic = !isItalic
    setIsItalic(newItalic)
    applyStyle("fontStyle", newItalic ? "italic" : "normal")
  }

  const handleFontSizeChange = (newSize) => {
    setFontSize(newSize)
    applyStyle("fontSize", newSize)
  }

  const handleFontFamilyChange = (newFont) => {
    setFontFamily(newFont)
    applyStyle("fontFamily", newFont)
  }

  const handleColorChange = (newColor) => {
    setFontColor(newColor)
    applyStyle("fill", newColor)
  }

  const saveLayout = async () => {
    if (!selectedTemplate || !fabricInstance.current) return alert("Select template first")

    const objects = fabricInstance.current.getObjects()
    if (objects.length === 0) return alert("Add Name field first")

    const obj = objects[0]
    const fields = [
      {
        type: "name",
        x: obj.left,
        y: obj.top,
        fontSize: obj.fontSize,
        fontFamily: obj.fontFamily,
        color: obj.fill,
        bold: obj.fontWeight === "bold",
        italic: obj.fontStyle === "italic",
      },
    ]

    await axios.post(
      `http://localhost:5000/templates/${selectedTemplate._id}/layout`,
      { fields }
    )
    alert("Layout saved!")
  }

  // Excel Upload
  const handleExcelUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const formData = new FormData()
    formData.append("file", file)
    try {
      const res = await axios.post("http://localhost:5000/excel/upload", formData)
      setStudents(res.data)
    } catch (err) {
      alert("Failed to parse Excel file")
    }
  }

  // Preview certificate
  const previewCertificate = async (student) => {
    if (!selectedTemplate) return alert("Select template first")
    try {
      const res = await axios.post(
        "http://localhost:5000/certificate/preview",
        { templateId: selectedTemplate._id, studentData: student },
        { responseType: "blob" }
      )
      window.open(URL.createObjectURL(res.data))
    } catch (err) {
      alert("Failed to generate preview")
    }
  }

  // Password-protected send
  const requestSend = (type, data) => {
    setPendingSend({ type, data })
    setSendPassword("")
    setShowPasswordModal(true)
  }

  const confirmSend = async () => {
    if (!sendPassword) return alert("Enter the password")
    setSending(true)

    try {
      if (pendingSend.type === "single") {
        await axios.post("http://localhost:5000/certificate/send", {
          templateId: selectedTemplate._id,
          studentData: pendingSend.data,
          password: sendPassword,
        })
        alert(`Certificate sent to ${pendingSend.data.email}!`)
      } else {
        const res = await axios.post("http://localhost:5000/certificate/send-bulk", {
          templateId: selectedTemplate._id,
          students: pendingSend.data,
          password: sendPassword,
        })
        const { results } = res.data
        const sent = results.filter((r) => r.success).length
        const failed = results.filter((r) => !r.success).length
        alert(`Done! ${sent} sent, ${failed} failed.`)
      }
    } catch (err) {
      const msg = err.response?.data?.error || "Send failed"
      alert(msg)
    } finally {
      setSending(false)
      setShowPasswordModal(false)
      setPendingSend(null)
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">

      {/* ─── LEFT SIDEBAR ─── */}
      <div className="w-72 glass-panel flex flex-col overflow-y-auto p-4 gap-4"
        style={{ minWidth: 288 }}>

        {/* Logo */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
            🎓
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-none">Certifi</h1>
            <p className="text-[10px] text-surface-400">Certificate Platform</p>
          </div>
        </div>

        <div className="divider" />

        {/* Upload Template */}
        <div>
          <p className="section-label">Upload Template</p>
          <input
            type="text"
            placeholder="Template name..."
            value={uploadName}
            onChange={(e) => setUploadName(e.target.value)}
            className="input mb-2"
          />
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => setUploadFile(e.target.files[0])}
            className="input input-file mb-2"
          />
          <button onClick={handleTemplateUpload} className="btn btn-primary btn-full">
            Upload PDF
          </button>
        </div>

        <div className="divider" />

        {/* Templates List */}
        <div>
          <p className="section-label">Templates ({templates.length})</p>
          <div className="flex flex-col gap-1.5">
            {templates.map((template) => (
              <div
                key={template._id}
                onClick={() => setSelectedTemplate(template)}
                className={`template-card ${
                  selectedTemplate?._id === template._id ? "active" : ""
                }`}
              >
                {template.name}
              </div>
            ))}
            {templates.length === 0 && (
              <p className="text-xs text-surface-500 italic">No templates yet</p>
            )}
          </div>
        </div>

        <div className="divider" />

        {/* Excel Upload */}
        <div>
          <p className="section-label">Student Data</p>
          <input
            type="file"
            accept=".xlsx"
            onChange={handleExcelUpload}
            className="input input-file mb-2"
          />

          {students.length > 0 && (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-2">
                <span className="badge badge-success">{students.length} students</span>
                <button
                  onClick={() => {
                    if (!selectedTemplate) return alert("Select template first")
                    requestSend("bulk", students)
                  }}
                  className="btn btn-purple btn-sm"
                >
                  Send All
                </button>
              </div>
              <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
                {students.map((student, i) => (
                  <div key={i} className="student-card">
                    <span
                      onClick={() => previewCertificate(student)}
                      className="flex-1 truncate cursor-pointer hover:text-primary-300"
                      title="Click to preview"
                    >
                      {student.name}
                    </span>
                    <button
                      onClick={() => {
                        if (!selectedTemplate) return alert("Select template first")
                        requestSend("single", student)
                      }}
                      className="btn btn-ghost btn-sm"
                      style={{ padding: "2px 8px", fontSize: "11px" }}
                    >
                      Send
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── CANVAS AREA ─── */}
      <div className="flex-1 canvas-area flex justify-center items-center relative overflow-auto">
        {!selectedTemplate && (
          <div className="text-center">
            <p className="text-surface-500 text-lg mb-1">No template selected</p>
            <p className="text-surface-600 text-sm">Upload a PDF template and click it to start designing</p>
          </div>
        )}
        <canvas ref={pdfCanvasRef} className="absolute" />
        <div ref={fabricContainerRef} className="absolute" />
      </div>

      {/* ─── RIGHT PANEL: Controls ─── */}
      <div className="w-72 glass-panel flex flex-col overflow-y-auto p-4 gap-4"
        style={{ minWidth: 288 }}>

        <p className="section-label">Field Controls</p>

        <button onClick={addNameField} disabled={!canvasReady}
          className="btn btn-primary btn-full">
          Add / Reset Name Field
        </button>

        <div className="divider" />

        {/* Font Family */}
        <div>
          <p className="section-label">Font Family</p>
          <select
            value={fontFamily}
            onChange={(e) => handleFontFamilyChange(e.target.value)}
            className="input"
          >
            {FONT_FAMILIES.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>

        {/* Font Size */}
        <div>
          <p className="section-label">Font Size ({fontSize}px)</p>
          <input
            type="range"
            min="12"
            max="96"
            value={fontSize}
            onChange={(e) => handleFontSizeChange(Number(e.target.value))}
            className="w-full accent-primary-500"
          />
          <div className="flex flex-wrap gap-1 mt-1">
            {FONT_SIZES.map((s) => (
              <button
                key={s}
                onClick={() => handleFontSizeChange(s)}
                className={`text-[10px] px-1.5 py-0.5 rounded ${
                  fontSize === s
                    ? "bg-primary-600 text-white"
                    : "bg-surface-800 text-surface-400 hover:bg-surface-700"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Bold / Italic */}
        <div>
          <p className="section-label">Style</p>
          <div className="flex gap-2">
            <button
              onClick={handleBoldToggle}
              className={`toggle-btn ${isBold ? "active" : ""}`}
              title="Bold"
            >
              <strong>B</strong>
            </button>
            <button
              onClick={handleItalicToggle}
              className={`toggle-btn ${isItalic ? "active" : ""}`}
              title="Italic"
            >
              <em>I</em>
            </button>
          </div>
        </div>

        {/* Color */}
        <div>
          <p className="section-label">Color</p>
          <div className="flex flex-wrap gap-1.5">
            {COLORS.map((c) => (
              <div
                key={c}
                onClick={() => handleColorChange(c)}
                className={`color-swatch ${fontColor === c ? "active" : ""}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <input
              type="color"
              value={fontColor}
              onChange={(e) => handleColorChange(e.target.value)}
              className="w-8 h-8 rounded cursor-pointer border-0"
              style={{ background: "none" }}
            />
            <span className="text-xs text-surface-400">{fontColor}</span>
          </div>
        </div>

        <div className="divider" />

        {/* Save */}
        <button onClick={saveLayout} disabled={!canvasReady}
          className="btn btn-success btn-full">
          Save Layout
        </button>
      </div>

      {/* ─── PASSWORD MODAL ─── */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => !sending && setShowPasswordModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-1">
              🔐 Confirm Send
            </h3>
            <p className="text-sm text-surface-400 mb-4">
              {pendingSend?.type === "bulk"
                ? `Sending to ${pendingSend.data.length} students. Enter the admin password to confirm.`
                : `Sending certificate to ${pendingSend?.data?.email}. Enter the admin password.`}
            </p>
            <input
              type="password"
              value={sendPassword}
              onChange={(e) => setSendPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && confirmSend()}
              placeholder="Enter admin password..."
              className="input mb-4"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowPasswordModal(false)}
                disabled={sending}
                className="btn btn-ghost flex-1"
              >
                Cancel
              </button>
              <button
                onClick={confirmSend}
                disabled={sending}
                className={`btn btn-primary flex-1 ${sending ? "sending" : ""}`}
              >
                {sending ? "Sending..." : "Confirm & Send"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}