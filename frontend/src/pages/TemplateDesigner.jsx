import { useEffect, useRef, useState } from "react"
import axios from "axios"
import * as fabric from "fabric"
import * as pdfjsLib from "pdfjs-dist"
import { toast } from "sonner"
import { 
  HiOutlineMenu,
  HiOutlineAdjustments
} from "react-icons/hi"

import LeftSidebar from "../components/LeftSidebar"
import RightSidebar from "../components/RightSidebar"

pdfjsLib.GlobalWorkerOptions.workerSrc =
  `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

const FONT_FAMILIES = ["Helvetica", "Times-Roman", "Courier"]
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

  // Responsive state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isControlsOpen, setIsControlsOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024)

  // Text styling state
  const [fontSize, setFontSize] = useState(40)
  const [fontFamily, setFontFamily] = useState("Helvetica")
  const [fontColor, setFontColor] = useState("#000000")
  const [isBold, setIsBold] = useState(false)
  const [isItalic, setIsItalic] = useState(false)

  // Password modal
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [sendPassword, setSendPassword] = useState("")
  const [pendingSend, setPendingSend] = useState(null)
  const [sending, setSending] = useState(false)
  const [currentScale, setCurrentScale] = useState(1.5)

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      const newScale = mobile ? 0.7 : 1.5
      setCurrentScale(newScale)
      
      if (mobile) {
        setIsSidebarOpen(false)
        setIsControlsOpen(false)
      } else {
        setIsSidebarOpen(true)
        setIsControlsOpen(true)
      }
    }
    window.addEventListener('resize', handleResize)
    handleResize()
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    fetchTemplates()
  }, [])

  useEffect(() => {
    if (selectedTemplate) renderPDF()
  }, [selectedTemplate, currentScale])

  useEffect(() => {
    if (!fabricInstance.current) return

    const canvas = fabricInstance.current
    const handleSelection = () => {
      const obj = canvas.getActiveObject()
      if (obj) {
        setFontSize((obj.fontSize / currentScale) * 1.5 || 40)
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
  }, [canvasReady, currentScale])

  const fetchTemplates = async () => {
    try {
      const res = await axios.get("http://localhost:5000/templates")
      setTemplates(res.data)
    } catch (err) {
      toast.error("Failed to load templates")
    }
  }

  const handleTemplateUpload = async () => {
    if (!uploadFile) return toast.error("Select a PDF file first")
    if (!uploadName.trim()) return toast.error("Enter a template name")

    const formData = new FormData()
    formData.append("template", uploadFile)
    formData.append("name", uploadName.trim())

    const promise = axios.post("http://localhost:5000/templates/upload", formData)
    
    toast.promise(promise, {
      loading: 'Uploading template...',
      success: (res) => {
        setTemplates((prev) => [...prev, res.data.template])
        setUploadName("")
        setUploadFile(null)
        return "Template uploaded successfully!"
      },
      error: "Failed to upload template"
    })
  }

  const renderPDF = async () => {
    try {
      const pdfUrl = `http://localhost:5000/${selectedTemplate.pdfPath.replace(/\\/g, "/")}`
      const loadingTask = pdfjsLib.getDocument(pdfUrl)
      const pdf = await loadingTask.promise
      const page = await pdf.getPage(1)

      const viewport = page.getViewport({ scale: currentScale })
      const canvas = pdfCanvasRef.current
      const context = canvas.getContext("2d")

      canvas.height = viewport.height
      canvas.width = viewport.width

      await page.render({ canvasContext: context, viewport }).promise
      initializeFabric(viewport.width, viewport.height)
    } catch (err) {
      toast.error("PDF render failed: " + err.message)
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

    if (selectedTemplate.fields?.length > 0) {
      selectedTemplate.fields.forEach((field) => {
        const visualX = (field.x / 1.5) * currentScale
        const visualY = (field.y / 1.5) * currentScale
        const visualFontSize = (field.fontSize / 1.5) * currentScale

        const text = new fabric.FabricText(field.type || "Name", {
          left: visualX,
          top: visualY,
          fontSize: visualFontSize,
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
    if (!fabricInstance.current) return toast.error("Select a template first!")

    fabricInstance.current.clear()

    const text = new fabric.FabricText("Name", {
      left: (200 / 1.5) * currentScale,
      top: (200 / 1.5) * currentScale,
      fontSize: (fontSize / 1.5) * currentScale,
      fill: fontColor,
      fontFamily,
      fontWeight: isBold ? "bold" : "normal",
      fontStyle: isItalic ? "italic" : "normal",
    })

    text.fieldType = "name"
    fabricInstance.current.add(text)
    fabricInstance.current.setActiveObject(text)
    fabricInstance.current.renderAll()
    toast.success("Name field added to canvas")
  }

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
    applyStyle("fontSize", (newSize / 1.5) * currentScale)
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
    if (!selectedTemplate || !fabricInstance.current) return toast.error("Select template first")

    const objects = fabricInstance.current.getObjects()
    if (objects.length === 0) return toast.error("Add Name field first")

    const obj = objects[0]
    const fields = [
      {
        type: "name",
        x: (obj.left / currentScale) * 1.5,
        y: (obj.top / currentScale) * 1.5,
        fontSize: (obj.fontSize / currentScale) * 1.5,
        fontFamily: obj.fontFamily,
        color: obj.fill,
        bold: obj.fontWeight === "bold",
        italic: obj.fontStyle === "italic",
      },
    ]

    try {
      await axios.post(
        `http://localhost:5000/templates/${selectedTemplate._id}/layout`,
        { fields }
      )
      toast.success("Design layout saved successfully!")
    } catch (err) {
      toast.error("Failed to save layout")
    }
  }

  const handleExcelUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const formData = new FormData()
    formData.append("file", file)
    
    const promise = axios.post("http://localhost:5000/excel/upload", formData)
    
    toast.promise(promise, {
      loading: 'Processing Excel data...',
      success: (res) => {
        setStudents(res.data)
        return `Loaded ${res.data.length} student records`
      },
      error: "Failed to parse Excel file"
    })
  }

  const previewCertificate = async (student) => {
    if (!selectedTemplate) return toast.error("Select template first")
    try {
      const res = await axios.post(
        "http://localhost:5000/certificate/preview",
        { templateId: selectedTemplate._id, studentData: student },
        { responseType: "blob" }
      )
      const url = URL.createObjectURL(res.data)
      window.open(url)
    } catch (err) {
      toast.error("Failed to generate preview")
    }
  }

  const requestSend = (type, data) => {
    setPendingSend({ type, data })
    setSendPassword("")
    setShowPasswordModal(true)
  }

  const confirmSend = async () => {
    if (!sendPassword) return toast.error("Enter the password")
    setSending(true)

    try {
      if (pendingSend.type === "single") {
        await axios.post("http://localhost:5000/certificate/send", {
          templateId: selectedTemplate._id,
          studentData: pendingSend.data,
          password: sendPassword,
        })
        toast.success(`Sent to ${pendingSend.data.email}`)
      } else {
        const res = await axios.post("http://localhost:5000/certificate/send-bulk", {
          templateId: selectedTemplate._id,
          students: pendingSend.data,
          password: sendPassword,
        })
        const sent = res.data.results.filter(r => r.success).length
        toast.success(`Process complete: ${sent} sent successfully`)
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Send failed")
    } finally {
      setSending(false)
      setShowPasswordModal(false)
      setPendingSend(null)
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 font-inter text-slate-200">
      
      {/* Mobile Toggle Bar */}
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 h-14 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 z-50 flex items-center justify-between px-4">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-400">
            <HiOutlineMenu size={24} />
          </button>
          <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Certifi</span>
          <button onClick={() => setIsControlsOpen(!isControlsOpen)} className="p-2 text-slate-400">
            <HiOutlineAdjustments size={24} />
          </button>
        </div>
      )}

      {/* ─── LEFT SIDEBAR ─── */}
      <LeftSidebar 
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        isMobile={isMobile}
        uploadName={uploadName}
        setUploadName={setUploadName}
        uploadFile={uploadFile}
        setUploadFile={setUploadFile}
        handleTemplateUpload={handleTemplateUpload}
        templates={templates}
        selectedTemplate={selectedTemplate}
        setSelectedTemplate={setSelectedTemplate}
        handleExcelUpload={handleExcelUpload}
        students={students}
        requestSend={requestSend}
        previewCertificate={previewCertificate}
      />

      {/* ─── MAIN CANVAS AREA ─── */}
      <main className={`flex-1 flex flex-col min-w-0 bg-slate-950 canvas-area overflow-auto relative ${isMobile ? 'pt-14' : ''}`}>
        <div className="flex-1 flex justify-center items-center relative p-8">
          {!selectedTemplate && (
            <div className="text-center animate-in fade-in zoom-in duration-500">
              <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center text-3xl mb-4 mx-auto border border-slate-800 shadow-2xl">
                🎨
              </div>
              <h2 className="text-xl font-bold text-slate-100 mb-2">Designer Playground Ready</h2>
              <p className="text-slate-500 text-sm max-w-sm mx-auto">
                First, pick a template from the left or upload a fresh PDF. Use the controls to place dynamic text.
              </p>
            </div>
          )}
          
          <div className="relative shadow-[0_0_100px_rgba(0,0,0,0.5)]">
            <canvas ref={pdfCanvasRef} className="rounded-sm" />
            <div ref={fabricContainerRef} className="absolute inset-0" />
          </div>
        </div>
      </main>

      {/* ─── RIGHT CONTROLS ─── */}
      <RightSidebar 
        isControlsOpen={isControlsOpen}
        setIsControlsOpen={setIsControlsOpen}
        isMobile={isMobile}
        addNameField={addNameField}
        canvasReady={canvasReady}
        fontFamily={fontFamily}
        handleFontFamilyChange={handleFontFamilyChange}
        FONT_FAMILIES={FONT_FAMILIES}
        handleBoldToggle={handleBoldToggle}
        isBold={isBold}
        handleItalicToggle={handleItalicToggle}
        isItalic={isItalic}
        fontSize={fontSize}
        handleFontSizeChange={handleFontSizeChange}
        handleColorChange={handleColorChange}
        fontColor={fontColor}
        COLORS={COLORS}
        saveLayout={saveLayout}
      />

      {/* ─── PASSWORD MODAL ─── */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => !sending && setShowPasswordModal(false)}>
          <div className="modal-box bg-slate-950/95 border-slate-800 shadow-2xl scale-in-center overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
            <div className="p-8">
              <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                🔐 Security Verification
              </h3>
              <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                {pendingSend?.type === "bulk"
                  ? `You are about to broadcast to ${pendingSend.data.length} recipients. This action requires administrative clearance.`
                  : `Initiating delivery to ${pendingSend?.data?.email}. Please authenticate.`}
              </p>
              <input
                type="password"
                value={sendPassword}
                onChange={(e) => setSendPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && confirmSend()}
                placeholder="Admin Authorization Key"
                className="input py-3 text-center text-lg tracking-widest mb-6 border-slate-700 bg-slate-900 focus:border-indigo-500"
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPasswordModal(false)}
                  disabled={sending}
                  className="btn bg-slate-800 hover:bg-slate-700 text-slate-300 flex-1 py-3"
                >
                  Abort
                </button>
                <button
                  onClick={confirmSend}
                  disabled={sending}
                  className={`btn btn-primary flex-1 py-3 font-bold transition-all ${sending ? "opacity-70" : "hover:scale-102 hover:shadow-indigo-500/30"}`}
                >
                  {sending ? "Processing..." : "Authorize Send"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #334155; }
        
        .template-card {
          padding: 0.75rem 1rem;
          background: #0f172a;
          border: 1px solid #1e293b;
          border-radius: 0.75rem;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          color: #94a3b8;
          font-size: 0.875rem;
          font-weight: 500;
        }
        .template-card:hover {
          background: #1e293b;
          border-color: #334155;
          color: #f1f5f9;
          transform: translateX(4px);
        }
        .template-card.active {
          background: rgba(79, 70, 229, 0.1);
          border-color: #4f46e5;
          color: #e0e7ff;
        }
        
        @keyframes scale-active {
           0% { transform: scale(1); }
           50% { transform: scale(1.02); }
           100% { transform: scale(1); }
        }
        .template-card.active { animation: scale-active 0.4s ease; }
      `}} />
    </div>
  )
}