import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import type { User } from "@shared/schema";
import type { Express, Request, Response, NextFunction } from "express";
import session from "express-session";

export function setupAuth(app: Express) {
  // Session configuration
  const sessionSecret = process.env.SESSION_SECRET || "corion-lackdoktor-secret-key-change-in-production";
  
  app.use(
    session({
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  // Configure Passport Local Strategy
  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          
          if (!user) {
            return done(null, false, { message: "E-Mailadresse oder Passwort ist falsch" });
          }

          const isValid = await bcrypt.compare(password, user.password);
          
          if (!isValid) {
            return done(null, false, { message: "E-Mailadresse oder Passwort ist falsch" });
          }

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  // Serialize user
  passport.serializeUser((user: Express.User, done) => {
    done(null, (user as User).id);
  });

  // Deserialize user
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
}

// Middleware to check if user is authenticated
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Nicht autorisiert" });
}

// Middleware to check if user is admin
export function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated() && (req.user as User).role === "admin") {
    return next();
  }
  res.status(403).json({ message: "Zugriff verweigert" });
}
