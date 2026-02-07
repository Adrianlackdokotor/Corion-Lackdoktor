
import OpenAI from "openai";

const SYSTEM_PROMPT = `
You are the "Lackdoktor Assistant", a professional AI agent for Corion GmbH.
Your goal is to assist clients and partners with auto body repair inquiries.

TONE: Professional, empathetic, solution-oriented (German "Kundenorientiert").
LANGUAGE: German (primary).

KEY SELLING POINTS (USP):
- Smart Repair (Fast, Cost-effective, No part removal).
- Value Retention (Important for Leasing returns).
- 5-Year Warranty on paint.
- 24h Express Service available.

ROLE:
If speaking to a PARTNER: Help them close the sale. Provide arguments to overcome price objections.
If speaking to a CLIENT: Explain the process simply, build trust, and ask for photos to provide an estimate.

SCENARIO: LEASING RETURN
- Emphasize that fixing it now is 50% cheaper than the leasing penalty.

SCENARIO: RUST RISK
- Explain that a small scratch can lead to expensive rust damage if ignored.
`;

export async function generateSalesResponse(
  userQuery: string, 
  context: { role: 'partner' | 'client', car?: string, damage?: string }
) {
  if (!process.env.OPENAI_API_KEY) {
    return "AI Service: API Key not configured.";
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Context: User is a ${context.role}. Car: ${context.car || 'Unknown'}. Damage: ${context.damage || 'Unknown'}. Query: ${userQuery}` }
      ]
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("OpenAI Error:", error);
    return "Entschuldigung, ich kann gerade nicht antworten. Bitte versuchen Sie es später.";
  }
}
