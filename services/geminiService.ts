import { GoogleGenAI, Type } from "@google/genai";
import { Project, Task, Resource } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateProjectPlan = async (description: string, existingResources: Resource[]): Promise<Partial<Project>> => {
  const model = "gemini-2.5-flash";
  
  const resourceNames = existingResources.map(r => r.name).join(", ");

  const prompt = `
    Create a project plan for: "${description}".
    
    The plan should include a logical sequence of tasks.
    Available resources: ${resourceNames || "Generic Developer, Project Manager, Designer"}.
    
    Return a JSON object with:
    - tasks: Array of tasks. Each task needs:
      - id: unique string (e.g., "t1")
      - name: short descriptive name
      - duration: integer (days)
      - predecessors: array of task IDs that must finish before this starts
      - resources: array of objects { resourceId: string (match name roughly), percentage: number (0-100) }
      - fixedCost: estimated material cost number
      - risks: array of objects { description: string, probability: 1-5, impact: 1-5, mitigation: string }
    
    Ensure the dependency graph is valid (no cycles).
    Estimate durations realistically.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  duration: { type: Type.NUMBER },
                  predecessors: { type: Type.ARRAY, items: { type: Type.STRING } },
                  resources: { 
                    type: Type.ARRAY, 
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        resourceName: { type: Type.STRING },
                        percentage: { type: Type.NUMBER }
                      }
                    }
                  },
                  fixedCost: { type: Type.NUMBER },
                  risks: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        description: { type: Type.STRING },
                        probability: { type: Type.INTEGER },
                        impact: { type: Type.INTEGER },
                        mitigation: { type: Type.STRING }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const data = JSON.parse(text);
    
    // Map AI output to internal types
    const mappedTasks: Task[] = data.tasks.map((t: any) => ({
      id: t.id,
      name: t.name,
      duration: t.duration,
      predecessors: t.predecessors || [],
      fixedCost: t.fixedCost || 0,
      risks: t.risks.map((r: any, idx: number) => ({
        id: `${t.id}-r${idx}`,
        ...r
      })),
      resources: t.resources.map((r: any) => {
        // Simple fuzzy match or create placeholder
        const existing = existingResources.find(er => er.name.toLowerCase().includes(r.resourceName.toLowerCase()));
        return {
          resourceId: existing ? existing.id : 'unknown', // In a real app we'd handle new resource creation better
          percentage: r.percentage
        };
      }).filter((r: any) => r.resourceId !== 'unknown'),
      // Defaults for calc fields
      earlyStart: 0, earlyFinish: 0, lateStart: 0, lateFinish: 0, slack: 0, isCritical: false
    }));

    return {
      tasks: mappedTasks
    };

  } catch (error) {
    console.error("Error generating plan:", error);
    throw error;
  }
};

export const analyzeProjectRisks = async (project: Project): Promise<string> => {
  const model = "gemini-2.5-flash";

  // Create a concise summary for the model
  const summary = JSON.stringify({
    projectBudget: project.budget,
    totalDuration: Math.max(...project.tasks.map(t => t.earlyFinish), 0),
    resources: project.resources.map(r => ({ id: r.id, name: r.name, hourlyRate: r.hourlyRate })),
    tasks: project.tasks.map(t => ({
      name: t.name,
      duration: t.duration,
      isCritical: t.isCritical,
      resources: t.resources,
      risks: t.risks,
      cost: t.fixedCost
    }))
  });

  const prompt = `
    Act as a Senior Project Manager and Risk Analyst.
    Analyze the following project data and provide a strategic assessment.
    
    Project Data: ${summary}
    
    Please provide:
    1. **High Risk Areas**: Identify tasks with high combined probability/impact or tight critical path dependencies.
    2. **Resource Bottlenecks**: Identify resources that appear over-utilized (over 100%) or critical to too many tasks.
    3. **Mitigation Strategies**: Suggest 3 concrete actions to reduce risk or cost.
    4. **Budget Check**: A quick comment on whether the budget seems sufficient given the resources and duration (heuristic check).
    
    Format the response in clean, readable Markdown. Use bullet points and bold text for emphasis. Keep it concise.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt
    });
    return response.text || "Could not generate analysis.";
  } catch (error) {
    console.error("Error analyzing risks:", error);
    return "Error generating analysis. Please check your API key and connection.";
  }
};
