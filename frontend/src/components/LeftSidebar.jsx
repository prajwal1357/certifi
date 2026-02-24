import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { toast, Toaster } from "sonner";
import { 
  CloudUpload, 
  FileText, 
  Users, 
  X, 
  ChevronRight,
  Plus,
  Send,
  Mail,
  Layout,
  Loader2
} from "lucide-react";

/**
 * FIXED: External libraries are now loaded dynamically to prevent 
 * "Could not resolve" bundle errors in the preview environment.
 */

const LeftSidebar = ({ 
  isSidebarOpen, 
  setIsSidebarOpen,
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
  return (
    <aside className={`
      fixed inset-y-0 left-0 z-40 w-72 bg-slate-950 border-r border-white/5 transition-transform duration-300 transform
      ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      ${isMobile ? 'pt-14 shadow-2xl' : 'relative translate-x-0'}
      flex flex-col h-full
    `}>
      {isMobile && isSidebarOpen && (
        <button 
          onClick={() => setIsSidebarOpen(false)} 
          className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>
      )}

      <div className="p-6 flex flex-col h-full overflow-y-auto custom-scrollbar">
        {/* Logo Section */}
        {!isMobile && (
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20">
              <Layout className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">Certifi<span className="text-indigo-400">.</span></h1>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Designer Pro</p>
            </div>
          </div>
        )}

        {/* Upload Template Section */}
        <section className="mb-8">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <CloudUpload size={14} className="text-indigo-400" /> Upload Template
          </h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Template name..."
              value={uploadName}
              onChange={(e) => setUploadName(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-200 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-600"
            />
            <div className="relative">
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setUploadFile(e.target.files[0])}
                className="opacity-0 absolute inset-0 cursor-pointer z-10"
              />
              <div className="flex items-center justify-center gap-2 text-slate-400 py-2 border-2 border-dashed border-white/10 rounded-xl text-xs hover:bg-white/5 transition-colors">
                <Plus size={14} /> {uploadFile ? uploadFile.name : "Select PDF File"}
              </div>
            </div>
            <button 
              onClick={handleTemplateUpload} 
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/20 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              Upload Design
            </button>
          </div>
        </section>

        <div className="h-px bg-white/5 mb-8" />

        {/* Templates List Section */}
        <section className="mb-8">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <FileText size={14} className="text-purple-400" /> My Templates
          </h3>
          <div className="space-y-2">
            {templates.length === 0 ? (
              <div className="text-center py-6 px-4 rounded-xl border border-white/5 bg-slate-900/20">
                 <p className="text-[10px] text-slate-500 leading-relaxed uppercase tracking-wider">No templates found.<br/>Upload one to begin.</p>
              </div>
            ) : (
              templates.map((template) => (
                <button
                  key={template._id}
                  onClick={() => {
                    setSelectedTemplate(template);
                    if(isMobile) setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all group ${
                    selectedTemplate?._id === template._id 
                    ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-100 shadow-lg" 
                    : "bg-slate-900/40 border-white/5 text-slate-400 hover:bg-slate-800 hover:border-white/10"
                  }`}
                >
                  <span className="text-sm font-medium truncate pr-2">{template.name}</span>
                  <div className={`w-1.5 h-1.5 rounded-full ${selectedTemplate?._id === template._id ? 'bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]' : 'bg-slate-700 group-hover:bg-slate-500'}`} />
                </button>
              ))
            )}
          </div>
        </section>

        <div className="h-px bg-white/5 mb-8" />

        {/* Recipients Section */}
        <section className="flex-1 flex flex-col min-h-0">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Users size={14} className="text-emerald-400" /> Recipients
          </h3>
          <div className="relative mb-4">
            <input
              type="file"
              accept=".xlsx, .csv"
              onChange={handleExcelUpload}
              className="opacity-0 absolute inset-0 cursor-pointer z-10"
            />
            <div className="flex items-center justify-center gap-2 text-slate-400 py-2 border-2 border-dashed border-white/10 rounded-xl text-xs hover:bg-white/5 transition-colors">
              <Plus size={14} /> Import Data
            </div>
          </div>

          {students.length > 0 && (
            <div className="flex flex-col flex-1 min-h-0">
              <div className="flex items-center justify-between mb-4 px-1">
                <span className="text-[10px] font-bold px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md">
                  {students.length} Total
                </span>
                <button
                  onClick={() => requestSend("bulk", students)}
                  className="flex items-center gap-2 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-wider"
                >
                  <Send size={12} /> Send All
                </button>
              </div>
              <div className="space-y-1 overflow-y-auto flex-1 custom-scrollbar pr-1 pb-4">
                {students.map((student, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-xl border border-transparent hover:border-white/5 hover:bg-white/5 transition-all group">
                    <div 
                      onClick={() => previewCertificate(student)}
                      className="flex-1 truncate cursor-pointer py-1"
                    >
                      <p className="text-xs font-semibold text-slate-200 group-hover:text-white transition-colors truncate">{student.name}</p>
                      <p className="text-[10px] text-slate-500 truncate">{student.email}</p>
                    </div>
                    <button
                      onClick={() => requestSend("single", student)}
                      className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-indigo-400 transition-all rounded-lg hover:bg-slate-800"
                    >
                      <Mail size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </aside>
  );
};

export default function TemplateDesigner() {
  const [libStatus, setLibStatus] = useState("loading");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [students, setStudents] = useState([]);
  const [uploadName, setUploadName] = useState("");
  const [uploadFile, setUploadFile] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  // Load Fabric and PDF.js dynamically
  useEffect(() => {
    const loadScripts = async () => {
      try {
        const fabricScript = document.createElement("script");
        fabricScript.src = "https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.1/fabric.min.js";
        
        const pdfScript = document.createElement("script");
        pdfScript.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
        
        const load = (script) => new Promise((resolve) => {
          script.onload = resolve;
          document.head.appendChild(script);
        });

        await Promise.all([load(fabricScript), load(pdfScript)]);
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
        setLibStatus("ready");
      } catch (err) {
        setLibStatus("error");
      }
    };
    loadScripts();
    
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (libStatus === "loading") {
    return (
      <div className="h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="animate-spin mb-4 text-indigo-500" size={32} />
        <p className="text-sm font-medium animate-pulse">Initializing Designer Studio...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#020617] font-sans text-slate-200">
      <Toaster position="top-center" richColors theme="dark" />
      
      <LeftSidebar 
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        isMobile={isMobile}
        uploadName={uploadName}
        setUploadName={setUploadName}
        uploadFile={uploadFile}
        setUploadFile={setUploadFile}
        templates={templates}
        selectedTemplate={selectedTemplate}
        setSelectedTemplate={setSelectedTemplate}
        students={students}
        // Mock handlers for standalone preview
        handleTemplateUpload={() => toast.success("Upload triggered")}
        handleExcelUpload={() => toast.info("Excel parser ready")}
        requestSend={(type, data) => toast.info(`Send requested for ${type}`)}
        previewCertificate={(s) => toast.info(`Previewing ${s.name}`)}
      />

      <main className="flex-1 flex items-center justify-center relative p-12 overflow-auto bg-pattern">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto border border-white/5">
            <Layout className="text-indigo-400" size={32} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white mb-2">Left Sidebar Component</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              This module handles template management, PDF uploads, and recipient distribution lists.
            </p>
          </div>
        </div>
      </main>

      <style>{`
        .bg-pattern {
          background-image: radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 0);
          background-size: 32px 32px;
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
      `}</style>
    </div>
  );
}