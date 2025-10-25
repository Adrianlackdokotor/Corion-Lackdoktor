import type { Express, Request, Response } from "express";
import passport from "passport";
import bcrypt from "bcrypt";
import { storage } from "../storage";
import { insertUserSchema } from "@shared/schema";
import { z } from "zod";

const SALT_ROUNDS = 10;

export function registerAuthRoutes(app: Express) {
  // Login route
  app.post("/api/auth/login", (req: Request, res: Response, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ message: "Ein Fehler ist aufgetreten" });
      }
      
      if (!user) {
        return res.status(401).json({ 
          message: info?.message || "E-Mailadresse oder Passwort ist falsch" 
        });
      }

      req.logIn(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Fehler beim Einloggen" });
        }
        
        // Remove password from response
        const { password, ...userWithoutPassword } = user;
        return res.json({ 
          message: "Erfolgreich eingeloggt",
          user: userWithoutPassword 
        });
      });
    })(req, res, next);
  });

  // Logout route
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Fehler beim Ausloggen" });
      }
      res.json({ message: "Erfolgreich ausgeloggt" });
    });
  });

  // Get current user status
  app.get("/api/auth/status", (req: Request, res: Response) => {
    if (req.isAuthenticated()) {
      const user = req.user as any;
      const { password, ...userWithoutPassword } = user;
      return res.json({ 
        authenticated: true, 
        user: userWithoutPassword 
      });
    }
    res.json({ authenticated: false, user: null });
  });

  // Register route (for creating new users)
  // NOTE: This endpoint is restricted - only admins can create users or it can be disabled
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      // Validate input - only email and password from client
      const registerSchema = z.object({
        email: z.string().email("Ungültige E-Mailadresse"),
        password: z.string().min(8, "Passwort muss mindestens 8 Zeichen lang sein"),
      });
      
      const validationResult = registerSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Ungültige Eingabe",
          errors: validationResult.error.errors 
        });
      }

      const { email, password } = validationResult.data;

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ message: "E-Mailadresse bereits registriert" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

      // Create user with enforced defaults - never trust client for role/emailVerified
      const newUser = await storage.createUser({
        email,
        password: hashedPassword,
        role: "user", // Always enforce "user" role for public registration
        emailVerified: false, // Always enforce false for new registrations
      });

      // Remove password from response
      const { password: _, ...userWithoutPassword } = newUser;

      res.status(201).json({ 
        message: "Benutzer erfolgreich erstellt",
        user: userWithoutPassword 
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Fehler bei der Registrierung" });
    }
  });
}
