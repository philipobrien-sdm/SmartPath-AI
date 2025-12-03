# SmartPath AI - Project Manager

SmartPath AI is an intelligent project management tool that leverages generative AI (Google Gemini) to help you plan, visualize, and analyze projects. It features interactive PERT and Gantt charts, CPM (Critical Path Method) calculation, and advanced risk and cost analysis.

## Features

-   **AI Project Generation**: Describe your project in plain text or upload a document (.md, .txt, .docx), and the AI will generate a structured task list with dependencies, resources, and risks.
-   **Interactive Visualizations**:
    -   **Gantt Chart**: A timeline view of your project schedule.
    -   **PERT Chart**: A layered, dependency-based tree view showing the flow of tasks.
-   **Critical Path Method (CPM)**: Automatically calculates the critical path, early/late starts, and slack time.
-   **Smart Overlays**:
    -   **Risk Heatmap**: Highlights tasks with high risk scores.
    -   **Cost Analysis**: Visualizes cost intensity relative to the budget.
    -   **Resource Load**: Shows resource allocation levels to spot bottlenecks.
-   **Export**: Export your charts to high-quality PNG images or your project data to JSON.
-   **AI Advisor**: Ask the AI to analyze your current plan for bottlenecks and mitigation strategies.

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
    This project uses Google's Gemini API. You need to set your API key in the environment variables or passing it during the build process depending on your setup.
    
    *Note: In the demo environment, the API key is handled via `process.env.API_KEY`.*

4.  **Run the app**:
    ```bash
    npm start
    ```

## Running on Google AI Studio

1.  Upload the file structure to the AI Studio prompt or editor.
2.  Ensure `@google/genai`, `react`, `react-dom`, `d3`, `mammoth`, and `html2canvas` are available (via import maps or CDN).
3.  The application entry point is `index.tsx`.

## Tech Stack

-   **Frontend**: React, TypeScript, Tailwind CSS
-   **Visualization**: D3.js (for PERT), Custom SVG/HTML (for Gantt)
-   **AI**: Google GenAI SDK (Gemini 2.5 Flash)
-   **Utilities**: Mammoth.js (Docx parsing), html2canvas (Image export)
