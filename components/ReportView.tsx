import React, { useState } from 'react';
import { Project, Task, ActionItem, Meeting, Risk } from '../types';

interface ReportViewProps {
  project: Project;
  setProject: React.Dispatch<React.SetStateAction<Project>>;
  aiEnabled?: boolean;
  onAskAI?: (category: 'OPTIMIZATION' | 'RISK' | 'MEETING' | 'CHARTER' | 'GENERAL', context?: string) => void;
}

type ActionFilter = 'ALL' | 'CRITICAL' | 'CURRENT' | 'UPCOMING';

interface RiskEditState {
    taskId: string;
    riskId: string;
    description: string;
    mitigation: string;
    probability: number;
    impact: number;
    owner: string;
    status: Risk['status'];
}

const ReportView: React.FC<ReportViewProps> = ({ project, setProject, aiEnabled, onAskAI }) => {
  const [activeTab, setActiveTab] = useState<'RISKS' | 'ACTIONS' | 'MEETINGS'>('RISKS');
  const [actionFilter, setActionFilter] = useState<ActionFilter>('ALL');
  const [upcomingDays, setUpcomingDays] = useState(7);
  
  // Risk Editing State
  const [editingRisk, setEditingRisk] = useState<RiskEditState | null>(null);

  // Meeting Form State
  const [isAddingMeeting, setIsAddingMeeting] = useState(false);
  const [newMeeting, setNewMeeting] = useState<Partial<Meeting>>({
      date: new Date().toISOString().split('T')[0],
      title: '',
      attendees: '',
      notes: ''
  });

  // --- Helper Functions ---

  const addDays = (date: Date, days: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };

  const getFilteredActions = () => {
    const projectStart = new Date(project.startDate);
    const today = new Date(); // In a real app, might want to allow setting "current date" for simulation

    return project.tasks.flatMap(task => {
      const taskStart = addDays(projectStart, task.earlyStart);
      const taskEnd = addDays(projectStart, task.earlyFinish);
      
      const hasActions = task.actions && task.actions.length > 0;
      if (!hasActions) return [];

      let include = false;
      if (actionFilter === 'ALL') include = true;
      else if (actionFilter === 'CRITICAL') include = task.isCritical;
      else if (actionFilter === 'CURRENT') {
         // Simple overlap check
         include = today >= taskStart && today <= taskEnd;
      } else if (actionFilter === 'UPCOMING') {
         const threshold = addDays(today, upcomingDays);
         include = taskStart >= today && taskStart <= threshold;
      }

      if (include) {
         return task.actions.map(action => ({ task, action }));
      }
      return [];
    });
  };

  const toggleAction = (taskId: string, actionId: string) => {
      setProject(prev => ({
          ...prev,
          tasks: prev.tasks.map(t => {
              if (t.id !== taskId) return t;
              return {
                  ...t,
                  actions: t.actions.map(a => a.id === actionId ? { ...a, isCompleted: !a.isCompleted } : a)
              };
          })
      }));
  };

  const saveMeeting = () => {
      if (!newMeeting.title || !newMeeting.date) return;
      const meeting: Meeting = {
          id: `m${Date.now()}`,
          date: newMeeting.date,
          title: newMeeting.title,
          attendees: newMeeting.attendees || '',
          notes: newMeeting.notes || ''
      };
      setProject(prev => ({
          ...prev,
          meetings: [meeting, ...(prev.meetings || [])].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      }));
      setIsAddingMeeting(false);
      setNewMeeting({
        date: new Date().toISOString().split('T')[0],
        title: '',
        attendees: '',
        notes: ''
      });
  };

  const deleteMeeting = (id: string) => {
      setProject(prev => ({
          ...prev,
          meetings: prev.meetings.filter(m => m.id !== id)
      }));
  };

  // --- Risk Handling ---

  const handleEditRisk = (task: Task, risk: Risk) => {
      setEditingRisk({
          taskId: task.id,
          riskId: risk.id,
          description: risk.description,
          mitigation: risk.mitigation,
          probability: risk.probability,
          impact: risk.impact,
          owner: risk.owner || '',
          status: risk.status || 'OPEN'
      });
  };

  const saveRiskEdit = () => {
      if (!editingRisk) return;
      setProject(prev => ({
          ...prev,
          tasks: prev.tasks.map(t => {
              if (t.id !== editingRisk.taskId) return t;
              return {
                  ...t,
                  risks: t.risks.map(r => r.id === editingRisk.riskId ? {
                      ...r,
                      description: editingRisk.description,
                      mitigation: editingRisk.mitigation,
                      probability: editingRisk.probability,
                      impact: editingRisk.impact,
                      owner: editingRisk.owner,
                      status: editingRisk.status
                  } : r)
              };
          })
      }));
      setEditingRisk(null);
  };

  const getRiskMatrixData = () => {
      const matrix = Array(5).fill(null).map(() => Array(5).fill(0));
      const risksList: {taskId: string, riskId: string, taskName: string, description: string, prob: number, imp: number, mitigation: string, owner: string, status: string, fullRisk: Risk, fullTask: Task}[] = [];

      project.tasks.forEach(task => {
          task.risks.forEach(risk => {
              const row = 5 - risk.probability;
              const col = risk.impact - 1;

              if(row >= 0 && row < 5 && col >= 0 && col < 5) {
                  matrix[row][col]++;
                  risksList.push({
                      taskId: task.id,
                      riskId: risk.id,
                      taskName: task.name,
                      description: risk.description,
                      prob: risk.probability,
                      imp: risk.impact,
                      mitigation: risk.mitigation,
                      owner: risk.owner || '',
                      status: risk.status || 'OPEN',
                      fullRisk: risk,
                      fullTask: task
                  });
              }
          });
      });
      return { matrix, risksList };
  };

  const { matrix, risksList } = getRiskMatrixData();
  const filteredActionItems = getFilteredActions();

  // --- Render ---

  return (
    <div className="w-full h-full bg-white rounded-xl shadow-inner border border-slate-200 overflow-hidden flex flex-col">
      
      {/* Tabs */}
      <div className="flex bg-slate-50 border-b border-slate-200 px-6 pt-4">
          <button 
              onClick={() => setActiveTab('RISKS')}
              className={`px-4 py-2 text-sm font-medium border-t border-l border-r rounded-t-lg mr-2 ${activeTab === 'RISKS' ? 'bg-white text-indigo-600 border-slate-200 -mb-px' : 'bg-slate-100 text-slate-500 border-transparent'}`}
          >
              Risk Analysis
          </button>
          <button 
              onClick={() => setActiveTab('ACTIONS')}
              className={`px-4 py-2 text-sm font-medium border-t border-l border-r rounded-t-lg mr-2 ${activeTab === 'ACTIONS' ? 'bg-white text-indigo-600 border-slate-200 -mb-px' : 'bg-slate-100 text-slate-500 border-transparent'}`}
          >
              Actions & Tracker
          </button>
          <button 
              onClick={() => setActiveTab('MEETINGS')}
              className={`px-4 py-2 text-sm font-medium border-t border-l border-r rounded-t-lg ${activeTab === 'MEETINGS' ? 'bg-white text-indigo-600 border-slate-200 -mb-px' : 'bg-slate-100 text-slate-500 border-transparent'}`}
          >
              Meeting Log
          </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 relative">
          
          {/* RISK VIEW */}
          {activeTab === 'RISKS' && (
              <div className="flex flex-col gap-8">
                  {aiEnabled && (
                    <div className="absolute top-6 right-6 z-10">
                        <button 
                            onClick={() => onAskAI?.('RISK')}
                            className="bg-white/90 backdrop-blur border border-indigo-200 text-indigo-700 px-3 py-1.5 rounded-lg shadow-sm text-xs font-bold hover:bg-indigo-50 flex items-center gap-1"
                        >
                            Risk Insights ✨
                        </button>
                    </div>
                  )}
                  {/* Heatmap Section */}
                  <div className="flex flex-col md:flex-row gap-8 items-start">
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                             Risk Matrix
                             <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-1 rounded">Probability vs Impact</span>
                          </h3>
                          <div className="flex">
                              {/* Y-Axis Label */}
                              <div className="flex items-center justify-center w-8 -rotate-90 text-xs font-bold text-slate-400 tracking-wider">
                                  PROBABILITY
                              </div>
                              
                              <div>
                                <div className="grid grid-cols-5 gap-1 mb-1 relative">
                                    {/* Matrix Rows */}
                                    {matrix.map((row, rowIndex) => (
                                        <React.Fragment key={rowIndex}>
                                            {/* Y-Axis Value */}
                                            {/* We can overlay numbers or just headers */}
                                            {row.map((count, colIndex) => {
                                                // Color logic
                                                // High (Red): Prob * Imp >= 15
                                                // Med (Yellow): Prob * Imp >= 5
                                                // Low (Green): < 5
                                                const prob = 5 - rowIndex;
                                                const imp = colIndex + 1;
                                                const score = prob * imp;
                                                
                                                let bgClass = 'bg-green-100 text-green-700 border-green-200';
                                                if(score >= 15) bgClass = 'bg-red-100 text-red-700 border-red-200';
                                                else if(score >= 5) bgClass = 'bg-orange-100 text-orange-700 border-orange-200';

                                                return (
                                                    <div key={`${rowIndex}-${colIndex}`} className={`w-16 h-16 md:w-20 md:h-20 flex items-center justify-center rounded border ${bgClass} relative group`}>
                                                        {count > 0 && (
                                                            <span className="text-xl font-bold">{count}</span>
                                                        )}
                                                        <div className="absolute top-1 right-1 text-[9px] opacity-30 font-mono">{score}</div>
                                                    </div>
                                                );
                                            })}
                                        </React.Fragment>
                                    ))}
                                </div>
                                {/* X-Axis Label */}
                                <div className="text-center text-xs font-bold text-slate-400 tracking-wider mt-2">
                                    IMPACT
                                </div>
                              </div>
                          </div>
                      </div>

                      {/* Summary Cards */}
                      <div className="flex-1 grid grid-cols-2 gap-4 w-full">
                           <div className="bg-red-50 border border-red-100 p-4 rounded-xl">
                               <div className="text-red-500 font-bold text-2xl">{risksList.filter(r => r.prob * r.imp >= 15).length}</div>
                               <div className="text-red-700 text-sm font-medium">Critical Risks</div>
                               <div className="text-red-400 text-xs mt-1">Requires immediate mitigation</div>
                           </div>
                           <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl">
                               <div className="text-orange-500 font-bold text-2xl">{risksList.filter(r => r.prob * r.imp >= 5 && r.prob * r.imp < 15).length}</div>
                               <div className="text-orange-700 text-sm font-medium">Moderate Risks</div>
                               <div className="text-orange-400 text-xs mt-1">Monitor regularly</div>
                           </div>
                           <div className="bg-green-50 border border-green-100 p-4 rounded-xl">
                               <div className="text-green-500 font-bold text-2xl">{risksList.filter(r => r.prob * r.imp < 5).length}</div>
                               <div className="text-green-700 text-sm font-medium">Low Risks</div>
                               <div className="text-green-400 text-xs mt-1">Periodic review</div>
                           </div>
                           <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
                               <div className="text-slate-500 font-bold text-2xl">{risksList.length}</div>
                               <div className="text-slate-700 text-sm font-medium">Total Risks Identified</div>
                           </div>
                      </div>
                  </div>

                  {/* Risks List */}
                  <div>
                      <h3 className="text-lg font-bold text-slate-800 mb-4">Risk Register</h3>
                      <div className="overflow-x-auto rounded-lg border border-slate-200">
                        <table className="min-w-full text-left text-sm whitespace-nowrap">
                            <thead className="uppercase tracking-wider border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Score</th>
                                    <th scope="col" className="px-6 py-3">Task / Status</th>
                                    <th scope="col" className="px-6 py-3 w-1/3">Description & Mitigation</th>
                                    <th scope="col" className="px-6 py-3">Prob</th>
                                    <th scope="col" className="px-6 py-3">Impact</th>
                                    <th scope="col" className="px-6 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {risksList.sort((a,b) => (b.prob*b.imp) - (a.prob*a.imp)).map((risk, i) => {
                                    const isEditing = editingRisk?.riskId === risk.riskId && editingRisk?.taskId === risk.taskId;
                                    const score = risk.prob * risk.imp;
                                    let badgeColor = 'bg-green-100 text-green-800';
                                    if(score >= 15) badgeColor = 'bg-red-100 text-red-800';
                                    else if(score >= 5) badgeColor = 'bg-orange-100 text-orange-800';

                                    if (isEditing) {
                                        return (
                                            <tr key={`${risk.taskId}-${risk.riskId}`} className="bg-indigo-50 border-b border-slate-200">
                                                <td className="px-6 py-4 font-bold text-slate-500">
                                                    {editingRisk!.probability * editingRisk!.impact}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-indigo-800 mb-2">{risk.taskName}</div>
                                                    <div className="flex gap-2">
                                                        <input 
                                                            className="w-full p-1 text-xs border rounded mb-1"
                                                            placeholder="Owner"
                                                            value={editingRisk!.owner}
                                                            onChange={e => setEditingRisk({...editingRisk!, owner: e.target.value})}
                                                        />
                                                        <select
                                                            className="text-xs border rounded p-1"
                                                            value={editingRisk!.status}
                                                            onChange={e => setEditingRisk({...editingRisk!, status: e.target.value as any})}
                                                        >
                                                            <option value="OPEN">OPEN</option>
                                                            <option value="WATCHING">WATCHING</option>
                                                            <option value="MITIGATED">MITIGATED</option>
                                                            <option value="CLOSED">CLOSED</option>
                                                        </select>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <input 
                                                        className="w-full p-2 border rounded mb-2 text-sm"
                                                        value={editingRisk!.description}
                                                        onChange={e => setEditingRisk({...editingRisk!, description: e.target.value})}
                                                        placeholder="Risk Description"
                                                    />
                                                    <textarea 
                                                        className="w-full p-2 border rounded text-xs h-16"
                                                        value={editingRisk!.mitigation}
                                                        onChange={e => setEditingRisk({...editingRisk!, mitigation: e.target.value})}
                                                        placeholder="Mitigation Strategy"
                                                    />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <select 
                                                        className="p-2 border rounded"
                                                        value={editingRisk!.probability}
                                                        onChange={e => setEditingRisk({...editingRisk!, probability: parseInt(e.target.value)})}
                                                    >
                                                        {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                                                    </select>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <select 
                                                        className="p-2 border rounded"
                                                        value={editingRisk!.impact}
                                                        onChange={e => setEditingRisk({...editingRisk!, impact: parseInt(e.target.value)})}
                                                    >
                                                        {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                                                    </select>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <button onClick={saveRiskEdit} className="text-xs bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700 mr-2">Save</button>
                                                    <button onClick={() => setEditingRisk(null)} className="text-xs text-slate-500 hover:text-slate-700">Cancel</button>
                                                </td>
                                            </tr>
                                        )
                                    }

                                    return (
                                        <tr key={`${risk.taskId}-${risk.riskId}`} className="border-b border-slate-100 hover:bg-slate-50">
                                            <td className="px-6 py-4 align-top">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${badgeColor}`}>{score}</span>
                                            </td>
                                            <td className="px-6 py-4 align-top">
                                                <div className="font-medium text-slate-800">{risk.taskName}</div>
                                                <div className="flex gap-2 mt-1">
                                                     <span className={`text-[10px] px-1.5 py-0.5 rounded border uppercase font-bold tracking-wider ${
                                                        risk.status === 'CLOSED' ? 'bg-slate-100 text-slate-500 border-slate-200' : 
                                                        risk.status === 'MITIGATED' ? 'bg-green-50 text-green-600 border-green-200' : 
                                                        risk.status === 'WATCHING' ? 'bg-blue-50 text-blue-600 border-blue-200' : 
                                                        'bg-red-50 text-red-600 border-red-200'
                                                     }`}>{risk.status}</span>
                                                     {risk.owner && <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">👤 {risk.owner}</span>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-normal align-top">
                                                <div className="text-slate-700 font-medium mb-1">{risk.description}</div>
                                                <div className="text-slate-500 text-xs italic bg-slate-50 p-2 rounded border border-slate-100">
                                                    <span className="font-semibold text-slate-400 mr-1">MITIGATION:</span>
                                                    {risk.mitigation || "No mitigation strategy defined."}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 align-top">{risk.prob}</td>
                                            <td className="px-6 py-4 align-top">{risk.imp}</td>
                                            <td className="px-6 py-4 align-top">
                                                <button onClick={() => handleEditRisk(risk.fullTask, risk.fullRisk)} className="text-indigo-600 hover:text-indigo-800 text-xs font-medium">
                                                    Edit / Mitigate
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {risksList.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-slate-400 italic">No risks identified yet.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                      </div>
                  </div>
              </div>
          )}

          {/* ACTIONS VIEW */}
          {activeTab === 'ACTIONS' && (
              <div className="flex flex-col gap-6">
                  {/* Controls */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-wrap gap-4 items-center justify-between">
                      <div className="flex gap-2">
                          {(['ALL', 'CRITICAL', 'CURRENT', 'UPCOMING'] as ActionFilter[]).map(filter => (
                              <button
                                  key={filter}
                                  onClick={() => setActionFilter(filter)}
                                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all uppercase tracking-wide ${actionFilter === filter ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-100'}`}
                              >
                                  {filter}
                              </button>
                          ))}
                      </div>
                      
                      {actionFilter === 'UPCOMING' && (
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                              <span>Next</span>
                              <input 
                                  type="number" min="1" max="365"
                                  value={upcomingDays}
                                  onChange={(e) => setUpcomingDays(parseInt(e.target.value) || 7)}
                                  className="w-16 p-1 border rounded text-center"
                              />
                              <span>days</span>
                          </div>
                      )}
                  </div>

                  {/* Actions List */}
                  <div className="space-y-4">
                      {filteredActionItems.length === 0 ? (
                          <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400">
                              <p>No actions found for this filter.</p>
                          </div>
                      ) : (
                          filteredActionItems.map(({task, action}) => (
                              <div key={action.id} className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${action.isCompleted ? 'bg-slate-50 border-slate-100' : 'bg-white border-slate-200 hover:shadow-md'}`}>
                                  <div className="pt-1">
                                      <input 
                                          type="checkbox" 
                                          checked={action.isCompleted} 
                                          onChange={() => toggleAction(task.id, action.id)}
                                          className="h-5 w-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                      />
                                  </div>
                                  <div className="flex-1">
                                      <div className={`text-sm font-medium mb-1 ${action.isCompleted ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                                          {action.description}
                                      </div>
                                      <div className="flex items-center gap-2 text-xs">
                                          <span className="font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">{task.name}</span>
                                          {task.isCritical && (
                                              <span className="font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                  Critical Path
                                              </span>
                                          )}
                                          <span className="text-slate-400">
                                              Due approx. Day {task.earlyFinish}
                                          </span>
                                      </div>
                                  </div>
                              </div>
                          ))
                      )}
                  </div>
              </div>
          )}
          
          {/* MEETINGS VIEW */}
          {activeTab === 'MEETINGS' && (
              <div className="flex flex-col gap-6">
                  {aiEnabled && (
                    <div className="absolute top-6 right-6 z-10">
                        <button 
                            onClick={() => onAskAI?.('MEETING')}
                            className="bg-white/90 backdrop-blur border border-indigo-200 text-indigo-700 px-3 py-1.5 rounded-lg shadow-sm text-xs font-bold hover:bg-indigo-50 flex items-center gap-1"
                        >
                            Analyze Logs ✨
                        </button>
                    </div>
                  )}
                  {/* Header/Add Button */}
                  <div className="flex justify-between items-center">
                      <h3 className="text-lg font-bold text-slate-800">Project Meetings Register</h3>
                      <button 
                          onClick={() => setIsAddingMeeting(!isAddingMeeting)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isAddingMeeting ? 'bg-slate-200 text-slate-600' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                      >
                          {isAddingMeeting ? 'Cancel' : '+ Log Meeting'}
                      </button>
                  </div>

                  {/* Add Meeting Form */}
                  {isAddingMeeting && (
                      <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 animate-in fade-in slide-in-from-top-2">
                          <h4 className="font-bold text-slate-700 mb-4">New Meeting Entry</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div>
                                  <label className="block text-xs font-bold text-slate-500 mb-1">Date</label>
                                  <input 
                                      type="date"
                                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                      value={newMeeting.date}
                                      onChange={e => setNewMeeting({...newMeeting, date: e.target.value})}
                                  />
                              </div>
                              <div>
                                  <label className="block text-xs font-bold text-slate-500 mb-1">Subject</label>
                                  <input 
                                      type="text"
                                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                      placeholder="e.g. Weekly Status Update"
                                      value={newMeeting.title}
                                      onChange={e => setNewMeeting({...newMeeting, title: e.target.value})}
                                  />
                              </div>
                              <div className="md:col-span-2">
                                  <label className="block text-xs font-bold text-slate-500 mb-1">Attendees</label>
                                  <input 
                                      type="text"
                                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                      placeholder="e.g. John Doe, Jane Smith, Stakeholders"
                                      value={newMeeting.attendees}
                                      onChange={e => setNewMeeting({...newMeeting, attendees: e.target.value})}
                                  />
                              </div>
                              <div className="md:col-span-2">
                                  <label className="block text-xs font-bold text-slate-500 mb-1">Minutes / Notes</label>
                                  <textarea 
                                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none h-32 resize-none"
                                      placeholder="Key discussion points, decisions made..."
                                      value={newMeeting.notes}
                                      onChange={e => setNewMeeting({...newMeeting, notes: e.target.value})}
                                  />
                              </div>
                          </div>
                          <div className="flex justify-end">
                              <button 
                                  onClick={saveMeeting}
                                  disabled={!newMeeting.title || !newMeeting.date}
                                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
                              >
                                  Save Entry
                              </button>
                          </div>
                      </div>
                  )}

                  {/* Meeting List */}
                  <div className="space-y-4">
                      {(!project.meetings || project.meetings.length === 0) ? (
                           <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400">
                               <p>No meetings logged yet.</p>
                           </div>
                      ) : (
                          project.meetings.map(meeting => (
                              <div key={meeting.id} className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                                  <div className="flex justify-between items-start mb-3">
                                      <div>
                                          <h4 className="text-lg font-bold text-slate-800">{meeting.title}</h4>
                                          <div className="text-sm text-slate-500 font-medium flex gap-2 mt-1">
                                              <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600">📅 {meeting.date}</span>
                                              {meeting.attendees && <span className="text-slate-400">|</span>}
                                              {meeting.attendees && <span>👥 {meeting.attendees}</span>}
                                          </div>
                                      </div>
                                      <button 
                                          onClick={() => deleteMeeting(meeting.id)}
                                          className="text-slate-300 hover:text-red-500 p-1"
                                          title="Delete Log"
                                      >
                                          ✕
                                      </button>
                                  </div>
                                  <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-700 whitespace-pre-wrap border border-slate-100 leading-relaxed">
                                      {meeting.notes || <span className="italic text-slate-400">No notes recorded.</span>}
                                  </div>
                              </div>
                          ))
                      )}
                  </div>
              </div>
          )}
      </div>
    </div>
  );
};

export default ReportView;