import type { Express, Request, Response } from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { storage } from "../storage";
import { sendEmail } from "../lib/resend";

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function registerPasswordResetRoutes(app: Express) {
  // Request password reset
  app.post("/api/auth/forgot-password", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          status: "error",
          message: "E-Mail-Adresse erforderlich",
        });
      }

      const user = await storage.getUserByEmail(email);
      
      // Always return success to prevent email enumeration
      if (!user) {
        return res.status(200).json({
          status: "success",
          message: "Falls ein Konto mit dieser E-Mail existiert, erhalten Sie einen Link zum Zurücksetzen des Passworts.",
        });
      }

      // Generate secure token - store hash, send original
      const token = crypto.randomBytes(32).toString("hex");
      const tokenHash = hashToken(token);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await storage.createPasswordResetToken(user.id, tokenHash, expiresAt);

      // Build reset URL
      const baseUrl = process.env.APP_URL || process.env.CORION_BASE_URL || "https://app.corion.app";
      const resetUrl = `${baseUrl}/reset-password?token=${token}`;

      // Email content
      let emailBody = `Hallo ${user.firstName || ""},\n\n`;
      emailBody += "Sie haben angefordert, Ihr Passwort zurückzusetzen.\n\n";
      emailBody += "Klicken Sie auf den folgenden Link, um ein neues Passwort festzulegen:\n";
      emailBody += `${resetUrl}\n\n`;
      emailBody += "Dieser Link ist 1 Stunde gültig.\n\n";
      emailBody += "Falls Sie diese Anfrage nicht gestellt haben, können Sie diese E-Mail ignorieren.\n\n";
      emailBody += "Mit freundlichen Grüßen,\n";
      emailBody += "Ihr Corion Team\n\n";
      emailBody += "---\n";
      emailBody += "Corion GmbH\n";
      emailBody += "📞 +49 176 83458274\n";
      emailBody += "🌐 www.corion-lackdoktor.de";

      // HTML version of the email
      const htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #E53935;">Passwort zurücksetzen</h2>
          <p>Hallo ${user.firstName || ""},</p>
          <p>Sie haben angefordert, Ihr Passwort zurückzusetzen.</p>
          <p>Klicken Sie auf den folgenden Button, um ein neues Passwort festzulegen:</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #E53935; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Passwort zurücksetzen
            </a>
          </p>
          <p style="color: #666; font-size: 14px;">Dieser Link ist 1 Stunde gültig.</p>
          <p style="color: #666; font-size: 14px;">Falls Sie diese Anfrage nicht gestellt haben, können Sie diese E-Mail ignorieren.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px;">
            Mit freundlichen Grüßen,<br>
            Ihr Corion Team<br><br>
            Corion GmbH<br>
            📞 +49 176 83458274<br>
            🌐 www.corion-lackdoktor.de
          </p>
        </div>
      `;

      // Send email via Resend (CC to adrianlackdoktor@gmail.com as per user requirements)
      try {
        await sendEmail({
          to: email,
          cc: "adrianlackdoktor@gmail.com",
          subject: "Passwort zurücksetzen – Corion GmbH",
          text: emailBody,
          html: htmlBody,
        });
        console.log('Password reset email sent successfully to:', email);
      } catch (emailError) {
        console.error('Failed to send password reset email:', emailError);
        // Still return success to prevent email enumeration
      }

      res.status(200).json({
        status: "success",
        message: "Falls ein Konto mit dieser E-Mail existiert, erhalten Sie einen Link zum Zurücksetzen des Passworts.",
      });

    } catch (error) {
      console.error("Password reset request error:", error);
      res.status(500).json({
        status: "error",
        message: "Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.",
      });
    }
  });

  // Verify reset token
  app.get("/api/auth/verify-reset-token", async (req: Request, res: Response) => {
    try {
      const { token } = req.query;

      if (!token || typeof token !== 'string') {
        return res.status(400).json({
          valid: false,
          message: "Token erforderlich",
        });
      }

      // Hash the provided token to compare with stored hash
      const tokenHash = hashToken(token);
      const resetToken = await storage.getPasswordResetToken(tokenHash);

      if (!resetToken) {
        return res.status(400).json({
          valid: false,
          message: "Ungültiger oder abgelaufener Link. Bitte fordern Sie einen neuen an.",
        });
      }

      res.status(200).json({
        valid: true,
        message: "Token ist gültig",
      });

    } catch (error) {
      console.error("Token verification error:", error);
      res.status(500).json({
        valid: false,
        message: "Ein Fehler ist aufgetreten.",
      });
    }
  });

  // Reset password
  app.post("/api/auth/reset-password", async (req: Request, res: Response) => {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        return res.status(400).json({
          status: "error",
          message: "Token und neues Passwort erforderlich",
        });
      }

      if (password.length < 8) {
        return res.status(400).json({
          status: "error",
          message: "Das Passwort muss mindestens 8 Zeichen lang sein",
        });
      }

      // Hash the provided token to compare with stored hash
      const tokenHash = hashToken(token);
      const resetToken = await storage.getPasswordResetToken(tokenHash);

      if (!resetToken) {
        return res.status(400).json({
          status: "error",
          message: "Ungültiger oder abgelaufener Link. Bitte fordern Sie einen neuen an.",
        });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Update user password
      await storage.updateUser(resetToken.userId, { password: hashedPassword });

      // Mark token as used
      await storage.markPasswordResetTokenUsed(resetToken.id);

      res.status(200).json({
        status: "success",
        message: "Passwort erfolgreich geändert. Sie können sich jetzt anmelden.",
      });

    } catch (error) {
      console.error("Password reset error:", error);
      res.status(500).json({
        status: "error",
        message: "Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.",
      });
    }
  });
}
