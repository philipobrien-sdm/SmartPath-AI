import React, { useState, useEffect } from 'react';
import { Task, Project, Resource, Deliverable, Risk } from '../types';
import { formatProjectDate } from '../utils/scheduler';

interface TaskModalProps {
  task: Task;
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskId: string, updates: Partial<Task>, actionDescription: string) => void;
}

const TaskModal: React.FC<TaskModalProps> = ({ task, project, isOpen, onClose, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState<Task | null>(null);

  useEffect(() => {
    if (isOpen && task) {
      setEditedTask(JSON.parse(JSON.stringify(task)));
      setIsEditing(false);
    }
  }, [isOpen, task]);

  if (!isOpen || !editedTask) return null;

  const handleSave = () => {
    if (editedTask) {
        // Compare to generate a rough description
        const changes = [];
        if (editedTask.name !== task.name) changes.push('Name');
        if (editedTask.duration !== task.duration) changes.push('Duration');
        if (JSON.stringify(editedTask.resources) !== JSON.stringify(task.resources)) changes.push('Resources');
        
        const actionDesc = changes.length > 0 ? `Updated Task ${task.id}: ${changes.join(', ')}` : `Updated Task ${task.id}`;
        
        onSave(task.id, editedTask, actionDesc);
        setIsEditing(false);
    }
  };

  const addDeliverable = () => {
      setEditedTask(prev => {
          if(!prev) return null;
          return { ...prev, deliverables: [...prev.deliverables, { id: `d${Date.now()}`, name: 'New Deliverable' }] };
      });
  };

  const updateDeliverable = (id: string, field: keyof Deliverable, value: string) => {
      setEditedTask(prev => {
          if(!prev) return null;
          return {
              ...prev,
              deliverables: prev.deliverables.map(d => d.id === id ? { ...d, [field]: value } : d)
          };
      });
  };

  const removeDeliverable = (id: string) => {
      setEditedTask(prev => {
          if(!prev) return null;
          return { ...prev, deliverables: prev.deliverables.filter(d => d.id !== id) };
      });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className={`p-6 border-b border-slate-100 flex justify-between items-center ${isEditing ? 'bg-amber-50' : 'bg-white'}`}>
          <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-sm ${isEditing ? 'bg-amber-500' : 'bg-indigo-600'}`}>
                  {isEditing ? '✎' : 'T'}
              </div>
              <div>
                  <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                      {isEditing ? (
                          <input 
                            className="bg-transparent border-b border-amber-300 focus:border-amber-500 outline-none w-full"
                            value={editedTask.name}
                            onChange={e => setEditedTask({...editedTask, name: e.target.value})}
                          />
                      ) : task.name}
                  </h2>
                  <p className="text-xs text-slate-400 font-mono">ID: {task.id}</p>
              </div>
          </div>
          <div className="flex items-center gap-2">
              {!isEditing ? (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 font-medium text-sm transition-colors"
                  >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                      </svg>
                      Unlock to Edit
                  </button>
              ) : (
                  <>
                    <button 
                        onClick={() => { setIsEditing(false); setEditedTask(task); }}
                        className="px-4 py-2 text-slate-500 hover:text-slate-700 font-medium text-sm"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSave}
                        className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 font-medium text-sm shadow-sm"
                    >
                        Save Changes
                    </button>
                  </>
              )}
              <button onClick={onClose} className="ml-2 text-slate-400 hover:text-red-500 p-2">✕</button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 bg-slate-50/50">
            
            {/* Properties Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Duration</label>
                    {isEditing ? (
                        <div className="flex items-center gap-1">
                            <input 
                                type="number" className="w-full p-1 border rounded text-sm"
                                value={editedTask.duration}
                                onChange={e => setEditedTask({...editedTask, duration: parseInt(e.target.value) || 0})}
                            />
                            <span className="text-xs text-slate-500">days</span>
                        </div>
                    ) : (
                        <div className="font-bold text-slate-700">{task.duration} days</div>
                    )}
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Fixed Cost</label>
                    {isEditing ? (
                        <input 
                            type="number" className="w-full p-1 border rounded text-sm"
                            value={editedTask.fixedCost}
                            onChange={e => setEditedTask({...editedTask, fixedCost: parseFloat(e.target.value) || 0})}
                        />
                    ) : (
                        <div className="font-bold text-slate-700">${task.fixedCost.toLocaleString()}</div>
                    )}
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200 col-span-2">
                    <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Manual Completion Date</label>
                    {isEditing ? (
                         <input 
                            type="date" className="w-full p-1 border rounded text-sm"
                            value={editedTask.actualEndDate || ''}
                            onChange={e => setEditedTask({...editedTask, actualEndDate: e.target.value})}
                        />
                    ) : (
                        <div className={`font-bold ${task.actualEndDate ? 'text-green-600' : 'text-slate-400 italic'}`}>
                            {task.actualEndDate || 'Not manually set'}
                        </div>
                    )}
                </div>
            </div>

            {/* CPM Scheduling Details */}
            {!isEditing && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-bold text-indigo-900 text-sm flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-indigo-600">
                                <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" clipRule="evenodd" />
                            </svg>
                            CPM Scheduling Details
                        </h3>
                        {task.isCritical && (
                            <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded border border-red-200">Critical Path</span>
                        )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                            <div className="text-[10px] uppercase text-indigo-400 font-bold mb-1">Earliest Start</div>
                            <div className="font-mono text-indigo-800 font-semibold">{formatProjectDate(project.startDate, task.earlyStart)}</div>
                        </div>
                        <div>
                            <div className="text-[10px] uppercase text-indigo-400 font-bold mb-1">Earliest Finish</div>
                            <div className="font-mono text-indigo-800 font-semibold">{formatProjectDate(project.startDate, task.earlyFinish)}</div>
                        </div>
                        <div>
                            <div className="text-[10px] uppercase text-slate-400 font-bold mb-1">Late Start</div>
                            <div className="font-mono text-slate-600">{formatProjectDate(project.startDate, task.lateStart)}</div>
                        </div>
                        <div>
                            <div className="text-[10px] uppercase text-slate-400 font-bold mb-1">Late Finish</div>
                            <div className="font-mono text-slate-600">{formatProjectDate(project.startDate, task.lateFinish)}</div>
                        </div>
                    </div>
                    {task.slack > 0 && (
                        <div className="mt-3 pt-3 border-t border-indigo-200/50 text-xs text-indigo-700">
                            <strong>Slack Available:</strong> {task.slack} days can be delayed without impacting the project deadline.
                        </div>
                    )}
                </div>
            )}

            {/* Deliverables */}
            <div className="bg-white p-4 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-slate-700">Deliverables</h3>
                    {isEditing && <button onClick={addDeliverable} className="text-xs text-indigo-600 font-medium">+ Add</button>}
                </div>
                <div className="space-y-2">
                    {editedTask.deliverables.length === 0 && <div className="text-sm text-slate-400 italic">No deliverables defined.</div>}
                    {editedTask.deliverables.map((del, idx) => (
                        <div key={del.id} className="flex gap-2 items-center text-sm">
                            <span className="text-slate-300 font-mono text-xs">{idx + 1}.</span>
                            {isEditing ? (
                                <>
                                    <input 
                                        className="flex-1 p-1.5 border border-slate-200 rounded text-sm"
                                        placeholder="Name"
                                        value={del.name}
                                        onChange={e => updateDeliverable(del.id, 'name', e.target.value)}
                                    />
                                    <input 
                                        className="flex-1 p-1.5 border border-slate-200 rounded text-sm text-blue-600"
                                        placeholder="URL (http://...)"
                                        value={del.url || ''}
                                        onChange={e => updateDeliverable(del.id, 'url', e.target.value)}
                                    />
                                    <button onClick={() => removeDeliverable(del.id)} className="text-red-400 hover:text-red-600 px-1">×</button>
                                </>
                            ) : (
                                <div className="flex-1 flex justify-between items-center bg-slate-50 p-2 rounded border border-slate-100">
                                    <span className="font-medium text-slate-700">{del.name}</span>
                                    {del.url ? (
                                        <a href={del.url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
                                            View Doc ↗
                                        </a>
                                    ) : (
                                        <span className="text-xs text-slate-400">Pending Upload</span>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Notes */}
            <div className="bg-white p-4 rounded-xl border border-slate-200">
                <h3 className="font-bold text-slate-700 mb-2">Notes</h3>
                {isEditing ? (
                    <textarea 
                        className="w-full p-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        rows={3}
                        value={editedTask.notes}
                        onChange={e => setEditedTask({...editedTask, notes: e.target.value})}
                    />
                ) : (
                    <p className="text-sm text-slate-600 whitespace-pre-wrap">{task.notes || <span className="italic text-slate-400">No notes.</span>}</p>
                )}
            </div>

            {/* Resources (Read Only in Modal for brevity, full edit in Sidebar) */}
             <div className="bg-white p-4 rounded-xl border border-slate-200">
                <h3 className="font-bold text-slate-700 mb-2">Assigned Resources</h3>
                <div className="flex flex-wrap gap-2">
                    {editedTask.resources.length === 0 && <span className="text-sm text-slate-400 italic">No resources assigned.</span>}
                    {editedTask.resources.map(r => {
                        const resName = project.resources.find(res => res.id === r.resourceId)?.name || 'Unknown';
                        return (
                            <span key={r.resourceId} className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-xs font-medium border border-indigo-100">
                                {resName} ({r.percentage}%)
                            </span>
                        )
                    })}
                </div>
                {isEditing && <p className="text-[10px] text-slate-400 mt-2 italic">* Edit resource allocation details in the main editor sidebar.</p>}
            </div>

        </div>
      </div>
    </div>
  );
};

export default TaskModal;