import type { Express } from "express";
import { z } from "zod";

const LACKDOKTOR_SYSTEM_PROMPT = `Du bist der "Lackdoktor Assistant" – ein professioneller KI-Agent der Corion GmbH (+1 Corion Lackdoktor).
Dein Ziel ist es, Kunden und Partner bei allen Fragen rund um Karosseriereparatur, Lackierung und Smart Repair zu unterstützen.

TONFALL: Professionell, empathisch, lösungsorientiert (Kundenorientiert).
SPRACHE: Deutsch (primär). Bei Bedarf auch Englisch oder Rumänisch.

FIRMENINFO:
- Name: +1 Corion Lackdoktor (Corion GmbH)
- Standorte: Hofheim-Wallau, Mainz-Kastel (Wiesbadener Str. 30), Wiesbaden
- Telefon: 0176 834 582 74
- E-Mail: coriongmbh@gmail.com
- WhatsApp: Verfügbar unter gleicher Nummer

USP (ALLEINSTELLUNGSMERKMALE):
- Smart Repair: Schnell, kostengünstig, kein Teileausbau nötig
- Werterhaltung: Besonders wichtig für Leasing-Rückgaben
- 5 Jahre Garantie auf Lackierung
- 24h Express-Service verfügbar
- Originalfarben und -materialien
- Über 20 Jahre Erfahrung im Team
- Zertifizierte Fachkräfte

DIENSTLEISTUNGEN:
- Unfallschäden (Versicherungsabwicklung)
- Lackschäden & Volllackierung
- Smart Repair (Spot-Repair, Kleinschadenreparatur)
- Dellen entfernen (PDR / Paintless Dent Repair)
- Felgenreparatur & Aufbereitung
- Rostschutz & Rostbeseitigung
- Oldtimer-Restaurierung
- Autoaufbereitung (Innen & Außen)
- Autoglas (Steinschlag, Scheibentausch)
- Kfz-Gutachter (Sachverständiger)

PREISRAHMEN (Richtwerte für Orientierung):
- Smart Repair: ab 80€
- Dellen entfernen: ab 60€
- Stoßstange lackieren: ab 250€
- Kotflügel lackieren: ab 200€
- Volllackierung: ab 2.500€
- Felgenreparatur: ab 60€ pro Felge

WICHTIGE HINWEISE:
- Für ein verbindliches Angebot immer Fotos anfordern
- Bei Versicherungsschäden: Wir übernehmen die komplette Abwicklung
- Kostenvoranschlag ist kostenlos`;

const ROLE_CONTEXT = {
  client: `
DEINE ROLLE ALS KUNDENBERATER:
- Erkläre Prozesse einfach und verständlich
- Baue Vertrauen auf durch Kompetenz und Transparenz
- Frage nach Fotos für eine bessere Einschätzung
- Biete konkrete nächste Schritte an (Terminvereinbarung, Kostenvoranschlag, WhatsApp-Kontakt)
- Erwähne proaktiv unsere Garantie und Express-Services

VERKAUFSSZENARIEN:

SZENARIO: LEASING-RÜCKGABE
- Betone: Jetzt reparieren ist ca. 50% günstiger als die Leasing-Strafzahlung
- Wir kennen die Prüfkriterien und reparieren exakt nach Leasing-Standard
- Dokumentation für die Rückgabe inklusive

SZENARIO: ROSTGEFAHR
- Erkläre: Ein kleiner Kratzer kann zu teurem Rostschaden führen, wenn er ignoriert wird
- Frühzeitige Behandlung spart langfristig viel Geld
- Unser Rostschutz hält jahrelang

SZENARIO: VERSICHERUNGSSCHADEN
- Wir übernehmen die komplette Versicherungsabwicklung
- Kostenvoranschlag erstellen wir kostenlos
- Der Kunde muss sich um nichts kümmern

SZENARIO: PREISVERHANDLUNG
- Betone Qualität: Originalfarben, 5 Jahre Garantie
- Vergleich: Vertragswerkstatt kostet 40-60% mehr
- Smart Repair als günstige Alternative vorschlagen`,

  partner: `
DEINE ROLLE ALS PARTNER-VERKAUFSCOACH:
- Hilf dem Partner, den Verkaufsabschluss zu erzielen
- Liefere Argumente gegen Preiseinwände
- Gib Gesprächstipps und Formulierungshilfen
- Analysiere die Verkaufssituation und schlage Strategien vor

ANTI-EINWAND-STRATEGIE:
- "Zu teuer" → Vergleich mit Vertragswerkstatt (40-60% teurer), 5J Garantie, Originalfarben
- "Kann warten" → Rostgefahr, Wertverlust, Leasing-Strafe
- "Muss überlegen" → Kostenloser Kostenvoranschlag als unverbindlicher erster Schritt
- "Andere Werkstatt" → 20+ Jahre Erfahrung, zertifizierte Techniker, 5J Garantie
- "Versicherung zahlt nicht" → Wir helfen bei der Abwicklung, kennen die Prozesse`,

  business: `
DEINE ROLLE ALS GESCHÄFTSASSISTENT:
- Erstelle realistische Kostenvoranschläge basierend auf Schadensbeschreibungen
- Schlage passende Dienstleistungen vor und empfehle Zusatzservices (Upselling)
- Schätze Bearbeitungszeiten realistisch ein
- Sei transparent und vertrauenswürdig
- Erwähne immer: "Für ein verbindliches Angebot senden Sie uns bitte ein Foto"`,

  learning: `
DEINE ROLLE ALS ANALYSE-ASSISTENT:
- Analysiere Nutzerverhalten und erkenne Kaufintentionen
- Identifiziere Cross-Selling und Upselling-Möglichkeiten
- Gib datengetriebene Empfehlungen
- Sei präzise und handlungsorientiert`,
};

