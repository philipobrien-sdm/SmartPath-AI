import { Project } from '../types';

export const SAMPLE_PROJECT: Project = {
  id: 'demo-project',
  name: 'Cloud Migration & App Modernization',
  startDate: new Date().toISOString().split('T')[0],
  budget: 150000,
  resources: [
    { id: 'r1', name: 'Senior Architect', hourlyRate: 150 },
    { id: 'r2', name: 'DevOps Lead', hourlyRate: 120 },
    { id: 'r3', name: 'Full Stack Dev 1', hourlyRate: 90 },
    { id: 'r4', name: 'Full Stack Dev 2', hourlyRate: 90 },
    { id: 'r5', name: 'QA Engineer', hourlyRate: 75 },
    { id: 'r6', name: 'Project Manager', hourlyRate: 100 }
  ],
  tasks: [
    {
      id: 't1',
      name: 'Requirement Analysis',
      duration: 5,
      predecessors: [],
      resources: [
        { resourceId: 'r1', percentage: 50 },
        { resourceId: 'r6', percentage: 100 }
      ],
      risks: [],
      fixedCost: 0,
      earlyStart: 0, earlyFinish: 0, lateStart: 0, lateFinish: 0, slack: 0, isCritical: false
    },
    {
      id: 't2',
      name: 'System Architecture Design',
      duration: 10,
      predecessors: ['t1'],
      resources: [
        { resourceId: 'r1', percentage: 100 }, // High load
        { resourceId: 'r2', percentage: 50 }
      ],
      risks: [
        { id: 'risk1', description: 'Architecture complexity underestimated', probability: 4, impact: 5, mitigation: 'Review with external consultant' }
      ],
      fixedCost: 0,
      earlyStart: 0, earlyFinish: 0, lateStart: 0, lateFinish: 0, slack: 0, isCritical: false
    },
    {
      id: 't3',
      name: 'Setup Cloud Infrastructure',
      duration: 8,
      predecessors: ['t2'],
      resources: [
        { resourceId: 'r2', percentage: 100 }
      ],
      risks: [],
      fixedCost: 5000, // Server costs
      earlyStart: 0, earlyFinish: 0, lateStart: 0, lateFinish: 0, slack: 0, isCritical: false
    },
    {
      id: 't4',
      name: 'Backend API Migration',
      duration: 15,
      predecessors: ['t2'],
      resources: [
        { resourceId: 'r3', percentage: 100 },
        { resourceId: 'r4', percentage: 50 }
      ],
      risks: [
        { id: 'risk2', description: 'Legacy code lacks documentation', probability: 5, impact: 4, mitigation: ' allocate extra time for reverse engineering' }
      ],
      fixedCost: 0,
      earlyStart: 0, earlyFinish: 0, lateStart: 0, lateFinish: 0, slack: 0, isCritical: false
    },
    {
      id: 't5',
      name: 'Frontend Modernization',
      duration: 12,
      predecessors: ['t2'],
      resources: [
        { resourceId: 'r4', percentage: 100 },
        { resourceId: 'r3', percentage: 20 }
      ],
      risks: [],
      fixedCost: 2000, // Licenses
      earlyStart: 0, earlyFinish: 0, lateStart: 0, lateFinish: 0, slack: 0, isCritical: false
    },
    {
      id: 't6',
      name: 'Database Migration',
      duration: 7,
      predecessors: ['t3'],
      resources: [
        { resourceId: 'r2', percentage: 120 }, // Overloaded!!
        { resourceId: 'r3', percentage: 50 }
      ],
      risks: [
        { id: 'risk3', description: 'Data corruption during transfer', probability: 2, impact: 5, mitigation: 'Dry runs and backups' }
      ],
      fixedCost: 0,
      earlyStart: 0, earlyFinish: 0, lateStart: 0, lateFinish: 0, slack: 0, isCritical: false
    },
    {
      id: 't7',
      name: 'Integration Testing',
      duration: 10,
      predecessors: ['t4', 't5', 't6'],
      resources: [
        { resourceId: 'r5', percentage: 100 },
        { resourceId: 'r3', percentage: 30 }
      ],
      risks: [],
      fixedCost: 0,
      earlyStart: 0, earlyFinish: 0, lateStart: 0, lateFinish: 0, slack: 0, isCritical: false
    },
    {
      id: 't8',
      name: 'User Acceptance Testing (UAT)',
      duration: 5,
      predecessors: ['t7'],
      resources: [
        { resourceId: 'r6', percentage: 50 },
        { resourceId: 'r5', percentage: 50 }
      ],
      risks: [
        { id: 'risk4', description: 'Client requests scope creep', probability: 4, impact: 3, mitigation: 'Strict sign-off on requirements' }
      ],
      fixedCost: 0,
      earlyStart: 0, earlyFinish: 0, lateStart: 0, lateFinish: 0, slack: 0, isCritical: false
    },
    {
      id: 't9',
      name: 'Final Deployment',
      duration: 2,
      predecessors: ['t8'],
      resources: [
        { resourceId: 'r2', percentage: 100 },
        { resourceId: 'r1', percentage: 50 }
      ],
      risks: [],
      fixedCost: 0,
      earlyStart: 0, earlyFinish: 0, lateStart: 0, lateFinish: 0, slack: 0, isCritical: false
    }
  ]
};
