import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import * as fabric from "fabric";
import * as pdfjsLib from "pdfjs-dist";
import { toast, Toaster } from "sonner";
import { 
  Menu, 
  Settings2, 
  CloudUpload, 
  Save, 
  PlusCircle, 
  Eye, 
  Send, 
  FileText, 
  Users, 
  X, 
  ChevronRight,
  Type,
  Bold,
  Italic,
  Palette,
  Check,
  Loader2,
  Lock,
  ArrowRight
} from "lucide-react";

// PDF.js Worker Configuration
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const FONT_FAMILIES = ["Helvetica", "Times-Roman", "Courier", "Arial", "Verdana"];
const COLORS = [
  "#000000", "#ffffff", "#ef4444", "#f97316", "#eab308",
  "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8d6",
];

// --- SUB-COMPONENT: LEFT SIDEBAR ---
const LeftSidebar = ({ 
  isSidebarOpen, 
  isMobile, 
  uploadName, 
  setUploadName, 
  uploadFile, 
  setUploadFile, 
  handleTemplateUpload, 
  templates, 
  selectedTemplate, 
  setSelectedTemplate, 
  handleExcelUpload, 
  students, 
  requestSend, 
  previewCertificate 
}) => {
  const [activeTab, setActiveTab] = useState("templates");

  return (
    <aside className={`
      ${isSidebarOpen ? 'translate-x-0 w-80' : '-translate-x-full w-0'} 
      fixed lg:relative z-40 h-full transition-all duration-300 ease-in-out
      bg-slate-950 border-r border-white/5 flex flex-col overflow-hidden
    `}>
      {/* Tab Navigation */}
      <div className="flex border-b border-white/5">
        <button 
          onClick={() => setActiveTab("templates")}
          className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === 'templates' ? 'text-indigo-400 border-b-2 border-indigo-400 bg-indigo-400/5' : 'text-slate-500 hover:text-slate-300'}`}
        >
          Templates
        </button>
        <button 
          onClick={() => setActiveTab("data")}
          className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === 'data' ? 'text-indigo-400 border-b-2 border-indigo-400 bg-indigo-400/5' : 'text-slate-500 hover:text-slate-300'}`}
        >
          Recipients
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
        {activeTab === "templates" ? (
          <>
            {/* Upload Section */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Upload Master</h4>
              <div className="p-4 bg-slate-900/50 border border-white/5 rounded-2xl space-y-3">
                <input 
                  type="text" 
                  placeholder="Template Name..." 
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                />
                <label className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all group">
                  <CloudUpload size={18} className="text-slate-500 group-hover:text-indigo-400" />
                  <span className="text-xs font-medium text-slate-400 group-hover:text-indigo-300">
                    {uploadFile ? uploadFile.name : "Select PDF File"}
                  </span>
                  <input type="file" hidden accept=".pdf" onChange={(e) => setUploadFile(e.target.files[0])} />
                </label>
                <button 
                  onClick={handleTemplateUpload}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
                >
                  Upload Template
                </button>
              </div>
            </div>

            {/* Template List */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Saved Designs</h4>
              <div className="space-y-2">
                {templates.map((t) => (
                  <button
                    key={t._id}
                    onClick={() => setSelectedTemplate(t)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all group ${
                      selectedTemplate?._id === t._id 
                      ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-100 shadow-[0_0_20px_rgba(79,70,229,0.1)]' 
                      : 'bg-slate-900/40 border-white/5 text-slate-400 hover:bg-slate-800 hover:border-white/10 hover:text-slate-200'
                    }`}
                  >
                    <FileText size={16} className={selectedTemplate?._id === t._id ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-400"} />
                    <span className="text-sm font-medium truncate">{t.name}</span>
                    <ChevronRight size={14} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Excel Upload */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Data Source</h4>
              <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-white/10 rounded-2xl cursor-pointer hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all group text-center">
                <Users size={32} className="text-slate-600 mb-2 group-hover:text-indigo-400 transition-colors" />
                <span className="text-xs font-bold text-slate-300">Import Student Data</span>
                <span className="text-[10px] text-slate-500 mt-1">Accepts .xlsx or .csv</span>
                <input type="file" hidden accept=".xlsx, .xls, .csv" onChange={handleExcelUpload} />
              </label>
            </div>

            {/* Students List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Recipients ({students.length})</h4>
                {students.length > 0 && (
                  <button 
                    onClick={() => requestSend("bulk", students)}
                    className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300"
                  >
                    Send All
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {students.map((s, idx) => (
                  <div key={idx} className="p-3 bg-slate-900/40 border border-white/5 rounded-xl group hover:border-white/10 transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-200 truncate pr-2">{s.name}</span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => previewCertificate(s)} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-indigo-400"><Eye size={12} /></button>
                        <button onClick={() => requestSend("single", s)} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-emerald-400"><Send size={12} /></button>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-500 block truncate">{s.email}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </aside>
  );
};

// --- SUB-COMPONENT: RIGHT SIDEBAR ---
const RightSidebar = ({ 
  isControlsOpen, 
  isMobile, 
  canvasReady, 
  fontFamily, 
  handleFontFamilyChange, 
  handleBoldToggle, 
  isBold, 
  handleItalicToggle, 
  isItalic, 
  fontSize, 
  handleFontSizeChange, 
  handleColorChange, 
  fontColor 
}) => {
  if (!canvasReady) return (
    <aside className={`${isControlsOpen ? 'w-80' : 'w-0'} bg-slate-950 border-l border-white/5 transition-all duration-300 hidden lg:flex flex-col items-center justify-center p-8 text-center`}>
      <Settings2 size={40} className="text-slate-800 mb-4" />
      <p className="text-xs font-medium text-slate-600 uppercase tracking-widest">Select a template to reveal controls</p>
    </aside>
  );

  return (
    <aside className={`
      ${isControlsOpen ? 'translate-x-0 w-80' : 'translate-x-full w-0'} 
      fixed right-0 lg:relative z-40 h-full transition-all duration-300 ease-in-out
      bg-slate-950 border-l border-white/5 flex flex-col overflow-hidden
    `}>
      <div className="p-6 space-y-8">
        <div>
          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
            <Type size={12} /> Font Identity
          </h4>
          <div className="space-y-4">
            <div className="relative">
              <select 
                value={fontFamily} 
                onChange={(e) => handleFontFamilyChange(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none appearance-none focus:ring-1 focus:ring-indigo-500 transition-all"
              >
                {FONT_FAMILIES.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500"><ChevronRight size={14} className="rotate-90" /></div>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={handleBoldToggle}
                className={`flex-1 flex items-center justify-center py-3 rounded-xl border transition-all ${isBold ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20' : 'bg-slate-900 border-white/10 text-slate-500 hover:border-white/20'}`}
              >
                <Bold size={18} />
              </button>
              <button 
                onClick={handleItalicToggle}
                className={`flex-1 flex items-center justify-center py-3 rounded-xl border transition-all ${isItalic ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20' : 'bg-slate-900 border-white/10 text-slate-500 hover:border-white/20'}`}
              >
                <Italic size={18} />
              </button>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center justify-between">
            <span>Size & Scaling</span>
            <span className="text-indigo-400 bg-indigo-400/10 px-2 py-0.5 rounded-md">{fontSize}px</span>
          </h4>
          <input 
            type="range" 
            min="10" 
            max="200" 
            value={fontSize} 
            onChange={(e) => handleFontSizeChange(parseInt(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
        </div>

        <div>
          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
            <Palette size={12} /> Color Palette
          </h4>
          <div className="grid grid-cols-5 gap-3">
            {COLORS.map(c => (
              <button 
                key={c} 
                onClick={() => handleColorChange(c)}
                className={`aspect-square rounded-full border-2 transition-all flex items-center justify-center ${fontColor === c ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:scale-105'}`}
                style={{ backgroundColor: c }}
              >
                {fontColor === c && <Check size={12} className={c === '#ffffff' ? 'text-slate-900' : 'text-white'} />}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-auto p-6 border-t border-white/5 bg-slate-900/20">
        <div className="p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10">
          <p className="text-[10px] leading-relaxed text-indigo-300/60 font-medium">
            Styles are applied in real-time to the selected canvas object. Changes will be saved to the database upon "Save Layout" click.
          </p>
        </div>
      </div>
    </aside>
  );
};

// --- MAIN PAGE COMPONENT ---
export default function TemplateDesigner() {
  const pdfCanvasRef = useRef(null);
  const fabricContainerRef = useRef(null);
  const fabricInstance = useRef(null);

  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [students, setStudents] = useState([]);
  const [canvasReady, setCanvasReady] = useState(false);
  const [uploadName, setUploadName] = useState("");
  const [uploadFile, setUploadFile] = useState(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isControlsOpen, setIsControlsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  const [fontSize, setFontSize] = useState(40);
  const [fontFamily, setFontFamily] = useState("Helvetica");
  const [fontColor, setFontColor] = useState("#000000");
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [sendPassword, setSendPassword] = useState("");
  const [pendingSend, setPendingSend] = useState(null);
  const [sending, setSending] = useState(false);
  const [currentScale, setCurrentScale] = useState(1.5);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      const newScale = mobile ? 0.7 : 1.5;
      setCurrentScale(newScale);
      
      if (mobile) {
        setIsSidebarOpen(false);
        setIsControlsOpen(false);
      } else {
        setIsSidebarOpen(true);
        setIsControlsOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => { fetchTemplates(); }, []);
  useEffect(() => { if (selectedTemplate) renderPDF(); }, [selectedTemplate, currentScale]);

  useEffect(() => {
    if (!fabricInstance.current) return;
    const canvas = fabricInstance.current;
    const handleSelection = () => {
      const obj = canvas.getActiveObject();
      if (obj) {
        setFontSize(Math.round((obj.fontSize / currentScale) * 1.5) || 40);
        setFontFamily(obj.fontFamily || "Helvetica");
        setFontColor(obj.fill || "#000000");
        setIsBold(obj.fontWeight === "bold");
        setIsItalic(obj.fontStyle === "italic");
      }
    };
    canvas.on("selection:created", handleSelection);
    canvas.on("selection:updated", handleSelection);
    return () => {
      canvas.off("selection:created", handleSelection);
      canvas.off("selection:updated", handleSelection);
    };
  }, [canvasReady, currentScale]);

  const fetchTemplates = async () => {
    try {
      const res = await axios.get("http://localhost:5000/templates");
      setTemplates(res.data);
    } catch (err) {
      toast.error("Failed to load templates");
    }
  };

  const handleTemplateUpload = async () => {
    if (!uploadFile) return toast.error("Select a PDF file first");
    if (!uploadName.trim()) return toast.error("Enter a template name");
    const formData = new FormData();
    formData.append("template", uploadFile);
    formData.append("name", uploadName.trim());
    const promise = axios.post("http://localhost:5000/templates/upload", formData);
    toast.promise(promise, {
      loading: 'Uploading template...',
      success: (res) => {
        setTemplates((prev) => [...prev, res.data.template]);
        setUploadName("");
        setUploadFile(null);
        return "Template uploaded successfully!";
      },
      error: "Failed to upload template"
    });
  };

  const renderPDF = async () => {
    try {
      const pdfUrl = `http://localhost:5000/${selectedTemplate.pdfPath.replace(/\\/g, "/")}`;
      const loadingTask = pdfjsLib.getDocument(pdfUrl);
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: currentScale });
      const canvas = pdfCanvasRef.current;
      const context = canvas.getContext("2d");
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      await page.render({ canvasContext: context, viewport }).promise;
      initializeFabric(viewport.width, viewport.height);
    } catch (err) {
      toast.error("PDF render failed: " + err.message);
    }
  };

  const initializeFabric = (width, height) => {
    if (fabricInstance.current) {
      fabricInstance.current.dispose();
      fabricInstance.current = null;
    }
    const container = fabricContainerRef.current;
    container.innerHTML = "";
    const newCanvas = document.createElement("canvas");
    container.appendChild(newCanvas);
    fabricInstance.current = new fabric.Canvas(newCanvas, { width, height, selection: true });
    setCanvasReady(true);
    if (selectedTemplate.fields?.length > 0) {
      selectedTemplate.fields.forEach((field) => {
        const visualX = (field.x / 1.5) * currentScale;
        const visualY = (field.y / 1.5) * currentScale;
        const visualFontSize = (field.fontSize / 1.5) * currentScale;
        const text = new fabric.IText(field.type || "Name", {
          left: visualX,
          top: visualY,
          fontSize: visualFontSize,
          fill: field.color || "#000000",
          fontFamily: field.fontFamily || "Helvetica",
          fontWeight: field.bold ? "bold" : "normal",
          fontStyle: field.italic ? "italic" : "normal",
        });
        text.fieldType = field.type || "name";
        fabricInstance.current.add(text);
      });
      fabricInstance.current.renderAll();
    }
  };

  const addNameField = () => {
    if (!fabricInstance.current) return toast.error("Select a template first!");
    fabricInstance.current.clear();
    const text = new fabric.IText("Name", {
      left: (200 / 1.5) * currentScale,
      top: (200 / 1.5) * currentScale,
      fontSize: (fontSize / 1.5) * currentScale,
      fill: fontColor,
      fontFamily,
      fontWeight: isBold ? "bold" : "normal",
      fontStyle: isItalic ? "italic" : "normal",
    });
    text.fieldType = "name";
    fabricInstance.current.add(text);
    fabricInstance.current.setActiveObject(text);
    fabricInstance.current.renderAll();
    toast.success("Placeholder field added");
  };

  const applyStyle = (prop, value) => {
    if (!fabricInstance.current) return;
    const obj = fabricInstance.current.getActiveObject();
    if (!obj) return;
    obj.set(prop, value);
    fabricInstance.current.renderAll();
  };

  const handleBoldToggle = () => { const n = !isBold; setIsBold(n); applyStyle("fontWeight", n ? "bold" : "normal"); };
  const handleItalicToggle = () => { const n = !isItalic; setIsItalic(n); applyStyle("fontStyle", n ? "italic" : "normal"); };
  const handleFontSizeChange = (v) => { setFontSize(v); applyStyle("fontSize", (v / 1.5) * currentScale); };
  const handleFontFamilyChange = (v) => { setFontFamily(v); applyStyle("fontFamily", v); };
  const handleColorChange = (v) => { setFontColor(v); applyStyle("fill", v); };

  const saveLayout = async () => {
    if (!selectedTemplate || !fabricInstance.current) return toast.error("Select template first");
    const objects = fabricInstance.current.getObjects();
    if (objects.length === 0) return toast.error("Add Name field first");
    const obj = objects[0];
    const fields = [{
      type: "name",
      x: (obj.left / currentScale) * 1.5,
      y: (obj.top / currentScale) * 1.5,
      fontSize: (obj.fontSize / currentScale) * 1.5,
      fontFamily: obj.fontFamily,
      color: obj.fill,
      bold: obj.fontWeight === "bold",
      italic: obj.fontStyle === "italic",
    }];
    try {
      await axios.post(`http://localhost:5000/templates/${selectedTemplate._id}/layout`, { fields });
      toast.success("Layout synced to cloud!");
    } catch (err) { toast.error("Failed to save layout"); }
  };

  const handleExcelUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    const promise = axios.post("http://localhost:5000/excel/upload", formData);
    toast.promise(promise, {
      loading: 'Parsing dataset...',
      success: (res) => { setStudents(res.data); return `Imported ${res.data.length} records`; },
      error: "Failed to parse Excel file"
    });
  };

  const previewCertificate = async (student) => {
    if (!selectedTemplate) return toast.error("Select template first");
    try {
      const res = await axios.post("http://localhost:5000/certificate/preview", { templateId: selectedTemplate._id, studentData: student }, { responseType: "blob" });
      window.open(URL.createObjectURL(res.data));
    } catch (err) { toast.error("Preview generation failed"); }
  };

  const requestSend = (type, data) => { setPendingSend({ type, data }); setSendPassword(""); setShowPasswordModal(true); };

  const confirmSend = async () => {
    if (!sendPassword) return toast.error("Authorization required");
    setSending(true);
    try {
      if (pendingSend.type === "single") {
        await axios.post("http://localhost:5000/certificate/send", { templateId: selectedTemplate._id, studentData: pendingSend.data, password: sendPassword });
        toast.success(`Dispatched to ${pendingSend.data.email}`);
      } else {
        const res = await axios.post("http://localhost:5000/certificate/send-bulk", { templateId: selectedTemplate._id, students: pendingSend.data, password: sendPassword });
        toast.success(`Broadcast finished: ${res.data.results.filter(r => r.success).length} successful`);
      }
    } catch (err) { toast.error(err.response?.data?.error || "Send failure"); }
    finally { setSending(false); setShowPasswordModal(false); setPendingSend(null); }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#020617] font-sans text-slate-200 selection:bg-indigo-500/30">
      <Toaster position="top-center" richColors theme="dark" />
      
      {/* Background Orbs */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500/10 blur-[120px]" />
      </div>

      {/* Mobile Bar */}
      {isMobile && (
        <div className="fixed top-0 inset-x-0 h-16 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 z-50 flex items-center justify-between px-6">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-white/5 rounded-lg transition-colors"><Menu size={20} className="text-slate-400" /></button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">C</div>
            <span className="font-bold tracking-tight text-white">Certifi</span>
          </div>
          <button onClick={() => setIsControlsOpen(!isControlsOpen)} className="p-2 hover:bg-white/5 rounded-lg transition-colors"><Settings2 size={20} className="text-slate-400" /></button>
        </div>
      )}

      {/* LEFT SIDEBAR */}
      <LeftSidebar 
        isSidebarOpen={isSidebarOpen} 
        isMobile={isMobile}
        uploadName={uploadName} setUploadName={setUploadName}
        uploadFile={uploadFile} setUploadFile={setUploadFile}
        handleTemplateUpload={handleTemplateUpload}
        templates={templates}
        selectedTemplate={selectedTemplate} setSelectedTemplate={setSelectedTemplate}
        handleExcelUpload={handleExcelUpload}
        students={students}
        requestSend={requestSend}
        previewCertificate={previewCertificate}
      />

      {/* MAIN VIEWPORT */}
      <main className={`flex-1 relative flex flex-col min-w-0 bg-[#020617] z-10 ${isMobile ? 'pt-16' : ''}`}>
        {/* Designer Header / Toolbar */}
        <header className="h-16 border-b border-white/5 bg-slate-950/50 backdrop-blur-sm flex items-center justify-between px-8">
          <div className="flex items-center gap-4">
            {!isMobile && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white">C</div>
                <span className="font-bold tracking-tight text-white mr-4">Certifi Studio</span>
              </div>
            )}
            <div className="h-4 w-px bg-white/10" />
            <span className="text-xs font-medium text-slate-500 truncate max-w-[200px]">
              {selectedTemplate ? selectedTemplate.name : "New Project"}
            </span>
          </div>

          {selectedTemplate && (
            <div className="flex items-center gap-3">
              <button 
                onClick={addNameField}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-white/10 rounded-xl transition-all text-xs font-bold"
              >
                <PlusCircle size={14} /> Add Placeholder
              </button>
              <button 
                onClick={saveLayout}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all text-xs font-bold shadow-lg shadow-indigo-600/20"
              >
                <Save size={14} /> Sync Layout
              </button>
            </div>
          )}
        </header>

        {/* Canvas Stage */}
        <div className="flex-1 overflow-auto flex justify-center items-center p-12 bg-pattern relative">
          {!selectedTemplate ? (
            <div className="max-w-md w-full text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="w-24 h-24 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-[32px] flex items-center justify-center mx-auto border border-white/10 shadow-2xl">
                <PlusCircle size={40} className="text-indigo-400" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white tracking-tight">Designer Workspace Ready</h2>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Start by selecting an existing template or uploading a fresh certificate PDF to define placement fields.
                </p>
              </div>
              <div className="flex items-center justify-center gap-8 text-[10px] font-bold text-slate-500 uppercase tracking-widest pt-4">
                <span className="flex items-center gap-2"><ArrowRight size={12} /> Pick Template</span>
                <span className="flex items-center gap-2"><ArrowRight size={12} /> Add Fields</span>
                <span className="flex items-center gap-2"><ArrowRight size={12} /> Send Bulk</span>
              </div>
            </div>
          ) : (
            <div className="relative animate-in zoom-in-95 fade-in duration-500">
              <div className="absolute -inset-2 bg-gradient-to-tr from-indigo-500/20 via-transparent to-purple-500/20 rounded-xl blur-lg pointer-events-none" />
              <div className="relative bg-white rounded shadow-[0_40px_100px_rgba(0,0,0,0.7)] overflow-hidden">
                <canvas ref={pdfCanvasRef} />
                <div ref={fabricContainerRef} className="absolute inset-0" />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* RIGHT SIDEBAR */}
      <RightSidebar 
        isControlsOpen={isControlsOpen} 
        isMobile={isMobile}
        canvasReady={canvasReady}
        fontFamily={fontFamily} handleFontFamilyChange={handleFontFamilyChange}
        handleBoldToggle={handleBoldToggle} isBold={isBold}
        handleItalicToggle={handleItalicToggle} isItalic={isItalic}
        fontSize={fontSize} handleFontSizeChange={handleFontSizeChange}
        handleColorChange={handleColorChange} fontColor={fontColor}
      />

      {/* MODAL: SECURITY AUTH */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#0f172a] border border-white/10 rounded-[32px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            <div className="h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
            <div className="p-10 text-center">
              <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Lock size={28} className="text-indigo-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Security Verification</h3>
              <p className="text-slate-400 text-sm mb-8 leading-relaxed px-4">
                {pendingSend?.type === "bulk" 
                  ? `You are broadcasting to ${pendingSend.data.length} recipients. Enter admin key.` 
                  : `Authorizing delivery to ${pendingSend?.data?.email}.`}
              </p>
              
              <input
                type="password"
                value={sendPassword}
                onChange={(e) => setSendPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-900/50 border border-white/10 rounded-2xl px-6 py-4 text-center text-xl tracking-[0.5em] text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all mb-6"
                autoFocus
              />

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setShowPasswordModal(false)}
                  disabled={sending}
                  className="py-4 px-6 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-semibold transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmSend}
                  disabled={sending}
                  className="py-4 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {sending ? <Loader2 className="animate-spin" size={18} /> : "Authorize"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STYLES */}
      <style>{`
        .bg-pattern {
          background-image: radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 0);
          background-size: 32px 32px;
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #334155; }
        
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          background: #6366f1;
          border: 4px solid #0f172a;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(99, 102, 241, 0.4);
        }

        .canvas-container { margin: 0 auto !important; }
      `}</style>
    </div>
  );
}