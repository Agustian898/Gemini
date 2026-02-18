import React from 'react';
import { Wand2, RefreshCw, StopCircle, Sparkles, Loader2, Copy, Video } from 'lucide-react';
import { TimelineStep } from '../types';

interface ControlPanelProps {
  objectDesc: string;
  setObjectDesc: (val: string) => void;
  prompts: TimelineStep[];
  isGeneratingPrompts: boolean;
  isRendering: boolean;
  renderingStep: number;
  onGeneratePrompts: () => void;
  onAutoRender: () => void;
  onStop: () => void;
  onRandom: () => void;
  error: string | null;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  objectDesc,
  setObjectDesc,
  prompts,
  isGeneratingPrompts,
  isRendering,
  renderingStep,
  onGeneratePrompts,
  onAutoRender,
  onStop,
  onRandom,
  error
}) => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).catch(console.error);
  };

  return (
    <div className="lg:col-span-4 space-y-6">
      {/* Header Info */}
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800 shadow-2xl relative overflow-hidden group">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-600/10 rounded-full blur-[80px] group-hover:bg-indigo-600/20 transition duration-1000"></div>

        {/* Input Section */}
        <div className="mb-6 relative z-10">
          <div className="flex justify-between items-end mb-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Project Subject</label>
            <button 
              onClick={onRandom} 
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition"
            >
              <Wand2 size={12} /> Surprise Location
            </button>
          </div>
          <input 
            type="text" 
            value={objectDesc}
            onChange={(e) => setObjectDesc(e.target.value)}
            placeholder="Describe the house (or leave empty for random)..."
            className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-sm text-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition shadow-inner"
          />
        </div>

        {/* Mode Info */}
        <div className="mb-6 relative z-10">
          <div className="p-3 bg-indigo-900/20 border border-indigo-500/30 rounded-lg flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-md">
              <Video size={16} className="text-white" />
            </div>
            <div>
              <p className="text-xs font-bold text-indigo-200 uppercase">Active Mode</p>
              <p className="text-sm text-gray-300">Renovation Drone: Pool, Heavy Machinery & Luxury</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 relative z-10">
          <button 
            onClick={onGeneratePrompts}
            disabled={isGeneratingPrompts || isRendering}
            className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium py-3 rounded-xl transition flex items-center justify-center gap-2 text-sm border border-gray-700 hover:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGeneratingPrompts ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
            {prompts.length > 0 ? "Regenerate Scenarios" : "Generate Scenario Only"}
          </button>

          <div className="relative">
            {isRendering ? (
              <button 
                onClick={onStop}
                className="w-full bg-red-900/50 hover:bg-red-900/80 text-red-200 font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 text-sm border border-red-800 animate-pulse"
              >
                <StopCircle size={18} /> Stop Rendering ({renderingStep}/8)
              </button>
            ) : (
              <button 
                onClick={onAutoRender}
                className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-900/40 transition transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 text-sm"
              >
                <Sparkles size={18} className="text-yellow-200" /> Auto Render 8 Frames
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-900/20 border border-red-900/50 rounded-lg text-red-300 text-xs text-center break-words">
            {error}
          </div>
        )}
      </div>

      {/* Prompts Log */}
      {prompts.length > 0 && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden max-h-60 overflow-y-auto custom-scrollbar">
          <div className="sticky top-0 p-3 bg-gray-800/95 backdrop-blur border-b border-gray-800 text-xs font-bold text-gray-400 uppercase flex justify-between z-10">
            <span>Generated Scenario</span>
            <span className="text-[10px] text-gray-500 normal-case">Image & Video Prompts</span>
          </div>
          <div className="p-2 space-y-2">
            {prompts.map((p, i) => (
              <div key={i} className="bg-gray-800/30 p-2 rounded border border-gray-800 hover:bg-gray-800 transition group">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-indigo-400 font-mono text-[10px] font-bold">Step {(i+1).toString().padStart(2,'0')}</span>
                  <div className="flex gap-1 opacity-50 group-hover:opacity-100 transition">
                    <button onClick={() => copyToClipboard(p.image)} className="text-gray-400 hover:text-white" title="Copy Image Prompt"><Copy size={10} /></button>
                    <button onClick={() => copyToClipboard(p.video)} className="text-gray-400 hover:text-white" title="Copy Video Prompt"><Video size={10} /></button>
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 truncate mb-1" title={p.image}>🖼️ {p.image}</p>
                <p className="text-[10px] text-indigo-400 truncate" title={p.video}>🎬 {p.video}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};