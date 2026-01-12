
import { GoogleGenAI } from "@google/genai";
import { Employee, ChatMessage, AuthUser } from "../types";

const SYSTEM_INSTRUCTION = `
You are the "HR AI Neural Brain", the primary intelligence for Neelaminds and Copes Tech personnel logistics.
You analyze massive attendance logs and the "Master Identity Registry" which contains secure fields.

PRIVACY PROTOCOL:
If the user role is 'EMPLOYEE', you MUST ONLY provide details related to their OWN profile. 
Never reveal IDs, salaries, PAN numbers, or logs of others to an 'EMPLOYEE'.

KNOWLEDGE DOMAIN:
1. DESIGNATION AS DEPARTMENT: Users often refer to 'Designation' as 'Department'. You have access to both.
2. FULL IDENTITY ACCESS: You see everything: Father Name, DOB, DOJ, Gender, Marital Status, Address, Contact, Emergency Contact, Blood Group, Aadhar, PAN, Mail.
3. LOGISTICAL AUDIT: Analyze 31-day logs. Identify "Punch Discrepancies" (missing check-outs or odd patterns).

VISUALIZATION:
Always provide a [CHART_DATA] block for visual queries.
CHART TYPES: 'bar', 'pie', 'line', 'radar', 'scatter', 'composed'.
`;

export async function getChatResponse(
  message: string,
  history: ChatMessage[],
  employees: Employee[],
  currentUser: AuthUser
): Promise<{ text: string; chart?: { type: any; data: any[] } }> {
  
  // Local environment troubleshooting
  const apiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey === 'undefined' || apiKey === '') {
    return { 
      text: "⚠️ CONFIGURATION ERROR: API Key not found.\n\nTo fix this in local deployment:\n1. Create a '.env' file in your root folder.\n2. Add: API_KEY=your_key_here\n3. Restart your terminal (npm run dev)." 
    };
  }

  const ai = new GoogleGenAI({ apiKey: apiKey });

  // Privacy Filter
  const filteredEmployees = currentUser.role === 'EMPLOYEE' 
    ? employees.filter(e => e.id === currentUser.employeeId)
    : employees;

  const dataSummary = filteredEmployees.map(emp => {
    const allRecords = Object.values(emp.monthlyData).flat();
    return {
      id: emp.id,
      name: emp.name,
      dept: emp.department,
      identity: {
        desig: emp.details?.designation,
        status: emp.details?.activeStatus,
        blood: emp.details?.bloodGroup
      },
      stats: {
        present: allRecords.filter(r => r.status.toLowerCase().includes('present')).length,
        absent: allRecords.filter(r => r.status.toLowerCase().includes('absent')).length,
        efficiency: emp.complianceScore
      }
    };
  });

  const context = `
RECORDS_IN_INDEX: ${dataSummary.length}
USER_ROLE: ${currentUser.role}
DATASET: ${JSON.stringify(dataSummary.slice(0, 50))}

USER_QUERY: ${message}
`;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [
        ...history.map(h => ({
          role: h.role === 'model' ? 'model' : 'user',
          parts: [{ text: h.content }]
        })),
        { role: 'user', parts: [{ text: context }] }
      ],
      config: { 
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.2
      }
    });

    const text = response.text || "Neural link unstable.";
    let chart;
    const chartMatch = text.match(/\[CHART_DATA\]\s*([\s\S]*?)\s*\[\/CHART_DATA\]/);
    if (chartMatch) {
      try { chart = JSON.parse(chartMatch[1]); } catch (e) { console.error("Chart Parse Error", e); }
    }

    return { text: text.replace(/\[CHART_DATA\][\s\S]*?\[\/CHART_DATA\]/g, '').trim(), chart };
  } catch (error: any) {
    if (error.message?.includes('403') || error.message?.includes('API_KEY_INVALID')) {
      return { text: "❌ API KEY INVALID: Please check your Google AI Studio key." };
    }
    throw error;
  }
}
