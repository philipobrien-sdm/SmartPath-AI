import React, { useState } from 'react';
import { Project, ProjectCharter } from '../types';

interface CharterViewProps {
  project: Project;
  setProject: React.Dispatch<React.SetStateAction<Project>>;
  aiEnabled?: boolean;
  onAskAI?: (category: 'OPTIMIZATION' | 'RISK' | 'MEETING' | 'CHARTER' | 'GENERAL', context?: string) => void;
}

const CharterView: React.FC<CharterViewProps> = ({ project, setProject, aiEnabled, onAskAI }) => {
  
  // Ensure charter exists
  const charter = project.charter || {
    overview: '',
    sponsor: '',
    manager: '',
    goals: [],
    scopeIn: [],
    scopeOut: [],
    stakeholders: [],
    successCriteria: [],
    assumptions: [],
    constraints: []
  };

  const updateCharter = (updates: Partial<ProjectCharter>) => {
      setProject(prev => ({
          ...prev,
          charter: { ...charter, ...updates }
      }));
  };

  // Helper for array list editing
  const ListEditor = ({ title, items, fieldKey }: { title: string, items: string[], fieldKey: keyof ProjectCharter }) => {
      const [newItem, setNewItem] = useState('');
      const [editingIndex, setEditingIndex] = useState<number | null>(null);
      const [editingText, setEditingText] = useState('');

      const add = () => {
          if(!newItem.trim()) return;
          updateCharter({ [fieldKey]: [...items, newItem] });
          setNewItem('');
      };

      const remove = (idx: number) => {
          const newItems = items.filter((_, i) => i !== idx);
          updateCharter({ [fieldKey]: newItems });
      };

      const startEdit = (index: number, text: string) => {
          setEditingIndex(index);
          setEditingText(text);
      };

      const saveEdit = (index: number) => {
          if (!editingText.trim()) return;
          const newItems = [...items];
          newItems[index] = editingText;
          updateCharter({ [fieldKey]: newItems });
          setEditingIndex(null);
          setEditingText('');
      };

      const cancelEdit = () => {
          setEditingIndex(null);
          setEditingText('');
      };

      return (
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 h-full flex flex-col">
              <h4 className="text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">{title}</h4>
              <ul className="space-y-2 mb-3 flex-1">
                  {items.length === 0 && <li className="text-xs text-slate-400 italic">No items defined</li>}
                  {items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-700 group min-h-[28px]">
                          {editingIndex === i ? (
                              <div className="flex-1 flex gap-2 animate-in fade-in duration-200">
                                  <input 
                                    autoFocus
                                    className="flex-1 px-2 py-1 border border-indigo-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                                    value={editingText}
                                    onChange={(e) => setEditingText(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') saveEdit(i);
                                        if (e.key === 'Escape') cancelEdit();
                                    }}
                                  />
                                  <button onClick={() => saveEdit(i)} className="text-green-600 hover:text-green-700 px-1">✓</button>
                                  <button onClick={cancelEdit} className="text-slate-400 hover:text-slate-600 px-1">✕</button>
                              </div>
                          ) : (
                              <>
                                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0"></span>
                                <span 
                                    onClick={() => startEdit(i, item)}
                                    className="flex-1 cursor-pointer hover:text-indigo-900 border border-transparent hover:border-slate-100 rounded px-1 py-0.5 transition-all"
                                    title="Click to edit"
                                >
                                    {item}
                                </span>
                                <button onClick={() => remove(i)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity px-1">×</button>
                              </>
                          )}
                      </li>
                  ))}
              </ul>
              <div className="flex gap-2 pt-2 border-t border-slate-200">
                  <input 
                      className="flex-1 text-sm border border-slate-200 rounded px-2 py-1 outline-none focus:border-indigo-400"
                      placeholder="Add item..."
                      value={newItem}
                      onChange={e => setNewItem(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && add()}
                  />
                  <button onClick={add} className="text-sm bg-white border border-slate-200 text-indigo-600 px-3 py-1 rounded hover:bg-slate-50">Add</button>
              </div>
          </div>
      );
  };

  return (
    <div className="w-full h-full bg-slate-100 p-6 overflow-y-auto relative">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            
            {/* Header */}
            <div className="bg-slate-800 text-white p-8 relative">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="text-indigo-300 font-bold tracking-widest text-xs uppercase mb-1">Project Charter</div>
                        <h1 className="text-3xl font-bold">{project.name}</h1>
                        <p className="text-slate-400 mt-1 text-sm">ID: {project.id} | Start: {project.startDate}</p>
                    </div>
                    <div className="text-right">
                         <div className="text-xs text-slate-400 uppercase tracking-widest mb-1">Total Budget</div>
                         <div className="text-2xl font-mono font-bold">${project.budget.toLocaleString()}</div>
                    </div>
                </div>

                {/* AI Review Button */}
                {aiEnabled && (
                    <div className="absolute top-8 right-1/3 mr-12">
                         <button 
                            onClick={() => onAskAI?.('CHARTER')}
                            className="bg-indigo-600/50 hover:bg-indigo-600 text-white border border-indigo-400 px-3 py-1.5 rounded-lg shadow-sm text-xs font-bold transition-all flex items-center gap-1 backdrop-blur-sm"
                        >
                            ✨ AI Review
                        </button>
                    </div>
                )}
            </div>

            <div className="p-8 space-y-8">
                
                {/* Executive Summary */}
                <section>
                    <h3 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">1. Executive Summary</h3>
                    <textarea 
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-sm leading-relaxed focus:ring-2 focus:ring-indigo-100 outline-none resize-none"
                        rows={4}
                        placeholder="Brief overview of the project purpose and business case..."
                        value={charter.overview}
                        onChange={(e) => updateCharter({ overview: e.target.value })}
                    />
                </section>

                {/* Roles */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Project Sponsor</label>
                        <input 
                            className="w-full p-2 border-b-2 border-slate-100 focus:border-indigo-500 outline-none font-medium text-slate-800 transition-colors"
                            placeholder="Name / Title"
                            value={charter.sponsor}
                            onChange={(e) => updateCharter({ sponsor: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Project Manager</label>
                        <input 
                            className="w-full p-2 border-b-2 border-slate-100 focus:border-indigo-500 outline-none font-medium text-slate-800 transition-colors"
                            placeholder="Name"
                            value={charter.manager}
                            onChange={(e) => updateCharter({ manager: e.target.value })}
                        />
                    </div>
                </section>

                {/* Goals & Success */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ListEditor title="Project Goals & Objectives" items={charter.goals} fieldKey="goals" />
                    <ListEditor title="Success Criteria" items={charter.successCriteria} fieldKey="successCriteria" />
                </section>

                {/* Scope */}
                <section>
                    <h3 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">4. Project Scope</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="border-l-4 border-green-400 pl-4">
                             <ListEditor title="In Scope" items={charter.scopeIn} fieldKey="scopeIn" />
                        </div>
                        <div className="border-l-4 border-red-300 pl-4">
                             <ListEditor title="Out of Scope" items={charter.scopeOut} fieldKey="scopeOut" />
                        </div>
                    </div>
                </section>

                {/* Stakeholders */}
                <section>
                    <ListEditor title="Key Stakeholders" items={charter.stakeholders} fieldKey="stakeholders" />
                </section>

                {/* Assumptions & Constraints */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ListEditor title="Assumptions" items={charter.assumptions} fieldKey="assumptions" />
                    <ListEditor title="Constraints" items={charter.constraints} fieldKey="constraints" />
                </section>

            </div>
            
            <div className="bg-slate-50 p-4 border-t border-slate-200 text-center text-xs text-slate-400">
                Project Charter v1.0 • Generated by SmartPath AI
            </div>

        </div>
    </div>
  );
};

export default CharterView;