import { Project } from '../types';
import { calculateProjectCost, isTaskComplete, isTaskOverdue } from './scheduler';

export const generateHTMLReport = (project: Project): string => {
  const totalCost = calculateProjectCost(project);
  const criticalPathLength = Math.max(...project.tasks.map(t => t.earlyFinish), 0);
  const riskCount = project.tasks.reduce((acc, t) => acc + t.risks.length, 0);
  const completedTasks = project.tasks.filter(t => isTaskComplete(t)).length;
  const progress = project.tasks.length > 0 ? Math.round((completedTasks / project.tasks.length) * 100) : 0;
  
  const now = new Date().toLocaleDateString();

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Status Report: ${project.name}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @media print {
            details[open] summary ~ * { animation: none; }
            body { padding: 0; background: white; }
            .no-print { display: none; }
        }
        /* Smooth accordion animation */
        details > summary { list-style: none; }
        details > summary::-webkit-details-marker { display: none; }
    </style>
</head>
<body class="bg-slate-100 text-slate-800 font-sans p-8 print:p-0">
    <div class="max-w-4xl mx-auto bg-white shadow-xl rounded-xl overflow-hidden print:shadow-none">
        
        <!-- Header -->
        <header class="bg-slate-900 text-white p-8">
            <div class="flex justify-between items-start">
                <div>
                    <h1 class="text-3xl font-bold mb-2">${project.name}</h1>
                    <p class="text-slate-400 text-sm">Project ID: ${project.id} | Generated: ${now}</p>
                </div>
                <div class="text-right">
                    <div class="text-xs uppercase tracking-widest text-slate-400">Total Budget</div>
                    <div class="text-2xl font-bold font-mono">$${project.budget.toLocaleString()}</div>
                </div>
            </div>
            
            <!-- Key Metrics -->
            <div class="grid grid-cols-4 gap-4 mt-8">
                <div class="bg-slate-800 p-4 rounded-lg">
                    <div class="text-xs text-slate-400 uppercase">Current Cost</div>
                    <div class="text-xl font-bold ${totalCost > project.budget ? 'text-red-400' : 'text-green-400'}">
                        $${totalCost.toLocaleString()}
                    </div>
                </div>
                 <div class="bg-slate-800 p-4 rounded-lg">
                    <div class="text-xs text-slate-400 uppercase">Duration</div>
                    <div class="text-xl font-bold text-white">${criticalPathLength} days</div>
                </div>
                 <div class="bg-slate-800 p-4 rounded-lg">
                    <div class="text-xs text-slate-400 uppercase">Progress</div>
                    <div class="text-xl font-bold text-white">${progress}%</div>
                </div>
                 <div class="bg-slate-800 p-4 rounded-lg">
                    <div class="text-xs text-slate-400 uppercase">Risks</div>
                    <div class="text-xl font-bold ${riskCount > 0 ? 'text-orange-400' : 'text-slate-500'}">${riskCount}</div>
                </div>
            </div>
        </header>

        <div class="p-8 space-y-6">

            <!-- Executive Summary -->
            <details class="group bg-slate-50 border border-slate-200 rounded-lg open:ring-2 open:ring-indigo-100 transition-all duration-300" open>
                <summary class="flex justify-between items-center p-4 font-bold cursor-pointer hover:bg-slate-100 select-none">
                    <span class="text-lg text-slate-700 flex items-center gap-2">
                        <span class="bg-indigo-100 text-indigo-700 w-6 h-6 flex items-center justify-center rounded text-xs">1</span> 
                        Executive Summary
                    </span>
                    <span class="transition-transform duration-300 group-open:rotate-180 text-slate-400">
                        <svg fill="none" height="24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                    </span>
                </summary>
                <div class="p-6 border-t border-slate-200 text-slate-600 leading-relaxed whitespace-pre-wrap animate-in slide-in-from-top-2 duration-300">
                    <div class="mb-4 text-slate-800">${project.charter?.overview || 'No overview defined.'}</div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-4 rounded border border-slate-100">
                        <div>
                            <h4 class="font-bold text-xs uppercase text-slate-400 mb-2 border-b border-slate-100 pb-1">Strategic Goals</h4>
                            <ul class="list-disc list-inside text-sm space-y-1">
                                ${project.charter?.goals?.map(g => `<li>${g}</li>`).join('') || '<li class="italic text-slate-400">None defined</li>'}
                            </ul>
                        </div>
                         <div>
                            <h4 class="font-bold text-xs uppercase text-slate-400 mb-2 border-b border-slate-100 pb-1">Key Stakeholders</h4>
                             <ul class="list-disc list-inside text-sm space-y-1">
                                ${project.charter?.stakeholders?.map(s => `<li>${s}</li>`).join('') || '<li class="italic text-slate-400">None defined</li>'}
                            </ul>
                        </div>
                    </div>
                </div>
            </details>

            <!-- Schedule Status -->
            <details class="group bg-slate-50 border border-slate-200 rounded-lg open:ring-2 open:ring-indigo-100 transition-all duration-300" open>
                <summary class="flex justify-between items-center p-4 font-bold cursor-pointer hover:bg-slate-100 select-none">
                     <span class="text-lg text-slate-700 flex items-center gap-2">
                        <span class="bg-indigo-100 text-indigo-700 w-6 h-6 flex items-center justify-center rounded text-xs">2</span> 
                        Schedule Status
                    </span>
                    <span class="transition-transform duration-300 group-open:rotate-180 text-slate-400">
                        <svg fill="none" height="24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                    </span>
                </summary>
                <div class="p-4 border-t border-slate-200 overflow-x-auto animate-in slide-in-from-top-2 duration-300">
                    <table class="w-full text-sm text-left border-collapse">
                        <thead class="bg-slate-100 text-slate-500 font-bold uppercase text-xs">
                            <tr>
                                <th class="p-3 border-b border-slate-200">Task Name</th>
                                <th class="p-3 border-b border-slate-200">Duration</th>
                                <th class="p-3 border-b border-slate-200">Predecessors</th>
                                <th class="p-3 border-b border-slate-200">Status</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-200 bg-white">
                            ${project.tasks.map(task => {
                                const isComplete = isTaskComplete(task);
                                const isOverdue = isTaskOverdue(task, project.startDate);
                                let statusBadge = '<span class="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-bold border border-slate-200">Pending</span>';
                                if(isComplete) statusBadge = '<span class="px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-bold border border-green-200">Complete</span>';
                                else if(isOverdue) statusBadge = '<span class="px-2 py-1 bg-red-50 text-red-700 rounded text-xs font-bold border border-red-200">Overdue</span>';
                                else if(task.earlyStart === 0 && !isComplete) statusBadge = '<span class="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-bold border border-blue-200">In Progress</span>';
                                
                                return `
                                <tr class="hover:bg-slate-50">
                                    <td class="p-3">
                                        <div class="font-medium text-slate-800">${task.name}</div>
                                        ${task.isCritical ? '<div class="text-[10px] text-red-500 font-bold mt-0.5">CRITICAL PATH</div>' : ''}
                                    </td>
                                    <td class="p-3 text-slate-600">${task.duration}d</td>
                                    <td class="p-3 text-slate-400 text-xs font-mono">${task.predecessors.length ? task.predecessors.join(', ') : '-'}</td>
                                    <td class="p-3">${statusBadge}</td>
                                </tr>
                                `
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </details>

            <!-- Risk Register -->
             <details class="group bg-slate-50 border border-slate-200 rounded-lg open:ring-2 open:ring-indigo-100 transition-all duration-300">
                <summary class="flex justify-between items-center p-4 font-bold cursor-pointer hover:bg-slate-100 select-none">
                     <span class="text-lg text-slate-700 flex items-center gap-2">
                        <span class="bg-indigo-100 text-indigo-700 w-6 h-6 flex items-center justify-center rounded text-xs">3</span> 
                        Risk Register (${riskCount})
                    </span>
                    <span class="transition-transform duration-300 group-open:rotate-180 text-slate-400">
                        <svg fill="none" height="24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                    </span>
                </summary>
                <div class="p-4 border-t border-slate-200 animate-in slide-in-from-top-2 duration-300">
                    <table class="w-full text-sm text-left border-collapse">
                        <thead class="bg-slate-100 text-slate-500 font-bold uppercase text-xs">
                            <tr>
                                <th class="p-3 border-b border-slate-200">Score</th>
                                <th class="p-3 border-b border-slate-200">Description</th>
                                <th class="p-3 border-b border-slate-200">Mitigation</th>
                                <th class="p-3 border-b border-slate-200">Status</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-200 bg-white">
                             ${project.tasks.flatMap(t => t.risks).sort((a,b) => (b.probability*b.impact) - (a.probability*a.impact)).map(r => {
                                 const score = r.probability * r.impact;
                                 let color = 'bg-green-100 text-green-800';
                                 if(score >= 15) color = 'bg-red-100 text-red-800';
                                 else if(score >= 5) color = 'bg-orange-100 text-orange-800';
                                 
                                 return `
                                 <tr class="hover:bg-slate-50">
                                    <td class="p-3"><span class="px-2 py-1 rounded font-bold text-xs ${color}">${score}</span></td>
                                    <td class="p-3 text-slate-800 font-medium">${r.description}</td>
                                    <td class="p-3 text-slate-600 italic text-xs bg-slate-50 rounded border border-slate-100 p-2 my-2 block max-w-xs">${r.mitigation}</td>
                                    <td class="p-3 text-xs font-bold uppercase text-slate-500">${r.status || 'OPEN'}</td>
                                 </tr>
                                 `
                             }).join('')}
                             ${riskCount === 0 ? '<tr><td colspan="4" class="p-8 text-center text-slate-400 italic">No active risks identified.</td></tr>' : ''}
                        </tbody>
                    </table>
                </div>
            </details>
            
            <!-- Actions & Meetings -->
             <details class="group bg-slate-50 border border-slate-200 rounded-lg open:ring-2 open:ring-indigo-100 transition-all duration-300">
                <summary class="flex justify-between items-center p-4 font-bold cursor-pointer hover:bg-slate-100 select-none">
                     <span class="text-lg text-slate-700 flex items-center gap-2">
                        <span class="bg-indigo-100 text-indigo-700 w-6 h-6 flex items-center justify-center rounded text-xs">4</span> 
                        Actions & Meetings
                    </span>
                    <span class="transition-transform duration-300 group-open:rotate-180 text-slate-400">
                        <svg fill="none" height="24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                    </span>
                </summary>
                <div class="p-4 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
                    <div class="bg-white p-4 rounded border border-slate-200">
                        <h4 class="font-bold text-slate-700 mb-3 uppercase text-xs tracking-wider border-b border-slate-100 pb-2">Open Action Items</h4>
                        <ul class="space-y-2">
                            ${project.tasks.flatMap(t => t.actions || []).filter(a => !a.isCompleted).map(a => `
                                <li class="flex items-start gap-2 text-sm text-slate-700">
                                    <span class="text-orange-500 font-bold mt-0.5">☐</span> ${a.description}
                                </li>
                            `).join('') || '<li class="text-slate-400 italic text-sm text-center py-2">No open actions.</li>'}
                        </ul>
                    </div>
                    <div class="bg-white p-4 rounded border border-slate-200">
                        <h4 class="font-bold text-slate-700 mb-3 uppercase text-xs tracking-wider border-b border-slate-100 pb-2">Recent Meetings</h4>
                         <ul class="space-y-3">
                            ${project.meetings?.slice(0, 5).map(m => `
                                <li class="text-sm">
                                    <div class="font-bold text-slate-800">${m.title}</div>
                                    <div class="text-xs text-slate-400">${m.date} | ${m.attendees}</div>
                                </li>
                            `).join('') || '<li class="text-slate-400 italic text-sm text-center py-2">No meetings recorded.</li>'}
                        </ul>
                    </div>
                </div>
            </details>

        </div>
        
        <footer class="bg-slate-100 p-6 text-center text-xs text-slate-400 border-t border-slate-200">
            Generated by SmartPath AI • ${new Date().getFullYear()}
        </footer>
    </div>
</body>
</html>`;
};