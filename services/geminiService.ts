
import { GoogleGenAI, Type } from "@google/genai";
import { AttendanceRecord } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const scanAttendanceForm = async (base64Image: string): Promise<Partial<AttendanceRecord>[]> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: [
      {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
          { text: "Extract all rows from this meeting attendance list. Return an array of objects. For each person, extract: name, gender, position, organization, phone, remarks. Use Khmer labels if found. If a field is blank, return an empty string. Output only the JSON array." }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            gender: { type: Type.STRING },
            position: { type: Type.STRING },
            organization: { type: Type.STRING },
            phone: { type: Type.STRING },
            remarks: { type: Type.STRING }
          }
        }
      }
    }
  });

  try {
    const text = response.text || '[]';
    return JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse AI response", e);
    return [];
  }
};

export const generateMeetingMinutes = async (records: AttendanceRecord[], notes: string): Promise<string> => {
  const participants = records.map(r => `${r.name} (${r.position}, ${r.organization})`).join(', ');
  const prompt = `
    Based on the following meeting details, generate a formal set of Meeting Minutes in Khmer (កំណត់ហេតុអង្គប្រជុំ).
    
    Participants: ${participants}
    Meeting Notes/Agenda: ${notes}
    
    The output should follow standard Khmer administrative format:
    1. Title (ព្រះរាជាណាចក្រកម្ពុជា)
    2. Logo/Department (if applicable, use placeholder)
    3. Title of Minutes
    4. Date, Time, and Location
    5. List of attendees
    6. Meeting Summary and Decisions
    7. Closing and Signature area
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: prompt,
  });

  return response.text || "Error generating minutes.";
};
