export interface Resource {
  id: string;
  name: string;
  hourlyRate: number;
}

export interface Risk {
  id: string;
  description: string;
  probability: number; // 1-5
  impact: number; // 1-5
  mitigation: string;
}

export interface ResourceAllocation {
  resourceId: string;
  percentage: number; // 0-100+
}

export interface Task {
  id: string;
  name: string;
  duration: number; // in days
  predecessors: string[]; // IDs of parent tasks
  resources: ResourceAllocation[];
  risks: Risk[];
  fixedCost: number; // Additional fixed costs separate from resources
  
  // Calculated fields (CPM)
  earlyStart: number;
  earlyFinish: number;
  lateStart: number;
  lateFinish: number;
  slack: number;
  isCritical: boolean;
}

export interface Project {
  id: string;
  name: string;
  startDate: string;
  budget: number;
  resources: Resource[];
  tasks: Task[];
}

export type ViewMode = 'PERT' | 'GANTT' | 'EDITOR';
export type OverlayMode = 'NONE' | 'RISK' | 'RESOURCE' | 'COST';
