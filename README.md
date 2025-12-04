# SmartPath AI - Project Manager

SmartPath AI is an intelligent project management suite that combines traditional methodologies with Generative AI to help you plan, visualize, and optimize complex projects. Beyond simple scheduling, it provides deep financial tracking, risk lifecycle management, and a context-aware AI Advisor.

## 🚀 Key Features

### 🧠 AI Planning & Advisory
-   **Generative Planning**: Describe your project in plain text or upload a document (`.md`, `.txt`, `.docx`), and the AI generates a complete schedule with tasks, dependencies, resources, and initial risks.
-   **Context-Aware Advisor**: Ask the AI for specific help depending on your current view:
    -   **Schedule Optimization**: Analyze the Critical Path for bottlenecks.
    -   **Risk Insights**: Identify blind spots and suggest mitigation strategies.
    -   **Meeting Analysis**: Extract action items and "what-if" scenarios from meeting logs.
    -   **Charter Review**: Validate scope alignment and clarity.
-   **Query Log**: All AI interactions are saved in a history log for future reference.

### 📊 Interactive Visualizations
-   **Dual-View Engine**: Switch instantly between **Gantt Charts** (Timeline) and **PERT Charts** (Network Diagram).
-   **Critical Path Method (CPM)**: Automatic calculation of early/late starts, slack time, and the critical path.
-   **Smart Overlays**: Toggle dynamic layers on your charts:
    -   **Risk Heatmap**: Color-codes tasks based on risk probability × impact.
    -   **Cost Intensity**: Visualizes high-cost nodes relative to the budget.
    -   **Resource Load**: Highlights over-allocated resources.

### 💰 Financial & Resource Management
-   **Detailed Budgeting**: Track fixed costs per task and hourly resource rates.
-   **Budget Change Log**: Manage the total budget with a mandatory audit trail (reasoning/history) for any increases or decreases.
-   **Real-time Costing**: Live calculation of projected costs vs. total budget.

### 🛡️ Risk & Governance
-   **Interactive Risk Register**: Manage risks with status tracking (`OPEN`, `WATCHING`, `MITIGATED`, `CLOSED`), owners, and mitigation strategies.
-   **Risk Matrix**: Auto-generated 5x5 Probability/Impact heatmap.
-   **Project Charter**: A dedicated, editable view for high-level goals, scope (In/Out), stakeholders, and success criteria.
-   **Meeting Logs**: specific tracking for project meetings and minutes.

### ⚙️ Customization
-   **Theme Engine**: Customize chart colors for tasks, critical paths, and risk levels.
-   **AI Toggle**: Enable or disable AI features globally via settings.
-   **Export**: Download project data as JSON or high-resolution PNG images of your charts.

## Installation & Running Locally

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/your-username/smartpath-ai.git
    cd smartpath-ai
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Set up API Key**:
    This project uses Google's Gemini API. You need to set your API key in the environment variables or pass it during the build process.
    
    *Note: In the demo environment, the API key is automatically handled via `process.env.API_KEY`.*

4.  **Run the app**:
    ```bash
    npm start
    ```

## Tech Stack

-   **Frontend**: React, TypeScript, Tailwind CSS
-   **Visualization**: D3.js (PERT), Custom SVG/React (Gantt)
-   **AI**: Google GenAI SDK (Gemini 2.5 Flash)
-   **Utilities**: Mammoth.js (Docx parsing), html2canvas (Image export)
