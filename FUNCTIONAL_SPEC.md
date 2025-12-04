# Functional Specification: SmartPath AI

**Version:** 1.0  
**Date:** 2025-05-20  
**Status:** Approved

---

## 1. Executive Summary
SmartPath AI is a web-based Project Management Intelligence System. It bridges the gap between traditional scheduling methodologies (Critical Path Method, PERT, Gantt) and modern Generative AI. The application allows users to generate complex project schedules from natural language or documents, visualize dependencies, simulate risks, and receive context-aware strategic advice.

## 2. System Scope
The system is a single-page application (SPA) running entirely in the browser, utilizing Google's Gemini API for intelligence and local browser storage/memory for state management.

### In-Scope
*   **AI-Driven Planning:** Generative scheduling from text prompts or uploaded documents (.docx, .txt, .md).
*   **Dual Visualization:** Synchronized Gantt and PERT chart views.
*   **CPM Engine:** Real-time calculation of Early/Late Start/Finish, Slack, and Critical Path.
*   **Financials:** Resource cost tracking, fixed costs, and budget change auditing.
*   **Governance:** Project Charter, Risk Management (Matrix + Register), Meeting Logs, and Action Tracking.
*   **Analysis Overlays:** Visual heatmaps for Risk, Cost, and Resource allocation.
*   **State Management:** Visual Undo/Redo history stack (Time Travel).

### Out-of-Scope
*   Multi-user real-time collaboration (WebSocket).
*   Backend database persistence (currently relies on Import/Export JSON).
*   User Authentication/Login system.

---

## 3. Functional Requirements

### 3.1 Project Initialization & Generation
**FR-01: Manual Creation**
*   The system shall allow users to start with an empty project template containing default resources.

**FR-02: AI Generation (Text)**
*   The user must be able to describe a project in natural language (e.g., "Build a mobile app...").
*   The AI must return a structured JSON object containing Tasks, Estimated Durations, Dependencies (Predecessors), Resource Allocations, and Initial Risks.

**FR-03: AI Generation (File)**
*   The system shall accept `.docx`, `.txt`, and `.md` files.
*   The system must parse the file content and send it as context to the AI model to generate the schedule.

### 3.2 Scheduling Engine (CPM)
**FR-04: Forward Pass Calculation**
*   The system shall calculate `Early Start` and `Early Finish` for all tasks based on predecessor constraints.

**FR-05: Backward Pass Calculation**
*   The system shall calculate `Late Start` and `Late Finish` based on the project deadline (max Early Finish).

**FR-06: Slack & Critical Path**
*   The system shall calculate `Slack` (Float) = `Late Start - Early Start`.
*   Tasks with `Slack <= 0` must be flagged as `IsCritical: true`.

### 3.3 Visualizations
**FR-07: Gantt Chart**
*   Display tasks on a horizontal timeline.
*   Visual indication of critical path items (distinct color).
*   Visual indication of slack time (lighter bars extending from task).
*   Visual indication of overdue tasks (striped pattern).

**FR-08: PERT Chart (Network Diagram)**
*   Display tasks as nodes connected by directional links (dependencies).
*   Auto-layout algorithm (Topological Sort) to organize nodes into logical columns (Generations).
*   Support Zoom and Pan interactions (D3.js).

**FR-09: Overlays**
*   The system shall allow toggling "Heatmap" modes on both charts:
    *   **Risk Mode:** Colors tasks based on `Probability * Impact` score.
    *   **Cost Mode:** Colors tasks based on `% of Total Budget` consumed.
    *   **Resource Mode:** Highlights tasks where a specific resource is allocated > 100%.

### 3.4 Task Management
**FR-10: Task Properties**
*   Users must be able to edit: Name, Duration, Predecessors, Fixed Cost, Notes.
*   **Deliverables:** Users can add deliverables with URLs. A task is "Complete" only when all deliverables have links or a manual "Actual End Date" is set.

**FR-11: Secure Editing (Modal)**
*   Task details must open in a "Read Only" modal by default.
*   Users must click "Unlock to Edit" to modify structural data (preventing accidental CPM invalidation).

