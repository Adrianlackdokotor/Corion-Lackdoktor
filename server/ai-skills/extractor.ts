
import OpenAI from "openai";

const SYSTEM_PROMPT = `
You are the Corion Scheduling AI.
Extract structured calendar event data from unstructured communication logs (WhatsApp, Email, Transcripts).

OUTPUT JSON FORMAT:
{
  "clientName": string | null,
  "carModel": string | null,
  "serviceType": "repair" | "inspection" | "pickup" | "other",
  "startTime": string (ISO 8601),
  "endTime": string (ISO 8601, default duration 30 min for inspection),
  "summary": string (short description for calendar title),
  "source": string (e.g. "whatsapp"),
  "notes": string (original context)
}

RULES:
- If date is relative ("next Tuesday"), calculate based on CURRENT DATE provided in user prompt.
- Infer service type from context (e.g. "angucken" -> inspection).
- Keep summary short (e.g. "Insp: Mercedes GLK").
`;

export async function extractEventFromText(rawText: string) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("AI Service: API Key not configured.");
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const now = new Date().toISOString();

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `CURRENT DATE: ${now}\n\nTEXT TO PARSE:\n${rawText}` }
      ],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error) {
    console.error("OpenAI Extraction Error:", error);
    throw new Error("Failed to parse event.");
  }
}
