import React, { useEffect, useRef, useMemo, useState } from 'react';
import * as d3 from 'd3';
import { Task, Project, OverlayMode, ThemeConfig } from '../types';
import { calculateTaskCost, getRiskScore, isTaskComplete, isTaskOverdue, calculateResourceBottlenecks } from '../utils/scheduler';

interface PERTChartProps {
  project: Project;
  overlayMode: OverlayMode;
  selectedResourceId?: string;
  onTaskClick: (taskId: string) => void;
  theme: ThemeConfig;
}

const CARD_WIDTH = 260; // Slightly wider for better spacing
const CARD_HEIGHT = 180; // Compacted slightly with better layout
const GAP_X = 80;
const GAP_Y = 60;

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

  // Pre-calculate bottlenecks if we are in resource mode
  const bottlenecks = useMemo(() => {
    if (overlayMode === 'RESOURCE' && selectedResourceId) {
        return calculateResourceBottlenecks(project, selectedResourceId);
    }
    return new Set<string>();
  }, [project, overlayMode, selectedResourceId]);

  // 1. Calculate Layout
  const layout = useMemo(() => {
    // Clone tasks to avoid mutation
    let nodes = project.tasks.map(t => ({ ...t, level: 0, x: 0, y: 0 }));
    
    // Assign Levels (Topological Layering)
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
        
        // Sort column based on predecessor positions
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
        const startY = (0 - colHeight) / 2;

        column.forEach((node, idx) => {
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
          if (score >= 15) { borderColor = theme.riskHigh; bgColor = '#fff'; }
          else if (score >= 5) { borderColor = theme.riskMedium; bgColor = '#fff'; }
          else { borderColor = theme.riskLow; bgColor = '#fff'; }
      }
      else if (overlayMode === 'COST') {
        const cost = calculateTaskCost(task, project.resources);
        const ratio = cost / (project.budget || 1);
        if (ratio > 0.1) { borderColor = theme.riskHigh; bgColor = '#fff'; }
        else if (ratio > 0.05) { borderColor = theme.riskMedium; bgColor = '#fff'; }
        else { borderColor = theme.riskLow; bgColor = '#fff'; }
      }
      else if (overlayMode === 'RESOURCE' && selectedResourceId) {
          const alloc = task.resources.find(r => r.resourceId === selectedResourceId);
          if (!alloc) {
              borderColor = '#cbd5e1'; 
              bgColor = '#f8fafc';
          } else {
              // Check if task is part of a bottleneck (aggregate usage > 100%) or individually > 100%
              if (alloc.percentage > 100 || bottlenecks.has(task.id)) { 
                  borderColor = theme.resourceOverload; 
                  bgColor = '#fff'; 
              } else { 
                  borderColor = theme.resourceNormal; 
                  bgColor = '#fff'; 
              }
          }
      }
      else {
          if (complete) {
              borderColor = '#10b981'; // green-500
              bgColor = '#f0fdf4'; // green-50
          } else if (overdue) {
              borderColor = '#ef4444'; // red-500
              bgColor = '#fef2f2'; // red-50
          } else if (task.isCritical) {
              borderColor = theme.taskCritical;
              bgColor = '#fff1f2'; // rose-50
          } else {
              borderColor = '#94a3b8'; // slate-400
              bgColor = '#ffffff';
          }
      }

      return {
          border: `2px solid ${borderColor}`,
          backgroundColor: bgColor,
          boxShadow: task.isCritical && overlayMode === 'NONE' ? `0 4px 6px -1px ${hexToRgba(theme.taskCritical, 0.2)}` : '0 2px 4px -1px rgba(0,0,0,0.05)'
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
        </defs>
        <g id="pert-group" transform={zoomTransform.toString()}>
            
            {/* Background for Export Clarity */}
            <rect x={-10000} y={-10000} width={20000} height={20000} fill="#f8fafc" opacity={0} className="export-bg" />

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
                        strokeDasharray={isCriticalLink ? "none" : "none"}
                    />
                );
            })}

            {/* Nodes */}
            {layout.nodes.map((node) => {
                const cost = calculateTaskCost(node, project.resources);
                const styles = getNodeStyles(node);
                const complete = isTaskComplete(node);
                const overdue = isTaskOverdue(node, project.startDate);
                
                return (
                    <foreignObject 
                        key={node.id}
                        x={node.x}
                        y={node.y}
                        width={CARD_WIDTH}
                        height={CARD_HEIGHT}
                        className="overflow-visible"
                    >
                        {/* 
                           We use inline styles here to ensure html2canvas captures the layout correctly 
                           even if external CSS classes (Tailwind) are not properly loaded in the cloned export context.
                        */}
                        <div 
                            onClick={(e) => { e.stopPropagation(); onTaskClick(node.id); }}
                            className="group hover:scale-[1.02]"
                            style={{ 
                                width: '100%',
                                height: '100%',
                                boxSizing: 'border-box',
                                display: 'flex',
                                flexDirection: 'column',
                                borderRadius: '8px',
                                position: 'relative',
                                transition: 'all 0.2s',
                                ...styles
                            }}
                        >
                            {/* Header Strip */}
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                padding: '12px 12px 8px 12px'
                            }}>
                                <h3 style={{
                                    fontWeight: 'bold',
                                    fontSize: '12px',
                                    color: '#1e293b', // slate-800
                                    lineHeight: '1.25',
                                    margin: 0,
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                    width: '100%',
                                    paddingRight: '24px'
                                }} title={node.name}>
                                    {node.name}
                                </h3>
                                {/* Absolute positioned status icons */}
                                <div style={{
                                    position: 'absolute',
                                    top: '8px',
                                    right: '8px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'flex-end'
                                }}>
                                    <span style={{ fontSize: '9px', fontFamily: 'monospace', color: '#94a3b8' }}>#{node.id}</span>
                                    {complete && <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#16a34a' }}>✓</span>}
                                    {overdue && !complete && <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#dc2626' }}>!</span>}
                                </div>
                            </div>

                            {/* Metrics Row */}
                            <div style={{
                                padding: '0 12px 8px 12px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: '10px',
                                color: '#64748b', // slate-500
                                marginBottom: '8px'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#94a3b8' }}>
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span style={{ fontWeight: 500 }}>{node.duration}d</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#94a3b8' }}>
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span style={{ fontWeight: 500 }}>${cost.toLocaleString()}</span>
                                </div>
                            </div>
                            
                            {/* Resources Area */}
                            <div style={{
                                flex: 1,
                                padding: '0 12px 8px 12px',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'flex-end'
                            }}>
                                {node.resources.length > 0 ? (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '4px' }}>
                                        {node.resources.slice(0, 3).map((r, idx) => {
                                            const resName = project.resources.find(res => res.id === r.resourceId)?.name || '??';
                                            return (
                                                <span key={idx} style={{
                                                    backgroundColor: '#f1f5f9', // slate-100
                                                    color: '#475569', // slate-600
                                                    border: '1px solid #e2e8f0', // slate-200
                                                    padding: '0 4px',
                                                    borderRadius: '4px',
                                                    fontSize: '9px',
                                                    whiteSpace: 'nowrap',
                                                    maxWidth: '60px',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    display: 'inline-block'
                                                }}>
                                                    {resName}
                                                </span>
                                            );
                                        })}
                                        {node.resources.length > 3 && <span style={{ fontSize: '9px', color: '#94a3b8' }}>+{node.resources.length - 3}</span>}
                                    </div>
                                ) : (
                                    <div style={{ fontSize: '9px', color: '#cbd5e1', fontStyle: 'italic', marginBottom: '4px' }}>Unassigned</div>
                                )}
                            </div>

                            {/* Clean CPM Grid Footer */}
                            <div style={{
                                marginTop: 'auto',
                                borderTop: '1px solid #f1f5f9',
                                padding: '8px',
                                backgroundColor: 'rgba(248, 250, 252, 0.5)',
                                borderBottomLeftRadius: '8px',
                                borderBottomRightRadius: '8px'
                            }}>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(4, 1fr)',
                                    fontSize: '9px',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '4px',
                                    backgroundColor: '#ffffff',
                                    overflow: 'hidden'
                                }}>
                                    {/* Headers */}
                                    {['ES', 'EF', 'LS', 'LF'].map(label => (
                                        <div key={label} style={{
                                            textAlign: 'center',
                                            padding: '2px 0',
                                            backgroundColor: '#f8fafc',
                                            color: '#94a3b8',
                                            fontWeight: 'bold',
                                            borderRight: label !== 'LF' ? '1px solid #f1f5f9' : 'none',
                                            borderBottom: '1px solid #f1f5f9'
                                        }}>{label}</div>
                                    ))}
                                    
                                    {/* Values */}
                                    {[node.earlyStart, node.earlyFinish, node.lateStart, node.lateFinish].map((val, i) => (
                                        <div key={i} style={{
                                            textAlign: 'center',
                                            padding: '4px 0',
                                            fontFamily: 'monospace',
                                            fontWeight: i < 2 ? 'bold' : 'normal',
                                            color: i < 2 ? '#4338ca' : '#64748b', // indigo-700 : slate-500
                                            borderRight: i !== 3 ? '1px solid #f1f5f9' : 'none'
                                        }}>{val}</div>
                                    ))}
                                </div>
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