const aiRequestSchema = z.object({
  prompt: z.string(),
  agentType: z.enum(['assistant', 'business', 'learning']).default('assistant'),
  userContext: z.string().optional(),
  role: z.enum(['client', 'partner']).optional(),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional(),
  scenario: z.string().optional(),
});

function detectScenario(prompt: string): string | null {
  const lower = prompt.toLowerCase();
  if (lower.includes('leasing') || lower.includes('rückgabe') || lower.includes('leasingrückgabe'))
    return 'leasing';
  if (lower.includes('rost') || lower.includes('kratzer') || lower.includes('steinschlag'))
    return 'rust';
  if (lower.includes('versicherung') || lower.includes('unfall') || lower.includes('kasko'))
    return 'insurance';
  if (lower.includes('teuer') || lower.includes('preis') || lower.includes('günstiger') || lower.includes('rabatt'))
    return 'price';
  return null;
}

function buildSystemPrompt(agentType: string, userRole: string, scenario: string | null, userPrompt: string, userContext?: string): string {
  const roleContext = ROLE_CONTEXT[userRole as keyof typeof ROLE_CONTEXT] || ROLE_CONTEXT.client;
  let prompt = `LANGUAGE RULE: Detect the language of the customer's current message below and respond exclusively in that same language. If the message is too short or ambiguous to identify a language, respond in German.\nCURRENT CUSTOMER MESSAGE: ${userPrompt}\n\n${LACKDOKTOR_SYSTEM_PROMPT}\n${roleContext}`;

  if (scenario) {
    const scenarioHints: Record<string, string> = {
      leasing: '\n\nAKTIVES SZENARIO: LEASING-RÜCKGABE - Betone den Kostenvorteil gegenüber Leasing-Strafzahlung. Jetzt reparieren = 50% billiger.',
      rust: '\n\nAKTIVES SZENARIO: ROSTGEFAHR - Betone die Dringlichkeit. Ein kleiner Kratzer heute = teurer Rostschaden morgen.',
      insurance: '\n\nAKTIVES SZENARIO: VERSICHERUNGSSCHADEN - Betone unsere Versicherungsabwicklung. Wir kümmern uns um alles.',
      price: '\n\nAKTIVES SZENARIO: PREISVERHANDLUNG - Betone Qualität, Garantie und den Vergleich zur Vertragswerkstatt.',
    };
    prompt += scenarioHints[scenario] || '';
  }

  if (userContext) {
    prompt += `\n\nNUTZERKONTEXT: ${userContext}`;
  }

  prompt += `\n\nANTWORTFORMAT:
- Antworte in der Sprache der aktuellen Kundennachricht; bei unklarer Sprache auf Deutsch
- Halte Antworten prägnant (max 3-4 kurze Absätze)
- Verwende Aufzählungen für bessere Lesbarkeit
- Ende mit einem konkreten nächsten Schritt oder einer Frage
- Schlage am Ende 2-3 passende Folgefragen vor (als separate Zeile mit ">>>" Prefix)
  Beispiel: >>> Soll ich einen Kostenvoranschlag erstellen?`;

  return prompt;
}

