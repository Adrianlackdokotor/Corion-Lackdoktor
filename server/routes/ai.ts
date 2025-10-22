import type { Express } from "express";
import { z } from "zod";

const aiRequestSchema = z.object({
  prompt: z.string(),
  agentType: z.enum(['assistant', 'business', 'learning']).default('assistant'),
  userContext: z.string().optional(),
});

export function registerAIRoutes(app: Express) {
  app.post("/api/ai", async (req, res) => {
    try {
      const { prompt, agentType, userContext } = aiRequestSchema.parse(req.body);

      const openaiApiKey = process.env.OPENAI_API_KEY_CORIONLACKDOKTOR || process.env.OPENAI_API_KEY;

      if (!openaiApiKey) {
        console.warn('OpenAI API key not configured, using fallback responses');
        return res.json(getFallbackResponse(prompt, agentType));
      }
      
      console.log('✅ OpenAI API key found, using GPT-4o-mini for responses');

      const systemPrompts = {
        assistant: `Du bist ein freundlicher AI-Assistent für +1 Corion Lackdoktor, eine professionelle Autoreparatur-Werkstatt in Wiesbaden, Hofheim und Mainz-Kastel.
        
Deine Aufgaben:
- Beantworte Fragen zu unseren Dienstleistungen (Unfallschäden, Lackschäden, Smart Repair, Felgenreparaturen, etc.)
- Sei freundlich, professionell und hilfsbereit
- Antworte immer auf Deutsch
- Biete konkrete Hilfe an (Terminvereinbarung, Kostenvoranschlag, Kontaktaufnahme)
- Erwähne unsere Standorte: Hofheim-Wallau, Mainz-Kastel, Wiesbaden
- Telefon: 0176 834 582 74

Wichtig: Wir sind ein Team in Ausbildung zum Meister - keine falschen Versprechungen über Meisterbetrieb.`,

        business: `Du bist ein Geschäfts-Assistent für +1 Corion Lackdoktor.
        
Deine Aufgaben:
- Erstelle Kostenvoranschläge basierend auf Schadensbeschreibungen
- Schlage passende Dienstleistungen vor
- Schätze Bearbeitungszeiten ein
- Sei realistisch und transparent
- Erwähne immer: "Für ein genaues Angebot senden Sie uns bitte ein Foto"

Services: Unfallschäden, Lackschäden, Smart Repair, Dellen entfernen, Felgenreparatur, Oldtimer-Restaurierung, Autoaufbereitung`,

        learning: `Du bist ein Analyse-Assistent für +1 Corion Lackdoktor.
        
Deine Aufgaben:
- Analysiere Nutzerverhalten und erkenne Intentionen
- Gib Empfehlungen für Verbesserungen
- Prognostiziere nächste Aktionen
- Sei datengetrieben und präzise`,
      };

      const messages = [
        {
          role: 'system',
          content: systemPrompts[agentType],
        },
        ...(userContext ? [{
          role: 'system',
          content: `Nutzerkontext: ${userContext}`,
        }] : []),
        {
          role: 'user',
          content: prompt,
        },
      ];

      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages,
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      if (!openaiResponse.ok) {
        const errorText = await openaiResponse.text();
        console.error('OpenAI API error:', errorText);
        return res.json(getFallbackResponse(prompt, agentType));
      }

      const openaiData = await openaiResponse.json();
      const reply = openaiData.choices[0]?.message?.content || 'Keine Antwort erhalten.';

      const response = {
        reply,
        suggestions: extractSuggestions(reply),
      };

      res.json(response);
    } catch (error) {
      console.error('AI route error:', error);
      res.status(500).json({
        reply: 'Entschuldigung, ein Fehler ist aufgetreten. Bitte kontaktieren Sie uns direkt unter 0176 834 582 74.',
      });
    }
  });
}

function getFallbackResponse(prompt: string, agentType: string) {
  const lowerPrompt = prompt.toLowerCase();

  if (lowerPrompt.includes('hallo') || lowerPrompt.includes('guten tag') || lowerPrompt.includes('hi')) {
    return {
      reply: 'Hallo! Willkommen bei +1 Corion Lackdoktor. Ich bin Ihr AI-Assistent. Wie kann ich Ihnen heute helfen?',
      suggestions: ['Ich möchte ein Angebot', 'Welche Dienstleistungen bieten Sie an?', 'Wo sind Ihre Standorte?'],
    };
  }

  if (lowerPrompt.includes('angebot') || lowerPrompt.includes('preis') || lowerPrompt.includes('kosten')) {
    return {
      reply: 'Gerne erstellen wir Ihnen ein individuelles Angebot! Für einen genauen Kostenvoranschlag senden Sie uns bitte ein Foto des Schadens per WhatsApp (0176 834 582 74) oder über unser Kontaktformular. Unsere Preise sind fair und transparent.',
      suggestions: ['Per WhatsApp kontaktieren', 'Zum Kontaktformular', 'Mehr über Preise erfahren'],
    };
  }

  if (lowerPrompt.includes('standort') || lowerPrompt.includes('adresse') || lowerPrompt.includes('wo')) {
    return {
      reply: 'Wir haben drei Standorte für Sie:\n\n📍 Hofheim-Wallau - Wiesbadener Straße\n📍 Mainz-Kastel - Wiesbadener Strasse 30\n📍 Wiesbaden\n\nWelcher Standort ist für Sie am besten erreichbar?',
      suggestions: ['Hofheim-Wallau', 'Mainz-Kastel', 'Wiesbaden'],
    };
  }

  if (lowerPrompt.includes('service') || lowerPrompt.includes('leistung') || lowerPrompt.includes('reparatur')) {
    return {
      reply: 'Wir bieten folgende Dienstleistungen an:\n\n🔧 Unfallschäden\n🎨 Lackschäden\n✨ Smart Repair\n💫 Dellen entfernen\n⭐ Felgenreparaturen\n🚗 Oldtimer-Restaurierung\n✨ Autoaufbereitung\n\nWofür interessieren Sie sich?',
      suggestions: ['Unfallschäden', 'Smart Repair', 'Lackschäden'],
    };
  }

  return {
    reply: 'Vielen Dank für Ihre Nachricht! Für eine detaillierte Beratung erreichen Sie uns unter:\n\n📞 0176 834 582 74\n💬 WhatsApp verfügbar\n📧 coriongmbh@gmail.com\n\nWie kann ich Ihnen weiterhelfen?',
    suggestions: ['Angebot einholen', 'Standorte anzeigen', 'Dienstleistungen'],
  };
}

function extractSuggestions(reply: string): string[] | undefined {
  const suggestions: string[] = [];

  if (reply.includes('Angebot') || reply.includes('Kostenvoranschlag')) {
    suggestions.push('Angebot einholen');
  }
  if (reply.includes('Standort') || reply.includes('Adresse')) {
    suggestions.push('Standorte anzeigen');
  }
  if (reply.includes('WhatsApp')) {
    suggestions.push('Per WhatsApp kontaktieren');
  }
  if (reply.includes('Termin')) {
    suggestions.push('Termin vereinbaren');
  }

  return suggestions.length > 0 ? suggestions : undefined;
}
