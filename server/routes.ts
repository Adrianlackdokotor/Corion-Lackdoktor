import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import passport from "passport";
import bcrypt from "bcrypt";
import { registerAIRoutes } from "./routes/ai";
import { registerContactRoutes } from "./routes/contact";
import { registerFranchiseRoutes } from "./routes/franchise";
import { registerPasswordResetRoutes } from "./routes/password-reset";
import { registerHubRoutes } from "./routes/hub";
import { registerTaskBoardRoutes } from "./routes/task-board";
import { registerUploadRoutes } from "./routes/uploads";
import { registerCfoInboxRoutes } from "./routes/cfo-inbox";
import { registerCfoFinanceRoutes } from "./routes/cfo-finance";
import { registerMaterialsKpiRoutes } from "./routes/materials-kpi";
import { registerFleetApiRoutes } from "./routes/fleet-api";
import { registerFleetAdminRoutes } from "./routes/fleet-admin";
import { startFleetWebhookScheduler, enqueueFleetWebhook } from "./services/fleetWebhooks";
import { registerPartnerPortalRoutes } from "./routes/partner-portal";
import { registerAdminFinanceRoutes } from "./routes/admin-finance";
import { registerGutachterRoutes } from "./routes/gutachter";
import { registerAcademyRoutes } from "./routes/academy";
import { registerMeisterAIRoutes } from "./routes/meister-ai";
import { registerClientSubmissionRoutes } from "./routes/client-submission";
import { registerAIDataEntryRoutes } from "./routes/ai-data-entry";
import { registerDocumentRoutes } from "./routes/documents";
import { registerAuftragRoutes } from "./routes/auftrag";
import { registerPartnersRoutes } from "./routes/partners";
import { registerSchedulerRoutes } from "./routes/scheduler";
import { registerWorkshopRoutes } from "./routes/workshop";
import { registerCoriRoutes } from "./routes/cori";
import { registerAgentTaskRoutes } from "./routes/agent-tasks";
import { registerSupervisorRoutes } from "./routes/supervisor";
import { registerIntakeRoutes } from "./routes/intake";
import { registerAgentEventRoutes } from "./routes/agent-events";
import { registerTelegramRoutes } from "./routes/telegram";
import { registerCommsRoutes } from "./routes/comms";
import { registerBookRoutes } from "./routes/book";
import { registerAdminCoraRoutes } from "./routes/admin-cora";
import { createPartnerAccount } from "./services/partnerAccounts";
import { startTaskBus } from "./services/taskBus";
import { getGoogleOAuthAuthUrl, saveGoogleOAuthTokenFromCode } from "./lib/google-drive-oauth";
import { insertRepairRequestSchema, insertMessageSchema, UserRole } from "@shared/schema";
import { generateSalesResponse } from "./ai-skills/sales";
import { processPartnerPayment } from "./financial-engine";

