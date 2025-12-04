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
  owner?: string;
  status?: 'OPEN' | 'WATCHING' | 'MITIGATED' | 'CLOSED';
}

export interface ResourceAllocation {
  resourceId: string;
  percentage: number; // 0-100+
}

export interface ActionItem {
  id: string;
  description: string;
  isCompleted: boolean;
}

export interface Meeting {
  id: string;
  date: string;
  title: string;
  attendees: string;
  notes: string;
}

export interface ProjectCharter {
  overview: string;
  sponsor: string;
  manager: string;
  goals: string[];
  scopeIn: string[];
  scopeOut: string[];
  stakeholders: string[];
  successCriteria: string[];
  assumptions: string[];
  constraints: string[];
}

export interface Task {
  id: string;
  name: string;
  duration: number; // in days
  predecessors: string[]; // IDs of parent tasks
  resources: ResourceAllocation[];
  risks: Risk[];
  fixedCost: number; // Additional fixed costs separate from resources
  actions: ActionItem[];
  notes: string;
  
  // Calculated fields (CPM)
  earlyStart: number;
  earlyFinish: number;
  lateStart: number;
  lateFinish: number;
  slack: number;
  isCritical: boolean;
}

export interface BudgetEntry {
  id: string;
  date: string;
  amount: number;
  reason: string;
}

export interface AIQueryEntry {
  id: string;
  date: string;
  category: 'OPTIMIZATION' | 'RISK' | 'MEETING' | 'CHARTER' | 'GENERAL';
  prompt: string;
  response: string;
}

export interface Project {
  id: string;
  name: string;
  startDate: string;
  budget: number;
  budgetHistory?: BudgetEntry[];
  aiQueryLog?: AIQueryEntry[];
  resources: Resource[];
  tasks: Task[];
  meetings: Meeting[];
  charter?: ProjectCharter;
}

export type ViewMode = 'PERT' | 'GANTT' | 'EDITOR' | 'REPORT' | 'CHARTER';
export type OverlayMode = 'NONE' | 'RISK' | 'RESOURCE' | 'COST';

export interface ThemeConfig {
  taskDefault: string;
  taskCritical: string;
  riskHigh: string;
  riskMedium: string;
  riskLow: string;
  resourceOverload: string;
  resourceNormal: string;
  linkDefault: string;
  linkCritical: string;
}