import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { registerAIRoutes } from "./routes/ai";
import { registerAuthRoutes } from "./routes/auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // put application routes here
  // prefix all routes with /api

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByEmail(email)

  // Register authentication routes
  registerAuthRoutes(app);
  
  // Register AI routes
  registerAIRoutes(app);

  const httpServer = createServer(app);

  return httpServer;
}