const PROTECTED_ADMIN_EMAIL = "adrianlackdoktor@gmail.com";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup email/password authentication
  setupAuth(app);

  // Debug route to check auth status
  app.get('/api/auth/debug', (req: any, res) => {
    try {
      const isAuth = req.isAuthenticated?.() || false;
      const user = req.user;
      res.json({
        isAuthenticated: isAuth,
        user: user ? { 
          id: user.claims?.sub,
          email: user.claims?.email,
          name: user.claims?.name 
        } : null,
        sessionId: req.sessionID
      });
    } catch (error) {
      res.json({ error: String(error) });
    }
  });

  // Auth routes
  // Register new user
  app.post('/api/auth/register', async (req: any, res) => {
    try {
      const { email, password, firstName, lastName, referralCode } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email und Passwort erforderlich" });
      }

      const existing = await storage.getUserByEmail(email);
      if (existing) {
        return res.status(400).json({ message: "E-Mail existiert bereits" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        firstName: firstName || null,
        lastName: lastName || null,
        role: "client",
        emailVerified: false,
        isApproved: true,
      });

      // Hub+1 Contribution Economy: capture referral attribution.
      // referralCode is the referrer's user.id (also exposed as ?ref= on landing).
      if (referralCode && typeof referralCode === "string" && referralCode !== user.id) {
        try {
          const referrer = await storage.getUser(referralCode);
          if (referrer) {
            await storage.createReferral({
              referrerId: referrer.id,
              referredUserId: user.id,
              status: "pending",
              rewardTokens: 0,
              source: "register",
            });
            console.log(`[Referral] ${user.email} attributed to ${referrer.email}`);
          }
        } catch (err) {
          console.error("[Referral] attribution failed (non-fatal):", err);
        }
      }

      req.login(user, (err: any) => {
        if (err) {
          return res.status(500).json({ message: "Login fehlgeschlagen" });
        }
        const { password, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registrierung fehlgeschlagen" });
    }
  });

  // Login user
  app.post('/api/auth/login', passport.authenticate('local'), (req: any, res) => {
    try {
      const user = req.user;
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login fehlgeschlagen" });
    }
  });

  // Get current user
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      let user = req.user;
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Auto-promote first user to admin if no admins exist
      if (user.role === "client") {
        const admins = await storage.getUsersByRole(UserRole.ADMIN);
        if (admins.length === 0) {
          user = await storage.updateUser(user.id, { role: UserRole.ADMIN, isApproved: true }) || user;
          console.log(`[Auth] First user ${user.email} promoted to admin`);
        }
      }
      
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Logout
  app.post('/api/auth/logout', (req: any, res) => {
    req.logout((err: any) => {
      if (err) {
        return res.status(500).json({ message: "Logout fehlgeschlagen" });
      }
      res.json({ message: "Logout erfolgreich" });
    });
  });

  // Update user profile
  app.patch('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { firstName, lastName, phone, company, address, city, postalCode } = req.body;
      
      const updatedUser = await storage.updateUser(userId, {
        firstName,
        lastName,
        phone,
        company,
        address,
        city,
        postalCode,
      });

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // ============== ADMIN ROUTES ==============
  
  // Get all users (admin only)
  app.get('/api/admin/users', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Zugriff verweigert" });
      }
      const users = await storage.getAllUsers();
      const safeUsers = users.map(({ password, ...user }) => user);
      res.json(safeUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get('/api/admin/users/:id', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Zugriff verweigert" });
      }
      const user = await storage.getUser(req.params.id);
      if (!user) return res.status(404).json({ message: "Benutzer nicht gefunden" });
      const { password, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Fehler beim Laden des Benutzers" });
    }
  });

  // Create user (admin only)
  app.post('/api/admin/users', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Nur Admins können Benutzer erstellen" });
      }
      const { email, password: rawPw, role, firstName, lastName, phone, company, address, city, postalCode, taxNumber, partnerSharePercent, partnerModel, materialPercent, preferredLanguage } = req.body;
      if (!email || !rawPw) {
        return res.status(400).json({ message: "E-Mail und Passwort erforderlich" });
      }
      const existing = await storage.getUserByEmail(email);
      if (existing) {
        return res.status(400).json({ message: "E-Mail existiert bereits" });
      }
      if (role === "partner") {
        try {
          const partner = await createPartnerAccount({
            email,
            password: rawPw,
            firstName,
            lastName,
            phone,
            company,
            address,
            city,
            postalCode,
            taxNumber,
            partnerSharePercent: partnerSharePercent ?? 40,
            materialPercent: materialPercent ?? 20,
            partnerModel: partnerModel ?? "B",
            preferredLanguage: preferredLanguage ?? "de",
          }, {
            userId: req.user.id,
            label: req.user.email ?? "admin",
            ip: req.ip,
          });
          return res.status(201).json(partner);
        } catch (error: any) {
          if (error?.message === "PARTNER_ACCOUNT_EXISTS") {
            return res.status(400).json({ message: "E-Mail existiert bereits" });
          }
          throw error;
        }
      }
      if (role && role !== "client" && role !== "admin" && role !== "cfo") {
        return res.status(400).json({ message: "Ungültige Benutzerrolle" });
      }
      const hashedPassword = await bcrypt.hash(rawPw, 10);
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        role: role || "client",
        firstName: firstName || null,
        lastName: lastName || null,
        phone: phone || null,
        company: company || null,
        address: address || null,
        city: city || null,
        postalCode: postalCode || null,
        taxNumber: taxNumber || null,
        partnerSharePercent: partnerSharePercent != null ? parseInt(partnerSharePercent) : null,
        materialPercent: materialPercent != null ? parseInt(materialPercent) : 20,
        partnerModel: partnerModel || "B",
        preferredLanguage: preferredLanguage || "de",
        emailVerified: true,
        isApproved: true,
      });
      const { password: _, ...safeUser } = user;
      res.status(201).json(safeUser);
    } catch (error) {
      console.error("Admin create user error:", error);
      res.status(500).json({ message: "Fehler beim Erstellen des Benutzers" });
    }
  });

  // Send welcome email to a user (admin only)
  app.post('/api/admin/users/:id/send-welcome', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Zugriff verweigert" });
      }
      const user = await storage.getUser(req.params.id);
      if (!user || !user.email) {
        return res.status(404).json({ message: "Benutzer oder E-Mail nicht gefunden" });
      }
      const { tempPassword } = req.body;
      const { sendEmail } = await import("./lib/resend");
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const roleLabel = user.role === "partner" ? "Partner" : user.role === "admin" ? "Admin" : "Kunde";
      const commissionText = user.partnerSharePercent ? `\nIhre Provisionsrate: ${user.partnerSharePercent}%` : "";
      await sendEmail({
        to: user.email,
        cc: "adrianlackdoktor@gmail.com",
        subject: `Willkommen bei Corion Lackdoktor – Ihre Zugangsdaten`,
        text: `Hallo ${user.firstName || ""} ${user.lastName || ""},\n\nIhr ${roleLabel}-Konto wurde erfolgreich erstellt.\n\nZugangsdaten:\nE-Mail: ${user.email}\nPasswort: ${tempPassword || "(vom Admin festgelegt)"}\n${commissionText}\n\nLogin: ${baseUrl}/login\n\nBitte ändern Sie Ihr Passwort nach dem ersten Login.\n\nMit freundlichen Grüßen,\nIhr Corion Lackdoktor Team`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #E53935; margin: 0;">Corion Lackdoktor</h1>
              <p style="color: #666; margin: 5px 0;">Ihr Partner für professionelle Fahrzeuglackierung</p>
            </div>
            <h2 style="color: #333;">Willkommen, ${user.firstName || ""} ${user.lastName || ""}!</h2>
            <p>Ihr <strong>${roleLabel}</strong>-Konto wurde erfolgreich erstellt.</p>
            <div style="background: #f5f5f5; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #E53935;">Ihre Zugangsdaten</h3>
              <p><strong>E-Mail:</strong> ${user.email}</p>
              <p><strong>Passwort:</strong> ${tempPassword || "(vom Admin festgelegt)"}</p>
              ${user.partnerSharePercent ? `<p><strong>Provisionsrate:</strong> ${user.partnerSharePercent}%</p>` : ""}
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${baseUrl}/login" style="display: inline-block; background-color: #E53935; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Jetzt einloggen</a>
            </div>
            <p style="color: #888; font-size: 13px;">Bitte ändern Sie Ihr Passwort nach dem ersten Login.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">Mit freundlichen Grüßen,<br/>Ihr Corion Lackdoktor Team</p>
          </div>
        `,
      });
      res.json({ success: true, message: "Willkommens-E-Mail gesendet" });
    } catch (error) {
      console.error("Send welcome email error:", error);
      res.status(500).json({ message: "Fehler beim Senden der E-Mail" });
    }
  });

  // Update user role/approval (admin only)
  app.patch('/api/admin/users/:id', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Zugriff verweigert" });
      }
      const { id } = req.params;
      const { role, isApproved, firstName, lastName, phone, company, address, city, postalCode, taxNumber, partnerSharePercent, preferredLanguage, newPassword } = req.body;

      // Geschützter Haupt-Admin: nur er selbst darf sein Konto ändern,
      // und Rolle/Freigabe dürfen nie entzogen werden (verhindert,
      // dass ein anderer Admin/CFO den Haupt-Admin entmachtet).
      const target = await storage.getUser(id);
      if (target?.email === PROTECTED_ADMIN_EMAIL) {
        if (req.user.email !== PROTECTED_ADMIN_EMAIL) {
          return res.status(403).json({ message: "Der Haupt-Admin darf nicht von anderen Benutzern geändert werden." });
        }
        if (role !== undefined && role !== "admin") {
          return res.status(403).json({ message: "Die Admin-Rolle des Haupt-Admins kann nicht entzogen werden." });
        }
        if (isApproved === false) {
          return res.status(403).json({ message: "Der Haupt-Admin kann nicht deaktiviert werden." });
        }
      }

      // Auto-approve when an admin promotes a user to the admin role and
      // hasn't explicitly set isApproved. Avoids hidden lockouts where a
      // freshly-promoted admin can't access admin-gated endpoints.
      const raw: any = { role, isApproved, firstName, lastName, phone, company, address, city, postalCode, taxNumber, partnerSharePercent, preferredLanguage };
      if (role === "admin" && isApproved === undefined) raw.isApproved = true;
      // Strip undefined so Drizzle does not nullify columns the caller
      // never intended to touch.
      const patch: any = Object.fromEntries(Object.entries(raw).filter(([, v]) => v !== undefined));

      // Optional password reset: only processed when non-empty string is provided.
      if (typeof newPassword === "string" && newPassword.trim().length >= 6) {
        patch.password = await bcrypt.hash(newPassword.trim(), 10);
      }

      const updatedUser = await storage.updateUser(id, patch);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete('/api/admin/users/:id', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Zugriff verweigert" });
      }
      const { id } = req.params;
      if (id === req.user.id) {
        return res.status(400).json({ message: "Sie können sich nicht selbst löschen" });
      }
      const target = await storage.getUser(id);
      if (target?.email === PROTECTED_ADMIN_EMAIL) {
        return res.status(403).json({ message: "Der Haupt-Admin kann nicht gelöscht werden." });
      }
      await storage.deleteUser(id);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting user:", error);
      if (error?.message === "Benutzer nicht gefunden") {
        return res.status(404).json({ message: "Benutzer nicht gefunden" });
      }
      if (error?.code === "23503") {
        return res.status(409).json({ message: "Benutzer kann nicht gelöscht werden, da noch verknüpfte Daten existieren (z.B. Aufträge, Anfragen)." });
      }
      res.status(500).json({ message: "Fehler beim Löschen des Benutzers" });
    }
  });

  // Get all repair requests (admin only)
  app.get('/api/admin/repair-requests', isAuthenticated, async (req, res) => {
    try {
      const requests = await storage.getAllRepairRequests();
      res.json(requests);
    } catch (error) {
      console.error("Error fetching repair requests:", error);
      res.status(500).json({ message: "Failed to fetch repair requests" });
    }
  });

  // Assign partner to repair request (admin only)
  app.patch('/api/admin/repair-requests/:id/assign', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { partnerId } = req.body;
      
      const updatedRequest = await storage.updateRepairRequest(id, { 
        partnerId,
        status: "quoted"
      });
      
      if (!updatedRequest) {
        return res.status(404).json({ message: "Repair request not found" });
      }

      // Create notification for partner
      await storage.createNotification({
        userId: partnerId,
        title: "Neue Reparaturanfrage",
        message: `Sie haben eine neue Reparaturanfrage erhalten: ${updatedRequest.title}`,
        type: "info",
        link: `/partner/repairs/${id}`,
      });

      res.json(updatedRequest);
    } catch (error) {
      console.error("Error assigning partner:", error);
      res.status(500).json({ message: "Failed to assign partner" });
    }
  });

  // Get franchise waitlist (admin only)
  app.get('/api/admin/franchise-waitlist', isAuthenticated, async (req, res) => {
    try {
      const entries = await storage.getAllFranchiseWaitlistEntries();
      res.json(entries);
    } catch (error) {
      console.error("Error fetching franchise waitlist:", error);
      res.status(500).json({ message: "Failed to fetch franchise waitlist" });
    }
  });

  app.get('/api/track/:referenceNumber', async (req, res) => {
    try {
      const order = await storage.getWorkshopOrderByReference(req.params.referenceNumber);
      if (!order) {
        return res.status(404).json({ message: "Auftrag nicht gefunden" });
      }
      res.json({
        referenceNumber: order.referenceNumber,
        status: order.status,
        customerName: order.customerName,
        vehicleMake: order.vehicleMake,
        vehicleModel: order.vehicleModel,
        vehiclePlate: order.vehiclePlate,
        damageDescription: order.damageDescription,
        orderDate: order.orderDate,
        deliveryDate: order.deliveryDate,
        pickupDate: order.pickupDate,
        paymentStatus: order.paymentStatus,
      });
    } catch (error) {
      console.error("Track order error:", error);
      res.status(500).json({ message: "Fehler beim Laden des Auftrags" });
    }
  });

  // ============== CLIENT ROUTES ==============

  // Get client's repair requests
  app.get('/api/client/repair-requests', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const requests = await storage.getRepairRequestsByClient(userId);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching repair requests:", error);
      res.status(500).json({ message: "Failed to fetch repair requests" });
    }
  });

  // Create repair request (client)
  app.post('/api/client/repair-requests', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const validatedData = insertRepairRequestSchema.parse({
        ...req.body,
        clientId: userId,
      });
      
      const request = await storage.createRepairRequest(validatedData);
      
      // Notify admins about new request
      const admins = await storage.getUsersByRole(UserRole.ADMIN);
      for (const admin of admins) {
        await storage.createNotification({
          userId: admin.id,
          title: "Neue Kundenanfrage",
          message: `Neue Reparaturanfrage: ${request.title}`,
          type: "info",
          link: `/admin/repairs/${request.id}`,
        });
      }

      res.status(201).json(request);
    } catch (error) {
      console.error("Error creating repair request:", error);
      res.status(500).json({ message: "Failed to create repair request" });
    }
  });

  // Get specific repair request (client)
  app.get('/api/client/repair-requests/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const request = await storage.getRepairRequest(id);
      
      if (!request) {
        return res.status(404).json({ message: "Repair request not found" });
      }

      // Check ownership
      if (request.clientId !== userId) {
        const user = await storage.getUser(userId);
        if (user?.role !== UserRole.ADMIN) {
          return res.status(403).json({ message: "Access denied" });
        }
      }

      res.json(request);
    } catch (error) {
      console.error("Error fetching repair request:", error);
      res.status(500).json({ message: "Failed to fetch repair request" });
    }
  });

  // ============== PARTNER ROUTES ==============

  // Get partner's assigned repair requests
  app.get('/api/partner/repair-requests', isAuthenticated, async (req: any, res) => {
    try {
      const role = req.user?.role;
      if (role !== "partner" && role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      const userId = req.user.id;
      const requests = await storage.getRepairRequestsByPartner(userId);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching repair requests:", error);
      res.status(500).json({ message: "Failed to fetch repair requests" });
    }
  });

  // Update repair request status (partner)
  app.patch('/api/partner/repair-requests/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { status, estimatedCost, estimatedDays, notes } = req.body;

      const request = await storage.getRepairRequest(id);
      
      if (!request) {
        return res.status(404).json({ message: "Repair request not found" });
      }

      // Check if partner is assigned
      if (request.partnerId !== userId) {
        const user = await storage.getUser(userId);
        if (user?.role !== UserRole.ADMIN) {
          return res.status(403).json({ message: "Access denied" });
        }
      }

      const updatedRequest = await storage.updateRepairRequest(id, {
        status,
        estimatedCost,
        estimatedDays,
        notes,
      });

      // Notify client about status update
      if (request.clientId) {
        await storage.createNotification({
          userId: request.clientId,
          title: "Status-Update",
          message: `Ihre Reparatur "${request.title}" hat einen neuen Status: ${status}`,
          type: "info",
          link: `/client/repairs/${id}`,
        });
      }

      res.json(updatedRequest);
    } catch (error) {
      console.error("Error updating repair request:", error);
      res.status(500).json({ message: "Failed to update repair request" });
    }
  });

  // ============== MESSAGES ==============

  // Get messages for a repair request
  app.get('/api/repair-requests/:id/messages', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const request = await storage.getRepairRequest(id);
      
      if (!request) {
        return res.status(404).json({ message: "Repair request not found" });
      }

      // Check access
      const user = await storage.getUser(userId);
      if (request.clientId !== userId && request.partnerId !== userId && user?.role !== UserRole.ADMIN) {
        return res.status(403).json({ message: "Access denied" });
      }

      const messages = await storage.getMessagesByRepairRequest(id);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Send message
  app.post('/api/repair-requests/:id/messages', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const request = await storage.getRepairRequest(id);
      
      if (!request) {
        return res.status(404).json({ message: "Repair request not found" });
      }

      // Check access
      const user = await storage.getUser(userId);
      if (request.clientId !== userId && request.partnerId !== userId && user?.role !== UserRole.ADMIN) {
        return res.status(403).json({ message: "Access denied" });
      }

      const validatedData = insertMessageSchema.parse({
        repairRequestId: id,
        senderId: userId,
        ...req.body,
      });

      const message = await storage.createMessage(validatedData);

      // Notify recipient
      const recipientId = userId === request.clientId ? request.partnerId : request.clientId;
      if (recipientId) {
        await storage.createNotification({
          userId: recipientId,
          title: "Neue Nachricht",
          message: `Sie haben eine neue Nachricht zu "${request.title}"`,
          type: "info",
          link: `/repairs/${id}`,
        });
      }

      res.status(201).json(message);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // ============== NOTIFICATIONS ==============

  // Get user notifications
  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const notifications = await storage.getNotificationsByUser(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  // Get unread notification count
  app.get('/api/notifications/unread-count', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const count = await storage.getUnreadNotificationCount(userId);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching notification count:", error);
      res.status(500).json({ message: "Failed to fetch notification count" });
    }
  });

  // Mark notification as read
  app.patch('/api/notifications/:id/read', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.markNotificationAsRead(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // ============== SALES ASSIST ==============
  app.post('/api/ai/sales-assist', isAuthenticated, async (req: any, res) => {
    try {
      const { query, car, damage } = req.body;
      if (!query) {
        return res.status(400).json({ message: "Query is required" });
      }
      if (!process.env.OPENAI_API_KEY) {
        return res.status(503).json({ message: "AI service not configured" });
      }
      const role = req.user?.role === "partner" ? "partner" : "client";
      const response = await generateSalesResponse(query, { role, car, damage });
      res.json({ response });
    } catch (error) {
      console.error("Sales assist error:", error);
      res.status(500).json({ message: "Sales assist failed" });
    }
  });

  // ============== PARTNER PAYMENT ==============
  app.post('/api/partner/payment', isAuthenticated, async (req: any, res) => {
    try {
      const { partnerId, jobAmount } = req.body;
      if (!partnerId || !jobAmount) {
        return res.status(400).json({ message: "partnerId and jobAmount required" });
      }
      const breakdown = await processPartnerPayment(partnerId, jobAmount);
      res.json(breakdown);
    } catch (error: any) {
      console.error("Payment processing error:", error);
      res.status(500).json({ message: error.message || "Payment processing failed" });
    }
  });

  // Register additional routes
  registerAIRoutes(app);
  registerContactRoutes(app);
  registerFranchiseRoutes(app);
  registerPasswordResetRoutes(app);
  registerHubRoutes(app);
  registerTaskBoardRoutes(app);
  registerUploadRoutes(app);
  registerCfoInboxRoutes(app);
  registerCfoFinanceRoutes(app);
  registerMaterialsKpiRoutes(app);
  registerFleetApiRoutes(app);
  registerFleetAdminRoutes(app);
  startFleetWebhookScheduler();
  registerPartnerPortalRoutes(app);
  app.get('/api/google/oauth/start', isAuthenticated, (req: any, res) => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Nur für Admins' });
    }
    try {
      res.redirect(getGoogleOAuthAuthUrl());
    } catch (error: any) {
      console.error('Google OAuth start error:', error);
      res.status(500).json({ message: error?.message || 'Google OAuth start failed' });
    }
  });

  app.get('/api/google/oauth/callback', isAuthenticated, async (req: any, res) => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Nur für Admins' });
    }
    try {
      const code = String(req.query.code || '');
      if (!code) return res.status(400).send('Missing OAuth code');
      await saveGoogleOAuthTokenFromCode(code);
      res.send('<html><body style="font-family: sans-serif; padding: 24px;"><h2>Google Drive verbunden</h2><p>OAuth token salvat local. Poți închide fereastra și reveni în Corion Hub.</p></body></html>');
    } catch (error: any) {
      console.error('Google OAuth callback error:', error);
      res.status(500).send(`Google OAuth callback failed: ${error?.message || error}`);
    }
  });

  registerAdminFinanceRoutes(app);
  registerGutachterRoutes(app);
  registerAcademyRoutes(app);
  registerMeisterAIRoutes(app);
  registerClientSubmissionRoutes(app);
  registerAIDataEntryRoutes(app);
  registerDocumentRoutes(app);
  registerAuftragRoutes(app);
  registerPartnersRoutes(app);
  registerSchedulerRoutes(app);
  registerWorkshopRoutes(app);
  registerCoriRoutes(app);
  registerAgentTaskRoutes(app);
  registerSupervisorRoutes(app);
  registerIntakeRoutes(app);
  registerAgentEventRoutes(app);
  registerTelegramRoutes(app);
  registerCommsRoutes(app);
  registerBookRoutes(app);
  registerAdminCoraRoutes(app);
  startTaskBus();

  // Faza A — A3: scheduler hourly tick for retention release.
  try {
    const { startRetentionReleaseScheduler } = await import("./services/payoutEngine");
    startRetentionReleaseScheduler();
  } catch (e: any) {
    console.error("[bootstrap] retention scheduler failed", e?.message);
  }

  // Faza B — B3: appointment reminder scheduler (5 min tick).
  try {
    const { startNotificationScheduler } = await import("./services/notificationService");
    startNotificationScheduler();
  } catch (e: any) {
    console.error("[bootstrap] notification scheduler failed", e?.message);
  }

  // Faza A — assert race-safety DB indexes are present at boot. The partial
  // UNIQUE index on token_ledger is created via raw SQL (drizzle-kit cannot
  // express partial uniques ergonomically), so we verify it on each start.
  try {
    const { db } = await import("../db/index");
    const { sql } = await import("drizzle-orm");
    // Auto-create the partial UNIQUE index on token_ledger if missing (db:push --force can drop it).
    await db.execute(sql`
      CREATE UNIQUE INDEX IF NOT EXISTS token_ledger_unique_job_event
        ON token_ledger (user_id, reason, related_auftrag_id)
        WHERE reason IN ('job_completed','warranty_retention_released');
    `);
    const res: any = await db.execute(sql`
      SELECT
        (SELECT COUNT(*) FROM pg_indexes WHERE indexname = 'token_ledger_unique_job_event')::int AS ledger_idx,
        (SELECT COUNT(*) FROM pg_indexes WHERE indexname = 'workshop_payouts_workshop_order_id_unique')::int AS payout_idx;
    `);
    const row: any = (res?.rows ?? res)[0] ?? {};
    const ledgerOk = Number(row.ledger_idx) > 0;
    const payoutOk = Number(row.payout_idx) > 0;
    if (!ledgerOk || !payoutOk) {
      console.error(
        "[bootstrap] CRITICAL: race-safety indexes missing — ledger:",
        row.ledger_idx,
        "payouts:",
        row.payout_idx,
        "— concurrent token mints may double-credit until applied.",
      );
    }
  } catch (e: any) {
    console.error("[bootstrap] index assertion failed", e?.message);
  }

  const httpServer = createServer(app);

  return httpServer;
}
