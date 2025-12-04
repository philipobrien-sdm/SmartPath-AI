import { Project } from '../types';

export const SAMPLE_PROJECT: Project = {
  id: 'smart-city-demo',
  name: 'Smart City Traffic Control System',
  startDate: new Date().toISOString().split('T')[0], // Starts Today
  budget: 250000,
  budgetHistory: [
      { id: 'b1', date: new Date(Date.now() - 86400000 * 30).toISOString().split('T')[0], amount: 200000, reason: 'Initial grant approval' },
      { id: 'b2', date: new Date(Date.now() - 86400000 * 10).toISOString().split('T')[0], amount: 250000, reason: 'Approved contingency for GPU shortage' }
  ],
  aiQueryLog: [],
  charter: {
    overview: "This project aims to deploy an intelligent traffic management system across 50 key downtown intersections. By utilizing IoT sensors, edge computing, and AI-driven signal timing, the system aims to dynamically adjust to traffic flows, reduce congestion, and improve air quality.",
    sponsor: "City Council / Dept of Transportation",
    manager: "Alice (Senior Project Mgr)",
    goals: [
        "Reduce peak hour congestion wait times by 20%",
        "Decrease average vehicle emissions in downtown by 15%",
        "Integrate with emergency response systems for automated green-lighting"
    ],
    scopeIn: [
        "Installation of LiDAR and camera sensors at 50 intersections",
        "Central command dashboard development",
        "Citizen mobile app for real-time traffic alerts",
        "Training of traffic control center staff"
    ],
    scopeOut: [
        "Highway on-ramps and off-ramps (State jurisdiction)",
        "Automated ticketing/enforcement systems",
        "Road resurfacing or physical infrastructure repairs"
    ],
    stakeholders: [
        "Mayor's Office",
        "Traffic Police Department",
        "Public Transit Authority",
        "Local Business Association",
        "City Residents"
    ],
    successCriteria: [
        "System uptime > 99.9%",
        "User satisfaction score > 4.0/5 from operators",
        "Deployment completed within 6 months",
        "Zero safety incidents during installation"
    ],
    assumptions: [
        "City provides access to existing fiber optic network",
        "Vendor hardware arrives within standard lead times",
        "No major legislative changes to privacy laws during dev"
    ],
    constraints: [
        "Budget fixed at $250k with 10% contingency",
        "No road closures allowed during rush hour (7-9am, 4-6pm)",
        "All data must be stored locally (no public cloud storage for video)"
    ]
  },
  resources: [
    { id: 'r1', name: 'Alice (Proj. Mgr)', hourlyRate: 120 },
    { id: 'r2', name: 'Bob (Architect)', hourlyRate: 150 },
    { id: 'r3', name: 'Charlie (Embedded)', hourlyRate: 110 },
    { id: 'r4', name: 'Diana (AI/ML)', hourlyRate: 140 },
    { id: 'r5', name: 'Evan (Frontend)', hourlyRate: 95 },
    { id: 'r6', name: 'Fiona (QA)', hourlyRate: 90 }
  ],
  meetings: [
    {
      id: 'm1',
      date: new Date(Date.now() - 86400000 * 14).toISOString().split('T')[0], // 2 weeks ago
      title: 'Project Kickoff',
      attendees: 'All Hands',
      notes: 'Launch of the Smart City initiative. Objectives: Reduce congestion by 20%. Stakeholders emphasized safety and data privacy.'
    },
    {
      id: 'm2',
      date: new Date(Date.now() - 86400000 * 7).toISOString().split('T')[0], // 1 week ago
      title: 'Hardware Selection Review',
      attendees: 'Alice, Bob, Charlie',
      notes: 'Selected Vendor X for LiDAR sensors despite higher cost due to better durability. Lead time is a concern (Risk #1).'
    },
    {
      id: 'm3',
      date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0], // 2 days ago
      title: 'AI Model Strategy',
      attendees: 'Bob, Diana',
      notes: 'Decided to use hybrid edge-cloud inference. Need to validate latency constraints in the "System Optimization" phase.'
    }
  ],
  tasks: [
    {
      id: 't1',
      name: 'Requirements Gathering',
      duration: 5,
      predecessors: [],
      resources: [{ resourceId: 'r1', percentage: 100 }, { resourceId: 'r2', percentage: 50 }],
      risks: [],
      fixedCost: 500,
      earlyStart: 0, earlyFinish: 0, lateStart: 0, lateFinish: 0, slack: 0, isCritical: false,
      actions: [{ id: 'a1', description: 'Sign off scope with City Council', isCompleted: true }],
      deliverables: [
          { id: 'd1', name: 'Requirements Doc', url: 'https://docs.google.com/requirements' },
          { id: 'd2', name: 'Stakeholder Sign-off', url: 'https://docs.google.com/signoff' }
      ],
      notes: "Focus on downtown intersections first. Compliance with ISO 27001 is mandatory."
    },
    {
      id: 't2',
      name: 'Hardware Procurement',
      duration: 14,
      predecessors: ['t1'],
      resources: [{ resourceId: 'r1', percentage: 20 }],
      risks: [
        { id: 'rsk1', description: 'Supply chain delays for GPU units', probability: 4, impact: 5, mitigation: 'Order from secondary supplier immediately', owner: 'Alice', status: 'OPEN' }
      ],
      fixedCost: 45000,
      earlyStart: 0, earlyFinish: 0, lateStart: 0, lateFinish: 0, slack: 0, isCritical: false,
      actions: [{ id: 'a2', description: 'Pay invoice for initial sensors', isCompleted: false }],
      deliverables: [
          { id: 'd3', name: 'Order Confirmation' } // Not delivered yet (no URL)
      ],
      notes: "Vendor: TechGlobal Inc. Invoice #TG-2023-99."
    },
    {
      id: 't3',
      name: 'System Architecture',
      duration: 7,
      predecessors: ['t1'],
      resources: [{ resourceId: 'r2', percentage: 100 }, { resourceId: 'r4', percentage: 20 }],
      risks: [],
      fixedCost: 0,
      earlyStart: 0, earlyFinish: 0, lateStart: 0, lateFinish: 0, slack: 0, isCritical: false,
      actions: [],
      deliverables: [
          { id: 'd4', name: 'Architecture Diagram', url: 'https://figma.com/arch' }
      ],
      notes: "Define message broker schema (MQTT vs Kafka)."
    },
    {
      id: 't4',
      name: 'Firmware Development',
      duration: 15,
      predecessors: ['t3'],
      resources: [{ resourceId: 'r3', percentage: 100 }], // Charlie
      risks: [
         { id: 'rsk2', description: 'Memory leaks in edge driver', probability: 2, impact: 4, mitigation: 'Strict code reviews and static analysis', owner: 'Charlie', status: 'WATCHING' }
      ],
      fixedCost: 0,
      earlyStart: 0, earlyFinish: 0, lateStart: 0, lateFinish: 0, slack: 0, isCritical: false,
      actions: [{ id: 'a3', description: 'Setup cross-compilation environment', isCompleted: true }],
      deliverables: [
          { id: 'd5', name: 'Firmware v0.1 Binary' }
      ],
      notes: "Targeting ARM Cortex-M4 boards."
    },
    {
      id: 't5',
      name: 'AI Model Training',
      duration: 20,
      predecessors: ['t3'],
      resources: [{ resourceId: 'r4', percentage: 100 }, { resourceId: 'r2', percentage: 20 }], // Diana, Bob
      risks: [
          { id: 'rsk3', description: 'Insufficient training data for night/rain conditions', probability: 5, impact: 5, mitigation: 'Use synthetic data generation tools', owner: 'Diana', status: 'OPEN' }
      ],
      fixedCost: 5000, // Cloud compute
      earlyStart: 0, earlyFinish: 0, lateStart: 0, lateFinish: 0, slack: 0, isCritical: false,
      actions: [
          { id: 'a4', description: 'Clean traffic dataset', isCompleted: false },
          { id: 'a5', description: 'Run baseline benchmarks', isCompleted: false }
      ],
      deliverables: [],
      notes: "Using PyTorch. Need 4x A100 GPUs for 2 weeks."
    },
    {
      id: 't6',
      name: 'Dashboard UI',
      duration: 10,
      predecessors: ['t3'],
      resources: [{ resourceId: 'r5', percentage: 100 }], // Evan
      risks: [],
      fixedCost: 0,
      earlyStart: 0, earlyFinish: 0, lateStart: 0, lateFinish: 0, slack: 0, isCritical: false,
      actions: [],
      deliverables: [],
      notes: "React + D3 for visualizations. Must support dark mode for operations center."
    },
    {
      id: 't7',
      name: 'Integration (Simulated)',
      duration: 5,
      predecessors: ['t4', 't5', 't6'],
      resources: [
          { resourceId: 'r2', percentage: 50 },
          { resourceId: 'r3', percentage: 50 },
          { resourceId: 'r4', percentage: 50 },
          { resourceId: 'r5', percentage: 50 }
      ],
      risks: [],
      fixedCost: 0,
      earlyStart: 0, earlyFinish: 0, lateStart: 0, lateFinish: 0, slack: 0, isCritical: false,
      actions: [{ id: 'a6', description: 'Define API contracts', isCompleted: true }],
      deliverables: [],
      notes: "Integration environment on local server before pilot."
    },
    {
      id: 't8',
      name: 'Pilot Installation',
      duration: 10,
      predecessors: ['t2', 't7'],
      resources: [{ resourceId: 'r3', percentage: 100 }, { resourceId: 'r1', percentage: 50 }],
      risks: [
          { id: 'rsk4', description: 'Permit delays from city', probability: 3, impact: 3, mitigation: 'Apply for permits during phase 1', owner: 'Alice', status: 'MITIGATED' }
      ],
      fixedCost: 2000, // Installation equipment
      earlyStart: 0, earlyFinish: 0, lateStart: 0, lateFinish: 0, slack: 0, isCritical: false,
      actions: [
          { id: 'a7', description: 'Safety briefing for crew', isCompleted: false },
          { id: 'a8', description: 'Notify traffic department of closure', isCompleted: false }
      ],
      deliverables: [],
      notes: "Intersection: 5th & Main. Requires bucket truck."
    },
    {
      id: 't9',
      name: 'System Optimization',
      duration: 7,
      predecessors: ['t8'],
      resources: [
          { resourceId: 'r4', percentage: 120 }, // Diana overloaded
          { resourceId: 'r3', percentage: 100 }
      ],
      risks: [],
      fixedCost: 0,
      earlyStart: 0, earlyFinish: 0, lateStart: 0, lateFinish: 0, slack: 0, isCritical: false,
      actions: [],
      deliverables: [],
      notes: "Optimization needed for real-time latency (<100ms)."
    },
    {
      id: 't10',
      name: 'Final Acceptance',
      duration: 2,
      predecessors: ['t9'],
      resources: [{ resourceId: 'r1', percentage: 100 }, { resourceId: 'r6', percentage: 100 }],
      risks: [],
      fixedCost: 0,
      earlyStart: 0, earlyFinish: 0, lateStart: 0, lateFinish: 0, slack: 0, isCritical: false,
      actions: [{ id: 'a9', description: 'Prepare final report', isCompleted: false }],
      deliverables: [],
      notes: "Sign-off with City Mayor."
    }
  ]
};