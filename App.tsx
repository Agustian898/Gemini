import React, { useState, useRef, useCallback } from 'react';
import { Video, Loader2 } from 'lucide-react';
import { TimelineStep, TimelineFrame, GenerationState } from './types';
import { generateTimelinePrompts, generateInitialImage, editImageFrame } from './services/geminiService';
import { ControlPanel } from './components/ControlPanel';
import { Visualizer } from './components/Visualizer';
import { STYLES, LOCATIONS, DEFAULT_SUBJECT } from './constants';

export default function App() {
  const [objectDesc, setObjectDesc] = useState('');
  const [prompts, setPrompts] = useState<TimelineStep[]>([]);
  const [images, setImages] = useState<TimelineFrame[]>(Array(8).fill(null));
  const [currentFrame, setCurrentFrame] = useState(0);
  
  const [genState, setGenState] = useState<GenerationState>({
    isGeneratingPrompts: false,
    isRendering: false,
    renderingStep: 0,
    error: null
  });
  
  const stopRenderingRef = useRef(false);

  const handleGeneratePrompts = useCallback(async (descOverride?: string) => {
    const descToUse = descOverride || objectDesc || DEFAULT_SUBJECT;
    setGenState(prev => ({ ...prev, isGeneratingPrompts: true, error: null }));
    
    try {
      const generatedPrompts = await generateTimelinePrompts(descToUse);
      setPrompts(generatedPrompts);
      if (!objectDesc && !descOverride) {
        setObjectDesc("Abandoned House (Aerial Drone View)");
      }
    } catch (err: any) {
      setGenState(prev => ({ ...prev, error: err.message || "Failed to generate prompts" }));
    } finally {
      setGenState(prev => ({ ...prev, isGeneratingPrompts: false }));
    }
  }, [objectDesc]);

  const handleAutoRender = useCallback(async () => {
    if (genState.isRendering) return;
    stopRenderingRef.current = false;
    setGenState(prev => ({ ...prev, isRendering: true, error: null }));

    // Ensure prompts exist
    let currentPrompts = prompts;
    if (prompts.length === 0) {
       try {
         const descToUse = objectDesc || DEFAULT_SUBJECT;
         const newPrompts = await generateTimelinePrompts(descToUse);
         setPrompts(newPrompts);
         currentPrompts = newPrompts;
       } catch (err: any) {
         setGenState(prev => ({ ...prev, isRendering: false, error: "Failed to auto-generate prompts: " + err.message }));
         return;
       }
    }

    try {
      const newImages = [...images];
      let prevImage = images[0];

      // If we are resuming or restarting, we might want to logic-check here, 
      // but for simplicity, we start from the first empty frame or 0 if all full?
      // Let's just always start from 0 for consistency in this tool.
      
      for (let i = 0; i < 8; i++) {
        if (stopRenderingRef.current) break;
        setGenState(prev => ({ ...prev, renderingStep: i + 1 }));

        // Skip if image exists? Maybe not, allow overwrite.
        // For 'edit' consistency, we must render sequentially.
        
        const promptText = currentPrompts[i].image;
        let resultImage: string | null = null;

        if (i === 0) {
          resultImage = await generateInitialImage(promptText);
        } else {
          // Frame 2-8: Edit previous frame
          if (!prevImage) throw new Error("Previous frame missing for edit operation");
          resultImage = await editImageFrame(promptText, prevImage);
        }

        if (resultImage) {
          newImages[i] = resultImage;
          setImages([...newImages]);
          prevImage = resultImage;
          // Optionally auto-advance view
          // setCurrentFrame(i); 
        } else {
          throw new Error(`Failed to render frame ${i + 1}`);
        }
      }
    } catch (err: any) {
       setGenState(prev => ({ ...prev, error: err.message || "Rendering stopped due to error" }));
    } finally {
      setGenState(prev => ({ ...prev, isRendering: false, renderingStep: 0 }));
    }
  }, [prompts, images, objectDesc]);

  const handleStop = () => {
    stopRenderingRef.current = true;
    setGenState(prev => ({ ...prev, isRendering: false }));
  };

  const handleRandom = () => {
    const randomStyle = STYLES[Math.floor(Math.random() * STYLES.length)];
    const randomLocation = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
    const fullDesc = `Aerial drone view of ${randomStyle} ${randomLocation}`;
    
    setObjectDesc(fullDesc);
    handleGeneratePrompts(fullDesc);
  };

  const handleDownloadAll = async () => {
    const validImages = images.filter(Boolean);
    if (validImages.length === 0) return;
    
    for (let i = 0; i < images.length; i++) {
      if (images[i]) {
        const link = document.createElement('a');
        link.href = images[i]!;
        link.download = `timelapse_frame_${i + 1}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        await new Promise(r => setTimeout(r, 200));
      }
    }
  };

  const handleClear = () => {
    setImages(Array(8).fill(null));
    setCurrentFrame(0);
    setGenState(prev => ({ ...prev, error: null }));
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans p-4 md:p-8 selection:bg-purple-500/30">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Header (Desktop: integrated into Control Panel, Mobile: separate?) 
            Actually, let's just put the main header here above the grid for clear structure 
        */}
        <div className="lg:col-span-12 flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-900/30 rounded-xl border border-indigo-500/30">
              <Video className="text-indigo-400 w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-200 to-blue-300 bg-clip-text text-transparent">
                Timelapse Architect
              </h1>
              <div className="flex items-center gap-2">
                 <span className="text-[10px] uppercase tracking-wider font-bold bg-indigo-900/50 text-indigo-400 px-2 py-0.5 rounded border border-indigo-800">Luxury Edition</span>
                 <span className="text-[10px] text-gray-500">Gemini Powered</span>
              </div>
            </div>
          </div>
        </div>

        <ControlPanel 
          objectDesc={objectDesc}
          setObjectDesc={setObjectDesc}
          prompts={prompts}
          isGeneratingPrompts={genState.isGeneratingPrompts}
          isRendering={genState.isRendering}
          renderingStep={genState.renderingStep}
          onGeneratePrompts={() => handleGeneratePrompts()}
          onAutoRender={handleAutoRender}
          onStop={handleStop}
          onRandom={handleRandom}
          error={genState.error}
        />

        <div className="lg:col-span-8 flex flex-col h-full gap-6">
          <Visualizer 
            images={images}
            prompts={prompts}
            currentFrame={currentFrame}
            setCurrentFrame={setCurrentFrame}
            isRendering={genState.isRendering}
            renderingStep={genState.renderingStep}
            onDownloadAll={handleDownloadAll}
            onClear={handleClear}
          />

          {/* Timeline Grid */}
          <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
            {images.map((img, idx) => (
              <button 
                key={idx}
                onClick={() => setCurrentFrame(idx)}
                className={`relative aspect-[9/16] rounded-lg overflow-hidden cursor-pointer transition-all duration-300 border ${currentFrame === idx ? 'border-indigo-500 ring-2 ring-indigo-500/30 scale-105 z-10' : 'border-gray-800 hover:border-gray-600 opacity-60 hover:opacity-100'} group`}
              >
                {img ? (
                  <>
                   <img src={img} className="w-full h-full object-cover" alt={`Thumb ${idx+1}`} />
                  </>
                ) : (
                  <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                    {genState.isRendering && genState.renderingStep === idx + 1 ? (
                       <Loader2 size={16} className="text-indigo-500 animate-spin" />
                    ) : (
                       <span className="text-[10px] text-gray-700 font-mono">{idx + 1}</span>
                    )}
                  </div>
                )}
                
                {/* Status Bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800 pointer-events-none">
                   <div className={`h-full ${img ? 'bg-green-500' : 'bg-transparent'}`}></div>
                </div>
              </button>
            ))}
          </div>
        </div>

      </div>
      
      {/* Global Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #111827; 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #374151; 
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #4B5563; 
        }
      `}</style>
    </div>
  );
}