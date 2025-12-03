import React, { useState, useEffect, useRef } from 'react';
import { Project, ViewMode, OverlayMode } from './types';
import { calculateCPM, calculateProjectCost } from './utils/scheduler';
import { generateProjectPlan, analyzeProjectRisks } from './services/geminiService';
import { SAMPLE_PROJECT } from './utils/sampleData';
import PERTChart from './components/PERTChart';
import GanttChart from './components/GanttChart';
import Editor from './components/Editor';

// Icons
const SparklesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
  </svg>
);

const BrainIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.854 1.591-2.16 1.72-.566 2.766-1.99 2.766-3.648 0-2.152-1.856-3.899-4.125-3.899-4.125-3.899-2.029 0-3.793 1.53-3.957 3.597a4.5 4.5 0 00-1.258 3.22v.328c0 .983.658 1.854 1.591 2.16.568.187 1.166.315 1.779.378" />
    </svg>
  );

const SaveIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
);

const LoadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
);

const UploadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
);

const LayersIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m-11.142 0c-1.145-.616-2.25-1.295-3.32-2.022M12 21.75l-9.68-5.208M12 21.75l9.68-5.208" />
    </svg>
  );

const CameraIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
    </svg>
);

const App: React.FC = () => {
  const [project, setProject] = useState<Project>({
    id: 'p1',
    name: 'New Project',
    startDate: new Date().toISOString().split('T')[0],
    budget: 50000,
    resources: [
      { id: 'r1', name: 'Project Manager', hourlyRate: 80 },
      { id: 'r2', name: 'Developer', hourlyRate: 60 },
      { id: 'r3', name: 'Designer', hourlyRate: 55 }
    ],
    tasks: []
  });

  const [viewMode, setViewMode] = useState<ViewMode>('GANTT');
  const [overlayMode, setOverlayMode] = useState<OverlayMode>('NONE');
  const [selectedResourceId, setSelectedResourceId] = useState<string | undefined>();
  
  // Generation State
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [generatePrompt, setGeneratePrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysisText, setAnalysisText] = useState('');
  const [isOverlayMenuOpen, setIsOverlayMenuOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const genFileInputRef = useRef<HTMLInputElement>(null);

  // Recalculate CPM whenever tasks change
  useEffect(() => {
    const updatedTasks = calculateCPM(project.tasks);
    const hasChanged = JSON.stringify(updatedTasks) !== JSON.stringify(project.tasks);
    if (hasChanged) {
        setProject(prev => ({ ...prev, tasks: updatedTasks }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.tasks.length, project.tasks.map(t => t.duration + t.predecessors.join('')).join('')]); 

  const handleGenerate = async () => {
    if (!generatePrompt.trim()) return;
    setIsGenerating(true);
    setAiError(null);
    try {
      const generated = await generateProjectPlan(generatePrompt, project.resources);
      if (generated.tasks) {
        setProject(prev => {
            const newTasks = calculateCPM(generated.tasks!);
            return {
                ...prev,
                tasks: newTasks
            };
        });
        setIsGenerateModalOpen(false);
        setGeneratePrompt('');
      }
    } catch (e) {
      setAiError("Failed to generate plan. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenFileRead = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAiError(null);
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.docx')) {
        const reader = new FileReader();
        reader.onload = (evt) => {
            const arrayBuffer = evt.target?.result as ArrayBuffer;
            if ((window as any).mammoth) {
                (window as any).mammoth.extractRawText({ arrayBuffer })
                    .then((result: any) => {
                        setGeneratePrompt(result.value);
                    })
                    .catch((err: any) => {
                        console.error(err);
                        setAiError("Failed to parse .docx file.");
                    });
            } else {
                setAiError("Docx parser not loaded. Please refresh.");
            }
        };
        reader.readAsArrayBuffer(file);
    } else {
        // Assume text-based (txt, md)
        const reader = new FileReader();
        reader.onload = (evt) => {
            setGeneratePrompt(evt.target?.result as string);
        };
        reader.readAsText(file);
    }
    // Clear input
    e.target.value = '';
  };

  const handleAnalyzeRisks = async () => {
      setIsAnalyzing(true);
      setShowAnalysis(true);
      setAnalysisText("Analyzing project structure, resources, and risks...");
      try {
          const analysis = await analyzeProjectRisks(project);
          setAnalysisText(analysis);
      } catch (e) {
          setAnalysisText("Failed to analyze project risks.");
      } finally {
          setIsAnalyzing(false);
      }
  };

  const handleExport = () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(project, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `${project.name.replace(/\s+/g, '_')}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
  };

  const handleExportImage = async () => {
    const html2canvas = (window as any).html2canvas;
    if (!html2canvas) {
        alert("Export library not loaded. Please refresh.");
        return;
    }
    
    setIsExporting(true);
    await new Promise(r => setTimeout(r, 100)); // allow UI update

    // Create a robust clone-based capture strategy
    const captureAndDownload = async (sourceId: string, filenameSuffix: string, isPert = false) => {
        const sourceElement = document.getElementById(sourceId);
        if (!sourceElement) return;

        // 1. Clone the node
        const clone = sourceElement.cloneNode(true) as HTMLElement;
        
        // 2. Setup styles for full capture
        clone.style.position = 'fixed';
        clone.style.top = '0';
        clone.style.left = '-9999px'; // Move off-screen
        clone.style.zIndex = '-1000';
        clone.style.overflow = 'visible'; // Ensure no clipping
        
        let width = sourceElement.scrollWidth;
        let height = sourceElement.scrollHeight;

        // Special handling for PERT SVG
        if (isPert) {
            const svg = clone.querySelector('#pert-svg') as SVGElement;
            const group = clone.querySelector('#pert-group') as SVGElement;
            const minX = parseFloat(svg?.getAttribute('data-min-x') || '0');
            const minY = parseFloat(svg?.getAttribute('data-min-y') || '0');
            const dataWidth = parseFloat(svg?.getAttribute('data-full-width') || '0');
            const dataHeight = parseFloat(svg?.getAttribute('data-full-height') || '0');
            
            if (dataWidth && dataHeight) {
                const padding = 50;
                width = dataWidth + (padding * 2);
                height = dataHeight + (padding * 2);
                
                if (svg) {
                    svg.setAttribute('width', `${width}px`);
                    svg.setAttribute('height', `${height}px`);
                    // Ensure viewBox is cleared to avoid scaling issues
                    svg.removeAttribute('viewBox');
                }
                if (group) {
                    // Reset transform to show everything from (minX, minY)
                    // We need to shift so that (minX, minY) becomes (padding, padding)
                    // Transform = translate(-minX + padding, -minY + padding)
                    const translateX = -minX + padding;
                    const translateY = -minY + padding;
                    group.setAttribute('transform', `translate(${translateX}, ${translateY}) scale(1)`);
                }
            }
        } else {
            // Gantt specific: ensure width accommodates content
            width = sourceElement.scrollWidth + 40;
            height = sourceElement.scrollHeight + 40;
        }

        clone.style.width = `${width}px`;
        clone.style.height = `${height}px`;

        // 3. Append to body
        document.body.appendChild(clone);

        try {
            // 4. Capture
            const canvas = await html2canvas(clone, {
                backgroundColor: '#ffffff',
                scale: 2, // High resolution
                width: width,
                height: height,
                windowWidth: width,
                windowHeight: height,
                x: 0,
                y: 0,
                logging: false,
                useCORS: true // if any external images
            });

            // 5. Download
            const image = canvas.toDataURL("image/png");
            const link = document.createElement('a');
            link.href = image;
            link.download = `${project.name.replace(/\s+/g, '_')}_${filenameSuffix}.png`;
            link.click();

        } catch (e) {
            console.error("Export Error:", e);
            alert("Failed to export image.");
        } finally {
            // 6. Cleanup
            document.body.removeChild(clone);
        }
    };

    try {
        if (viewMode === 'GANTT') {
            await captureAndDownload('gantt-chart-inner', 'GANTT');
        } else if (viewMode === 'PERT') {
            await captureAndDownload('pert-chart-container', 'PERT', true);
        }
    } finally {
        setIsExporting(false);
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const content = e.target?.result as string;
              const parsed = JSON.parse(content);
              // Basic validation
              if (parsed.tasks && parsed.resources) {
                  setProject(parsed);
                  // Trigger calculation immediately
                  setProject(prev => ({ ...prev, tasks: calculateCPM(prev.tasks) }));
              } else {
                  alert("Invalid project file format");
              }
          } catch (err) {
              alert("Failed to parse JSON file");
          }
      };
      reader.readAsText(file);
      // Reset input
      event.target.value = '';
  };

  const loadSampleData = () => {
      setProject(SAMPLE_PROJECT);
      setProject(prev => ({ ...prev, tasks: calculateCPM(SAMPLE_PROJECT.tasks) }));
  };

  const totalCost = calculateProjectCost(project);
  const criticalPathLength = Math.max(...project.tasks.map(t => t.earlyFinish), 0);
  const riskCount = project.tasks.reduce((acc, t) => acc + t.risks.length, 0);

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-800 font-sans">
      {/* Navbar */}
      <header className="flex items-center justify-between px-6 py-4 bg-white shadow-sm z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">SP</div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">SmartPath AI</h1>
        </div>

        <div className="flex items-center gap-4">
           
           {/* New Generate Button */}
           <button 
             onClick={() => setIsGenerateModalOpen(true)}
             className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-full shadow-sm hover:shadow-md transition-all font-medium text-sm"
           >
             <SparklesIcon />
             <span>New Project Plan</span>
           </button>

           <div className="h-6 w-px bg-slate-200 mx-2"></div>

           {/* Actions */}
           <div className="flex items-center gap-2">
                <button 
                    onClick={handleExport}
                    className="p-2 text-slate-500 hover:bg-slate-100 rounded-full hover:text-indigo-600 transition-colors"
                    title="Export JSON">
                    <SaveIcon />
                </button>
                <button 
                    onClick={handleExportImage}
                    disabled={isExporting}
                    className="p-2 text-slate-500 hover:bg-slate-100 rounded-full hover:text-indigo-600 transition-colors"
                    title="Export PNG">
                    {isExporting ? <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div> : <CameraIcon />}
                </button>
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-slate-500 hover:bg-slate-100 rounded-full hover:text-indigo-600 transition-colors"
                    title="Import JSON">
                    <LoadIcon />
                </button>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImport} 
                    className="hidden" 
                    accept="application/json" 
                />
                
                <button 
                    onClick={loadSampleData}
                    className="text-xs font-medium text-slate-500 hover:text-indigo-600 px-2 py-1 hover:bg-slate-100 rounded transition-colors">
                    Load Demo
                </button>
           </div>

           <div className="h-6 w-px bg-slate-200 mx-2"></div>

           {/* View Switcher */}
           <div className="flex bg-slate-100 p-1 rounded-lg">
              {(['GANTT', 'PERT'] as ViewMode[]).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${viewMode === mode ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                      {mode}
                  </button>
              ))}
           </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* Editor Sidebar */}
        <div className="w-96 flex-shrink-0 p-4 border-r border-slate-200 bg-slate-50 overflow-hidden">
           <Editor project={project} setProject={setProject} />
        </div>

        {/* Visualization Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-100 p-4 relative">
            
            {/* Stats Bar */}
            <div className="flex gap-4 mb-4 items-center">
                <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 flex-1">
                    <div className="text-xs text-slate-400 font-semibold uppercase">Cost</div>
                    <div className={`text-xl font-bold ${totalCost > project.budget ? 'text-red-500' : 'text-slate-700'}`}>
                        ${totalCost.toLocaleString()} 
                        <span className="text-xs font-normal text-slate-400 ml-1">/ ${project.budget.toLocaleString()}</span>
                    </div>
                </div>
                <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 flex-1">
                    <div className="text-xs text-slate-400 font-semibold uppercase">Duration</div>
                    <div className="text-xl font-bold text-slate-700">{criticalPathLength} days</div>
                </div>
                <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 flex-1">
                    <div className="text-xs text-slate-400 font-semibold uppercase">Active Risks</div>
                    <div className="text-xl font-bold text-orange-500">{riskCount}</div>
                </div>
                
                {/* Ask AI Button */}
                <button 
                    onClick={handleAnalyzeRisks}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-xl shadow-sm font-medium transition-colors flex items-center gap-2">
                    <BrainIcon />
                    <span>Ask AI Advisor</span>
                </button>
            </div>

            {/* View Container */}
            <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 p-4 overflow-hidden relative">
                {project.tasks.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                        <SparklesIcon />
                        <p className="mt-4 text-sm">Start by describing a project above or load the demo.</p>
                        <button 
                            onClick={loadSampleData}
                            className="mt-4 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors font-medium text-sm">
                            Load Demo Data
                        </button>
                    </div>
                ) : (
                    <>
                        {viewMode === 'GANTT' && (
                            <GanttChart project={project} overlayMode={overlayMode} selectedResourceId={selectedResourceId} />
                        )}
                        {viewMode === 'PERT' && (
                            <PERTChart 
                                project={project} 
                                overlayMode={overlayMode} 
                                selectedResourceId={selectedResourceId}
                                onTaskClick={(id) => console.log("Task clicked", id)} 
                            />
                        )}
                    </>
                )}
            </div>

             {/* Expanding Bottom Toolbar */}
             <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-30 flex flex-col items-center gap-2">
                {/* Expanded Menu */}
                {isOverlayMenuOpen && (
                    <div className="bg-white/95 backdrop-blur-md border border-slate-200 shadow-2xl rounded-2xl p-4 mb-2 min-w-[320px] animate-in slide-in-from-bottom-5 fade-in duration-200">
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Overlays</h4>
                            <button onClick={() => setOverlayMode('NONE')} className="text-[10px] text-slate-400 hover:text-red-500">Reset</button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 mb-3">
                             <button 
                                onClick={() => setOverlayMode(overlayMode === 'RISK' ? 'NONE' : 'RISK')}
                                className={`text-sm px-3 py-2 rounded-lg font-medium transition-all border ${overlayMode === 'RISK' ? 'bg-red-50 text-red-600 border-red-200 shadow-sm' : 'hover:bg-slate-50 text-slate-600 border-slate-100'}`}
                             >
                                Risk Heatmap
                             </button>
                             <button 
                                onClick={() => setOverlayMode(overlayMode === 'COST' ? 'NONE' : 'COST')}
                                className={`text-sm px-3 py-2 rounded-lg font-medium transition-all border ${overlayMode === 'COST' ? 'bg-green-50 text-green-600 border-green-200 shadow-sm' : 'hover:bg-slate-50 text-slate-600 border-slate-100'}`}
                             >
                                Cost Analysis
                             </button>
                        </div>
                        
                        <div className="pt-3 border-t border-slate-100">
                            <button 
                                onClick={() => {
                                    const next = overlayMode === 'RESOURCE' ? 'NONE' : 'RESOURCE';
                                    setOverlayMode(next);
                                    if(next === 'RESOURCE' && !selectedResourceId && project.resources.length > 0) {
                                        setSelectedResourceId(project.resources[0].id);
                                    }
                                }}
                                className={`w-full text-sm px-3 py-2 rounded-lg font-medium transition-all border mb-2 ${overlayMode === 'RESOURCE' ? 'bg-blue-50 text-blue-600 border-blue-200 shadow-sm' : 'hover:bg-slate-50 text-slate-600 border-slate-100'}`}
                            >
                                Resource Load
                            </button>
                            
                            {overlayMode === 'RESOURCE' && (
                                <div className="bg-slate-50 rounded-lg p-2 max-h-32 overflow-y-auto border border-slate-100 grid grid-cols-1 gap-1">
                                    {project.resources.length === 0 ? <span className="text-xs text-slate-400 text-center py-2">No resources defined</span> : 
                                     project.resources.map(r => (
                                        <button
                                            key={r.id}
                                            onClick={() => setSelectedResourceId(r.id)}
                                            className={`text-left text-xs px-2 py-1.5 rounded transition-colors ${selectedResourceId === r.id ? 'bg-blue-100 text-blue-700 font-semibold' : 'hover:bg-slate-200 text-slate-600'}`}
                                        >
                                            {r.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Main Toggle Button */}
                <button 
                    onClick={() => setIsOverlayMenuOpen(!isOverlayMenuOpen)}
                    className="bg-slate-800 hover:bg-slate-900 text-white px-6 py-3 rounded-full shadow-xl shadow-slate-300/50 font-medium transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-95 flex items-center gap-2 border border-slate-700"
                >
                    <LayersIcon />
                    <span>{isOverlayMenuOpen ? 'Hide Overlays' : 'View Overlays'}</span>
                    {(overlayMode !== 'NONE') && (
                        <span className="flex h-2.5 w-2.5 relative ml-1">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500 border border-slate-800"></span>
                        </span>
                    )}
                </button>
            </div>


            {/* Generate Plan Modal */}
            {isGenerateModalOpen && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                 <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-200">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                        <h3 className="font-bold flex items-center gap-2">
                           <SparklesIcon /> AI Project Generator
                        </h3>
                        <button onClick={() => setIsGenerateModalOpen(false)} className="text-white/80 hover:text-white">✕</button>
                    </div>
                    <div className="p-6">
                        <p className="text-sm text-slate-600 mb-4">
                           Describe your project in detail, or upload a project document (.md, .txt, .docx). The AI will parse it and generate a schedule with tasks, resources, and risks.
                        </p>
                        
                        <div className="relative">
                            <textarea 
                                className="w-full h-48 p-4 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 ring-indigo-500 outline-none resize-none text-sm"
                                placeholder="E.g., I want to build a mobile app for finding dog sitters. It needs a login, a map view, payment integration..."
                                value={generatePrompt}
                                onChange={(e) => setGeneratePrompt(e.target.value)}
                            />
                            
                            {/* Upload Overlay/Button */}
                            <div className="absolute bottom-4 right-4 flex gap-2">
                                <button 
                                  onClick={() => genFileInputRef.current?.click()}
                                  className="bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 px-3 py-1.5 rounded-lg text-xs font-medium shadow-sm flex items-center gap-2 transition-colors">
                                  <UploadIcon />
                                  Upload File
                                </button>
                                <input 
                                    type="file" 
                                    ref={genFileInputRef} 
                                    className="hidden" 
                                    accept=".txt,.md,.docx"
                                    onChange={handleGenFileRead}
                                />
                            </div>
                        </div>
                        {aiError && <div className="mt-2 text-red-500 text-xs">{aiError}</div>}
                    </div>
                    <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
                        <button 
                            onClick={() => setIsGenerateModalOpen(false)}
                            className="px-4 py-2 text-slate-500 hover:text-slate-700 font-medium text-sm">
                            Cancel
                        </button>
                        <button 
                            onClick={handleGenerate}
                            disabled={isGenerating || !generatePrompt.trim()}
                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                            {isGenerating ? (
                                <>
                                 <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                 Generating...
                                </>
                            ) : (
                                <>Generate Plan</>
                            )}
                        </button>
                    </div>
                 </div>
              </div>
            )}

            {/* AI Analysis Modal */}
            {showAnalysis && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80%] flex flex-col overflow-hidden border border-slate-100">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-indigo-600 text-white">
                            <h3 className="font-bold flex items-center gap-2">
                                <BrainIcon /> AI Project Advisor
                            </h3>
                            <button 
                                onClick={() => setShowAnalysis(false)}
                                className="text-indigo-100 hover:text-white"
                            >✕</button>
                        </div>
                        <div className="p-6 overflow-y-auto prose prose-sm max-w-none text-slate-700">
                            {isAnalyzing ? (
                                <div className="flex items-center justify-center py-10 gap-3 text-slate-500">
                                    <div className="animate-spin h-5 w-5 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
                                    <span>Analyzing project...</span>
                                </div>
                            ) : (
                                <div className="whitespace-pre-wrap">{analysisText}</div>
                            )}
                        </div>
                        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                            <button 
                                onClick={() => setShowAnalysis(false)}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
      </main>
    </div>
  );
};

export default App;