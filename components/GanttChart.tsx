import React, { useMemo } from 'react';
import { Project, Task, OverlayMode, Resource } from '../types';
import { getRiskScore, calculateTaskCost, getDailyResourceUsage } from '../utils/scheduler';
import * as d3 from 'd3';

interface GanttChartProps {
  project: Project;
  overlayMode: OverlayMode;
  selectedResourceId?: string;
}

const GanttChart: React.FC<GanttChartProps> = ({ project, overlayMode, selectedResourceId }) => {
  const chartHeight = Math.max(project.tasks.length * 40 + 50, 400);
  const rowHeight = 40;
  const headerHeight = 40;
  const footerHeight = 100; // For resource heatmap

  const totalDays = Math.max(...project.tasks.map(t => t.earlyFinish), 10);
  const dayWidth = 40;
  const chartWidth = Math.max(totalDays * dayWidth + 200, 800);

  // Colors
  const getTaskColor = (task: Task) => {
    if (overlayMode === 'RISK') {
      const score = getRiskScore(task);
      return score >= 15 ? 'bg-red-500' : score >= 5 ? 'bg-orange-400' : 'bg-green-500';
    }
    if (overlayMode === 'COST') {
       const cost = calculateTaskCost(task, project.resources);
       const ratio = cost / (project.budget || 1);
       // Simple heuristic threshold
       return ratio > 0.1 ? 'bg-red-500' : 'bg-green-500'; 
    }
    if (overlayMode === 'RESOURCE' && selectedResourceId) {
       const alloc = task.resources.find(r => r.resourceId === selectedResourceId);
       return alloc ? (alloc.percentage > 100 ? 'bg-red-600' : 'bg-blue-500') : 'bg-slate-200';
    }
    return task.isCritical ? 'bg-rose-500' : 'bg-indigo-500';
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

          {project.tasks.map((task, idx) => (
            <div key={task.id} className="flex border-b border-slate-50 hover:bg-slate-50 transition-colors h-[40px] items-center group relative">
              <div className="w-48 flex-shrink-0 px-4 text-sm font-medium text-slate-700 truncate border-r border-slate-200 z-10 bg-white group-hover:bg-slate-50">
                {task.name}
              </div>
              <div className="flex-1 relative h-full">
                {/* Task Bar */}
                <div
                  className={`absolute h-6 top-2 rounded-md shadow-sm transition-all duration-300 text-xs flex items-center justify-center text-white cursor-pointer ${getTaskColor(task)}`}
                  style={{
                    left: task.earlyStart * dayWidth,
                    width: task.duration * dayWidth,
                  }}
                  title={`Start: ${task.earlyStart}, End: ${task.earlyFinish}, Slack: ${task.slack}`}
                >
                  {task.duration * dayWidth > 30 && <span className="truncate px-1">{task.name}</span>}
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
          ))}
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
                        let color = 'bg-green-400';
                        if (d.usage > 100) color = 'bg-red-500';
                        else if (d.usage > 80) color = 'bg-orange-400';
                        else if (d.usage === 0) color = 'bg-transparent';
                        
                        // Height based on usage (capped at 100% height for 150% usage to avoid overflow)
                        const barHeight = Math.min((d.usage / 150) * 100, 100);

                        return (
                            <div key={d.day} className="absolute bottom-0 flex flex-col justify-end items-center group"
                                style={{ left: d.day * dayWidth, width: dayWidth, height: '100%' }}>
                                {d.usage > 0 && (
                                    <div className={`w-full ${color} opacity-80 hover:opacity-100 transition-all`} 
                                        style={{ height: `${barHeight}%` }}>
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