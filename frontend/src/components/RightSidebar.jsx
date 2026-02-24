import { 
  HiOutlineAdjustments, 
  HiOutlinePlus, 
  HiOutlineSave, 
  HiOutlineX 
} from "react-icons/hi"

export default function RightSidebar({
  isControlsOpen,
  setIsControlsOpen,
  isMobile,
  addNameField,
  canvasReady,
  fontFamily,
  handleFontFamilyChange,
  FONT_FAMILIES,
  handleBoldToggle,
  isBold,
  handleItalicToggle,
  isItalic,
  fontSize,
  handleFontSizeChange,
  handleColorChange,
  fontColor,
  COLORS,
  saveLayout
}) {
  return (
    <aside className={`
      fixed inset-y-0 right-0 z-40 w-72 bg-slate-900 border-l border-slate-800 transition-transform duration-300 transform
      ${isControlsOpen ? 'translate-x-0' : 'translate-x-full'}
      ${isMobile ? 'pt-14 shadow-2xl' : 'relative translate-x-0'}
      flex flex-col
    `}>
      {isMobile && isControlsOpen && (
        <button onClick={() => setIsControlsOpen(false)} className="absolute top-4 left-4 p-2 text-slate-500 hover:text-white">
          <HiOutlineX size={20} />
        </button>
      )}

      <div className="p-6 flex flex-col h-full overflow-y-auto custom-scrollbar">
        <h2 className="text-sm font-bold text-white mb-6 uppercase tracking-widest flex items-center gap-2">
          <HiOutlineAdjustments className="text-indigo-400" /> Styling Suite
        </h2>

        <div className="space-y-6">
          <button onClick={addNameField} disabled={!canvasReady} className="btn btn-primary btn-full py-3 gap-2 shadow-indigo-500/20">
            <HiOutlinePlus /> Reset & Add Name
          </button>

          <div className="h-px bg-slate-800" />

          {/* Typography */}
          <div>
            <p className="section-label mb-3">Typography</p>
            <div className="space-y-4">
              <select
                value={fontFamily}
                onChange={(e) => handleFontFamilyChange(e.target.value)}
                className="input text-sm text-slate-200"
              >
                {FONT_FAMILIES.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleBoldToggle}
                  className={`toggle-btn w-full ${isBold ? "active" : ""}`}
                >
                  <strong>Bold</strong>
                </button>
                <button
                  onClick={handleItalicToggle}
                  className={`toggle-btn w-full ${isItalic ? "active" : ""}`}
                >
                  <em>Italic</em>
                </button>
              </div>
            </div>
          </div>

          {/* Scale */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <p className="section-label m-0">Size: <span className="text-white tabular-nums">{Math.round(fontSize)}px</span></p>
            </div>
            <input
              type="range"
              min="12"
              max="96"
              step="1"
              value={fontSize}
              onChange={(e) => handleFontSizeChange(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <div className="flex flex-wrap gap-1 mt-3">
              {[14, 24, 32, 40, 56, 72].map((s) => (
                <button
                  key={s}
                  onClick={() => handleFontSizeChange(s)}
                  className={`text-[10px] font-bold px-2 py-1 rounded-md transition-all ${
                    fontSize === s
                      ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30"
                      : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Color Palette */}
          <div>
            <p className="section-label mb-3">Color Palette</p>
            <div className="grid grid-cols-5 gap-2 gap-y-3">
              {COLORS.map((c) => (
                <div
                  key={c}
                  onClick={() => handleColorChange(c)}
                  className={`color-swatch w-full h-8 rounded-lg cursor-pointer ring-offset-2 ring-offset-slate-900 transition-all ${fontColor === c ? "ring-2 ring-white scale-110" : "hover:scale-105"}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <div className="flex items-center gap-3 mt-4 p-2 rounded-xl bg-slate-800/50 border border-slate-700/50">
              <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-slate-600">
                <input
                  type="color"
                  value={fontColor}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="absolute inset-0 w-full h-full p-0 border-0 cursor-pointer scale-150"
                />
              </div>
              <span className="text-xs font-mono text-slate-400 uppercase">{fontColor}</span>
            </div>
          </div>

          <div className="h-px bg-slate-800" />

          {/* Save Action */}
          <button onClick={saveLayout} disabled={!canvasReady} className="btn btn-success btn-full py-4 gap-2 text-base font-bold shadow-emerald-500/20">
            <HiOutlineSave size={20} /> Deploy Layout
          </button>
        </div>
      </div>
    </aside>
  )
}