### 3.5 Resource & Budget Management
**FR-12: Resource Allocation**
*   Resources are defined globally with an `Hourly Rate`.
*   Tasks can be assigned multiple resources with a specific `% allocation`.

**FR-13: Cost Calculation**
*   `Task Cost` = `Fixed Cost` + Sum(`Duration * 8hrs * Hourly Rate * Allocation %`).
*   `Total Project Cost` = Sum of all Task Costs.

**FR-14: Budget Audit Log**
*   Changes to the Total Project Budget must require a "Reason" text entry.
*   The system must store a history log of budget changes (Date, Amount, Reason).

### 3.6 Risk Management
**FR-15: Risk Register**
*   Risks are attached to specific tasks.
*   Properties: Description, Probability (1-5), Impact (1-5), Mitigation Strategy, Owner, Status (Open, Watch, Mitigated, Closed).

**FR-16: Risk Matrix**
*   The system must auto-generate a 5x5 Heatmap Grid showing the count of risks in each Probability/Impact quadrant.

### 3.7 AI Advisor
**FR-17: Context-Aware Queries**
*   The AI Advisor must change its system instruction based on the active view:
    *   **Optimization Mode:** Analyzes CPM data to suggest schedule compression.
    *   **Risk Mode:** Analyzes High P*I risks to suggest mitigation.
    *   **Meeting Mode:** Analyzes meeting logs to find action items or gaps.
    *   **Charter Mode:** Analyzes scope vs. goals for alignment.

### 3.8 Governance
**FR-18: Project Charter**
*   A dedicated view for defining Scope (In/Out), Goals, Stakeholders, Assumptions, and Constraints.
*   Supports list-based editing.

**FR-19: Meeting Logs**
*   CRUD functionality for meeting minutes.

### 3.9 History & Persistence
**FR-20: Time Travel (Undo)**
*   Every state change (Edit, Add, Delete) must be pushed to a history stack.
*   Users can rollback the project state up to 10 steps.
*   Users can view a dropdown of the last 10 actions to jump to a specific state.

**FR-21: Export/Import**
*   **JSON:** Full state serialization for saving/loading.
*   **PNG:** High-resolution image export of the Gantt or PERT chart via canvas rasterization.

---

## 4. Technical Architecture

### 4.1 Technology Stack
*   **Framework:** React 18+
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS
*   **Visualization:** D3.js (PERT Graph logic), SVG (Gantt)
*   **AI Service:** Google Generative AI SDK (Gemini 2.5 Flash)
*   **Utilities:** `mammoth.js` (Docx parsing), `html2canvas` (Export)

### 4.2 Data Model (Key Entities)

```typescript
interface Project {
  id: string;
  name: string;
  startDate: string;
  budget: number;
  tasks: Task[];
  resources: Resource[];
  risks: Risk[]; // (Derived from tasks)
  meetings: Meeting[];
  charter: ProjectCharter;
  budgetHistory: BudgetEntry[];
}

interface Task {
  id: string;
  duration: number; // days
  predecessors: string[]; // Task IDs
  earlyStart: number; // Calculated
  earlyFinish: number; // Calculated
  lateStart: number; // Calculated
  lateFinish: number; // Calculated
  slack: number; // Calculated
  isCritical: boolean; // Calculated
}
```

---

## 5. User Interface / UX Guidelines
*   **Color Coding:**
    *   Critical Path: Red/Rose.
    *   Completed: Green/Emerald.
    *   Standard: Indigo/Slate.
*   **Interaction:**
    *   Clicking a task node/bar opens the Modal.
    *   Dragging the PERT canvas pans the view.
    *   Scroll wheel on PERT canvas zooms.
*   **Feedback:**
    *   Loading spinners for AI generation.
    *   Toast/Alerts for validation errors (e.g., Circular dependencies - handled by AI logic).

---

## 6. Security & Performance
*   **API Key:** The Google Gemini API key is injected via environment variables (`process.env.API_KEY`) and is never exposed in the UI for user entry.
*   **Client-Side Processing:** All CPM calculations happen on the client (Main Thread).
*   **Large Projects:** The PERT chart utilizes virtualized logic (only rendering nodes, but calculating layout once) to support projects up to ~100 nodes comfortably.

---
**End of Specification**
