import React, { useState, useEffect, useRef } from 'react';
import { Project, ViewMode, OverlayMode, ThemeConfig, AIQueryEntry } from './types';
import { calculateCPM, calculateProjectCost } from './utils/scheduler';
import { generateProjectPlan, getAIAdvice } from './services/geminiService';
import { SAMPLE_PROJECT } from './utils/sampleData';
import PERTChart from './components/PERTChart';
import GanttChart from './components/GanttChart';
import Editor from './components/Editor';
import ReportView from './components/ReportView';
import CharterView from './components/CharterView';
import TaskModal from './components/TaskModal';

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

const SettingsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.581-.495.644-.869l.214-1.281z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const InfoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
  </svg>
);

const HistoryIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const UndoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
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
    tasks: [],
    meetings: [],
    aiQueryLog: []
  });

  // History State
  const [history, setHistory] = useState<{project: Project, action: string}[]>([]);
  const [isHistoryDropdownOpen, setIsHistoryDropdownOpen] = useState(false);

  const [viewMode, setViewMode] = useState<ViewMode>('GANTT');
  const [overlayMode, setOverlayMode] = useState<OverlayMode>('NONE');
  const [selectedResourceId, setSelectedResourceId] = useState<string | undefined>();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Theme State
  const [theme, setTheme] = useState<ThemeConfig>({
      taskDefault: '#6366f1', // indigo-500
      taskCritical: '#e11d48', // rose-600
      riskHigh: '#ef4444',     // red-500
      riskMedium: '#f97316',   // orange-500
      riskLow: '#22c55e',      // green-500
      resourceOverload: '#dc2626', // red-600
      resourceNormal: '#3b82f6', // blue-500
      linkDefault: '#cbd5e1',  // slate-300
      linkCritical: '#dc2626', // red-600
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false); // AI Log
  const [aiEnabled, setAiEnabled] = useState(true);

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

  // --- History & Project Management ---
  const handleProjectChange = (newProject: Project, action: string) => {
      // 1. Push current state to history
      setHistory(prev => {
          const newHistory = [...prev, { project: JSON.parse(JSON.stringify(project)), action }];
          // Keep max 10 steps
          if (newHistory.length > 10) return newHistory.slice(newHistory.length - 10);
          return newHistory;
      });

      // 2. Update State
      setProject(newProject);
  };

  const handleUndo = () => {
      if (history.length === 0) return;
      const lastState = history[history.length - 1];
      
      setProject(lastState.project);
      setHistory(prev => prev.slice(0, prev.length - 1));
  };

  const handleRollbackTo = (index: number) => {
      const targetState = history[index];
      setProject(targetState.project);
      setHistory(prev => prev.slice(0, index));
      setIsHistoryDropdownOpen(false);
  };

  const handleSaveFromModal = (taskId: string, updates: Partial<any>, actionDesc: string) => {
    const newTasks = project.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t);
    handleProjectChange({ ...project, tasks: newTasks }, actionDesc);
  };

  const handleGenerate = async () => {
    if (!generatePrompt.trim()) return;
    setIsGenerating(true);
    setAiError(null);
    try {
      const generated = await generateProjectPlan(generatePrompt, project.resources);
      if (generated.tasks) {
        handleProjectChange({
             ...project,
             tasks: calculateCPM(generated.tasks!),
             meetings: generated.meetings || [],
             charter: generated.charter
        }, "Generated New Plan via AI");
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

  // Generic AI Helper
  const handleAskAI = async (category: 'OPTIMIZATION' | 'RISK' | 'MEETING' | 'CHARTER' | 'GENERAL', contextData?: string) => {
      if (!aiEnabled) return;
      
      setIsAnalyzing(true);
      setShowAnalysis(true);
      setAnalysisText("Analyzing...");

      let dataToAnalyze = contextData;

      if (!dataToAnalyze) {
          // Default context construction if not provided
          if (category === 'OPTIMIZATION') {
              dataToAnalyze = JSON.stringify({
                  tasks: project.tasks.map(t => ({
                      name: t.name, duration: t.duration, predecessors: t.predecessors, earlyStart: t.earlyStart, slack: t.slack, isCritical: t.isCritical
                  })),
                  resources: project.resources
              });
          } else if (category === 'RISK') {
              dataToAnalyze = JSON.stringify({
                  risks: project.tasks.flatMap(t => t.risks),
                  tasks: project.tasks.map(t => ({ name: t.name, isCritical: t.isCritical }))
              });
          } else if (category === 'MEETING') {
              dataToAnalyze = JSON.stringify(project.meetings);
          } else if (category === 'CHARTER') {
              dataToAnalyze = JSON.stringify(project.charter);
          }
      }

      try {
          const advice = await getAIAdvice(category, dataToAnalyze || "No data provided.");
          setAnalysisText(advice);
          
          // Log query
          const logEntry: AIQueryEntry = {
              id: `ai-${Date.now()}`,
              date: new Date().toLocaleString(),
              category,
              prompt: `Analysis request for ${category}`,
              response: advice
          };
          // Don't use handleProjectChange for AI Logs to keep Undo History clean for structural changes
          setProject(prev => ({
              ...prev,
              aiQueryLog: [logEntry, ...(prev.aiQueryLog || [])]
          }));
      } catch (e) {
          setAnalysisText("Failed to get AI advice.");
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
              if (parsed.tasks && parsed.resources) {
                  // Push a "Loaded Project" state to history before overwriting
                  handleProjectChange(parsed, `Imported ${file.name}`);
                  // Note: handleProjectChange already sets project, so we are good.
              } else {
                  alert("Invalid project file format");
              }
          } catch (err) {
              alert("Failed to parse JSON file");
          }
      };
      reader.readAsText(file);
      event.target.value = '';
  };

  const loadSampleData = () => {
      handleProjectChange(SAMPLE_PROJECT, "Loaded Demo Data");
  };

  const totalCost = calculateProjectCost(project);
  const criticalPathLength = Math.max(...project.tasks.map(t => t.earlyFinish), 0);
  const riskCount = project.tasks.reduce((acc, t) => acc + t.risks.length, 0);

  // Determine last action for Undo Tooltip
  const lastAction = history.length > 0 ? history[history.length - 1].action : null;

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-800 font-sans">
      {/* Navbar */}
      <header className="flex items-center justify-between px-6 py-4 bg-white shadow-sm z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">SP</div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">SmartPath</h1>
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
                {/* Undo Button */}
                <div className="relative">
                     <button 
                        onClick={handleUndo}
                        disabled={history.length === 0}
                        onMouseEnter={() => setIsHistoryDropdownOpen(true)}
                        className={`p-2 rounded-full transition-colors flex items-center gap-1 ${history.length === 0 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-500 hover:bg-slate-100 hover:text-indigo-600'}`}
                        title={lastAction ? `Undo: ${lastAction}` : 'Undo'}
                     >
                        <UndoIcon />
                        {history.length > 0 && <span className="text-[10px] font-bold bg-slate-100 px-1 rounded">{history.length}</span>}
                     </button>
                     
                     {/* History Dropdown */}
                     {isHistoryDropdownOpen && history.length > 0 && (
                         <div 
                            className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100"
                            onMouseLeave={() => setIsHistoryDropdownOpen(false)}
                         >
                            <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase">History</div>
                            <div className="max-h-64 overflow-y-auto">
                                {[...history].reverse().map((state, idx) => {
                                    // Real index in history array
                                    const realIdx = history.length - 1 - idx;
                                    return (
                                        <button 
                                            key={realIdx}
                                            onClick={() => handleRollbackTo(realIdx)}
                                            className="w-full text-left px-4 py-3 text-xs hover:bg-slate-50 border-b border-slate-50 last:border-0 flex flex-col group"
                                        >
                                            <span className="font-medium text-slate-700 group-hover:text-indigo-600">{state.action}</span>
                                            <span className="text-[10px] text-slate-400">Step {realIdx + 1}</span>
                                        </button>
                                    )
                                })}
                            </div>
                         </div>
                     )}
                </div>

                <div className="h-6 w-px bg-slate-200 mx-2"></div>

                <button 
                    onClick={handleExport}
                    className="p-2 text-slate-500 hover:bg-slate-100 rounded-full hover:text-indigo-600 transition-colors"
                    title="Export JSON">
                    <SaveIcon />
                </button>
                <button 
                    onClick={handleExportImage}
                    disabled={isExporting || viewMode === 'REPORT' || viewMode === 'CHARTER'}
                    className={`p-2 rounded-full transition-colors ${isExporting || viewMode === 'REPORT' || viewMode === 'CHARTER' ? 'text-slate-300 cursor-not-allowed' : 'text-slate-500 hover:bg-slate-100 hover:text-indigo-600'}`}
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
                 
                 {/* AI History Button */}
                 {aiEnabled && (
                    <button 
                        onClick={() => setIsHistoryOpen(true)}
                        className="p-2 text-slate-500 hover:bg-slate-100 rounded-full hover:text-indigo-600 transition-colors"
                        title="AI Query Log">
                        <HistoryIcon />
                    </button>
                 )}

                 <button 
                    onClick={() => setIsSettingsOpen(true)}
                    className="p-2 text-slate-500 hover:bg-slate-100 rounded-full hover:text-indigo-600 transition-colors"
                    title="Chart Settings">
                    <SettingsIcon />
                </button>

                <button 
                    onClick={() => setIsAboutOpen(true)}
                    className="p-2 text-slate-500 hover:bg-slate-100 rounded-full hover:text-indigo-600 transition-colors"
                    title="About SmartPath">
                    <InfoIcon />
                </button>
           </div>

           <div className="h-6 w-px bg-slate-200 mx-2"></div>

           {/* View Switcher */}
           <div className="flex bg-slate-100 p-1 rounded-lg">
              {(['CHARTER', 'GANTT', 'PERT', 'REPORT'] as ViewMode[]).map(mode => (
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
           <Editor project={project} onProjectChange={handleProjectChange} />
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
                
                {/* Ask AI Button - General/Risk */}
                {aiEnabled && (
                    <button 
                        onClick={() => handleAskAI('RISK')}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-xl shadow-sm font-medium transition-colors flex items-center gap-2">
                        <BrainIcon />
                        <span>Ask AI Advisor</span>
                    </button>
                )}
            </div>

            {/* View Container */}
            <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 p-4 overflow-hidden relative flex flex-col">
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
                        {/* Specific Header for Charts to include Optimization */}
                        {(viewMode === 'PERT' || viewMode === 'GANTT') && aiEnabled && (
                            <div className="absolute top-6 right-6 z-10">
                                <button 
                                    onClick={() => handleAskAI('OPTIMIZATION')}
                                    className="bg-white/90 backdrop-blur border border-indigo-200 text-indigo-700 px-3 py-1.5 rounded-lg shadow-sm text-xs font-bold hover:bg-indigo-50 flex items-center gap-1"
                                >
                                    <SparklesIcon /> Optimize Schedule
                                </button>
                            </div>
                        )}

                        {viewMode === 'GANTT' && (
                            <div className="flex-1 overflow-hidden">
                                <GanttChart 
                                    project={project} 
                                    overlayMode={overlayMode} 
                                    selectedResourceId={selectedResourceId} 
                                    theme={theme}
                                    onTaskClick={(id) => setSelectedTaskId(id)}
                                />
                            </div>
                        )}
                        {viewMode === 'PERT' && (
                            <div className="flex-1 overflow-hidden">
                                <PERTChart 
                                    project={project} 
                                    overlayMode={overlayMode} 
                                    selectedResourceId={selectedResourceId}
                                    onTaskClick={(id) => setSelectedTaskId(id)} 
                                    theme={theme}
                                />
                            </div>
                        )}
                        {viewMode === 'REPORT' && (
                            <ReportView 
                                project={project}
                                onProjectChange={handleProjectChange}
                                aiEnabled={aiEnabled}
                                onAskAI={handleAskAI}
                            />
                        )}
                        {viewMode === 'CHARTER' && (
                            <CharterView 
                                project={project}
                                onProjectChange={handleProjectChange}
                                aiEnabled={aiEnabled}
                                onAskAI={handleAskAI}
                            />
                        )}
                    </>
                )}
            </div>

             {/* Expanding Bottom Toolbar (Only for Gantt/Pert) */}
             {(viewMode === 'GANTT' || viewMode === 'PERT') && (
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
             )}


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
            
            {/* AI History Modal */}
            {isHistoryOpen && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-200 h-[80vh]">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-700 flex items-center gap-2">
                                <HistoryIcon /> AI Query Log
                            </h3>
                            <button onClick={() => setIsHistoryOpen(false)} className="text-slate-400 hover:text-red-500">✕</button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
                            {(!project.aiQueryLog || project.aiQueryLog.length === 0) ? (
                                <div className="text-center text-slate-400 py-10 italic">No AI queries recorded yet.</div>
                            ) : (
                                project.aiQueryLog.map(log => (
                                    <div key={log.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-xs font-bold px-2 py-1 rounded bg-indigo-100 text-indigo-700 uppercase">{log.category}</span>
                                            <span className="text-xs text-slate-400">{log.date}</span>
                                        </div>
                                        <div className="text-sm font-semibold text-slate-800 mb-2 border-b border-slate-100 pb-2">
                                            {log.prompt}
                                        </div>
                                        <div className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed font-mono text-[11px] bg-slate-50 p-2 rounded">
                                            {log.response}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Settings Modal */}
            {isSettingsOpen && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-200">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-700 flex items-center gap-2">
                                <SettingsIcon /> Settings
                            </h3>
                            <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-red-500">✕</button>
                        </div>
                        <div className="p-6 overflow-y-auto max-h-[70vh]">
                            
                            {/* AI Toggle */}
                            <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-xl border border-indigo-100 mb-6">
                                <div>
                                    <h4 className="font-bold text-indigo-900">Enable AI Assistance</h4>
                                    <p className="text-xs text-indigo-700 mt-1">Show AI Advisor buttons and features across the app.</p>
                                </div>
                                <button 
                                    onClick={() => setAiEnabled(!aiEnabled)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${aiEnabled ? 'bg-indigo-600' : 'bg-slate-200'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${aiEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>

                            <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Color Theme</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Standard Task</label>
                                    <div className="flex items-center gap-2">
                                        <input type="color" className="w-8 h-8 rounded cursor-pointer border-0" value={theme.taskDefault} onChange={(e) => setTheme({...theme, taskDefault: e.target.value})} />
                                        <span className="text-xs text-slate-400 font-mono">{theme.taskDefault}</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Critical Task</label>
                                    <div className="flex items-center gap-2">
                                        <input type="color" className="w-8 h-8 rounded cursor-pointer border-0" value={theme.taskCritical} onChange={(e) => setTheme({...theme, taskCritical: e.target.value})} />
                                        <span className="text-xs text-slate-400 font-mono">{theme.taskCritical}</span>
                                    </div>
                                </div>
                                {/* ... existing color settings ... */}
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
                            <button 
                                onClick={() => {
                                    setTheme({
                                      taskDefault: '#6366f1', 
                                      taskCritical: '#e11d48',
                                      riskHigh: '#ef4444', 
                                      riskMedium: '#f97316', 
                                      riskLow: '#22c55e', 
                                      resourceOverload: '#dc2626', 
                                      resourceNormal: '#3b82f6', 
                                      linkDefault: '#cbd5e1', 
                                      linkCritical: '#dc2626'
                                    });
                                }}
                                className="px-4 py-2 text-slate-500 hover:text-slate-700 font-medium text-sm">
                                Reset Colors
                            </button>
                            <button 
                                onClick={() => setIsSettingsOpen(false)}
                                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm">
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* About Modal */}
            {isAboutOpen && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-200 max-h-[85vh]">
                        {/* Header */}
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-200">SP</div>
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800">About SmartPath AI</h2>
                                    <p className="text-sm text-slate-500">Next-Gen Project Management Suite</p>
                                </div>
                            </div>
                            <button onClick={() => setIsAboutOpen(false)} className="text-slate-400 hover:text-slate-600 bg-slate-50 p-2 rounded-full transition-colors">✕</button>
                        </div>
                        
                        {/* Content */}
                        <div className="p-8 overflow-y-auto space-y-8">
                            {/* Intro */}
                            <p className="text-slate-600 text-lg leading-relaxed">
                                SmartPath AI combines traditional project management methodologies with the power of Generative AI. 
                                It helps project managers plan, visualize, and analyze complex projects with ease, ensuring nothing falls through the cracks.
                            </p>

                            {/* Features Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                                    <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                                        <span className="text-indigo-600">✨</span> AI Planning & Advisory
                                    </h3>
                                    <p className="text-sm text-slate-600">
                                        Describe your project in plain English or upload a document, and our AI generates a complete schedule with tasks, dependencies, and resources. Use the <strong>AI Advisor</strong> for real-time risk analysis.
                                    </p>
                                </div>
                                <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                                    <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                                        <span className="text-indigo-600">📊</span> Dual Visualization
                                    </h3>
                                    <p className="text-sm text-slate-600">
                                        Switch instantly between a <strong>Gantt Chart</strong> for timeline planning and a <strong>PERT Chart</strong> (Network Diagram) for dependency analysis. Both views support interactive editing.
                                    </p>
                                </div>
                                <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                                    <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                                        <span className="text-indigo-600">🎯</span> CPM & Analytics
                                    </h3>
                                    <p className="text-sm text-slate-600">
                                        Automatic <strong>Critical Path Method (CPM)</strong> calculation identifies the longest path and slack times. Smart overlays visualize <strong>Risk</strong>, <strong>Cost</strong>, and <strong>Resource Overload</strong> directly on the charts.
                                    </p>
                                </div>
                                <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                                    <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                                        <span className="text-indigo-600">📋</span> Charter & Reports
                                    </h3>
                                    <p className="text-sm text-slate-600">
                                        Draft a professional <strong>Project Charter</strong>, manage meeting logs, track action items, and view a generated <strong>Risk Heatmap Matrix</strong> all in one place.
                                    </p>
                                </div>
                            </div>

                            {/* Footer/Credits */}
                             <div className="border-t border-slate-100 pt-6 text-center text-slate-400 text-sm">
                                <p>Powered by Google Gemini 2.5 Flash • Built with React & D3</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Task Modal */}
            {selectedTaskId && (
                <TaskModal 
                    isOpen={!!selectedTaskId}
                    task={project.tasks.find(t => t.id === selectedTaskId)!}
                    project={project}
                    onClose={() => setSelectedTaskId(null)}
                    onSave={handleSaveFromModal}
                />
            )}

        </div>
      </main>
    </div>
  );
};

export default App;