import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { insertFranchiseWaitlistSchema } from "../../shared/schema";
import { sendEmail } from "../lib/resend";

export function registerFranchiseRoutes(app: Express) {
  app.post("/api/franchise-waitlist", async (req: Request, res: Response) => {
    try {
      // Validate form data
      const validationResult = insertFranchiseWaitlistSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({
          status: "error",
          message: "Bitte füllen Sie alle Pflichtfelder aus.",
          errors: validationResult.error.errors
        });
      }

      const { name, email, phone, interestType, message } = validationResult.data;

      // Insert into database using storage layer
      await storage.createFranchiseWaitlistEntry({
        name,
        email,
        phone,
        interestType,
        message
      });

      // Build email body
      let bodyText = "Neue Franchise/Partner Wartelisten-Anmeldung:\n\n";
      bodyText += `👤 Name: ${name}\n`;
      bodyText += `📧 E-Mail: ${email}\n`;
      if (phone) {
        bodyText += `📞 Telefon: ${phone}\n`;
      }
      const interestLabels: Record<string, string> = {
        'freelancer': 'Modell A: Freelancer / Vopsitor Independent',
        'b2b': 'Modell B: B2B Partner / Service Existent',
        'franchise': 'Franchise (Unternehmer)',
        'partner': 'Partner (Handwerker)',
        'unsure': 'Noch unsicher'
      };
      bodyText += `🎯 Interesse: ${interestLabels[interestType] || interestType}\n\n`;
      
      if (message) {
        bodyText += `📝 Nachricht:\n${message}\n`;
      }

      bodyText += `\n⏰ Zeitstempel: ${new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin' })}\n`;

      // Build confirmation email for applicant
      const interestTypeTexts: Record<string, string> = {
        'freelancer': 'Modell A: Freelancer / Vopsitor Independent (bis 40% Anteil)',
        'b2b': 'Modell B: B2B Partner / Service Existent (10-40% Kommission)',
        'franchise': 'Franchise-Modell (Unternehmer)',
        'partner': 'Partner-Modell (Handwerker)',
        'unsure': 'unsere verschiedenen Partnerschaftsmodelle'
      };
      const interestTypeText = interestTypeTexts[interestType] || 'unsere verschiedenen Geschäftsmodelle';

      let confirmMessage = `Hallo ${name},\n\n`;
      confirmMessage += `vielen Dank für Ihr Interesse am ${interestTypeText} bei Corion Hub!\n\n`;
      confirmMessage += "Wir haben Ihre Anfrage erhalten und werden uns in Kürze bei Ihnen melden.\n\n";
      confirmMessage += "Was passiert als Nächstes?\n";
      confirmMessage += "• Sie erhalten ausführliche Informationen über das gewählte Modell\n";
      confirmMessage += "• Wir vereinbaren ein unverbindliches Erstgespräch\n";
      confirmMessage += "• Gemeinsam prüfen wir, welches Modell am besten zu Ihnen passt\n\n";
      confirmMessage += "Mehr Informationen:\n";
      confirmMessage += "🌐 Website: www.corion-lackdoktor.de\n";
      confirmMessage += "📧 E-Mail: coriongmbh@gmail.com\n";
      confirmMessage += "📞 Telefon: +49 176 83458274\n\n";
      confirmMessage += "Wir freuen uns darauf, gemeinsam mit Ihnen zu arbeiten!\n\n";
      confirmMessage += "Mit freundlichen Grüßen,\n";
      confirmMessage += "Ihr Corion Hub Team\n\n";
      confirmMessage += "---\n";
      confirmMessage += "Corion GmbH\n";
      confirmMessage += "Mainzer Str. 75, 65189 Wiesbaden";

      // Send emails via Resend (CC to adrianlackdoktor@gmail.com as per user requirements)
      try {
        // Send notification to business
        await sendEmail({
          to: "coriongmbh@gmail.com",
          cc: "adrianlackdoktor@gmail.com",
          subject: `🚀 Neue Partner-Anfrage (${interestLabels[interestType] || interestType}) – Corion Hub`,
          text: bodyText,
        });

        // Send confirmation to applicant
        await sendEmail({
          to: email,
          cc: "coriongmbh@gmail.com",
          subject: "Bestätigung Ihrer Partner-Anfrage – Corion Hub",
          text: confirmMessage,
        });

        console.log('Partner waitlist emails sent successfully to:', email);

        res.status(200).json({
          status: "success",
          message: "Erfolgreich zur Warteliste hinzugefügt. Sie erhalten in Kürze eine Bestätigungs-E-Mail.",
        });
      } catch (emailError) {
        console.error('Email sending error:', emailError);
        // Still return success since data was saved to database
        res.status(200).json({
          status: "success",
          message: "Ihre Daten wurden gespeichert. Wir melden uns bald bei Ihnen.",
        });
      }

    } catch (error) {
      console.error('Franchise waitlist error:', error);
      
      res.status(500).json({
        status: "error",
        message: "Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut oder kontaktieren Sie uns direkt.",
      });
    }
  });

  // Course waitlist endpoint (polishing course)
  app.post("/api/waitlist/polishing-course", async (req: Request, res: Response) => {
    try {
      const { name, email, phone, experience, course } = req.body;

      if (!name || !email) {
        return res.status(400).json({
          status: "error",
          message: "Name und E-Mail sind erforderlich.",
        });
      }

      // Build email body
      let bodyText = "Neue Kurs-Wartelisten-Anmeldung:\n\n";
      bodyText += `👤 Name: ${name}\n`;
      bodyText += `📧 E-Mail: ${email}\n`;
      if (phone) {
        bodyText += `📞 Telefon: ${phone}\n`;
      }
      bodyText += `📚 Kurs: ${course || 'Kratzerpolitur Kurs'}\n\n`;
      
      if (experience) {
        bodyText += `💼 Erfahrung:\n${experience}\n`;
      }

      bodyText += `\n⏰ Zeitstempel: ${new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin' })}\n`;

      // Send confirmation email to applicant
      let confirmMessage = `Hallo ${name},\n\n`;
      confirmMessage += "vielen Dank für Ihr Interesse am Kratzerpolitur Kurs der Corion Academy!\n\n";
      confirmMessage += "Wir haben Ihre Anmeldung zur Warteliste erhalten und werden Sie informieren, sobald der Kurs startet.\n\n";
      confirmMessage += "Was Sie erwartet:\n";
      confirmMessage += "• Professionelle Video-Anleitungen\n";
      confirmMessage += "• Schritt-für-Schritt Anweisungen\n";
      confirmMessage += "• Tipps vom Profi Adrian Apostol\n\n";
      confirmMessage += "Mehr Informationen:\n";
      confirmMessage += "🌐 Website: www.corion-lackdoktor.de\n";
      confirmMessage += "📧 E-Mail: coriongmbh@gmail.com\n";
      confirmMessage += "📞 Telefon: +49 176 83458274\n\n";
      confirmMessage += "Mit freundlichen Grüßen,\n";
      confirmMessage += "Ihr Corion Academy Team";

      // Send emails via Resend (CC to adrianlackdoktor@gmail.com as per user requirements)
      try {
        // Send notification to business
        await sendEmail({
          to: "coriongmbh@gmail.com",
          cc: "adrianlackdoktor@gmail.com",
          subject: `📚 Neue Kurs-Anmeldung – ${course || 'Kratzerpolitur Kurs'}`,
          text: bodyText,
        });

        // Send confirmation to applicant
        await sendEmail({
          to: email,
          cc: "coriongmbh@gmail.com",
          subject: "Bestätigung Ihrer Kurs-Wartelisten-Anmeldung – Corion Academy",
          text: confirmMessage,
        });

        console.log('Course waitlist emails sent successfully to:', email);

        res.status(200).json({
          status: "success",
          message: "Erfolgreich zur Warteliste hinzugefügt. Sie erhalten in Kürze eine Bestätigungs-E-Mail.",
        });
      } catch (emailError) {
        console.error('Email sending error:', emailError);
        res.status(200).json({
          status: "success",
          message: "Erfolgreich zur Warteliste hinzugefügt.",
        });
      }

    } catch (error) {
      console.error('Course waitlist error:', error);
      
      res.status(500).json({
        status: "error",
        message: "Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.",
      });
    }
  });
}
