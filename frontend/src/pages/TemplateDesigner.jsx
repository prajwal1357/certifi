import { useEffect, useRef, useState } from "react"
import axios from "axios"
import * as fabric from "fabric"
import * as pdfjsLib from "pdfjs-dist"

pdfjsLib.GlobalWorkerOptions.workerSrc =
  `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

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

  // Fetch templates
  useEffect(() => {
    fetchTemplates()
  }, [])

  // Render PDF when template selected
  useEffect(() => {
    if (selectedTemplate) renderPDF()
  }, [selectedTemplate])

  const fetchTemplates = async () => {
    const res = await axios.get("http://localhost:5000/templates")
    setTemplates(res.data)
  }

  // Upload new template PDF
  const handleTemplateUpload = async () => {
    if (!uploadFile) {
      alert("Select a PDF file first")
      return
    }
    if (!uploadName.trim()) {
      alert("Enter a template name")
      return
    }

    const formData = new FormData()
    formData.append("template", uploadFile)
    formData.append("name", uploadName.trim())

    try {
      const res = await axios.post("http://localhost:5000/templates/upload", formData)
      setTemplates((prev) => [...prev, res.data.template])
      setUploadName("")
      setUploadFile(null)
      alert("Template uploaded!")
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

      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise

      initializeFabric(viewport.width, viewport.height)
    } catch (err) {
      console.error("PDF render failed:", err)
    }
  }

  const initializeFabric = (width, height) => {
    // Dispose old instance
    if (fabricInstance.current) {
      fabricInstance.current.dispose()
      fabricInstance.current = null
    }

    // Create a fresh canvas element inside the container
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

    // Load saved field if exists
    if (selectedTemplate.fields?.length > 0) {
      selectedTemplate.fields.forEach((field) => {
        const text = new fabric.FabricText(field.type || "Name", {
          left: field.x,
          top: field.y,
          fontSize: field.fontSize || 40,
          fill: field.color || "black",
          fontFamily: field.fontFamily || "Helvetica",
        })

        text.fieldType = field.type || "name"
        fabricInstance.current.add(text)
      })
      fabricInstance.current.renderAll()
    }
  }

  const addNameField = () => {
    if (!fabricInstance.current) {
      alert("Select a template first!")
      return
    }

    fabricInstance.current.clear()

    const text = new fabric.FabricText("Name", {
      left: 200,
      top: 200,
      fontSize: 40,
      fill: "black",
      fontFamily: "Helvetica",
    })

    text.fieldType = "name"
    fabricInstance.current.add(text)
    fabricInstance.current.renderAll()
  }

  const saveLayout = async () => {
    if (!selectedTemplate) {
      alert("Select template first")
      return
    }
    if (!fabricInstance.current) {
      alert("No canvas initialized")
      return
    }

    const objects = fabricInstance.current.getObjects()

    if (objects.length === 0) {
      alert("Add Name field first")
      return
    }

    const obj = objects[0]

    const fields = [
      {
        type: "name",
        x: obj.left,
        y: obj.top,
        fontSize: obj.fontSize,
        fontFamily: obj.fontFamily,
        color: obj.fill,
      },
    ]

    await axios.post(
      `http://localhost:5000/templates/${selectedTemplate._id}/layout`,
      { fields }
    )

    alert("Name position saved successfully!")
  }

  // Excel Upload
  const handleExcelUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await axios.post(
        "http://localhost:5000/excel/upload",
        formData
      )
      setStudents(res.data)
    } catch (err) {
      console.error("Excel upload failed:", err)
      alert("Failed to parse Excel file")
    }
  }

  // Preview Certificate
  const previewCertificate = async (student) => {
    if (!selectedTemplate) {
      alert("Select template first")
      return
    }

    try {
      const res = await axios.post(
        "http://localhost:5000/certificate/preview",
        {
          templateId: selectedTemplate._id,
          studentData: student,
        },
        { responseType: "blob" }
      )

      const fileURL = URL.createObjectURL(res.data)
      window.open(fileURL)
    } catch (err) {
      console.error("Preview failed:", err)
      alert("Failed to generate preview")
    }
  }

  // Send single certificate
  const sendCertificate = async (student) => {
    if (!selectedTemplate) {
      alert("Select template first")
      return
    }

    try {
      await axios.post("http://localhost:5000/certificate/send", {
        templateId: selectedTemplate._id,
        studentData: student,
      })
      alert(`Certificate sent to ${student.email}!`)
    } catch (err) {
      console.error("Send failed:", err)
      alert("Failed to send certificate")
    }
  }

  // Bulk send
  const sendAllCertificates = async () => {
    if (!selectedTemplate) {
      alert("Select template first")
      return
    }
    if (students.length === 0) {
      alert("Upload Excel first")
      return
    }

    if (!window.confirm(`Send certificates to all ${students.length} students?`))
      return

    try {
      const res = await axios.post("http://localhost:5000/certificate/send-bulk", {
        templateId: selectedTemplate._id,
        students,
      })

      const { results } = res.data
      const sent = results.filter((r) => r.success).length
      const failed = results.filter((r) => !r.success).length
      alert(`Done! ${sent} sent, ${failed} failed.`)
    } catch (err) {
      console.error("Bulk send failed:", err)
      alert("Bulk send failed")
    }
  }

  return (
    <div className="flex h-screen">

      {/* Sidebar */}
      <div className="w-1/4 bg-gray-100 p-4 border-r overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Upload Template</h2>
        <input
          type="text"
          placeholder="Template name"
          value={uploadName}
          onChange={(e) => setUploadName(e.target.value)}
          className="w-full p-2 border rounded mb-2"
        />
        <input
          type="file"
          accept=".pdf"
          onChange={(e) => setUploadFile(e.target.files[0])}
          className="w-full mb-2"
        />
        <button
          onClick={handleTemplateUpload}
          className="bg-indigo-600 text-white px-4 py-2 rounded w-full mb-4"
        >
          Upload PDF
        </button>

        <hr className="my-4" />

        <h2 className="text-xl font-bold mb-4">Templates</h2>

        {templates.map((template) => (
          <div
            key={template._id}
            onClick={() => setSelectedTemplate(template)}
            className={`p-2 mb-2 shadow cursor-pointer rounded ${
              selectedTemplate?._id === template._id
                ? "bg-blue-100 border border-blue-400"
                : "bg-white hover:bg-gray-200"
            }`}
          >
            {template.name}
          </div>
        ))}

        <hr className="my-4" />

        <h3 className="font-bold mb-2">Upload Excel</h3>
        <input
          type="file"
          accept=".xlsx"
          onChange={handleExcelUpload}
          className="mb-4 w-full"
        />

        {students.length > 0 && (
          <>
            <h3 className="font-bold mb-2">Students ({students.length})</h3>
            <div className="max-h-64 overflow-y-auto mb-3">
              {students.map((student, index) => (
                <div
                  key={index}
                  className="p-2 mb-1 bg-white shadow cursor-pointer hover:bg-gray-200 rounded flex justify-between items-center"
                >
                  <span
                    onClick={() => previewCertificate(student)}
                    className="flex-1"
                  >
                    {student.name}
                  </span>
                  <button
                    onClick={() => sendCertificate(student)}
                    className="text-xs bg-blue-500 text-white px-2 py-1 rounded ml-2"
                  >
                    Send
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={sendAllCertificates}
              className="bg-purple-600 text-white px-4 py-2 rounded w-full"
            >
              Send All ({students.length})
            </button>
          </>
        )}
      </div>

      {/* Designer */}
      <div className="flex-1 flex justify-center items-center bg-gray-50 relative overflow-auto">
        <canvas ref={pdfCanvasRef} className="absolute" />
        <div ref={fabricContainerRef} className="absolute" />
      </div>

      {/* Controls */}
      <div className="w-1/4 bg-gray-100 p-4 border-l">
        <h2 className="text-xl font-bold mb-4">Controls</h2>

        <button
          onClick={addNameField}
          disabled={!canvasReady}
          className="bg-blue-500 text-white px-4 py-2 rounded w-full mb-3 disabled:opacity-50"
        >
          Add / Reset Name Field
        </button>

        <button
          onClick={saveLayout}
          disabled={!canvasReady}
          className="bg-green-500 text-white px-4 py-2 rounded w-full disabled:opacity-50"
        >
          Save Name Position
        </button>
      </div>
    </div>
  )
}