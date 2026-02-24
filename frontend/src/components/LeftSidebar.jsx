import { 
  HiOutlineCloudUpload, 
  HiOutlineTemplate, 
  HiOutlineUserGroup, 
  HiOutlinePlus, 
  HiOutlineMail, 
  HiOutlineX 
} from "react-icons/hi"

export default function LeftSidebar({
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
}) {
  return (
    <aside className={`
      fixed inset-y-0 left-0 z-40 w-72 bg-slate-900 border-r border-slate-800 transition-transform duration-300 transform
      ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      ${isMobile ? 'pt-14 shadow-2xl' : 'relative translate-x-0'}
      flex flex-col
    `}>
      {isMobile && isSidebarOpen && (
        <button onClick={() => setIsSidebarOpen(false)} className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white">
          <HiOutlineX size={20} />
        </button>
      )}

      <div className="p-6 flex flex-col h-full overflow-y-auto custom-scrollbar">
        {/* Logo */}
        {!isMobile && (
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20">
              🎓
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">Certifi<span className="text-indigo-400">.</span></h1>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Designer Pro</p>
            </div>
          </div>
        )}

        {/* Upload Template */}
        <section className="mb-8">
          <h3 className="section-label flex items-center gap-2 mb-4">
            <HiOutlineCloudUpload className="text-indigo-400" /> Upload Template
          </h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Template name..."
              value={uploadName}
              onChange={(e) => setUploadName(e.target.value)}
              className="input text-slate-200"
            />
            <div className="relative">
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setUploadFile(e.target.files[0])}
                className="input input-file opacity-0 absolute inset-0 cursor-pointer z-10"
              />
              <div className="input flex items-center justify-center gap-2 text-slate-400 py-2 border-dashed">
                <HiOutlinePlus /> {uploadFile ? uploadFile.name : "Select PDF File"}
              </div>
            </div>
            <button onClick={handleTemplateUpload} title="Upload New Template" className="btn btn-primary btn-full py-2.5">
              Upload Design
            </button>
          </div>
        </section>

        <div className="h-px bg-slate-800 mb-8" />

        {/* Templates List */}
        <section className="mb-8">
          <h3 className="section-label flex items-center gap-2 mb-4">
            <HiOutlineTemplate className="text-purple-400" /> My Templates
          </h3>
          <div className="space-y-2">
            {templates.length === 0 ? (
              <div className="text-center py-6 px-4 rounded-xl border border-slate-800 bg-slate-900/50">
                 <p className="text-xs text-slate-500">No templates found.<br/>Upload one to begin.</p>
              </div>
            ) : (
              templates.map((template) => (
                <div
                  key={template._id}
                  onClick={() => {
                    setSelectedTemplate(template)
                    if(isMobile) setIsSidebarOpen(false)
                  }}
                  className={`template-card flex items-center justify-between group ${
                    selectedTemplate?._id === template._id ? "active ring-1 ring-indigo-500" : ""
                  }`}
                >
                  <span className="truncate pr-2">{template.name}</span>
                  <div className={`w-1.5 h-1.5 rounded-full ${selectedTemplate?._id === template._id ? 'bg-indigo-400' : 'bg-slate-700 group-hover:bg-slate-500'}`} />
                </div>
              ))
            )}
          </div>
        </section>

        <div className="h-px bg-slate-800 mb-8" />

        {/* Excel Upload & Students */}
        <section className="flex-1 flex flex-col min-h-0">
          <h3 className="section-label flex items-center gap-2 mb-4">
            <HiOutlineUserGroup className="text-emerald-400" /> Recipients
          </h3>
          <div className="relative mb-4">
            <input
              type="file"
              accept=".xlsx"
              onChange={handleExcelUpload}
              className="input input-file opacity-0 absolute inset-0 cursor-pointer z-10"
            />
            <div className="input flex items-center justify-center gap-2 text-slate-400 py-2 border-dashed">
              <HiOutlinePlus /> Upload Excel Data
            </div>
          </div>

          {students.length > 0 && (
            <div className="flex flex-col flex-1 min-h-0">
              <div className="flex items-center justify-between mb-4">
                <span className="badge badge-success px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {students.length} Total
                </span>
                <button
                  onClick={() => requestSend("bulk", students)}
                  className="flex items-center gap-2 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  <HiOutlineMail size={16} /> Send All
                </button>
              </div>
              <div className="space-y-1 overflow-y-auto flex-1 custom-scrollbar pr-1 pb-4">
                {students.map((student, i) => (
                  <div key={i} className="student-card group hover:bg-slate-800/80">
                    <div 
                      onClick={() => previewCertificate(student)}
                      className="flex-1 truncate py-1"
                      title="Click to preview"
                    >
                      <p className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">{student.name}</p>
                      <p className="text-[10px] text-slate-500 truncate">{student.email}</p>
                    </div>
                    <button
                      onClick={() => requestSend("single", student)}
                      className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-indigo-400 transition-all rounded-lg hover:bg-slate-700"
                      title="Send Mail"
                    >
                      <HiOutlineMail size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </aside>
  )
}
