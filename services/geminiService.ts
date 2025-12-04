import { GoogleGenAI, Type } from "@google/genai";
import { Project, Task, Resource } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const model = "gemini-2.5-flash";

export const generateProjectPlan = async (description: string, existingResources: Resource[]): Promise<Partial<Project>> => {
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
        ...r,
        owner: '',
        status: 'OPEN'
      })),
      resources: t.resources.map((r: any) => {
        // Simple fuzzy match or create placeholder
        const existing = existingResources.find(er => er.name.toLowerCase().includes(r.resourceName.toLowerCase()));
        return {
          resourceId: existing ? existing.id : 'unknown', // In a real app we'd handle new resource creation better
          percentage: r.percentage
        };
      }).filter((r: any) => r.resourceId !== 'unknown'),
      // Defaults for new fields
      actions: [],
      notes: '',
      // Defaults for calc fields
      earlyStart: 0, earlyFinish: 0, lateStart: 0, lateFinish: 0, slack: 0, isCritical: false
    }));

    return {
      tasks: mappedTasks,
      meetings: [],
      charter: {
        overview: description,
        sponsor: '',
        manager: '',
        goals: [],
        scopeIn: [],
        scopeOut: [],
        stakeholders: [],
        successCriteria: [],
        assumptions: [],
        constraints: []
      }
    };

  } catch (error) {
    console.error("Error generating plan:", error);
    throw error;
  }
};

export const analyzeProjectRisks = async (project: Project): Promise<string> => {
  return getAIAdvice('RISK', JSON.stringify({
    risks: project.tasks.flatMap(t => t.risks),
    tasks: project.tasks.map(t => ({name: t.name, isCritical: t.isCritical}))
  }));
};

export const getAIAdvice = async (
  category: 'OPTIMIZATION' | 'RISK' | 'MEETING' | 'CHARTER' | 'GENERAL',
  dataContext: string
): Promise<string> => {
  
  let systemInstruction = "You are a Senior Project Manager and AI Consultant.";
  let prompt = "";

  if (category === 'OPTIMIZATION') {
      systemInstruction += " You specialize in scheduling (PERT/Gantt), Critical Path Method (CPM), and resource optimization.";
      prompt = `
        Analyze the following project schedule data:
        ${dataContext}
        
        Provide advice on:
        1. **Critical Path Optimization**: How to shorten the project duration?
        2. **Resource Balancing**: Are there potential bottlenecks or underutilized resources?
        3. **Logic Check**: Are the dependencies logical?
        
        Return the advice in clear Markdown format.
      `;
  } else if (category === 'RISK') {
      systemInstruction += " You specialize in risk management (PMBOK/Prince2).";
      prompt = `
        Analyze the following project risks:
        ${dataContext}
        
        Provide:
        1. **Risk Assessment**: Identify the most critical risks (Probability x Impact).
        2. **Mitigation Strategies**: Suggest concrete steps to mitigate top risks.
        3. **Blind Spots**: Are there common risks missing for this type of project?
        
        Return the advice in clear Markdown format.
      `;
  } else if (category === 'MEETING') {
      systemInstruction += " You specialize in meeting efficiency and extracting action items.";
      prompt = `
        Analyze the following meeting logs:
        ${dataContext}
        
        Provide:
        1. **Key Insights**: Summarize the main decisions and blockers.
        2. **What-If Analysis**: Based on the notes, what happens if the decisions are delayed?
        3. **Action Gap**: Are there implied actions in the notes that aren't tracked?
        
        Return the advice in clear Markdown format.
      `;
  } else if (category === 'CHARTER') {
      systemInstruction += " You specialize in project initiation and charter definition.";
      prompt = `
        Review the following Project Charter:
        ${dataContext}
        
        Provide:
        1. **Clarity Check**: Are the goals and scope clearly defined?
        2. **Missing Elements**: Is there ambiguity in constraints or assumptions?
        3. **Strategic Alignment**: Does the scope match the goals?
        
        Return the advice in clear Markdown format.
      `;
  } else {
      prompt = `Analyze the following data and provide helpful advice: ${dataContext}`;
  }

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
             advice: { type: Type.STRING, description: "Markdown formatted advice" }
          }
        }
      }
    });
    
    const json = JSON.parse(response.text || "{}");
    return json.advice || "No advice generated.";
  } catch (error) {
    console.error(`Error in getAIAdvice (${category}):`, error);
    return "Error contacting AI service. Please check your connection.";
  }
};