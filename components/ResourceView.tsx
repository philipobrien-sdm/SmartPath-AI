import React, { useMemo } from 'react';
import { Project, ThemeConfig } from '../types';
import { getDailyResourceUsage } from '../utils/scheduler';

interface ResourceViewProps {
  project: Project;
  theme: ThemeConfig;
}

const ResourceView: React.FC<ResourceViewProps> = ({ project, theme }) => {
  const dayWidth = 40;
  const rowHeight = 60;
  const headerHeight = 40;
  
  const totalDays = useMemo(() => {
    return Math.max(...project.tasks.map(t => t.earlyFinish), 20); // Minimum 20 days view
  }, [project.tasks]);

  const chartWidth = Math.max(totalDays * dayWidth + 200, 800);

  // Calculate data for all resources
  const resourceData = useMemo(() => {
    return project.resources.map(res => {
      const dailyUsage = [];
      let maxLoad = 0;
      let overloadDays = 0;

      for(let d=0; d<=totalDays; d++) {
         const usage = getDailyResourceUsage(project, d, res.id);
         dailyUsage.push({ day: d, usage });
         if (usage > maxLoad) maxLoad = usage;
         if (usage > 100) overloadDays++;
      }
      return { resource: res, dailyUsage, maxLoad, overloadDays };
    });
  }, [project, totalDays]);

  return (
    <div className="w-full h-full bg-white rounded-xl shadow-inner border border-slate-200 flex flex-col overflow-hidden">
      {/* Scrollable Container */}
      <div className="flex-1 overflow-auto relative">
         <div style={{ width: chartWidth, minWidth: '100%' }}>
            
            {/* Header Row (Timeline) */}
            <div className="flex border-b border-slate-200 bg-slate-50 sticky top-0 z-20 h-[40px]">
                {/* Fixed Corner */}
                <div className="w-56 flex-shrink-0 p-2 font-bold text-slate-600 border-r border-slate-200 flex items-center bg-slate-50 sticky left-0 z-30 shadow-[1px_0_3px_rgba(0,0,0,0.1)]">
                    Resource Name
                </div>
                {/* Days */}
                <div className="flex flex-1 relative">
                    {Array.from({ length: totalDays + 1 }).map((_, i) => (
                    <div key={i} className="absolute border-r border-slate-200 text-xs text-slate-400 flex justify-center pt-2 font-mono" 
                        style={{ left: i * dayWidth, width: dayWidth, height: '100%' }}>
                        D{i}
                    </div>
                    ))}
                </div>
            </div>

            {/* Resource Rows */}
            <div className="relative">
                {/* Grid Lines Background */}
                <div className="absolute inset-0 pointer-events-none z-0">
                    {Array.from({ length: totalDays + 1 }).map((_, i) => (
                        <div key={i} className="absolute border-r border-dashed border-slate-100 h-full" 
                            style={{ left: i * dayWidth + 224 }} /> // 224 = 56 (w-56) * 4px
                    ))}
                </div>

                {resourceData.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 italic">
                        No resources defined in the project. Go to the Editor to add resources.
                    </div>
                ) : (
                    resourceData.map((row) => (
                        <div key={row.resource.id} className="flex border-b border-slate-100 hover:bg-slate-50 transition-colors relative h-[60px] group">
                            
                            {/* Sticky Resource Info Column */}
                            <div className="w-56 flex-shrink-0 px-4 py-2 border-r border-slate-200 bg-white group-hover:bg-slate-50 sticky left-0 z-10 flex flex-col justify-center shadow-[1px_0_3px_rgba(0,0,0,0.05)]">
                                <div className="font-bold text-slate-700 text-sm truncate">{row.resource.name}</div>
                                <div className="flex justify-between items-center mt-1">
                                    <span className="text-xs text-slate-400">${row.resource.hourlyRate}/hr</span>
                                    {row.overloadDays > 0 && (
                                        <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-bold animate-pulse">
                                            {row.overloadDays} Days Overload
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Timeline Bars */}
                            <div className="flex-1 relative h-full">
                                {row.dailyUsage.map((d) => {
                                    if (d.usage === 0) return null;

                                    // Visual Logic
                                    let barColor = theme.resourceNormal;
                                    if (d.usage > 100) barColor = theme.resourceOverload;
                                    else if (d.usage > 80) barColor = theme.riskMedium;

                                    // Height scaling: Max height 80% of row. 
                                    // Usage of 100% = 80% height. Usage of 200% = capped at 100% of container or clipped.
                                    // Let's cap visual height at 100% for 125% usage to show severe overload clearly but cleanly.
                                    const heightPct = Math.min((d.usage / 125) * 80, 90);

                                    return (
                                        <div key={d.day} 
                                            className="absolute bottom-0 flex flex-col justify-end items-center group/bar"
                                            style={{ left: d.day * dayWidth, width: dayWidth, height: '100%' }}
                                        >
                                            <div 
                                                className={`w-full mx-px rounded-t-sm transition-all relative ${d.usage > 100 ? 'opacity-90' : 'opacity-70 group-hover/bar:opacity-100'}`}
                                                style={{ 
                                                    height: `${heightPct}%`, 
                                                    backgroundColor: barColor,
                                                    width: '90%' // Slight gap between days
                                                }}
                                            >
                                                {/* Tooltip */}
                                                <div className="hidden group-hover/bar:flex absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-50 pointer-events-none">
                                                    Day {d.day}: {d.usage}%
                                                </div>
                                            </div>
                                            {/* Text Label for values if space permits or overload */}
                                            {d.usage > 100 && (
                                                <div className="absolute top-1 text-[9px] font-bold text-red-600 z-0">
                                                    {d.usage}%
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                )}
            </div>
         </div>
      </div>
      
      {/* Legend Footer */}
      <div className="h-12 border-t border-slate-200 bg-slate-50 flex items-center px-6 gap-6 text-xs text-slate-500">
          <div className="font-bold uppercase tracking-wider text-slate-400">Legend:</div>
          <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-blue-500 opacity-70"></div>
              <span>Normal Load (≤ 80%)</span>
          </div>
          <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-orange-500 opacity-70"></div>
              <span>High Load (80-100%)</span>
          </div>
          <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-red-600 opacity-90"></div>
              <span>Overloaded (> 100%)</span>
          </div>
      </div>
    </div>
  );
};

export default ResourceView;