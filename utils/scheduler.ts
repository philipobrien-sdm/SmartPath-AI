import { Task, Project, Resource } from '../types';

export const calculateCPM = (tasks: Task[]): Task[] => {
  if (tasks.length === 0) return [];

  // Create a map for easy lookup
  const taskMap = new Map<string, Task>();
  // Deep copy to avoid mutating state directly during calculation
  const calculatedTasks = tasks.map(t => ({ ...t }));
  calculatedTasks.forEach(t => taskMap.set(t.id, t));

  // 1. Topological Sort (Simplified: we iterate enough times or use a dependency check)
  // For CPM, we can just do a Forward Pass using dependency resolution.
  
  // Forward Pass: Calculate Early Start (ES) and Early Finish (EF)
  let changed = true;
  let iterations = 0;
  while (changed && iterations < tasks.length + 2) {
    changed = false;
    iterations++;
    calculatedTasks.forEach(task => {
      let maxPredEF = 0;
      task.predecessors.forEach(predId => {
        const pred = taskMap.get(predId);
        if (pred && pred.earlyFinish > maxPredEF) {
          maxPredEF = pred.earlyFinish;
        }
      });

      const newES = maxPredEF;
      const newEF = newES + task.duration;

      if (task.earlyStart !== newES || task.earlyFinish !== newEF) {
        task.earlyStart = newES;
        task.earlyFinish = newEF;
        changed = true;
      }
    });
  }

  // Project Duration
  const projectDuration = Math.max(...calculatedTasks.map(t => t.earlyFinish), 0);

  // Backward Pass: Calculate Late Start (LS) and Late Finish (LF)
  // Initialize all LF to project duration (or max possible)
  calculatedTasks.forEach(task => {
    task.lateFinish = projectDuration;
    task.lateStart = projectDuration - task.duration;
  });

  // Iterate backwards (or just repeat untill stable like forward pass but reverse logic)
  changed = true;
  iterations = 0;
  while (changed && iterations < tasks.length + 2) {
    changed = false;
    iterations++;
    calculatedTasks.forEach(task => {
      // Find successors
      const successors = calculatedTasks.filter(t => t.predecessors.includes(task.id));
      
      let minSuccLS = projectDuration;
      if (successors.length > 0) {
        minSuccLS = Math.min(...successors.map(s => s.lateStart));
      }

      const newLF = minSuccLS;
      const newLS = newLF - task.duration;

      if (task.lateFinish !== newLF || task.lateStart !== newLS) {
        task.lateFinish = newLF;
        task.lateStart = newLS;
        changed = true;
      }
    });
  }

  // Calculate Slack and Criticality
  calculatedTasks.forEach(task => {
    task.slack = task.lateStart - task.earlyStart;
    // Floating point tolerance could be needed, but integer days usually fine
    task.isCritical = task.slack <= 0; 
  });

  return calculatedTasks;
};

export const calculateProjectCost = (project: Project): number => {
  return project.tasks.reduce((total, task) => {
    const resourceCost = task.resources.reduce((tRes, alloc) => {
      const res = project.resources.find(r => r.id === alloc.resourceId);
      if (!res) return tRes;
      // Cost = (Duration days * 8 hours) * (Percentage / 100) * Hourly Rate
      const hours = task.duration * 8;
      const effectiveHours = hours * (alloc.percentage / 100);
      return tRes + (effectiveHours * res.hourlyRate);
    }, 0);
    return total + task.fixedCost + resourceCost;
  }, 0);
};

export const calculateTaskCost = (task: Task, resources: Resource[]): number => {
    const resourceCost = task.resources.reduce((tRes, alloc) => {
      const res = resources.find(r => r.id === alloc.resourceId);
      if (!res) return tRes;
      const hours = task.duration * 8;
      const effectiveHours = hours * (alloc.percentage / 100);
      return tRes + (effectiveHours * res.hourlyRate);
    }, 0);
    return resourceCost + task.fixedCost;
};

export const getRiskScore = (task: Task): number => {
  // Max risk score for a single task (simplest metric)
  if (task.risks.length === 0) return 0;
  return Math.max(...task.risks.map(r => r.probability * r.impact));
};

export const getDailyResourceUsage = (project: Project, day: number, resourceId: string): number => {
  let totalPercent = 0;
  project.tasks.forEach(task => {
    // Check if task is active on this day
    if (day >= task.earlyStart && day < task.earlyFinish) {
      const alloc = task.resources.find(r => r.resourceId === resourceId);
      if (alloc) {
        totalPercent += alloc.percentage;
      }
    }
  });
  return totalPercent;
};

// --- Completion & Status Logic ---

export const isTaskComplete = (task: Task): boolean => {
  // If task has no deliverables, it relies on manual `actualEndDate` for completeness
  if (task.deliverables.length === 0) {
      return !!task.actualEndDate;
  }
  // If task has deliverables, ALL must have a URL (be submitted)
  return task.deliverables.every(d => d.url && d.url.trim().length > 0);
};

export const getTaskStatusColor = (task: Task, projectStartDate: string, theme: any): string => {
    const isComplete = isTaskComplete(task);
    
    if (isComplete) return '#10b981'; // green-500

    // Check for Overdue
    // Calculate expected finish date
    const start = new Date(projectStartDate);
    const expectedFinish = new Date(start);
    expectedFinish.setDate(start.getDate() + task.earlyFinish);
    
    const today = new Date();
    // Reset times to compare dates only
    today.setHours(0,0,0,0);
    expectedFinish.setHours(0,0,0,0);

    if (today > expectedFinish) {
        // Overdue and not complete
        return 'OVERDUE_PATTERN'; // Handled in renderers
    }

    return task.isCritical ? theme.taskCritical : theme.taskDefault;
};

export const isTaskOverdue = (task: Task, projectStartDate: string): boolean => {
    if (isTaskComplete(task)) return false;

    const start = new Date(projectStartDate);
    const expectedFinish = new Date(start);
    expectedFinish.setDate(start.getDate() + task.earlyFinish);
    
    const today = new Date();
    today.setHours(0,0,0,0);
    expectedFinish.setHours(0,0,0,0);

    return today > expectedFinish;
};