function extractSmartSuggestions(reply: string, prompt: string): string[] {
  const suggestions: string[] = [];

  const suggestionLines = reply.split('\n').filter(l => l.trim().startsWith('>>>'));
  if (suggestionLines.length > 0) {
    suggestionLines.forEach(line => {
      const clean = line.replace(/^>>>/, '').trim();
      if (clean) suggestions.push(clean);
    });
  }

  if (suggestions.length === 0) {
    const lower = reply.toLowerCase();
    if (lower.includes('foto') || lower.includes('bild')) suggestions.push('Foto per WhatsApp senden');
    if (lower.includes('angebot') || lower.includes('kostenvoranschlag')) suggestions.push('Kostenvoranschlag anfordern');
    if (lower.includes('termin')) suggestions.push('Termin vereinbaren');
    if (lower.includes('standort') || lower.includes('adresse')) suggestions.push('Standorte anzeigen');
    if (lower.includes('leasing')) suggestions.push('Leasing-Rückgabe Beratung');
    if (lower.includes('versicherung')) suggestions.push('Versicherungsabwicklung');
    if (lower.includes('smart repair')) suggestions.push('Mehr zu Smart Repair');
    if (lower.includes('whatsapp')) suggestions.push('Per WhatsApp kontaktieren');
  }

  return suggestions.length > 0 ? suggestions.slice(0, 3) : ['Angebot einholen', 'Standorte anzeigen', 'Per WhatsApp kontaktieren'];
}

function cleanReplyFromSuggestions(reply: string): string {
  return reply.split('\n').filter(l => !l.trim().startsWith('>>>')).join('\n').trim();
}

