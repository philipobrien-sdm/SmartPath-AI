import React, { useState } from 'react';
import { Project, Task, Resource, Risk, ActionItem, BudgetEntry } from '../types';

interface EditorProps {
  project: Project;
  setProject: React.Dispatch<React.SetStateAction<Project>>;
}

const Editor: React.FC<EditorProps> = ({ project, setProject }) => {
  const [activeTab, setActiveTab] = useState<'TASKS' | 'RESOURCES'>('TASKS');
  const [newActionText, setNewActionText] = useState<{[key: string]: string}>({});
  
  // Budget State
  const [newBudgetAmount, setNewBudgetAmount] = useState<string>('');
  const [budgetReason, setBudgetReason] = useState<string>('');

  const addTask = () => {
    const newTask: Task = {
      id: `t${Date.now()}`,
      name: 'New Task',
      duration: 1,
      predecessors: [],
      resources: [],
      risks: [],
      actions: [],
      notes: '',
      fixedCost: 0,
      earlyStart: 0, earlyFinish: 0, lateStart: 0, lateFinish: 0, slack: 0, isCritical: false
    };
    setProject(prev => ({ ...prev, tasks: [...prev.tasks, newTask] }));
  };

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    setProject(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t)
    }));
  };

  const updateResourceAlloc = (taskId: string, resourceId: string, percentage: number) => {
    setProject(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => {
        if (t.id !== taskId) return t;
        const exists = t.resources.find(r => r.resourceId === resourceId);
        let newResources;
        if (exists) {
            newResources = t.resources.map(r => r.resourceId === resourceId ? { ...r, percentage } : r);
        } else {
            newResources = [...t.resources, { resourceId, percentage }];
        }
        return { ...t, resources: newResources.filter(r => r.percentage > 0) };
      })
    }));
  };

  const addRisk = (taskId: string) => {
      const newRisk: Risk = {
          id: `r${Date.now()}`,
          description: 'New Risk',
          probability: 3,
          impact: 3,
          mitigation: '',
          owner: '',
          status: 'OPEN'
      };
      setProject(prev => ({
          ...prev,
          tasks: prev.tasks.map(t => t.id === taskId ? { ...t, risks: [...t.risks, newRisk] } : t)
      }));
  };

  const updateRisk = (taskId: string, riskId: string, updates: Partial<Risk>) => {
    setProject(prev => ({
        ...prev,
        tasks: prev.tasks.map(t => {
            if (t.id !== taskId) return t;
            return {
                ...t,
                risks: t.risks.map(r => r.id === riskId ? { ...r, ...updates } : r)
            };
        })
    }));
  };

  const addAction = (taskId: string) => {
      const text = newActionText[taskId];
      if (!text?.trim()) return;

      const newAction: ActionItem = {
          id: `act${Date.now()}`,
          description: text,
          isCompleted: false
      };

      setProject(prev => ({
          ...prev,
          tasks: prev.tasks.map(t => t.id === taskId ? { ...t, actions: [...(t.actions || []), newAction] } : t)
      }));
      setNewActionText(prev => ({...prev, [taskId]: ''}));
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

  const deleteAction = (taskId: string, actionId: string) => {
      setProject(prev => ({
          ...prev,
          tasks: prev.tasks.map(t => {
              if (t.id !== taskId) return t;
              return {
                  ...t,
                  actions: t.actions.filter(a => a.id !== actionId)
              };
          })
      }));
  };

  const handleUpdateBudget = () => {
      const amount = parseFloat(newBudgetAmount);
      if (isNaN(amount) || !budgetReason.trim()) {
          alert("Please enter a valid amount and a reason for the budget change.");
          return;
      }

      const entry: BudgetEntry = {
          id: `b${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          amount: amount,
          reason: budgetReason
      };

      setProject(prev => ({
          ...prev,
          budget: amount,
          budgetHistory: [entry, ...(prev.budgetHistory || [])]
      }));

      setNewBudgetAmount('');
      setBudgetReason('');
  };

  return (
    <div className="p-4 bg-white rounded-xl shadow-sm border border-slate-200 h-full overflow-hidden flex flex-col">
      <div className="flex space-x-4 border-b border-slate-100 pb-2 mb-4">
        <button 
            onClick={() => setActiveTab('TASKS')}
            className={`pb-1 font-medium ${activeTab === 'TASKS' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`}>
            Tasks
        </button>
        <button 
            onClick={() => setActiveTab('RESOURCES')}
            className={`pb-1 font-medium ${activeTab === 'RESOURCES' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`}>
            Resources & Budget
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-4">
        {activeTab === 'TASKS' && (
            <>
              {project.tasks.map(task => (
                <div key={task.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                  <div className="flex justify-between mb-2">
                    <input 
                      className="font-bold bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 outline-none w-full mr-2"
                      value={task.name}
                      onChange={(e) => updateTask(task.id, { name: e.target.value })}
                    />
                    <button 
                        onClick={() => setProject(p => ({ ...p, tasks: p.tasks.filter(t => t.id !== task.id) }))}
                        className="text-red-400 hover:text-red-600 text-xs whitespace-nowrap">
                        Remove
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-xs text-slate-500">Duration (Days)</label>
                        <input 
                            type="number" min="1"
                            className="w-full mt-1 p-1 text-sm border rounded"
                            value={task.duration}
                            onChange={(e) => updateTask(task.id, { duration: parseInt(e.target.value) || 1 })}
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-slate-500">Fixed Node Cost ($)</label>
                        <input 
                            type="number" min="0"
                            className="w-full mt-1 p-1 text-sm border rounded"
                            placeholder="e.g. 500"
                            value={task.fixedCost}
                            onChange={(e) => updateTask(task.id, { fixedCost: parseFloat(e.target.value) || 0 })}
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-xs text-slate-500">Predecessors (IDs)</label>
                        <input 
                            type="text"
                            placeholder="e.g. t1, t2"
                            className="w-full mt-1 p-1 text-sm border rounded"
                            value={task.predecessors.join(', ')}
                            onChange={(e) => updateTask(task.id, { predecessors: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                        />
                         <div className="text-[10px] text-slate-400 mt-1">ID: {task.id}</div>
                    </div>
                  </div>

                  {/* Actions & Notes Section */}
                  <div className="mb-4 bg-white p-2 rounded border border-slate-100">
                      <label className="block text-xs text-slate-500 font-bold mb-2 uppercase">Actions & Notes</label>
                      
                      {/* Notes */}
                      <textarea
                          className="w-full text-xs p-2 border border-slate-200 rounded mb-3 focus:outline-none focus:border-indigo-400"
                          placeholder="Add meeting notes, details, or ideas..."
                          rows={2}
                          value={task.notes || ''}
                          onChange={(e) => updateTask(task.id, { notes: e.target.value })}
                      />

                      {/* Actions List */}
                      <div className="space-y-1 mb-2">
                          {(task.actions || []).map(action => (
                              <div key={action.id} className="flex items-center gap-2 group">
                                  <input 
                                    type="checkbox" 
                                    checked={action.isCompleted} 
                                    onChange={() => toggleAction(task.id, action.id)}
                                    className="rounded text-indigo-600 focus:ring-indigo-500 h-3 w-3"
                                  />
                                  <span className={`text-xs flex-1 truncate ${action.isCompleted ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                                      {action.description}
                                  </span>
                                  <button onClick={() => deleteAction(task.id, action.id)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500">×</button>
                              </div>
                          ))}
                      </div>

                      {/* Add Action */}
                      <div className="flex gap-2">
                          <input 
                            className="flex-1 text-xs border border-slate-200 rounded px-2 py-1"
                            placeholder="New action item..."
                            value={newActionText[task.id] || ''}
                            onChange={(e) => setNewActionText(prev => ({...prev, [task.id]: e.target.value}))}
                            onKeyDown={(e) => e.key === 'Enter' && addAction(task.id)}
                          />
                          <button 
                            onClick={() => addAction(task.id)}
                            className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded hover:bg-indigo-100">
                            Add
                          </button>
                      </div>
                  </div>

                  {/* Resource Alloc */}
                  <div className="mb-4">
                      <label className="block text-xs text-slate-500 font-bold mb-1">Resource Allocation</label>
                      <div className="space-y-1">
                          {project.resources.map(res => {
                              const alloc = task.resources.find(r => r.resourceId === res.id);
                              return (
                                  <div key={res.id} className="flex items-center justify-between text-sm">
                                      <span className="text-slate-600">{res.name} <span className="text-xs text-slate-400">(${res.hourlyRate}/hr)</span></span>
                                      <input 
                                        type="number" placeholder="%"
                                        className="w-20 p-1 border rounded text-right"
                                        value={alloc?.percentage || ''}
                                        onChange={(e) => updateResourceAlloc(task.id, res.id, parseInt(e.target.value) || 0)}
                                      />
                                  </div>
                              )
                          })}
                      </div>
                  </div>

                  {/* Risks */}
                  <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-xs text-slate-500 font-bold">Risks</label>
                        <button onClick={() => addRisk(task.id)} className="text-[10px] text-indigo-600">+ Add Risk</button>
                      </div>
                      {task.risks.map(risk => (
                          <div key={risk.id} className="bg-white p-2 rounded border border-slate-100 mb-2 text-xs">
                              <input 
                                className="w-full mb-1 border-b border-slate-100 pb-1"
                                placeholder="Risk Description"
                                value={risk.description}
                                onChange={(e) => updateRisk(task.id, risk.id, { description: e.target.value })}
                              />
                              <div className="flex gap-2 mb-1">
                                  <select 
                                    className="border rounded p-0.5"
                                    value={risk.probability}
                                    onChange={(e) => updateRisk(task.id, risk.id, { probability: parseInt(e.target.value) })}
                                  >
                                      {[1,2,3,4,5].map(n => <option key={n} value={n}>Prob: {n}</option>)}
                                  </select>
                                  <select 
                                    className="border rounded p-0.5"
                                    value={risk.impact}
                                    onChange={(e) => updateRisk(task.id, risk.id, { impact: parseInt(e.target.value) })}
                                  >
                                      {[1,2,3,4,5].map(n => <option key={n} value={n}>Imp: {n}</option>)}
                                  </select>
                                   <select 
                                    className="border rounded p-0.5 max-w-[80px]"
                                    value={risk.status || 'OPEN'}
                                    onChange={(e) => updateRisk(task.id, risk.id, { status: e.target.value as any })}
                                  >
                                      <option value="OPEN">Open</option>
                                      <option value="WATCHING">Watch</option>
                                      <option value="MITIGATED">Mitig</option>
                                      <option value="CLOSED">Closed</option>
                                  </select>
                              </div>
                              <input 
                                className="w-full text-slate-500 italic mb-1"
                                placeholder="Mitigation..."
                                value={risk.mitigation}
                                onChange={(e) => updateRisk(task.id, risk.id, { mitigation: e.target.value })}
                              />
                              <input 
                                className="w-full text-slate-400"
                                placeholder="Owner (e.g. Alice)"
                                value={risk.owner || ''}
                                onChange={(e) => updateRisk(task.id, risk.id, { owner: e.target.value })}
                              />
                          </div>
                      ))}
                  </div>

                </div>
              ))}
              <button 
                onClick={addTask}
                className="w-full py-2 border-2 border-dashed border-slate-300 text-slate-500 rounded-lg hover:border-indigo-500 hover:text-indigo-600 transition-colors">
                + Add New Task
              </button>
            </>
        )}

        {activeTab === 'RESOURCES' && (
            <div className="space-y-6">
                
                {/* Budget Management */}
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Project Budget Management</label>
                    
                    <div className="text-2xl font-bold text-indigo-600 mb-4">${project.budget.toLocaleString()}</div>
                    
                    <div className="space-y-2 mb-4">
                        <input 
                            type="number"
                            placeholder="New Budget Amount"
                            className="w-full p-2 border rounded text-sm"
                            value={newBudgetAmount}
                            onChange={(e) => setNewBudgetAmount(e.target.value)}
                        />
                        <textarea 
                            placeholder="Reason for change (Required)"
                            className="w-full p-2 border rounded text-sm resize-none"
                            rows={2}
                            value={budgetReason}
                            onChange={(e) => setBudgetReason(e.target.value)}
                        />
                        <button 
                            onClick={handleUpdateBudget}
                            disabled={!newBudgetAmount || !budgetReason}
                            className="w-full bg-indigo-600 text-white py-2 rounded text-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                            Update Budget
                        </button>
                    </div>

                    {/* History */}
                    {project.budgetHistory && project.budgetHistory.length > 0 && (
                        <div>
                            <div className="text-xs font-bold text-slate-500 uppercase mb-2">Change Log</div>
                            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                                {project.budgetHistory.map(entry => (
                                    <div key={entry.id} className="bg-white p-2 rounded border border-slate-100 text-xs">
                                        <div className="flex justify-between font-bold text-slate-700">
                                            <span>${entry.amount.toLocaleString()}</span>
                                            <span className="text-slate-400">{entry.date}</span>
                                        </div>
                                        <div className="text-slate-500 mt-1">{entry.reason}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                
                {/* Resource Management */}
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-slate-700">Resource Rates</label>
                        <button 
                            onClick={() => setProject(p => ({
                                ...p, 
                                resources: [...p.resources, { id: `res${Date.now()}`, name: 'New Resource', hourlyRate: 50 }]
                            }))}
                            className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded hover:bg-indigo-100">
                            + Add Resource
                        </button>
                    </div>
                    {project.resources.map(res => (
                        <div key={res.id} className="flex gap-2 mb-2 items-center">
                            <input 
                                className="flex-1 p-2 border rounded text-sm"
                                value={res.name}
                                onChange={(e) => setProject(p => ({
                                    ...p,
                                    resources: p.resources.map(r => r.id === res.id ? { ...r, name: e.target.value } : r)
                                }))}
                            />
                            <div className="relative w-24">
                                <span className="absolute left-2 top-2 text-slate-400 text-xs">$</span>
                                <input 
                                    className="w-full p-2 pl-4 border rounded text-sm"
                                    type="number"
                                    title="Hourly Rate"
                                    value={res.hourlyRate}
                                    onChange={(e) => setProject(p => ({
                                        ...p,
                                        resources: p.resources.map(r => r.id === res.id ? { ...r, hourlyRate: parseInt(e.target.value) || 0 } : r)
                                    }))}
                                />
                                <span className="absolute right-2 top-2 text-slate-400 text-xs">/hr</span>
                            </div>
                            <button 
                                onClick={() => setProject(p => ({ ...p, resources: p.resources.filter(r => r.id !== res.id) }))}
                                className="text-slate-400 hover:text-red-500">
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default Editor;