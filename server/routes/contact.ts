import type { Express, Request, Response } from "express";
import nodemailer from "nodemailer";
import path from "path";
import { z } from "zod";

const contactFormSchema = z.object({
  name: z.string().min(2, "Name muss mindestens 2 Zeichen lang sein"),
  email: z.string().email("Bitte geben Sie eine gültige E-Mail-Adresse ein"),
  telefon: z.string().optional(),
  nachricht: z.string().min(10, "Nachricht muss mindestens 10 Zeichen lang sein"),
  files: z.array(z.object({
    name: z.string(),
    type: z.string().optional(),
    data: z.string(),
    size: z.number().optional(),
  })).optional(),
});

export function registerContactRoutes(app: Express) {
  app.post("/api/contact", async (req: Request, res: Response) => {
    try {
      const validationResult = contactFormSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({
          status: "error",
          message: "Bitte füllen Sie alle Pflichtfelder aus (Name, E-Mail, Nachricht).",
        });
      }

      const { name, email, telefon, nachricht, files: uploadFiles } = validationResult.data;
      const fileArray = uploadFiles || [];

      let bodyText = "Neue Nachricht über das Kontaktformular:\n\n";
      bodyText += `Name: ${name}\n`;
      bodyText += `E-Mail: ${email}\n`;
      bodyText += `Telefon: ${telefon || "(nicht angegeben)"}\n\n`;
      bodyText += `Nachricht:\n${nachricht}\n`;

      if (fileArray.length > 0) {
        bodyText += `\nAnhänge: ${fileArray.length} Datei(en)\n`;
        fileArray.forEach(file => {
          const sizeMB = file.size ? (file.size / 1024 / 1024).toFixed(2) : "?";
          bodyText += `  - ${file.name} (${sizeMB} MB)\n`;
        });
      }

      const attachments = fileArray.map(file => ({
        filename: file.name,
        content: Buffer.from(file.data, "base64"),
      }));

      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: false,
        auth: process.env.SMTP_USER ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        } : undefined,
      });

      const mainMailOptions = {
        from: `"${name}" <${email}>`,
        to: "coriongmbh@gmail.com",
        cc: "adrianlackdoktor@gmail.com",
        bcc: "coriongmbh@gmail.com",
        subject: "Neue Anfrage über das Kontaktformular – Corion GmbH",
        text: bodyText,
        attachments: attachments,
      };

      let confirmMessage = `Hallo ${name},\n\n`;
      confirmMessage += "vielen Dank für Ihre Nachricht an Corion GmbH!\n";
      confirmMessage += "Wir haben Ihre Anfrage erhalten und werden uns so schnell wie möglich bei Ihnen melden.\n\n";
      
      if (fileArray.length > 0) {
        confirmMessage += "Ihre hochgeladenen Dateien:\n";
        fileArray.forEach(file => {
          confirmMessage += `  - ${file.name}\n`;
        });
        confirmMessage += "\n";
      }
      
      confirmMessage += "Standort Hofheim-Wallau\n";
      confirmMessage += "+49 176 83458274\n";
      confirmMessage += "www.corion-gmbh.de\n";
      confirmMessage += "E-Mail: coriongmbh@gmail.com\n\n";
      confirmMessage += "Mit freundlichen Grüßen,\n";
      confirmMessage += "Ihr Corion-Team";

      const confirmMailOptions = {
        from: '"Corion GmbH" <coriongmbh@gmail.com>',
        to: email,
        bcc: "coriongmbh@gmail.com",
        subject: "Bestätigung Ihrer Anfrage – Corion GmbH",
        text: confirmMessage,
        attachments: attachments,
      };

      if (process.env.NODE_ENV === 'development' || !process.env.SMTP_USER) {
        console.log('=== DEVELOPMENT MODE: Email would be sent ===');
        console.log('Main Email:', mainMailOptions);
        console.log('Confirmation Email:', confirmMailOptions);
        console.log('==========================================');
        
        return res.status(200).json({
          status: "success",
          message: `Nachricht erfolgreich gesendet (Entwicklungsmodus).${fileArray.length > 0 ? ` (${fileArray.length} Datei(en) angehängt)` : ""}`,
        });
      }

      try {
        await transporter.sendMail(mainMailOptions);
        await transporter.sendMail(confirmMailOptions);

        res.status(200).json({
          status: "success",
          message: `Nachricht erfolgreich gesendet.${fileArray.length > 0 ? ` (${fileArray.length} Datei(en) angehängt)` : ""}`,
        });
      } catch (emailError) {
        console.error('Email sending error:', emailError);
        res.status(500).json({
          status: "error",
          message: "Fehler beim Senden der E-Mail. Bitte versuchen Sie es erneut oder rufen Sie uns direkt an: 0176 834 582 74",
        });
      }

    } catch (error) {
      console.error('Contact form error:', error);
      res.status(500).json({
        status: "error",
        message: "Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.",
      });
    }
  });
}