export function registerAIRoutes(app: Express) {
  app.post("/api/ai/analyze-damage", async (req, res) => {
    try {
      const { photos, damageDescription } = req.body;
      
      if (!photos || photos.length === 0) {
        return res.status(400).json({ 
          error: "Mindestens ein Foto ist erforderlich" 
        });
      }

      const openaiApiKey = process.env.OPENAI_API_KEY_CORIONLACKDOKTOR || process.env.OPENAI_API_KEY;

      if (!openaiApiKey) {
        return res.json({
          suggestedDamageType: "sonstiges",
          suggestedPriority: "normal",
          analysis: "AI-Analyse nicht verfügbar. Bitte füllen Sie das Formular manuell aus.",
          estimatedCost: null,
        });
      }

      const systemPrompt = `Du bist ein Experte für Autoreparaturen bei +1 Corion Lackdoktor.
Analysiere die hochgeladenen Fotos und die Schadensbeschreibung und antworte mit JSON:
{
  "damageType": "smart-repair|unfallschaden|lackschaden|dellenentfernung|felgenreparatur|rostschaden|oldtimer|aufbereitung|autoglas|sonstiges",
  "severity": "gering|mittel|schwer",
  "priority": "low|normal|high|urgent",
  "analysis": "Deutsche Zusammenfassung des Schadens",
  "estimatedCostEUR": 100-5000,
  "estimatedDays": 1-30
}`;

      const messages = [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Schaden Beschreibung: ${damageDescription || 'Keine Beschreibung bereitgestellt'}.\n\nAnalysiere die Fotos und gebe eine detaillierte Einschätzung.`,
            },
            ...photos.slice(0, 4).map((photo: string) => ({
              type: 'image_url',
              image_url: { url: photo, detail: 'high' },
            })),
          ],
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
          temperature: 0.5,
          max_tokens: 500,
        }),
      });

      if (!openaiResponse.ok) {
        console.error('OpenAI Vision API error');
        return res.json({
          suggestedDamageType: "sonstiges",
          suggestedPriority: "normal",
          analysis: "Die Bildanalyse konnte nicht durchgeführt werden.",
          estimatedCost: null,
        });
      }

      const openaiData = await openaiResponse.json();
      const content = openaiData.choices[0]?.message?.content || '{}';
      
      try {
        const analysis = JSON.parse(content);
        res.json({
          suggestedDamageType: analysis.damageType || 'sonstiges',
          suggestedPriority: analysis.priority || 'normal',
          severity: analysis.severity || 'mittel',
          analysis: analysis.analysis || 'Analyse durchgeführt',
          estimatedCost: analysis.estimatedCostEUR || null,
          estimatedDays: analysis.estimatedDays || null,
        });
      } catch {
        res.json({
          suggestedDamageType: "sonstiges",
          suggestedPriority: "normal",
          analysis: content,
          estimatedCost: null,
        });
      }
    } catch (error) {
      console.error('Damage analysis error:', error);
      res.status(500).json({ error: 'Fehler bei der Schadensanalyse' });
    }
  });

  app.post("/api/ai", async (req, res) => {
    try {
      const { prompt, agentType, userContext, role, conversationHistory, scenario } = aiRequestSchema.parse(req.body);

      const openaiApiKey = process.env.OPENAI_API_KEY_CORIONLACKDOKTOR || process.env.OPENAI_API_KEY;

      if (!openaiApiKey) {
        console.warn('OpenAI API key not configured, using fallback responses');
        return res.json(getFallbackResponse(prompt, agentType));
      }

      const detectedScenario = scenario || detectScenario(prompt);
      const userRole = role || 'client';
      const systemPrompt = buildSystemPrompt(agentType, userRole, detectedScenario, prompt, userContext);

      const messages: any[] = [
        { role: 'system', content: systemPrompt },
      ];

      if (conversationHistory && conversationHistory.length > 0) {
        const recentHistory = conversationHistory.slice(-6);
        recentHistory.forEach(msg => {
          messages.push({ role: msg.role === 'assistant' ? 'assistant' : 'user', content: msg.content });
        });
      }

      messages.push({ role: 'user', content: prompt });

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
          max_tokens: 800,
        }),
      });

      if (!openaiResponse.ok) {
        const errorText = await openaiResponse.text();
        console.error('OpenAI API error:', errorText);
        return res.json(getFallbackResponse(prompt, agentType));
      }

      const openaiData = await openaiResponse.json();
      const rawReply = openaiData.choices[0]?.message?.content || 'Keine Antwort erhalten.';
      const reply = cleanReplyFromSuggestions(rawReply);
      const suggestions = extractSmartSuggestions(rawReply, prompt);
      const detectedIntent = detectedScenario;

      res.json({ reply, suggestions, scenario: detectedIntent });
    } catch (error) {
      console.error('AI route error:', error);
      res.status(500).json({
        reply: 'Entschuldigung, ein Fehler ist aufgetreten. Bitte kontaktieren Sie uns direkt unter 0176 834 582 74.',
      });
    }
  });

  app.get("/api/ai/status", (_req, res) => {
    const openaiApiKey = process.env.OPENAI_API_KEY_CORIONLACKDOKTOR || process.env.OPENAI_API_KEY;
    res.json({
      orchestrator: 'CORA',
      version: '2.0',
      agents: ['assistant', 'business', 'learning'],
      roles: ['client', 'partner'],
      scenarios: ['leasing', 'rust', 'insurance', 'price'],
      aiAvailable: !!openaiApiKey,
    });
  });
}

function getFallbackResponse(prompt: string, agentType: string) {
  const lowerPrompt = prompt.toLowerCase();

  if (lowerPrompt.includes('hallo') || lowerPrompt.includes('guten tag') || lowerPrompt.includes('hi')) {
    return {
      reply: 'Hallo! Willkommen bei +1 Corion Lackdoktor. Ich bin Ihr KI-Assistent. Wie kann ich Ihnen heute helfen? Ob Unfallschaden, Lackierung oder Smart Repair - ich bin für Sie da!',
      suggestions: ['Ich brauche ein Angebot', 'Welche Services bieten Sie an?', 'Wo sind Ihre Standorte?'],
    };
  }

  if (lowerPrompt.includes('leasing') || lowerPrompt.includes('rückgabe')) {
    return {
      reply: 'Leasing-Rückgabe? Da sind Sie bei uns genau richtig!\n\nWussten Sie: Jetzt reparieren ist ca. 50% günstiger als die Leasing-Strafzahlung. Wir kennen die Prüfkriterien und reparieren exakt nach Leasing-Standard.\n\nSenden Sie uns einfach Fotos des Schadens per WhatsApp (0176 834 582 74) und wir erstellen Ihnen einen kostenlosen Kostenvoranschlag.',
      suggestions: ['Foto per WhatsApp senden', 'Kostenvoranschlag anfordern', 'Mehr über Leasing-Service'],
    };
  }

  if (lowerPrompt.includes('angebot') || lowerPrompt.includes('preis') || lowerPrompt.includes('kosten')) {
    return {
      reply: 'Gerne erstellen wir Ihnen ein individuelles Angebot! Unser Kostenvoranschlag ist kostenlos.\n\nFür eine schnelle Einschätzung senden Sie uns bitte ein Foto des Schadens per WhatsApp (0176 834 582 74).\n\nUnsere Preise sind fair und transparent - und in der Regel 40-60% günstiger als die Vertragswerkstatt. Plus: 5 Jahre Garantie auf Lackierung!',
      suggestions: ['Per WhatsApp kontaktieren', 'Smart Repair Preise', 'Standorte anzeigen'],
    };
  }

  if (lowerPrompt.includes('standort') || lowerPrompt.includes('adresse') || lowerPrompt.includes('wo')) {
    return {
      reply: 'Wir sind an drei Standorten für Sie da:\n\nHofheim-Wallau - Wiesbadener Strasse\nMainz-Kastel - Wiesbadener Strasse 30\nWiesbaden\n\nTelefon: 0176 834 582 74\nWhatsApp: Gleiche Nummer\n\nWelcher Standort ist für Sie am besten erreichbar?',
      suggestions: ['Hofheim-Wallau', 'Mainz-Kastel', 'Wiesbaden'],
    };
  }

  if (lowerPrompt.includes('smart repair')) {
    return {
      reply: 'Smart Repair ist unsere Spezialität!\n\nVorteile:\n- Schnell: Oft am selben Tag fertig\n- Günstig: Ab 80EUR\n- Schonend: Kein Teileausbau nötig\n- Qualität: 5 Jahre Garantie auf Lackierung\n\nIdeal für kleine bis mittlere Schäden wie Kratzer, Dellen oder Steinschläge. Senden Sie uns ein Foto und wir sagen Ihnen, ob Smart Repair für Ihren Schaden geeignet ist!',
      suggestions: ['Foto senden für Einschätzung', 'Preise für Smart Repair', 'Termin vereinbaren'],
    };
  }

  if (lowerPrompt.includes('rost') || lowerPrompt.includes('kratzer')) {
    return {
      reply: 'Achtung: Kratzer und kleine Schäden können schnell zu Rost führen!\n\nEin unbehandelter Kratzer kann innerhalb weniger Monate zu einem teuren Rostschaden werden. Frühzeitig behandeln spart langfristig viel Geld.\n\nUnsere Empfehlung: Lassen Sie den Schaden jetzt günstig mit Smart Repair beheben - ab 80EUR.',
      suggestions: ['Foto per WhatsApp senden', 'Smart Repair Infos', 'Termin vereinbaren'],
    };
  }

  if (lowerPrompt.includes('service') || lowerPrompt.includes('leistung') || lowerPrompt.includes('reparatur')) {
    return {
      reply: 'Unsere Dienstleistungen im Überblick:\n\nUnfallschäden (inkl. Versicherungsabwicklung)\nLackschäden & Volllackierung\nSmart Repair (ab 80EUR)\nDellen entfernen (ab 60EUR)\nFelgenreparatur (ab 60EUR/Felge)\nRostschutz & Rostbeseitigung\nOldtimer-Restaurierung\nAutoaufbereitung\nAutoglas\n\nAlle Arbeiten mit 5 Jahren Garantie auf Lackierung!',
      suggestions: ['Smart Repair Details', 'Angebot einholen', 'Termin vereinbaren'],
    };
  }

  if (lowerPrompt.includes('versicherung') || lowerPrompt.includes('unfall')) {
    return {
      reply: 'Bei Versicherungsschäden kümmern wir uns um alles!\n\nUnser Service:\n- Kostenvoranschlag kostenlos\n- Komplette Versicherungsabwicklung\n- Direktabrechnung mit Versicherung\n- Sie müssen sich um nichts kümmern\n\nSenden Sie uns einfach Fotos des Schadens und wir starten den Prozess.',
      suggestions: ['Versicherungsschaden melden', 'Foto per WhatsApp senden', 'Termin vereinbaren'],
    };
  }

  return {
    reply: 'Vielen Dank für Ihre Nachricht! Ich bin der Lackdoktor Assistant von Corion.\n\nOb Lackschaden, Delle, Smart Repair oder Leasing-Rückgabe - wir finden die beste Lösung für Sie.\n\nKontaktieren Sie uns:\nTelefon: 0176 834 582 74\nWhatsApp: Gleiche Nummer\nE-Mail: coriongmbh@gmail.com',
    suggestions: ['Angebot einholen', 'Standorte anzeigen', 'Dienstleistungen ansehen'],
  };
}
