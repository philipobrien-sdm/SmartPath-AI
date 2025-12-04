import React, { useEffect, useRef, useMemo, useState } from 'react';
import * as d3 from 'd3';
import { Task, Project, OverlayMode, ThemeConfig } from '../types';
import { calculateTaskCost, getRiskScore, isTaskComplete, isTaskOverdue } from '../utils/scheduler';

interface PERTChartProps {
  project: Project;
  overlayMode: OverlayMode;
  selectedResourceId?: string;
  onTaskClick: (taskId: string) => void;
  theme: ThemeConfig;
}

const CARD_WIDTH = 240;
const CARD_HEIGHT = 160;
const GAP_X = 100;
const GAP_Y = 40;

// Helper to add opacity to hex color
const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const PERTChart: React.FC<PERTChartProps> = ({ project, overlayMode, selectedResourceId, onTaskClick, theme }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [zoomTransform, setZoomTransform] = useState<d3.ZoomTransform>(d3.zoomIdentity);

  // 1. Calculate Layout
  const layout = useMemo(() => {
    // Clone tasks to avoid mutation
    let nodes = project.tasks.map(t => ({ ...t, level: 0, x: 0, y: 0 }));
    
    // Assign Levels (Topological Layering)
    // Run a few passes to propagate levels
    for (let pass = 0; pass < nodes.length + 2; pass++) {
        nodes.forEach(node => {
            if (node.predecessors.length > 0) {
                const maxPredLevel = Math.max(...node.predecessors.map(pid => {
                    const p = nodes.find(n => n.id === pid);
                    return p ? p.level : 0;
                }));
                node.level = maxPredLevel + 1;
            }
        });
    }

    // Group by Level
    const levels: { [key: number]: typeof nodes } = {};
    nodes.forEach(n => {
        if (!levels[n.level]) levels[n.level] = [];
        levels[n.level].push(n);
    });

    const maxLevel = Math.max(...nodes.map(n => n.level));
    
    // Assign X and Initial Y
    for (let l = 0; l <= maxLevel; l++) {
        const column = levels[l] || [];
        
        // Sort column based on predecessor positions (barycenter heuristic)
        if (l > 0) {
             column.sort((a, b) => {
                 const getAvgPredY = (task: typeof nodes[0]) => {
                     const preds = task.predecessors.map(pid => nodes.find(n => n.id === pid)).filter(Boolean);
                     if (preds.length === 0) return 0;
                     return preds.reduce((sum, p) => sum + (p!.y || 0), 0) / preds.length;
                 };
                 return getAvgPredY(a) - getAvgPredY(b);
             });
        }

        const colHeight = column.length * (CARD_HEIGHT + GAP_Y) - GAP_Y;
        
        const startY = (0 - colHeight) / 2; // Center vertically around 0

        column.forEach((node, idx) => {
            // Round coordinates to avoid sub-pixel rendering issues in foreignObjects
            node.x = Math.round(l * (CARD_WIDTH + GAP_X) + 50); 
            node.y = Math.round(startY + idx * (CARD_HEIGHT + GAP_Y));
        });
    }

    // Calculate Bounding Box
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    if (nodes.length > 0) {
        nodes.forEach(n => {
            minX = Math.min(minX, n.x);
            minY = Math.min(minY, n.y);
            maxX = Math.max(maxX, n.x + CARD_WIDTH);
            maxY = Math.max(maxY, n.y + CARD_HEIGHT);
        });
    } else {
        minX = 0; minY = 0; maxX = 100; maxY = 100;
    }

    // Create Links
    const links: { source: typeof nodes[0], target: typeof nodes[0] }[] = [];
    nodes.forEach(node => {
        node.predecessors.forEach(pid => {
            const source = nodes.find(n => n.id === pid);
            if (source) {
                links.push({ source, target: node });
            }
        });
    });

    return { 
        nodes, 
        links, 
        boundingBox: { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY }
    };
  }, [project.tasks]);


  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 2])
      .on('zoom', (event) => {
        setZoomTransform(event.transform);
      });
    
    svg.call(zoom);
  }, [layout]);

  // Helper to draw bezier curves
  const getLinkPath = (source: any, target: any) => {
      const sx = source.x + CARD_WIDTH;
      const sy = source.y + CARD_HEIGHT / 2;
      const tx = target.x;
      const ty = target.y + CARD_HEIGHT / 2;
      
      const midX = (sx + tx) / 2;
      
      return `M ${sx} ${sy} C ${midX} ${sy}, ${midX} ${ty}, ${tx} ${ty}`;
  };

  const getNodeStyles = (task: Task) => {
      let borderColor = '#cbd5e1'; // slate-300
      let bgColor = '#ffffff';

      const complete = isTaskComplete(task);
      const overdue = isTaskOverdue(task, project.startDate);

      if (overlayMode === 'RISK') {
          const score = getRiskScore(task);
          if (score >= 15) { borderColor = theme.riskHigh; bgColor = hexToRgba(theme.riskHigh, 0.1); }
          else if (score >= 5) { borderColor = theme.riskMedium; bgColor = hexToRgba(theme.riskMedium, 0.1); }
          else { borderColor = theme.riskLow; bgColor = hexToRgba(theme.riskLow, 0.1); }
      }
      else if (overlayMode === 'COST') {
        const cost = calculateTaskCost(task, project.resources);
        const ratio = cost / (project.budget || 1);
        if (ratio > 0.1) { borderColor = theme.riskHigh; bgColor = hexToRgba(theme.riskHigh, 0.1); }
        else if (ratio > 0.05) { borderColor = theme.riskMedium; bgColor = hexToRgba(theme.riskMedium, 0.1); }
        else { borderColor = theme.riskLow; bgColor = hexToRgba(theme.riskLow, 0.1); }
      }
      else if (overlayMode === 'RESOURCE' && selectedResourceId) {
          const alloc = task.resources.find(r => r.resourceId === selectedResourceId);
          if (!alloc) {
              borderColor = '#cbd5e1'; 
              bgColor = '#f8fafc';
          } else {
              if (alloc.percentage > 100) { borderColor = theme.resourceOverload; bgColor = hexToRgba(theme.resourceOverload, 0.1); }
              else { borderColor = theme.resourceNormal; bgColor = hexToRgba(theme.resourceNormal, 0.1); }
          }
      }
      else {
          // Standard view with Status Colors
          if (complete) {
              borderColor = '#10b981'; // green-500
              bgColor = '#ecfdf5'; // green-50
          } else if (overdue) {
              borderColor = '#ef4444'; // red-500
              bgColor = '#fef2f2'; // red-50
          } else if (task.isCritical) {
              borderColor = theme.taskCritical;
              bgColor = '#ffffff';
          } else {
              borderColor = '#94a3b8'; // slate-400
          }
      }

      return {
          border: `2px solid ${borderColor}`,
          backgroundColor: bgColor,
          boxShadow: task.isCritical && overlayMode === 'NONE' ? `0 0 10px ${hexToRgba(theme.taskCritical, 0.3)}` : 'none'
      };
  };

  return (
    <div id="pert-chart-container" className="w-full h-full bg-slate-50 overflow-hidden relative border border-slate-200 rounded-xl">
      <svg 
        id="pert-svg"
        ref={svgRef} 
        className="w-full h-full cursor-grab active:cursor-grabbing"
        data-min-x={layout.boundingBox.minX}
        data-min-y={layout.boundingBox.minY}
        data-full-width={layout.boundingBox.width}
        data-full-height={layout.boundingBox.height}
      >
        <defs>
            <marker id="arrow-head" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 0 0 L 10 5 L 0 10 z" fill={theme.linkDefault} />
            </marker>
            <marker id="arrow-head-critical" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 0 0 L 10 5 L 0 10 z" fill={theme.linkCritical} />
            </marker>
             <pattern id="diagonalHatch" patternUnits="userSpaceOnUse" width="8" height="8">
                <path d="M-2,2 l4,-4 M0,8 l8,-8 M6,10 l4,-4" 
                    style={{stroke:theme.riskHigh, strokeWidth:1}} />
            </pattern>
        </defs>
        <g id="pert-group" transform={zoomTransform.toString()}>
            
            {/* Background Rect for white export background */}
            <rect 
                x={-10000} y={-10000} width={20000} height={20000} 
                fill="#f8fafc" opacity={0} 
                className="export-bg" 
            />

            {/* Links */}
            {layout.links.map((link, i) => {
                const isCriticalLink = link.source.isCritical && link.target.isCritical;
                return (
                    <path 
                        key={i}
                        d={getLinkPath(link.source, link.target)}
                        fill="none"
                        stroke={isCriticalLink ? theme.linkCritical : theme.linkDefault}
                        strokeWidth={isCriticalLink ? "3" : "2"}
                        markerEnd={isCriticalLink ? "url(#arrow-head-critical)" : "url(#arrow-head)"}
                        className="transition-all duration-500"
                        strokeDasharray={isCriticalLink ? "none" : "none"}
                    />
                );
            })}

            {/* Nodes */}
            {layout.nodes.map((node) => {
                const cost = calculateTaskCost(node, project.resources);
                const riskScore = getRiskScore(node);
                const styles = getNodeStyles(node);
                const complete = isTaskComplete(node);
                const overdue = isTaskOverdue(node, project.startDate);
                const deliveredCount = (node.deliverables || []).filter(d => d.url).length;
                const totalDeliverables = (node.deliverables || []).length;
                
                return (
                    <foreignObject 
                        key={node.id}
                        x={node.x}
                        y={node.y}
                        width={CARD_WIDTH}
                        height={CARD_HEIGHT}
                        className="overflow-visible"
                    >
                        {/* Explicit styles for export */}
                        <div 
                            onClick={(e) => { e.stopPropagation(); onTaskClick(node.id); }}
                            className={`w-full h-full rounded-lg shadow-sm transition-all duration-200 flex flex-col p-3 hover:shadow-md relative`}
                            style={{ 
                                boxSizing: 'border-box',
                                borderStyle: 'solid',
                                ...styles
                            }}
                        >
                            {overdue && !complete && (
                                <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full animate-pulse -mr-1 -mt-1 border border-white"></div>
                            )}

                            {/* Header */}
                            <div className="flex justify-between items-start mb-2 pb-2 border-b border-slate-100">
                                <h3 className="font-bold text-sm text-slate-800 leading-tight line-clamp-2" title={node.name}>{node.name}</h3>
                                <span className="text-[10px] font-mono text-slate-400 ml-1">#{node.id}</span>
                            </div>

                            {/* Details */}
                            <div className="flex-1 space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-500 flex items-center gap-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
                                        </svg>
                                        {node.duration}d
                                    </span>
                                    <span className="text-slate-500 flex items-center gap-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                                          <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                                        </svg>
                                        ${cost.toLocaleString()}
                                    </span>
                                </div>
                                
                                {/* Deliverables Progress */}
                                {totalDeliverables > 0 && (
                                    <div className="flex items-center gap-1 text-[10px] text-slate-600 font-medium">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-indigo-500">
                                          <path d="M10 2a.75.75 0 01.75.75v5.59l2.68-2.68a.75.75 0 111.06 1.06l-4 4a.75.75 0 01-1.06 0l-4-4a.75.75 0 011.06-1.06l2.68 2.68V2.75A.75.75 0 0110 2z" />
                                          <path d="M2.75 13a.75.75 0 000 1.5h14.5a.75.75 0 000-1.5H2.75z" />
                                        </svg>
                                        Docs: {deliveredCount} / {totalDeliverables}
                                    </div>
                                )}
                                
                                {/* Resources */}
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {node.resources.length === 0 && <span className="text-[10px] text-slate-300 italic">No resources</span>}
                                    {node.resources.slice(0, 3).map((r, idx) => {
                                        const resName = project.resources.find(res => res.id === r.resourceId)?.name || 'Unknown';
                                        return (
                                            <span key={idx} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-700" title={`${resName}: ${r.percentage}%`}>
                                                {resName.split(' ')[0]}
                                                <span className="ml-1 text-indigo-400 text-[9px]">{r.percentage}%</span>
                                            </span>
                                        );
                                    })}
                                    {node.resources.length > 3 && <span className="text-[10px] text-slate-400">+{node.resources.length - 3}</span>}
                                </div>
                            </div>
                            
                            {/* Footer Badges */}
                            <div className="mt-auto pt-2 flex gap-2 justify-end">
                                {complete && (
                                    <span className="text-[10px] font-bold text-green-700 bg-green-100 px-1.5 rounded flex items-center">
                                        ✓ Done
                                    </span>
                                )}
                                {overdue && !complete && (
                                    <span className="text-[10px] font-bold text-red-700 bg-red-100 px-1.5 rounded animate-pulse">
                                        ! LATE
                                    </span>
                                )}
                                {riskScore > 5 && (
                                    <span className="text-[10px] font-bold text-orange-600 bg-orange-100 px-1.5 rounded" title="Risk Score">
                                        ⚠ {riskScore}
                                    </span>
                                )}
                                {node.isCritical && (
                                    <span className="text-[10px] font-bold text-red-600 bg-red-100 px-1.5 rounded">
                                        CP
                                    </span>
                                )}
                            </div>
                        </div>
                    </foreignObject>
                );
            })}
        </g>
      </svg>
    </div>
  );
};

export default PERTChart;