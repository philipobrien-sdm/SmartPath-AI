import React, { useMemo } from 'react';
import { Project, Task, OverlayMode, ThemeConfig } from '../types';
import { getRiskScore, calculateTaskCost, getDailyResourceUsage, isTaskComplete, isTaskOverdue, calculateResourceBottlenecks } from '../utils/scheduler';
import * as d3 from 'd3';

interface GanttChartProps {
  project: Project;
  overlayMode: OverlayMode;
  selectedResourceId?: string;
  theme: ThemeConfig;
  onTaskClick?: (taskId: string) => void;
}

const GanttChart: React.FC<GanttChartProps> = ({ project, overlayMode, selectedResourceId, theme, onTaskClick }) => {
  const chartHeight = Math.max(project.tasks.length * 40 + 50, 400);
  const rowHeight = 40;
  const headerHeight = 40;
  const footerHeight = 100; // For resource heatmap

  const totalDays = Math.max(...project.tasks.map(t => t.earlyFinish), 10);
  const dayWidth = 40;
  const chartWidth = Math.max(totalDays * dayWidth + 200, 800);

  // Pre-calculate bottlenecks if we are in resource mode
  const bottlenecks = useMemo(() => {
    if (overlayMode === 'RESOURCE' && selectedResourceId) {
        return calculateResourceBottlenecks(project, selectedResourceId);
    }
    return new Set<string>();
  }, [project, overlayMode, selectedResourceId]);

  // Colors
  const getTaskColor = (task: Task) => {
    if (overlayMode === 'RISK') {
      const score = getRiskScore(task);
      return score >= 15 ? theme.riskHigh : score >= 5 ? theme.riskMedium : theme.riskLow;
    }
    if (overlayMode === 'COST') {
       const cost = calculateTaskCost(task, project.resources);
       const ratio = cost / (project.budget || 1);
       return ratio > 0.1 ? theme.riskHigh : theme.riskLow; 
    }
    if (overlayMode === 'RESOURCE' && selectedResourceId) {
       const alloc = task.resources.find(r => r.resourceId === selectedResourceId);
       if (alloc) {
           // Flag if individual > 100% OR if part of aggregate bottleneck
           if (alloc.percentage > 100 || bottlenecks.has(task.id)) {
               return theme.resourceOverload;
           }
           return theme.resourceNormal;
       }
       return '#e2e8f0'; // slate-200
    }
    
    // Status Logic
    if (isTaskComplete(task)) return '#10b981'; // Green
    if (isTaskOverdue(task, project.startDate)) return 'url(#diagonalHatch)'; // Red hatch pattern

    return task.isCritical ? theme.taskCritical : theme.taskDefault;
  };

  const getTaskStyle = (task: Task) => {
      const bg = getTaskColor(task);
      const isOverdue = isTaskOverdue(task, project.startDate);
      
      // If overdue and using pattern, we need a base color fallback for text contrast or non-svg contexts
      // But here we use standard div. Patterns in CSS are tricky without SVG.
      // Let's use CSS striping for overdue.
      
      if (isOverdue && !isTaskComplete(task)) {
          return {
              backgroundImage: 'repeating-linear-gradient(45deg, #ef4444, #ef4444 10px, #f87171 10px, #f87171 20px)',
              color: 'white'
          }
      }

      return { backgroundColor: bg, color: 'white' };
  };

  // Resource Heatmap Data
  const heatmapData = useMemo(() => {
    if (overlayMode !== 'RESOURCE' || !selectedResourceId) return null;
    const data = [];
    for(let d=0; d<=totalDays; d++) {
        data.push({
            day: d,
            usage: getDailyResourceUsage(project, d, selectedResourceId)
        });
    }
    return data;
  }, [project, overlayMode, selectedResourceId, totalDays]);

  return (
    <div className="w-full h-full overflow-x-auto bg-white rounded-xl shadow-inner border border-slate-200">
      <div 
        id="gantt-chart-inner" 
        style={{ width: chartWidth, minWidth: '100%', minHeight: '100%' }} 
        className="relative bg-white"
      >
        
        {/* Header (Timeline) */}
        <div className="flex border-b border-slate-200 bg-slate-50 sticky top-0 z-10" style={{ height: headerHeight }}>
          <div className="w-48 flex-shrink-0 p-2 font-bold text-slate-600 border-r border-slate-200 flex items-center">
            Task Name
          </div>
          <div className="flex flex-1 relative">
            {Array.from({ length: totalDays + 1 }).map((_, i) => (
              <div key={i} className="absolute border-r border-slate-200 text-xs text-slate-400 flex justify-center pt-1" 
                   style={{ left: i * dayWidth, width: dayWidth, height: '100%' }}>
                D{i}
              </div>
            ))}
          </div>
        </div>

        {/* Rows */}
        <div className="relative">
          {/* Grid lines */}
          <div className="absolute inset-0 pointer-events-none">
             {Array.from({ length: totalDays + 1 }).map((_, i) => (
              <div key={i} className="absolute border-r border-dashed border-slate-100 h-full" 
                   style={{ left: i * dayWidth + 192 }} /> 
             ))}
          </div>

          {project.tasks.map((task, idx) => {
            const isOverdue = isTaskOverdue(task, project.startDate);
            return (
              <div key={task.id} className="flex border-b border-slate-50 hover:bg-slate-50 transition-colors h-[40px] items-center group relative">
                <div 
                    onClick={() => onTaskClick?.(task.id)}
                    className="w-48 flex-shrink-0 px-4 text-sm font-medium text-slate-700 truncate border-r border-slate-200 z-10 bg-white group-hover:bg-slate-50 flex justify-between items-center cursor-pointer hover:text-indigo-600 transition-colors"
                >
                  <span>{task.name}</span>
                  {isOverdue && !isTaskComplete(task) && <span className="text-[10px] bg-red-100 text-red-600 px-1 rounded font-bold">!</span>}
                </div>
                <div className="flex-1 relative h-full">
                  {/* Task Bar */}
                  <div
                    onClick={(e) => { e.stopPropagation(); onTaskClick?.(task.id); }}
                    className={`absolute h-6 top-2 rounded-md shadow-sm transition-all duration-300 text-xs flex items-center justify-center cursor-pointer hover:shadow-md hover:scale-[1.01]`}
                    style={{
                      left: task.earlyStart * dayWidth,
                      width: task.duration * dayWidth,
                      ...getTaskStyle(task)
                    }}
                    title={`Start: ${task.earlyStart}, End: ${task.earlyFinish}, Slack: ${task.slack}`}
                  >
                    {task.duration * dayWidth > 30 && <span className="truncate px-1 shadow-black drop-shadow-md">{task.name}</span>}
                  </div>
                  
                  {/* Slack indication (if not critical) */}
                  {!task.isCritical && task.slack > 0 && (
                     <div 
                      className="absolute h-1 top-4 bg-slate-300 opacity-50"
                      style={{
                          left: task.earlyFinish * dayWidth,
                          width: task.slack * dayWidth
                      }}
                     />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Resource Heatmap Footer */}
        {heatmapData && (
            <div className="sticky bottom-0 bg-white border-t-2 border-slate-200 z-20" style={{ height: footerHeight }}>
                 <div className="absolute top-0 left-0 bg-slate-50 text-xs font-bold p-2 w-48 border-r border-slate-200 h-full">
                    {project.resources.find(r => r.id === selectedResourceId)?.name} Load
                 </div>
                 <div className="ml-48 relative h-full">
                    {heatmapData.map((d) => {
                        // Color scale for usage
                        let color = theme.riskLow; // using riskLow as 'good'
                        if (d.usage > 100) color = theme.resourceOverload;
                        else if (d.usage > 80) color = theme.riskMedium;
                        else if (d.usage === 0) color = 'transparent';
                        
                        // Height based on usage (capped at 100% height for 150% usage to avoid overflow)
                        const barHeight = Math.min((d.usage / 150) * 100, 100);

                        return (
                            <div key={d.day} className="absolute bottom-0 flex flex-col justify-end items-center group"
                                style={{ left: d.day * dayWidth, width: dayWidth, height: '100%' }}>
                                {d.usage > 0 && (
                                    <div className={`w-full opacity-80 hover:opacity-100 transition-all`} 
                                        style={{ height: `${barHeight}%`, backgroundColor: color }}>
                                    </div>
                                )}
                                <div className="hidden group-hover:block absolute bottom-full mb-1 bg-black text-white text-xs p-1 rounded">
                                    {d.usage}%
                                </div>
                            </div>
                        )
                    })}
                 </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default GanttChart;