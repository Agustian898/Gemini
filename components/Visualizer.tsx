import React from 'react';
import { Loader2, ImageIcon, ChevronLeft, ChevronRight, Download, SlidersHorizontal, Trash2, Video } from 'lucide-react';
import { TimelineFrame, TimelineStep } from '../types';

interface VisualizerProps {
  images: TimelineFrame[];
  prompts: TimelineStep[];
  currentFrame: number;
  setCurrentFrame: (val: number) => void;
  isRendering: boolean;
  renderingStep: number;
  onDownloadAll: () => void;
  onClear: () => void;
}

export const Visualizer: React.FC<VisualizerProps> = ({
  images,
  prompts,
  currentFrame,
  setCurrentFrame,
  isRendering,
  renderingStep,
  onDownloadAll,
  onClear
}) => {
  
  const handleDownloadSingle = (idx: number) => {
    const img = images[idx];
    if (img) {
      const link = document.createElement('a');
      link.href = img;
      link.download = `timelapse_frame_${idx + 1}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).catch(console.error);
  };

  const hasImages = images.some(Boolean);

  return (
    <div className="flex-1 min-h-[500px] bg-black rounded-3xl border border-gray-800 shadow-2xl relative overflow-hidden flex flex-col md:flex-row">
      {/* Image Display */}
      <div className="flex-1 relative bg-gray-900 flex items-center justify-center overflow-hidden">
        {/* Grid Background */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        
        <div className="relative h-full w-full flex items-center justify-center p-4">
          <div className="relative aspect-[9/16] h-full max-h-full bg-gray-800 shadow-2xl rounded overflow-hidden border border-gray-700 ring-1 ring-white/10 group">
            {images[currentFrame] ? (
              <img src={images[currentFrame]!} className="w-full h-full object-cover" alt={`Frame ${currentFrame + 1}`} />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-600 gap-4">
                {isRendering && renderingStep === currentFrame + 1 ? (
                  <div className="flex flex-col items-center animate-pulse">
                    <Loader2 size={40} className="text-indigo-500 animate-spin mb-2" />
                    <span className="text-xs font-mono text-indigo-400">Rendering Frame {currentFrame + 1}...</span>
                  </div>
                ) : (
                  <>
                    <ImageIcon size={48} className="opacity-20" />
                    <span className="text-xs">Empty Frame</span>
                  </>
                )}
              </div>
            )}

            {/* Navigation Controls */}
            <button 
              onClick={(e) => { e.stopPropagation(); setCurrentFrame((currentFrame - 1 + 8) % 8); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-2 rounded-full border border-white/20 transition z-20 opacity-0 group-hover:opacity-100"
              title="Previous Frame"
            >
              <ChevronLeft size={24} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); setCurrentFrame((currentFrame + 1) % 8); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-2 rounded-full border border-white/20 transition z-20 opacity-0 group-hover:opacity-100"
              title="Next Frame"
            >
              <ChevronRight size={24} />
            </button>

            {/* Scrubber */}
            {hasImages && (
              <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-3/4 z-20 flex items-center gap-3 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 opacity-0 group-hover:opacity-100 transition duration-300">
                <SlidersHorizontal size={14} className="text-indigo-400" />
                <input 
                  type="range" 
                  min="0" 
                  max="7" 
                  value={currentFrame} 
                  onChange={(e) => setCurrentFrame(parseInt(e.target.value))}
                  className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <span className="text-[10px] font-mono text-white whitespace-nowrap">{currentFrame + 1} / 8</span>
              </div>
            )}

            {/* Single Download */}
            {images[currentFrame] && (
              <button 
                onClick={() => handleDownloadSingle(currentFrame)}
                className="absolute top-4 right-4 bg-black/50 hover:bg-black/80 text-white p-2 rounded-full border border-white/20 transition opacity-0 group-hover:opacity-100 z-20"
                title="Download Frame"
              >
                <Download size={16} />
              </button>
            )}
            
            {/* Overlay Info */}
            <div className="absolute top-0 left-0 p-4 pointer-events-none z-10">
              <span className="text-xs font-mono text-gray-300 bg-black/50 px-2 py-1 rounded border border-white/10">Frame {currentFrame + 1}/8</span>
            </div>

            {/* Video Prompt Overlay */}
            {prompts[currentFrame] && images[currentFrame] && (
              <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-md p-3 rounded-lg border border-white/10 flex flex-col gap-1 transition-opacity opacity-0 group-hover:opacity-100 z-20">
                <span className="text-[10px] uppercase font-bold text-indigo-400 flex items-center gap-1">
                  <Video size={10} /> Image-to-Video Prompt
                </span>
                <p className="text-[10px] text-gray-200 leading-tight line-clamp-2">
                  {prompts[currentFrame].video}
                </p>
                <button 
                  onClick={() => copyToClipboard(prompts[currentFrame].video)}
                  className="mt-1 text-[10px] bg-indigo-600 hover:bg-indigo-500 text-white py-1 px-2 rounded self-start"
                >
                  Copy for Runway/Pika
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar Tools */}
      <div className="md:w-20 bg-gray-900 border-l border-gray-800 flex md:flex-col items-center justify-center gap-6 p-4 z-20">
        <button 
          onClick={onDownloadAll}
          className="p-2 text-gray-400 hover:text-blue-400 transition flex flex-col items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Download All Frames"
          disabled={!hasImages}
        >
          <Download size={18} />
        </button>

        <button 
          onClick={onClear}
          className="p-2 text-gray-600 hover:text-red-400 transition"
          title="Clear All"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
};