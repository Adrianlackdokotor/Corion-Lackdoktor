
import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("user"),
  emailVerified: boolean("email_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  // Partner Specifics
  partnerType: text("partner_type").default("standard"), // 'standard' (40%), 'premium' (60%)
  commissionRate: integer("commission_rate").default(40),
  // Gamification
  xp: integer("xp").default(0),
  level: integer("level").default(1),
  streakDays: integer("streak_days").default(0),
  // Financials
  tokenBalance: integer("token_balance").default(0),
  securityDepositTarget: integer("security_deposit_target").default(3000),
  securityDepositCurrent: integer("security_deposit_current").default(0),
  onboardingDebt: integer("onboarding_debt").default(0),
});

export const onboardingTasks = pgTable("onboarding_tasks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").default("pending"),
  cost: integer("cost").default(0),
  proofFile: text("proof_file"),
});

export const partnerDebts = pgTable("partner_debts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  amount: integer("amount").notNull(),
  reason: text("reason").notNull(),
  isPaid: boolean("is_paid").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tokenTransactions = pgTable("token_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  amount: integer("amount").notNull(),
  type: text("type").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});
