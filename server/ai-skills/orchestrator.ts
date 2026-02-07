
import OpenAI from "openai";
import { generateSalesResponse } from "./sales";
import { extractEventFromText } from "./extractor";

// Definim personalitățile Agenților Specializați
const AGENTS_CONTEXT = {
  SALES: "Lackdoktor Assistant: Expert în vânzări, estimări preț, negociere cu clienții.",
  TECH: "Meister AI: Expert tehnic auto, proceduri reparație, scule, materiale.",
  OPS: "Corion Ops: Programări, logistică, piese, calendar.",
  HR: "HR Partner: Recrutare, onboarding, acte angajați.",
  FINANCE: "Contabil AI: Facturi, taxe, salarii, profit.",
  EMPATHIC: "Mentor: Motivație, suport emoțional, coaching."
};

const ROUTING_PROMPT = `
You are CORA, the Master Orchestrator for Corion Ecosystem.
Your goal: Analyze the user's input and route it to the BEST specialized agent.

USER INPUT: "{USER_QUERY}"

AVAILABLE AGENTS:
1. SALES (Client questions, prices, offers)
2. TECH (How-to, repair steps, tools, technical problems)
3. OPS (Scheduling, calendar, parts ordering)
4. HR (Hiring, paperwork, onboarding)
5. FINANCE (Money, invoices, taxes)
6. EMPATHIC (User is frustrated, tired, or needs motivation)

OUTPUT FORMAT (JSON):
{
  "targetAgent": "SALES" | "TECH" | "OPS" | "HR" | "FINANCE" | "EMPATHIC",
  "confidence": number (0-1),
  "reasoning": "Why you chose this agent"
}
`;

export async function orchestrateRequest(userQuery: string, userContext: any) {
  if (!process.env.OPENAI_API_KEY) return { answer: "System Error: AI Key missing." };

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    // 1. PASUL 1: DECIDE CINE RĂSPUNDE (ROUTING)
    const routingResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: ROUTING_PROMPT.replace("{USER_QUERY}", userQuery) }],
      response_format: { type: "json_object" }
    });

    const decision = JSON.parse(routingResponse.choices[0].message.content || "{}");
    const agent = decision.targetAgent || "EMPATHIC"; // Default fallback

    console.log(`[CORA] Routing to: ${agent} (${decision.reasoning})`);

    // 2. PASUL 2: EXECUȚIA (DELEGAREA)
    let finalResponse = "";

    switch (agent) {
      case "SALES":
        // Folosim skill-ul existent de Sales
        finalResponse = await generateSalesResponse(userQuery, { role: userContext.role });
        break;

      case "OPS":
        // Verificăm dacă e o cerere de calendar
        if (userQuery.includes("program") || userQuery.includes("calendar") || userQuery.includes("marți")) {
            const eventData = await extractEventFromText(userQuery);
            finalResponse = `Am extras datele pentru calendar:\nClient: ${eventData.clientName}\nData: ${eventData.startTime}\n\nVrei să confirm programarea?`;
        } else {
            finalResponse = "Verific disponibilitatea în atelier... (Funcție în lucru)";
        }
        break;

      case "TECH":
        // Aici am conecta Meister AI (momentan simulăm)
        finalResponse = `[Meister AI]: Pentru "${userQuery}", îți recomand să verifici fișa tehnică din Academy. Ai nevoie de Torx T30 și multă răbdare.`;
        break;

      case "EMPATHIC":
      default:
        // Răspuns direct de la CORA (Suport General)
        const chatCompletion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "Ești CORA, un partener empatic și de ajutor. Răspunde scurt, cald și încurajator." },
                { role: "user", content: userQuery }
            ]
        });
        finalResponse = chatCompletion.choices[0].message.content || "Sunt aici să te ajut.";
        break;
    }

    return {
      agentUsed: agent,
      answer: finalResponse
    };

  } catch (error) {
    console.error("Orchestration Error:", error);
    return { answer: "Nu am reușit să contactez agenții. Verifică conexiunea." };
  }
}
