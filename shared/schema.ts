import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, timestamp, integer, jsonb, index, uniqueIndex, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User roles enum
export const UserRole = {
  ADMIN: "admin",
  CFO: "cfo",
  CLIENT: "client", 
  PARTNER: "partner",
  TECHNICIAN: "technician",
} as const;

export type UserRoleType = typeof UserRole[keyof typeof UserRole];

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - compatible with both Replit Auth and password auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").unique(),
  password: text("password"), // Optional - null for OAuth users
  role: text("role").notNull().default("client"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  phone: text("phone"),
  company: text("company"), // For partners - company name
  address: text("address"),
  city: text("city"),
  postalCode: text("postal_code"),
  taxNumber: text("tax_number"),
  partnerSharePercent: integer("partner_share_percent"),
  materialPercent: integer("material_percent").notNull().default(20),
  // Materials-KPI target % of labor revenue that should be reinvested in materials.
  // Default 40 (matches the 40/60 split shown to partners). Influences default
  // material_bde_percent on new auftrag orders for this partner.
  materialKpiTargetPercent: integer("material_kpi_target_percent").notNull().default(40),
  partnerModel: varchar("partner_model", { length: 1 }).default("B"), // A / B / C commission model
  preferredLanguage: varchar("preferred_language", { length: 8 }).notNull().default("de"),
  isTemporary: boolean("is_temporary").notNull().default(false),
  tempExpiresAt: timestamp("temp_expires_at"),
  emailVerified: boolean("email_verified").notNull().default(false),
  isApproved: boolean("is_approved").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Upsert type for Replit Auth
export type UpsertUser = {
  id: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  profileImageUrl?: string | null;
};

// Repair requests - inspired by Fixico
export const repairRequests = pgTable("repair_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull().references(() => users.id),
  partnerId: varchar("partner_id").references(() => users.id), // Assigned partner
  title: text("title").notNull(),
  description: text("description").notNull(),
  vehicleMake: text("vehicle_make"),
  vehicleModel: text("vehicle_model"),
  vehicleYear: text("vehicle_year"),
  licensePlate: text("license_plate"),
  damageType: text("damage_type"), // smart-repair, accident, dent, etc.
  photos: text("photos").array(), // Array of photo URLs
  status: text("status").notNull().default("pending"), // pending, quoted, accepted, in_progress, completed, cancelled
  estimatedCost: integer("estimated_cost"), // In cents
  finalCost: integer("final_cost"), // In cents
  estimatedDays: integer("estimated_days"),
  priority: text("priority").default("normal"), // low, normal, high, urgent
  notes: text("notes"),
  adminNotes: text("admin_notes"),
  locationId: text("location_id"), // Which Corion location
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertRepairRequestSchema = createInsertSchema(repairRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true,
});

export type InsertRepairRequest = z.infer<typeof insertRepairRequestSchema>;
export type RepairRequest = typeof repairRequests.$inferSelect;

// Messages between users for repair requests
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  repairRequestId: varchar("repair_request_id").notNull().references(() => repairRequests.id),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  receiverId: varchar("receiver_id").references(() => users.id),
  content: text("content").notNull(),
  attachments: text("attachments").array(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

// Notifications
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull().default("info"), // info, success, warning, error
  link: text("link"), // Optional link to navigate to
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

// Franchise waitlist (existing)
export const franchiseWaitlist = pgTable("franchise_waitlist", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  interestType: text("interest_type").notNull(),
  message: text("message"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertFranchiseWaitlistSchema = createInsertSchema(franchiseWaitlist).omit({
  id: true,
  createdAt: true,
});

export type InsertFranchiseWaitlist = z.infer<typeof insertFranchiseWaitlistSchema>;
export type FranchiseWaitlist = typeof franchiseWaitlist.$inferSelect;

// Course waitlist
export const courseWaitlist = pgTable("course_waitlist", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: text("course_id").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  experience: text("experience"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCourseWaitlistSchema = createInsertSchema(courseWaitlist).omit({
  id: true,
  createdAt: true,
});

export type InsertCourseWaitlist = z.infer<typeof insertCourseWaitlistSchema>;
export type CourseWaitlist = typeof courseWaitlist.$inferSelect;

// ============== CORION HUB ERP TABLES ==============

// Password reset tokens
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  token: varchar("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;

// Vehicles - customer cars
export const vehicles = pgTable("vehicles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: varchar("owner_id").references(() => users.id),
  vin: varchar("vin", { length: 17 }), // Fahrzeug-Identifizierungsnummer
  licensePlate: varchar("license_plate", { length: 15 }),
  make: text("make").notNull(), // Marke (VW, BMW, etc.)
  model: text("model").notNull(), // Modell (Golf, 3er, etc.)
  year: integer("year"),
  color: text("color"),
  mileage: integer("mileage"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertVehicleSchema = createInsertSchema(vehicles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type Vehicle = typeof vehicles.$inferSelect;

// Resources - Technicians and equipment (paint booths, etc.)
export const ResourceType = {
  TECHNICIAN: "technician",
  PAINT_BOOTH: "paint_booth",
  WORKSPACE: "workspace",
} as const;

export type ResourceTypeValue = typeof ResourceType[keyof typeof ResourceType];

export const resources = pgTable("resources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // "Alex (Vopsitor)", "Cabina 1"
  type: text("type").notNull(), // technician, paint_booth, workspace
  userId: varchar("user_id").references(() => users.id), // Link to user if technician
  color: varchar("color", { length: 7 }), // Hex color for calendar display
  isActive: boolean("is_active").notNull().default(true),
  skills: text("skills").array(), // ["lackierung", "smart-repair", "dellen"]
  hourlyRate: integer("hourly_rate"), // In cents, for cost calculations
  // Capacity model — 8h working day per technician (480 min); paint booths/bays
  // typically share the same default but can be overridden per resource.
  dailyWorkMinutes: integer("daily_work_minutes").notNull().default(480),
  // Number of cars that can physically occupy this resource at the same time.
  // For a technician this is usually 1; for a workshop/garage it can be 2-4.
  bayCount: integer("bay_count").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertResourceSchema = createInsertSchema(resources).omit({
  id: true,
  createdAt: true,
});

export type InsertResource = z.infer<typeof insertResourceSchema>;
export type Resource = typeof resources.$inferSelect;

// Orders - Main work orders (replaces/extends repairRequests for ERP)
export const OrderStatus = {
  PENDING_REVIEW: "pending_review",
  OFFER_CREATED: "offer_created",
  BOOKED: "booked",
  IN_REPAIR: "in_repair",
  QA_CHECK: "qa_check",
  COMPLETED: "completed",
  INVOICED: "invoiced",
  CANCELLED: "cancelled",
} as const;

export type OrderStatusValue = typeof OrderStatus[keyof typeof OrderStatus];

export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  referenceNumber: varchar("reference_number", { length: 20 }).unique(), // e.g., "DE8747ED"
  vehicleId: varchar("vehicle_id").references(() => vehicles.id),
  clientId: varchar("client_id").references(() => users.id),
  assignedResourceId: varchar("assigned_resource_id").references(() => resources.id),
  status: text("status").notNull().default("pending_review"),
  priority: text("priority").notNull().default("normal"), // low, normal, high, urgent
  damageDescription: text("damage_description"),
  damageLocation: text("damage_location"), // "Heckklappe", "Stoßstange", etc.
  postalCode: varchar("postal_code", { length: 10 }),
  estimatedDays: integer("estimated_days"),
  // Smart-calendar inputs captured at quoting time. workMinutes counts towards
  // partner's 8h/day capacity; dryingMinutes lets the scheduler stack cars.
  estimatedWorkMinutes: integer("estimated_work_minutes"),
  estimatedDryingMinutes: integer("estimated_drying_minutes"),
  complexity: text("complexity").default("standard"), // quick | standard | complex
  scheduledDate: timestamp("scheduled_date"),
  totalNetCents: integer("total_net_cents"), // Net amount in cents
  totalGrossCents: integer("total_gross_cents"), // Gross amount with tax
  notes: text("notes"),
  internalNotes: text("internal_notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  referenceNumber: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true,
});

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

// Line items - for offers and invoices
export const LineItemType = {
  LABOR: "labor",
  PART: "part",
  PAINT: "paint",
  MATERIAL: "material",
} as const;

export const lineItems = pgTable("line_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id),
  type: text("type").notNull(), // labor, part, paint, material
  descriptionDe: text("description_de").notNull(),
  quantity: integer("quantity").notNull().default(1),
  unitPriceNetCents: integer("unit_price_net_cents").notNull(),
  taxRate: integer("tax_rate").notNull().default(19), // 19% MwSt default
  awValue: integer("aw_value"), // Arbeitswert for labor items
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertLineItemSchema = createInsertSchema(lineItems).omit({
  id: true,
  createdAt: true,
});

export type InsertLineItem = z.infer<typeof insertLineItemSchema>;
export type LineItem = typeof lineItems.$inferSelect;

// Appointments - calendar entries linked to resources
export const appointments = pgTable("appointments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").references(() => orders.id),
  resourceId: varchar("resource_id").notNull().references(() => resources.id),
  title: text("title").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  allDay: boolean("all_day").notNull().default(false),
  status: text("status").notNull().default("scheduled"), // scheduled, in_progress, completed, cancelled, no_show
  notes: text("notes"),
  driveFolderUrl: text("drive_folder_url"),
  localFiles: jsonb("local_files"),
  linkedTaskIds: jsonb("linked_task_ids"),
  assignedPartnerUserId: varchar("assigned_partner_user_id").references(() => users.id),
  customerName: text("customer_name"),
  customerPhone: text("customer_phone"),
  vehicleLabel: text("vehicle_label"),
  priceInfo: text("price_info"),
  deadlineNote: text("deadline_note"),
  // Smart-calendar fields — split active labour from passive drying so the AI
  // scheduler can let two cars share a tech during paint cure time.
  workMinutes: integer("work_minutes").notNull().default(0),       // active labour, counts towards 8h/day cap
  dryingMinutes: integer("drying_minutes").notNull().default(0),   // passive cure / wait, does NOT count towards labour
  bayOccupied: boolean("bay_occupied").notNull().default(true),    // does this car block a physical bay
  complexity: text("complexity").notNull().default("standard"),    // quick | standard | complex
  colorOverride: varchar("color_override", { length: 7 }),         // optional hex override on top of resource color
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Appointment = typeof appointments.$inferSelect;

// Media files - photos, documents
export const MediaFileType = {
  IMAGE: "image",
  PDF: "pdf",
  DOCUMENT: "document",
} as const;

export const MediaFileTag = {
  DAMAGE_BEFORE: "damage_before",
  DAMAGE_AFTER: "damage_after",
  INVOICE: "invoice",
  PARTS_LIST: "parts_list",
  ESTIMATE: "estimate",
  OTHER: "other",
} as const;

export const mediaFiles = pgTable("media_files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").references(() => orders.id),
  vehicleId: varchar("vehicle_id").references(() => vehicles.id),
  fileType: text("file_type").notNull(), // image, pdf, document
  tag: text("tag").notNull().default("other"), // damage_before, damage_after, invoice, etc.
  url: text("url").notNull(),
  fileName: text("file_name"),
  fileSizeBytes: integer("file_size_bytes"),
  mimeType: text("mime_type"),
  aiAnalysis: jsonb("ai_analysis"), // Store AI damage analysis results
  uploadedById: varchar("uploaded_by_id").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertMediaFileSchema = createInsertSchema(mediaFiles).omit({
  id: true,
  createdAt: true,
});

export type InsertMediaFile = z.infer<typeof insertMediaFileSchema>;
export type MediaFile = typeof mediaFiles.$inferSelect;

// Invoices
export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id),
  invoiceNumber: varchar("invoice_number", { length: 20 }).unique().notNull(),
  totalNetCents: integer("total_net_cents").notNull(),
  totalTaxCents: integer("total_tax_cents").notNull(),
  totalGrossCents: integer("total_gross_cents").notNull(),
  isPaid: boolean("is_paid").notNull().default(false),
  paidAt: timestamp("paid_at"),
  dueDate: timestamp("due_date"),
  pdfUrl: text("pdf_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
});

export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;

// ============== FINANCIAL CALCULATOR (BWA) ==============

export const StakeholderRole = {
  OWNER: "owner",
  PARTNER: "partner",
  INVESTOR: "investor",
  MANAGER: "manager",
} as const;

export type StakeholderRoleType = typeof StakeholderRole[keyof typeof StakeholderRole];

export const financialProfiles = pgTable("financial_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  name: text("name").notNull(),
  role: text("role").notNull().default("partner"),
  company: text("company"),
  ownershipPercent: integer("ownership_percent"),
  profitSharePercent: integer("profit_share_percent").notNull().default(15),
  investmentSharePercent: integer("investment_share_percent").notNull().default(15),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertFinancialProfileSchema = createInsertSchema(financialProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertFinancialProfile = z.infer<typeof insertFinancialProfileSchema>;
export type FinancialProfile = typeof financialProfiles.$inferSelect;

export const bwaEntries = pgTable("bwa_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  profileId: varchar("profile_id").notNull().references(() => financialProfiles.id),
  period: varchar("period", { length: 7 }).notNull(),
  revenue: integer("revenue").notNull().default(0),
  materialCosts: integer("material_costs").notNull().default(0),
  externalServices: integer("external_services").notNull().default(0),
  personnelCosts: integer("personnel_costs").notNull().default(0),
  rentCosts: integer("rent_costs").notNull().default(0),
  taxInsurance: integer("tax_insurance").notNull().default(0),
  vehicleCosts: integer("vehicle_costs").notNull().default(0),
  marketingCosts: integer("marketing_costs").notNull().default(0),
  miscCosts: integer("misc_costs").notNull().default(0),
  otherExpenses: integer("other_expenses").notNull().default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertBwaEntrySchema = createInsertSchema(bwaEntries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertBwaEntry = z.infer<typeof insertBwaEntrySchema>;
export type BwaEntry = typeof bwaEntries.$inferSelect;

// ============ Finance Dashboard Tables ============

export const expenseCategories = pgTable("expense_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  type: text("type").notNull().default("variable"),
  targetGuwPercent: integer("target_guw_percent").notNull().default(0),
  isDefault: boolean("is_default").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertExpenseCategorySchema = createInsertSchema(expenseCategories).omit({
  id: true,
  createdAt: true,
});

export type InsertExpenseCategory = z.infer<typeof insertExpenseCategorySchema>;
export type ExpenseCategory = typeof expenseCategories.$inferSelect;

export const financialTransactions = pgTable("financial_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  date: timestamp("date").notNull(),
  type: text("type").notNull(),
  amountCents: integer("amount_cents").notNull(),
  categoryId: varchar("category_id"),
  description: text("description"),
  paymentMethod: text("payment_method"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertFinancialTransactionSchema = createInsertSchema(financialTransactions).omit({
  id: true,
  createdAt: true,
});

export type InsertFinancialTransaction = z.infer<typeof insertFinancialTransactionSchema>;
export type FinancialTransaction = typeof financialTransactions.$inferSelect;

// ============== PARTNER PORTAL / CRM TABLES ==============

// Client status tags
export const ClientStatus = {
  LEAD: "lead",
  ACTIVE: "active",
  LOST: "lost",
} as const;

export type ClientStatusType = typeof ClientStatus[keyof typeof ClientStatus];

// Client profiles - extends user data with CRM-specific fields
export const clients = pgTable("clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  partnerId: varchar("partner_id").references(() => users.id),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  company: text("company"),
  address: text("address"),
  city: text("city"),
  postalCode: text("postal_code"),
  status: text("status").notNull().default("lead"),
  vehicleMake: text("vehicle_make"),
  vehicleModel: text("vehicle_model"),
  vehicleYear: text("vehicle_year"),
  licensePlate: text("license_plate"),
  vin: text("vin"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;

// Client interactions / notes history
export const clientInteractions = pgTable("client_interactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull().references(() => clients.id),
  userId: varchar("user_id").references(() => users.id),
  type: text("type").notNull().default("note"),
  content: text("content").notNull(),
  orderId: varchar("order_id").references(() => orders.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertClientInteractionSchema = createInsertSchema(clientInteractions).omit({
  id: true,
  createdAt: true,
});

export type InsertClientInteraction = z.infer<typeof insertClientInteractionSchema>;
export type ClientInteraction = typeof clientInteractions.$inferSelect;

// Offers / Quotations
export const OfferStatus = {
  DRAFT: "draft",
  SENT: "sent",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
  EXPIRED: "expired",
} as const;

export type OfferStatusType = typeof OfferStatus[keyof typeof OfferStatus];

export const offers = pgTable("offers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  offerNumber: varchar("offer_number", { length: 20 }).unique(),
  orderId: varchar("order_id").references(() => orders.id),
  partnerId: varchar("partner_id").references(() => users.id),
  clientId: varchar("client_id").references(() => clients.id),
  clientName: text("client_name"),
  vehicleInfo: text("vehicle_info"),
  licensePlate: text("license_plate"),
  status: text("status").notNull().default("draft"),
  repairDescription: text("repair_description"),
  estimatedDays: integer("estimated_days"),
  subtotalCents: integer("subtotal_cents").notNull().default(0),
  discountCents: integer("discount_cents").notNull().default(0),
  taxRate: integer("tax_rate").notNull().default(19),
  totalNetCents: integer("total_net_cents").notNull().default(0),
  totalTaxCents: integer("total_tax_cents").notNull().default(0),
  totalGrossCents: integer("total_gross_cents").notNull().default(0),
  materialPercent: integer("material_percent").notNull().default(20),
  materialCostCents: integer("material_cost_cents").notNull().default(0),
  netAfterMaterialCents: integer("net_after_material_cents").notNull().default(0),
  partnerSharePercent: integer("partner_share_percent").notNull().default(40),
  partnerCommissionCents: integer("partner_commission_cents").notNull().default(0),
  corionCommissionCents: integer("corion_commission_cents").notNull().default(0),
  workshopOrderId: varchar("workshop_order_id").references(() => workshopOrders.id),
  clientUserId: varchar("client_user_id").references(() => users.id),
  validUntil: timestamp("valid_until"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertOfferSchema = createInsertSchema(offers).omit({
  id: true,
  offerNumber: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertOffer = z.infer<typeof insertOfferSchema>;
export type Offer = typeof offers.$inferSelect;

// Offer line items
export const offerLineItems = pgTable("offer_line_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  offerId: varchar("offer_id").notNull().references(() => offers.id),
  type: text("type").notNull().default("labor"),
  description: text("description").notNull(),
  quantity: integer("quantity").notNull().default(1),
  unitPriceCents: integer("unit_price_cents").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertOfferLineItemSchema = createInsertSchema(offerLineItems).omit({
  id: true,
  createdAt: true,
});

export type InsertOfferLineItem = z.infer<typeof insertOfferLineItemSchema>;
export type OfferLineItem = typeof offerLineItems.$inferSelect;

// Partner revenue transactions
export const PartnerTransactionStatus = {
  PENDING: "pending",
  PAID: "paid",
  CANCELLED: "cancelled",
} as const;

export const partnerTransactions = pgTable("partner_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  partnerId: varchar("partner_id").notNull().references(() => users.id),
  orderId: varchar("order_id").references(() => orders.id),
  invoiceId: varchar("invoice_id").references(() => invoices.id),
  description: text("description").notNull(),
  revenueCents: integer("revenue_cents").notNull().default(0),
  commissionPercent: integer("commission_percent").notNull().default(80),
  commissionCents: integer("commission_cents").notNull().default(0),
  status: text("status").notNull().default("pending"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPartnerTransactionSchema = createInsertSchema(partnerTransactions).omit({
  id: true,
  createdAt: true,
});

export type InsertPartnerTransaction = z.infer<typeof insertPartnerTransactionSchema>;
export type PartnerTransaction = typeof partnerTransactions.$inferSelect;

// ============== DAILY FINANCIAL ENTRIES (Break Even Excel) ==============

export const dailyFinancialEntries = pgTable("daily_financial_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  partnerId: varchar("partner_id").notNull().references(() => users.id),
  entryDate: timestamp("entry_date").notNull(),
  cashAmount: integer("cash_amount").notNull().default(0),
  invoiceGross: integer("invoice_gross").notNull().default(0),
  invoiceAccount: integer("invoice_account").notNull().default(0),
  paymentStatus: text("payment_status").notNull().default("unpaid"),
  variableCosts: integer("variable_costs").notNull().default(0),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertDailyFinancialEntrySchema = createInsertSchema(dailyFinancialEntries).omit({
  id: true,
  createdAt: true,
});

export type InsertDailyFinancialEntry = z.infer<typeof insertDailyFinancialEntrySchema>;
export type DailyFinancialEntry = typeof dailyFinancialEntries.$inferSelect;

// ============== FIXED COST ITEMS ==============

export const fixedCostItems = pgTable("fixed_cost_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  partnerId: varchar("partner_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  amountCents: integer("amount_cents").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertFixedCostItemSchema = createInsertSchema(fixedCostItems).omit({
  id: true,
  createdAt: true,
});

export type InsertFixedCostItem = z.infer<typeof insertFixedCostItemSchema>;
export type FixedCostItem = typeof fixedCostItems.$inferSelect;

// ============== WORKSHOP ORDERS (Werkstatt Auftrag) ==============

export const workshopOrders = pgTable("workshop_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  referenceNumber: varchar("reference_number", { length: 20 }).unique(),
  orderDate: timestamp("order_date").notNull(),
  customerName: text("customer_name").notNull(),
  customerAddress: text("customer_address"),
  customerPhone: text("customer_phone"),
  customerEmail: text("customer_email"),
  vehicleMake: text("vehicle_make"),
  vehicleModel: text("vehicle_model"),
  vehiclePlate: text("vehicle_plate"),
  vehicleVin: text("vehicle_vin"),
  vehicleColor: text("vehicle_color"),
  vehicleMileage: text("vehicle_mileage"),
  damageDescription: text("damage_description").notNull(),
  priorDamage: text("prior_damage"),
  deliveryDate: timestamp("delivery_date"),
  pickupDate: timestamp("pickup_date"),
  customerSignature: text("customer_signature"),
  partnerId: varchar("partner_id").references(() => users.id),
  clientUserId: varchar("client_user_id").references(() => users.id),
  scheduledDate: timestamp("scheduled_date"),
  appointmentId: varchar("appointment_id"),
  driveFolderUrl: text("drive_folder_url"),
  localFolderPath: text("local_folder_path"),
  libraryKey: text("library_key"),
  status: text("status").notNull().default("open"),
  paymentStatus: text("payment_status").notNull().default("offen"),
  paidAmountCents: integer("paid_amount_cents").notNull().default(0),
  paymentMethod: text("payment_method"),
  attachments: jsonb("attachments").default([]),
  totalAmountCents: integer("total_amount_cents").notNull().default(0),
  laborAmountCents: integer("labor_amount_cents").notNull().default(0),
  partsAmountCents: integer("parts_amount_cents").notNull().default(0),
  partnerCommissionCentsCalc: integer("partner_commission_cents_calc").notNull().default(0),
  // Multi-partner split (optional). When set, overrides single-partner share.
  // Shape: [{partnerId, sharePercent, label?}, ...]. Sum may exceed/be < 100;
  // Corion gets the residual = max(0, baseForSplit − sum(partnerGrossShares)).
  partnerSplitsJson: jsonb("partner_splits_json").$type<Array<{partnerId: string; sharePercent: number; label?: string | null}>>().default([]),
  // When TRUE, materials are billed separately to the customer and the 20%
  // material deduction (Materialabzug) is forced to 0 for partner split calc.
  materialsBilledSeparately: boolean("materials_billed_separately").notNull().default(false),
  // Per-order override for material BDE %. Null = use partner profile default.
  materialBdePercentOverride: integer("material_bde_percent_override"),
  // Faza A — Money flow corect: persistă rezultatul calculateAuftrag() pe order.
  partnerPayoutNetCents: integer("partner_payout_net_cents").notNull().default(0),
  corionShareCents: integer("corion_share_cents").notNull().default(0),
  materialDeductionCents: integer("material_deduction_cents").notNull().default(0),
  warrantyRetentionCents: integer("warranty_retention_cents").notNull().default(0),
  splitCalculatedAt: timestamp("split_calculated_at"),
  tokensMintedAt: timestamp("tokens_minted_at"),
  // Faza B — notification idempotency
  partnerNotifiedAt: timestamp("partner_notified_at"),
  appointmentNotifiedFor: timestamp("appointment_notified_for"),
  repairProtocolJson: jsonb("repair_protocol_json"),
  partnerDescriptionTranslations: jsonb("partner_description_translations").$type<Record<string, string>>().default({}),
  meisterSnapshotJson: jsonb("meister_snapshot_json").$type<{
    translatedDescription?: string;
    workAdvice?: string;
    riskNotes?: string[];
    suggestedNextStep?: string;
    analyzedAt?: string;
    model?: string;
  }>().default({}),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertWorkshopOrderSchema = createInsertSchema(workshopOrders).omit({
  id: true,
  referenceNumber: true,
  createdAt: true,
});

export type InsertWorkshopOrder = z.infer<typeof insertWorkshopOrderSchema>;
export type WorkshopOrder = typeof workshopOrders.$inferSelect;

// ============== Faza A — Workshop Payouts (money flow + token mint) ==============
// Per-order ledger of partner payouts. Created when payment_status flips to
// 'bezahlt'. Drives the token mint (1 token = 1€ commission) and tracks the
// 12-month Sicherheitseinbehalt release.
export const workshopPayouts = pgTable("workshop_payouts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  // UNIQUE — exactly one payout row per workshop order. Hard idempotency guard
  // so concurrent /payment PATCH calls cannot create two payouts / mint twice.
  workshopOrderId: varchar("workshop_order_id").notNull().unique()
    .references(() => workshopOrders.id, { onDelete: "cascade" }),
  partnerId: varchar("partner_id").notNull().references(() => users.id),
  partnerGrossShareCents: integer("partner_gross_share_cents").notNull().default(0),
  partnerPayoutNetCents: integer("partner_payout_net_cents").notNull().default(0),
  warrantyRetentionCents: integer("warranty_retention_cents").notNull().default(0),
  corionShareCents: integer("corion_share_cents").notNull().default(0),
  // pending | paid | retention_released | forfeit
  status: text("status").notNull().default("pending"),
  tokensMinted: boolean("tokens_minted").notNull().default(false),
  tokensMintedAmount: integer("tokens_minted_amount").notNull().default(0),
  retentionTokensMinted: boolean("retention_tokens_minted").notNull().default(false),
  retentionTokensAmount: integer("retention_tokens_amount").notNull().default(0),
  paidAt: timestamp("paid_at"),
  retentionReleasedAt: timestamp("retention_released_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertWorkshopPayoutSchema = createInsertSchema(workshopPayouts).omit({
  id: true,
  createdAt: true,
});
export type InsertWorkshopPayout = z.infer<typeof insertWorkshopPayoutSchema>;
export type WorkshopPayout = typeof workshopPayouts.$inferSelect;

// ============== FILE ATTACHMENTS (Database-stored files) ==============

export const fileAttachments = pgTable("file_attachments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  // Nullable so the table doubles as a generic upload store when no order
  // is attached yet (e.g. CFO inbox drops, partner before/after, ad-hoc).
  workshopOrderId: varchar("workshop_order_id").references(() => workshopOrders.id, { onDelete: "cascade" }),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  data: text("data").notNull(),
  driveFileId: text("drive_file_id"),
  driveLink: text("drive_link"),
  uploadedBy: varchar("uploaded_by").references(() => users.id),
  // Free-form bucket so the upload endpoint can route into different
  // workflows: cfo_inbox, partner_post, document, generic, …
  category: text("category"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertFileAttachmentSchema = createInsertSchema(fileAttachments).omit({
  id: true,
  createdAt: true,
});

export type InsertFileAttachment = z.infer<typeof insertFileAttachmentSchema>;
export type FileAttachment = typeof fileAttachments.$inferSelect;

// ============== FAZA C — DOCUMENT HUB: Audit Logs & Invoices ==============

export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  actorUserId: varchar("actor_user_id").references(() => users.id, { onDelete: "set null" }),
  actorLabel: text("actor_label"),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: varchar("entity_id"),
  meta: jsonb("meta"),
  ip: text("ip"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => ({
  byEntity: index("audit_logs_entity_idx").on(t.entityType, t.entityId),
  byCreated: index("audit_logs_created_at_idx").on(t.createdAt),
  byAction: index("audit_logs_action_idx").on(t.action),
}));

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;

// CFO Inbox — incoming supplier invoices (separate from outgoing customer `invoices` table).
export const supplierInvoices = pgTable("supplier_invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fileAttachmentId: varchar("file_attachment_id")
    .notNull()
    .references(() => fileAttachments.id, { onDelete: "cascade" }),
  workshopOrderId: varchar("workshop_order_id").references(() => workshopOrders.id, { onDelete: "set null" }),
  supplierName: text("supplier_name"),
  invoiceNumber: text("invoice_number"),
  invoiceDate: text("invoice_date"), // ISO YYYY-MM-DD; text avoids drizzle/neon-http date parse quirks
  totalCents: integer("total_cents"),
  vatCents: integer("vat_cents"),
  currency: text("currency").default("EUR"),
  status: text("status").notNull().default("pending_approval"), // pending_approval | approved | rejected
  extractedJson: jsonb("extracted_json"),
  notes: text("notes"),
  approvedBy: varchar("approved_by").references(() => users.id, { onDelete: "set null" }),
  approvedAt: timestamp("approved_at"),
  rejectedReason: text("rejected_reason"),
  // AI-classified flag: true when invoice content is materials (paint, lacquer,
  // parts, consumables, body filler, abrasives, etc.) — used to compute the
  // per-partner Material-KPI vs target.
  isMaterial: boolean("is_material").notNull().default(false),
  // AI-extracted partner attribution (matched by name from invoice text or
  // attachment metadata). Nullable when no match.
  partnerId: varchar("partner_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => ({
  byStatus: index("supplier_invoices_status_idx").on(t.status),
  byOrder: index("supplier_invoices_workshop_order_idx").on(t.workshopOrderId),
  byAttachment: uniqueIndex("supplier_invoices_file_attachment_unique").on(t.fileAttachmentId),
  byPartner: index("supplier_invoices_partner_idx").on(t.partnerId),
  byMaterial: index("supplier_invoices_is_material_idx").on(t.isMaterial),
}));

export const insertSupplierInvoiceSchema = createInsertSchema(supplierInvoices).omit({
  id: true,
  createdAt: true,
  approvedAt: true,
});
export type InsertSupplierInvoice = z.infer<typeof insertSupplierInvoiceSchema>;
export type SupplierInvoice = typeof supplierInvoices.$inferSelect;

// ============== CRM & AI: Order CRM Links / Follow-Ups / Timeline / AI Insights ==============
// Salesforce/HubSpot-style CRM enrichment for every workshop order.
// Independent tables so we can iterate without touching workshopOrders.

export const orderCrmLinks = pgTable("order_crm_links", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workshopOrderId: varchar("workshop_order_id").notNull()
    .references(() => workshopOrders.id, { onDelete: "cascade" }),
  // customer_crm | insurance | leasing | whatsapp | email | drive | gutachten | hub_task | partner_system | other
  kind: text("kind").notNull(),
  label: text("label").notNull(),
  url: text("url").notNull(),
  notes: text("notes"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
export const insertOrderCrmLinkSchema = createInsertSchema(orderCrmLinks).omit({
  id: true, createdAt: true,
});
export type InsertOrderCrmLink = z.infer<typeof insertOrderCrmLinkSchema>;
export type OrderCrmLink = typeof orderCrmLinks.$inferSelect;

export const orderFollowUps = pgTable("order_follow_ups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workshopOrderId: varchar("workshop_order_id").notNull()
    .references(() => workshopOrders.id, { onDelete: "cascade" }),
  dueAt: timestamp("due_at").notNull(),
  assigneeId: varchar("assignee_id").references(() => users.id),
  // open | snoozed | done | cancelled
  status: text("status").notNull().default("open"),
  // waiting_customer | waiting_insurance | waiting_partner | waiting_gutachter | offer_followup | other
  reason: text("reason").notNull().default("other"),
  message: text("message").notNull(),
  // ai | human
  source: text("source").notNull().default("human"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
export const insertOrderFollowUpSchema = createInsertSchema(orderFollowUps).omit({
  id: true, createdAt: true,
});
export type InsertOrderFollowUp = z.infer<typeof insertOrderFollowUpSchema>;
export type OrderFollowUp = typeof orderFollowUps.$inferSelect;

export const orderTimelineEvents = pgTable("order_timeline_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workshopOrderId: varchar("workshop_order_id").notNull()
    .references(() => workshopOrders.id, { onDelete: "cascade" }),
  // upload | call | whatsapp | status_change | offer | appointment | ai_action | partner_comment | follow_up | note
  kind: text("kind").notNull(),
  title: text("title").notNull(),
  message: text("message"),
  actorId: varchar("actor_id").references(() => users.id),
  actorLabel: text("actor_label"),
  metaJson: jsonb("meta_json"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
export const insertOrderTimelineEventSchema = createInsertSchema(orderTimelineEvents).omit({
  id: true, createdAt: true,
});
export type InsertOrderTimelineEvent = z.infer<typeof insertOrderTimelineEventSchema>;
export type OrderTimelineEvent = typeof orderTimelineEvents.$inferSelect;

// Faza B — appointment reminders (24h + 2h before scheduled_date)
export const appointmentReminders = pgTable("appointment_reminders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workshopOrderId: varchar("workshop_order_id").notNull()
    .references(() => workshopOrders.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(), // '24h' | '2h'
  scheduledFor: timestamp("scheduled_for").notNull(),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  uniqueIndex("appointment_reminders_order_kind_unique").on(table.workshopOrderId, table.kind),
  index("appointment_reminders_due_idx").on(table.scheduledFor),
]);
export const insertAppointmentReminderSchema = createInsertSchema(appointmentReminders).omit({
  id: true, createdAt: true, sentAt: true,
});
export type InsertAppointmentReminder = z.infer<typeof insertAppointmentReminderSchema>;
export type AppointmentReminder = typeof appointmentReminders.$inferSelect;

export const orderAiInsights = pgTable("order_ai_insights", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workshopOrderId: varchar("workshop_order_id").notNull().unique()
    .references(() => workshopOrders.id, { onDelete: "cascade" }),
  summary: text("summary").notNull(),
  nextAction: text("next_action"),
  // low | normal | high | urgent
  urgency: text("urgency").notNull().default("normal"),
  // positive | neutral | negative | unknown
  sentiment: text("sentiment").notNull().default("unknown"),
  // 0..100
  closeProbability: integer("close_probability"),
  riskFlags: text("risk_flags").array().default([]),
  missingInfo: text("missing_info").array().default([]),
  // free-form additional structured data (insurance status, repair probability, …)
  extraJson: jsonb("extra_json"),
  generatedBy: varchar("generated_by").references(() => users.id),
  generatedAt: timestamp("generated_at").notNull().defaultNow(),
});
export const insertOrderAiInsightSchema = createInsertSchema(orderAiInsights).omit({
  id: true, generatedAt: true,
});
export type InsertOrderAiInsight = z.infer<typeof insertOrderAiInsightSchema>;
export type OrderAiInsight = typeof orderAiInsights.$inferSelect;

export const academyResources = pgTable("academy_resources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(), // video, audio, pdf, text
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(), // vopsitorie, tinichigerie, management, marketing, gutachten
  thumbnailUrl: text("thumbnail_url"),
  resourceUrl: text("resource_url").notNull(),
  duration: text("duration"),
  pages: integer("pages"),
  tags: text("tags").array(),
  isFeatured: boolean("is_featured").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAcademyResourceSchema = createInsertSchema(academyResources).omit({
  id: true,
  createdAt: true,
});

export type InsertAcademyResource = z.infer<typeof insertAcademyResourceSchema>;
export type AcademyResource = typeof academyResources.$inferSelect;

// ============== PARTNER BREAK-EVEN CALCULATOR ==============

export const partnerFinancialEntries = pgTable("partner_financial_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  partnerId: varchar("partner_id").notNull().references(() => users.id),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  entryDate: timestamp("entry_date").notNull(),
  barCosti: doublePrecision("bar_costi").notNull().default(0),
  rechnungCosti: doublePrecision("rechnung_costi").notNull().default(0),
  stare: text("stare").notNull().default("Neachitat"),
  explicatii: text("explicatii"),
  clientBar: doublePrecision("client_bar").notNull().default(0),
  clientRechnung: doublePrecision("client_rechnung").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPartnerFinancialEntrySchema = createInsertSchema(partnerFinancialEntries).omit({
  id: true,
  createdAt: true,
});

export type InsertPartnerFinancialEntry = z.infer<typeof insertPartnerFinancialEntrySchema>;
export type PartnerFinancialEntry = typeof partnerFinancialEntries.$inferSelect;

export const partnerFixedCosts = pgTable("partner_fixed_costs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  partnerId: varchar("partner_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  amount: doublePrecision("amount").notNull().default(0),
  hasMwst: boolean("has_mwst").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPartnerFixedCostSchema = createInsertSchema(partnerFixedCosts).omit({
  id: true,
  createdAt: true,
});

export type InsertPartnerFixedCost = z.infer<typeof insertPartnerFixedCostSchema>;
export type PartnerFixedCost = typeof partnerFixedCosts.$inferSelect;

// ============== TASK BOARD (Trello-style) ==============

export const boardTasks = pgTable("board_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  column: text("column").notNull().default("todo"),
  priority: text("priority").notNull().default("normal"),
  assignedTo: varchar("assigned_to").references(() => users.id),
  relatedOrderId: varchar("related_order_id").references(() => workshopOrders.id),
  dueDate: timestamp("due_date"),
  sortOrder: integer("sort_order").notNull().default(0),
  source: text("source").notNull().default("manual"),
  driveFolderUrl: text("drive_folder_url"),
  suggestedAction: jsonb("suggested_action"),
  workflowChecklist: jsonb("workflow_checklist"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertBoardTaskSchema = createInsertSchema(boardTasks).omit({
  id: true,
  createdAt: true,
});

export type InsertBoardTask = z.infer<typeof insertBoardTaskSchema>;
export type BoardTask = typeof boardTasks.$inferSelect;

// ============== CORION HUB DOCUMENT LIBRARY ==============
// Scalable document storage: contracts, photos, videos, forms, internal docs.
// Access: admin role automatically; other users need a row in documentAccess.

export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull().default("other"), // contract|inventory|form|photo|video|other
  fileType: text("file_type").notNull().default("other"), // pdf|image|video|template|other
  templateKey: text("template_key"), // e.g. "contract_franchise_b_c" for editable contracts
  language: varchar("language", { length: 5 }), // de|en|ro|es|null
  fields: jsonb("fields"), // editable template fields (partner name, address, etc.)
  fileContent: text("file_content"), // base64 for small files (<2MB)
  fileName: text("file_name"),
  mimeType: text("mime_type"),
  fileSize: integer("file_size"),
  driveFileId: text("drive_file_id"), // Google Drive ref for large files
  driveLink: text("drive_link"),
  tags: text("tags").array(),
  createdBy: varchar("created_by").references(() => users.id),
  updatedBy: varchar("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;

// Grants library access to non-admin users (admins always have access)
export const documentAccess = pgTable("document_access", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  permission: text("permission").notNull().default("view"), // view|edit
  grantedBy: varchar("granted_by").references(() => users.id),
  grantedAt: timestamp("granted_at").notNull().defaultNow(),
});

export const insertDocumentAccessSchema = createInsertSchema(documentAccess).omit({
  id: true,
  grantedAt: true,
});

export type InsertDocumentAccess = z.infer<typeof insertDocumentAccessSchema>;
export type DocumentAccess = typeof documentAccess.$inferSelect;

export { aiConversations, aiMessages, insertAiConversationSchema, insertAiMessageSchema } from "./models/chat";
export type { AiConversation, InsertAiConversation, AiMessage, InsertAiMessage } from "./models/chat";

// =====================================================================
// Auftrag (Order) module — dedicated to the AuftragCalculator (Hub+1)
// Independent from existing repairRequests / workshopOrders so that the
// new SaaS calculator module can evolve without affecting current flows.
// =====================================================================

// Business-entity partners (a workshop / partner company).
// Distinct from `users` rows with role='partner' (which are login accounts).
// One business partner can later be linked to one or more user accounts.
export const partners = pgTable("partners", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().default(""),
  phone: text("phone").notNull().default(""),
  city: text("city").notNull().default(""),
  address: text("address").notNull().default(""),
  zip: text("zip").notNull().default(""),
  country: text("country").notNull().default("DE"),
  contactPerson: text("contact_person").notNull().default(""),
  status: text("status").notNull().default("pending"), // pending|active|suspended
  // Default cooperation model — drives autofill on Auftrag detail.
  defaultPartnershipModel: text("default_partnership_model").notNull().default("Model_C"), // Model_A|B|C|D
  defaultPartnerShare: integer("default_partner_share").notNull().default(40), // 0-100
  defaultBdePercent: integer("default_bde_percent").notNull().default(20),     // 0-100
  dailyCapacity: integer("daily_capacity").notNull().default(0),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertPartnerSchema = createInsertSchema(partners).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertPartner = z.infer<typeof insertPartnerSchema>;
export type Partner = typeof partners.$inferSelect;

export const auftragOrders = pgTable("auftrag_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  referenceNumber: text("reference_number").notNull().unique(), // e.g. COR-10042
  clientName: text("client_name").notNull().default(""),
  clientPhone: text("client_phone").notNull().default(""),
  carMake: text("car_make").notNull().default(""),
  carVin: text("car_vin").notNull().default(""),
  damageDesc: text("damage_desc").notNull().default(""),
  // Stored in cents to avoid float drift; calculations convert to EUR for display.
  laborNetCents: integer("labor_net_cents").notNull().default(0),
  partsNetCents: integer("parts_net_cents").notNull().default(0),
  // BDE: percent retained from labor for materials/consumables before partner split.
  // Legacy column (kept for backward compat). New flow writes to bdePercent below.
  materialBdePercent: integer("material_bde_percent").notNull().default(20),
  assignedPartnerId: varchar("assigned_partner_id").references(() => users.id),
  status: text("status").notNull().default("draft"), // draft|saved|sent|invoiced|paid|cancelled
  createdById: varchar("created_by_id").references(() => users.id),
  // ---- Split fields (Roadmap step 1) ----
  // Soft FK to partners.id (no DB-level constraint to avoid neon-http insert
  // adapters serializing nulls as empty strings on optional FKs).
  partnerId: varchar("partner_id"),
  partnershipModel: text("partnership_model"), // Model_A|B|C|D
  partnerSharePercent: integer("partner_share_percent"),
  corionSharePercent: integer("corion_share_percent"),
  bdePercent: integer("bde_percent"),
  isOwnCustomer: boolean("is_own_customer").notNull().default(false),
  isOwnMaterial: boolean("is_own_material").notNull().default(false),
  // Sicherheitseinbehalt persisted per order so we can SUM() it for the
  // 3.000 € cap per partner. 5% of partnerGrossShare at save time, capped.
  warrantyRetentionCents: integer("warranty_retention_cents").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertAuftragOrderSchema = createInsertSchema(auftragOrders).omit({
  id: true,
  referenceNumber: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertAuftragOrder = z.infer<typeof insertAuftragOrderSchema>;
export type AuftragOrder = typeof auftragOrders.$inferSelect;

// One row per user — current Hub+1 token balance. 1 Token = 1 EUR.
export const userTokens = pgTable("user_tokens", {
  userId: varchar("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  balance: integer("balance").notNull().default(0),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type UserTokens = typeof userTokens.$inferSelect;

// Append-only ledger of all token movements (debits negative, credits positive).
export const tokenLedger = pgTable("token_ledger", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  delta: integer("delta").notNull(), // signed: + credit, - debit
  balanceAfter: integer("balance_after").notNull(),
  reason: text("reason").notNull(), // e.g. ai_extract|topup|manual_adjust|order_save
  // Soft reference to auftrag_orders.id (no DB-level FK; some queries pass empty
  // strings via the neon-http adapter which break a hard constraint).
  relatedAuftragId: varchar("related_auftrag_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTokenLedgerSchema = createInsertSchema(tokenLedger).omit({
  id: true,
  createdAt: true,
});

export type InsertTokenLedger = z.infer<typeof insertTokenLedgerSchema>;

// ============== Hub+1 Contribution Economy ==============
// Architectural foundation for: escrow, reputation, earn events, referrals,
// appointment waitlist and (future) staking. Tables are intentionally minimal
// and additive — engines can be wired incrementally without breaking existing
// flows. Token math stays in `userTokens` + `tokenLedger`; these tables are
// drivers/recorders that *eventually* call creditTokens/debitTokens.

// Locked funds for an appointment (EUR cents). Released on completion,
// forfeited on no-show, refunded on policy-honored cancellation.
export const escrowHolds = pgTable("escrow_holds", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  partnerId: varchar("partner_id").references(() => users.id, { onDelete: "set null" }),
  auftragId: varchar("auftrag_id"),
  amountCents: integer("amount_cents").notNull(),
  // held | released | refunded | forfeited | replaced
  status: text("status").notNull().default("held"),
  reason: text("reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});
export type EscrowHold = typeof escrowHolds.$inferSelect;
export const insertEscrowHoldSchema = createInsertSchema(escrowHolds).omit({
  id: true,
  createdAt: true,
  resolvedAt: true,
});
export type InsertEscrowHold = z.infer<typeof insertEscrowHoldSchema>;

// One row per user — running Hub Reputation. Score 0..1000.
export const reputationScores = pgTable("reputation_scores", {
  userId: varchar("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  score: integer("score").notNull().default(500),
  completedJobs: integer("completed_jobs").notNull().default(0),
  cancellations: integer("cancellations").notNull().default(0),
  noShows: integer("no_shows").notNull().default(0),
  reviewsAvgX10: integer("reviews_avg_x10").notNull().default(0), // 0..50 (×10 to keep int)
  reviewsCount: integer("reviews_count").notNull().default(0),
  lastEventAt: timestamp("last_event_at"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
export type ReputationScore = typeof reputationScores.$inferSelect;

// Typed earn events (causes for token credits — for analytics + caps + audit).
// `tokens` here is the gross amount that *should* be credited; the actual
// credit happens via storage.creditTokens which writes the ledger.
export const tokenEarnEvents = pgTable("token_earn_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  // referral | review | workflow_use | onboarding_partner | content | bug_fix |
  // template | doc_improvement | community_answer | social_growth | training_ai
  kind: text("kind").notNull(),
  tokens: integer("tokens").notNull(),
  // optional cross-ref (e.g. referred user id, workflow id, review id)
  refKey: text("ref_key"),
  meta: jsonb("meta"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
export type TokenEarnEvent = typeof tokenEarnEvents.$inferSelect;
export const insertTokenEarnEventSchema = createInsertSchema(tokenEarnEvents).omit({
  id: true,
  createdAt: true,
});
export type InsertTokenEarnEvent = z.infer<typeof insertTokenEarnEventSchema>;

// Contribution Network (referral relationships — NOT pyramid; flat 1-level
// + revenue-share-on-usage attribution by ref tree pulled at query time).
export const referrals = pgTable("referrals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  referrerId: varchar("referrer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  referredUserId: varchar("referred_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  // pending | active | rewarded | revoked
  status: text("status").notNull().default("pending"),
  rewardTokens: integer("reward_tokens").notNull().default(0),
  source: text("source"), // landing | partner_qr | qr_workshop | manual
  createdAt: timestamp("created_at").notNull().defaultNow(),
  rewardedAt: timestamp("rewarded_at"),
});
export type Referral = typeof referrals.$inferSelect;
export const insertReferralSchema = createInsertSchema(referrals).omit({
  id: true,
  createdAt: true,
  rewardedAt: true,
});
export type InsertReferral = z.infer<typeof insertReferralSchema>;

// AI-powered standby waitlist for cancelled / urgent slots.
export const appointmentWaitlist = pgTable("appointment_waitlist", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  locationId: varchar("location_id"),
  preferredFrom: timestamp("preferred_from"),
  preferredTo: timestamp("preferred_to"),
  serviceKind: text("service_kind"), // smart_repair | gutachten | leasing | unfall | sonstiges
  autoAccept: boolean("auto_accept").notNull().default(false),
  contactPref: text("contact_pref").notNull().default("whatsapp"),
  // waiting | offered | accepted | expired | cancelled
  status: text("status").notNull().default("waiting"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  notifiedAt: timestamp("notified_at"),
});
export type AppointmentWaitlistEntry = typeof appointmentWaitlist.$inferSelect;
export const insertAppointmentWaitlistSchema = createInsertSchema(appointmentWaitlist)
  .omit({
    id: true,
    createdAt: true,
    notifiedAt: true,
    status: true, // server-forced "waiting" — clients cannot self-promote
  })
  .extend({
    serviceKind: z
      .enum(["smart_repair", "gutachten", "leasing", "unfall", "sonstiges"])
      .nullish(),
    contactPref: z.enum(["whatsapp", "email", "sms", "call"]).default("whatsapp"),
  })
  .superRefine((d, ctx) => {
    if (d.preferredFrom && d.preferredTo && d.preferredFrom > d.preferredTo) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["preferredTo"],
        message: "preferredTo muss nach preferredFrom liegen",
      });
    }
  });
export type InsertAppointmentWaitlistEntry = z.infer<typeof insertAppointmentWaitlistSchema>;

// Future-ready: locked tokens supporting AI infra / partner pools / governance.
export const stakingPositions = pgTable("staking_positions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  amountTokens: integer("amount_tokens").notNull(),
  // ai_infra | partner_pool | growth | governance
  pool: text("pool").notNull(),
  apyBps: integer("apy_bps").notNull().default(0), // basis points (100 = 1%)
  lockUntil: timestamp("lock_until"),
  // active | withdrawn | slashed
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
export type StakingPosition = typeof stakingPositions.$inferSelect;
export const insertStakingPositionSchema = createInsertSchema(stakingPositions).omit({
  id: true,
  createdAt: true,
});
export type InsertStakingPosition = z.infer<typeof insertStakingPositionSchema>;

export type TokenLedger = typeof tokenLedger.$inferSelect;

// =============== AI Agent Task Board ===============
// Trello-style board where 6 specialized AI agents pick up tasks.
// Roles: cfo | reception | partner_liaison | customer_care | marketing | qc
// Columns: todo | in_progress | review | done | failed
// Hybrid claim (auto for routine, manual for high-impact) and hybrid
// completion (auto-done for routine, HITL review for >€500 / client-facing /
// contract changes).
export const taskBoardTasks = pgTable("task_board_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  // todo | in_progress | review | done | failed
  column: text("column").notNull().default("todo"),
  // null until claimed
  assignedAgent: text("assigned_agent"),
  assignedUserId: varchar("assigned_user_id").references(() => users.id, { onDelete: "set null" }),
  createdById: varchar("created_by_id").references(() => users.id, { onDelete: "set null" }),
  // auftrag | invoice | upload | lead_stale | marketing_request | photo_qc | manual
  sourceType: text("source_type").notNull().default("manual"),
  sourceId: varchar("source_id"),
  // routine | normal | high | critical
  priority: text("priority").notNull().default("normal"),
  impactValueCents: integer("impact_value_cents").notNull().default(0),
  // payload for the agent (jsonb): inputs, context, refs.
  payload: jsonb("payload").$type<Record<string, unknown>>().default({}),
  // result of the last completion attempt (jsonb).
  result: jsonb("result").$type<Record<string, unknown>>().default({}),
  requiresReview: boolean("requires_review").notNull().default(false),
  autoClaimEligible: boolean("auto_claim_eligible").notNull().default(false),
  claimedAt: timestamp("claimed_at"),
  completedAt: timestamp("completed_at"),
  approvedAt: timestamp("approved_at"),
  approvedById: varchar("approved_by_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
export type TaskBoardTask = typeof taskBoardTasks.$inferSelect;
export const insertTaskBoardTaskSchema = createInsertSchema(taskBoardTasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  claimedAt: true,
  completedAt: true,
  approvedAt: true,
  approvedById: true,
});
export type InsertTaskBoardTask = z.infer<typeof insertTaskBoardTaskSchema>;

// Audit trail: every action an agent (or human) performs on a task.
export const agentActions = pgTable("agent_actions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: varchar("task_id").notNull().references(() => taskBoardTasks.id, { onDelete: "cascade" }),
  // agent role OR "human" if performed by a user
  actor: text("actor").notNull(),
  actorUserId: varchar("actor_user_id").references(() => users.id, { onDelete: "set null" }),
  // claim | complete | approve | reject | reassign | comment | auto_create
  action: text("action").notNull(),
  input: jsonb("input").$type<Record<string, unknown>>().default({}),
  output: jsonb("output").$type<Record<string, unknown>>().default({}),
  success: boolean("success").notNull().default(true),
  message: text("message"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
export type AgentAction = typeof agentActions.$inferSelect;
export const insertAgentActionSchema = createInsertSchema(agentActions).omit({
  id: true,
  createdAt: true,
});
export type InsertAgentAction = z.infer<typeof insertAgentActionSchema>;

// ════════════════════════════════════════════════════════════════════════════
// FLEET COMMUNICATION LAYER (GDPR-compliant API for external fleets)
// ════════════════════════════════════════════════════════════════════════════

// External fleet partners (leasing companies, telematic providers, etc.)
export const fleetPartners = pgTable("fleet_partners", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  slug: text("slug").notNull().unique(), // url-safe identifier (e.g. "sixt-de")
  name: text("name").notNull(),
  contactEmail: text("contact_email"),
  webhookUrl: text("webhook_url"), // outbound endpoint
  webhookSecret: text("webhook_secret"), // shared secret for outbound HMAC
  // GDPR policy: which PII categories the fleet is allowed to receive
  gdprAllowFullPii: boolean("gdpr_allow_full_pii").notNull().default(false),
  gdprDataRetentionDays: integer("gdpr_data_retention_days").notNull().default(365),
  // Synthetic user that owns repair_requests originated from this fleet
  systemUserId: varchar("system_user_id").references(() => users.id),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
export const insertFleetPartnerSchema = createInsertSchema(fleetPartners).omit({
  id: true, createdAt: true, systemUserId: true, webhookSecret: true,
});
export type FleetPartner = typeof fleetPartners.$inferSelect;
export type InsertFleetPartner = z.infer<typeof insertFleetPartnerSchema>;

// API keys per fleet — only the hash is persisted; secret shown to admin once.
export const fleetApiKeys = pgTable(
  "fleet_api_keys",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    fleetId: varchar("fleet_id").notNull().references(() => fleetPartners.id, { onDelete: "cascade" }),
    keyId: text("key_id").notNull().unique(), // public id sent in X-Fleet-Key-Id
    secretHash: text("secret_hash").notNull(), // sha256 of secret
    label: text("label").notNull().default("default"),
    revokedAt: timestamp("revoked_at"),
    lastUsedAt: timestamp("last_used_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("fleet_api_keys_fleet_idx").on(t.fleetId)],
);
export type FleetApiKey = typeof fleetApiKeys.$inferSelect;

// Audit / event log of every inbound API call (anti-replay + forensics)
export const fleetEvents = pgTable(
  "fleet_events",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    fleetId: varchar("fleet_id").references(() => fleetPartners.id, { onDelete: "set null" }),
    direction: text("direction").notNull(), // 'inbound' | 'outbound'
    eventType: text("event_type").notNull(), // e.g. 'repair_request.created'
    method: text("method"),
    path: text("path"),
    statusCode: integer("status_code"),
    requestId: text("request_id"), // X-Request-Id header echo
    nonce: text("nonce"), // anti-replay token
    payload: jsonb("payload").$type<Record<string, unknown>>(),
    repairRequestId: varchar("repair_request_id").references(() => repairRequests.id, { onDelete: "set null" }),
    errorMessage: text("error_message"),
    ip: text("ip"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("fleet_events_fleet_idx").on(t.fleetId),
    index("fleet_events_created_idx").on(t.createdAt),
    uniqueIndex("fleet_events_nonce_uniq").on(t.fleetId, t.nonce),
  ],
);
export type FleetEvent = typeof fleetEvents.$inferSelect;

// Outbound webhook delivery queue with retry tracking
export const fleetWebhookDeliveries = pgTable(
  "fleet_webhook_deliveries",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    fleetId: varchar("fleet_id").notNull().references(() => fleetPartners.id, { onDelete: "cascade" }),
    eventType: text("event_type").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    repairRequestId: varchar("repair_request_id").references(() => repairRequests.id, { onDelete: "set null" }),
    status: text("status").notNull().default("pending"), // pending|delivered|failed|dead
    attempts: integer("attempts").notNull().default(0),
    nextAttemptAt: timestamp("next_attempt_at").notNull().defaultNow(),
    lastResponseCode: integer("last_response_code"),
    lastError: text("last_error"),
    deliveredAt: timestamp("delivered_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("fleet_webhook_deliveries_status_idx").on(t.status, t.nextAttemptAt),
    index("fleet_webhook_deliveries_fleet_idx").on(t.fleetId),
  ],
);
export type FleetWebhookDelivery = typeof fleetWebhookDeliveries.$inferSelect;

// GDPR consent ledger — immutable record of every consent grant/revoke
export const fleetConsents = pgTable(
  "fleet_consents",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    fleetId: varchar("fleet_id").notNull().references(() => fleetPartners.id, { onDelete: "cascade" }),
    subjectRef: text("subject_ref").notNull(), // e.g. VIN or external client id
    scope: text("scope").notNull(), // 'pii_full' | 'pii_basic' | 'photos'
    granted: boolean("granted").notNull(),
    legalBasis: text("legal_basis"), // 'contract' | 'consent' | 'legitimate_interest'
    evidence: jsonb("evidence").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("fleet_consents_subject_idx").on(t.fleetId, t.subjectRef),
  ],
);
export type FleetConsent = typeof fleetConsents.$inferSelect;

// ════════════════════════════════════════════════════════════════════════════
// CLAUDE WORKER BRIDGE — developer / coding agent task queue
// ════════════════════════════════════════════════════════════════════════════

// Task dispatched to a coding agent (e.g. claude_worker).
// Separate from taskBoardTasks which is for operational (finance/reception/QC) work.
export const agentTasks = pgTable("agent_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  // claude_worker | future: grok_worker, cora_worker …
  agentType: text("agent_type").notNull().default("claude_worker"),
  // coding | docs | analysis | cleanup
  taskType: text("task_type").notNull().default("coding"),
  taskPrompt: text("task_prompt").notNull(),
  workingDirectory: text("working_directory").notNull(),
  // optional list of doc/file paths to inject as context
  contextRefs: jsonb("context_refs").$type<string[]>().default([]),
  // queued | running | completed | failed | pending_review | approved | needs_rework
  status: text("status").notNull().default("queued"),
  createdById: varchar("created_by_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  startedAt: timestamp("started_at"),
  finishedAt: timestamp("finished_at"),
});
export type AgentTask = typeof agentTasks.$inferSelect;
export const insertAgentTaskSchema = createInsertSchema(agentTasks).omit({
  id: true,
  createdAt: true,
  startedAt: true,
  finishedAt: true,
});
export type InsertAgentTask = z.infer<typeof insertAgentTaskSchema>;

// Result written back by the bridge runner after Claude executes the task.
export const agentTaskResults = pgTable("agent_task_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: varchar("task_id").notNull().references(() => agentTasks.id, { onDelete: "cascade" }),
  summary: text("summary"),
  rawOutput: text("raw_output"),
  structuredOutputJson: jsonb("structured_output_json").$type<Record<string, unknown>>().default({}),
  exitCode: integer("exit_code"),
  changedFilesJson: jsonb("changed_files_json").$type<string[]>().default([]),
  risksJson: jsonb("risks_json").$type<string[]>().default([]),
  verificationNeededJson: jsonb("verification_needed_json").$type<string[]>().default([]),
  // pending_review | approved | needs_rework
  reviewStatus: text("review_status").notNull().default("pending_review"),
  reviewNotes: text("review_notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
export type AgentTaskResult = typeof agentTaskResults.$inferSelect;
export const insertAgentTaskResultSchema = createInsertSchema(agentTaskResults).omit({
  id: true,
  createdAt: true,
});
export type InsertAgentTaskResult = z.infer<typeof insertAgentTaskResultSchema>;

// ════════════════════════════════════════════════════════════════════════════
// AGENT ACTIVITY FEED
//
// Append-only event log: every bus task execution, error, or notable agent
// action is persisted here so the admin can observe agent activity in-app.
//
// Rules:
//   - Rows are NEVER updated or deleted (append-only audit log).
//   - Written by taskBus.ts after writeResult() — fail-soft (bus is not
//     blocked if the DB write fails; the result file remains the durable record).
//   - Not a task queue. No status transitions. No assignee. No claims.
//   - agentSlug is a free-text identifier (e.g. "cora", "claude_worker") —
//     not a FK — so the feed works even before agent_profiles is built.
// ════════════════════════════════════════════════════════════════════════════

export const agentEvents = pgTable("agent_events", {
  id:             varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  // Who produced this event. Free-text slug — "cora" | "claude_worker" | "system"
  agentSlug:      text("agent_slug").notNull(),
  // bus_task_done | bus_task_error | annotation
  eventType:      text("event_type").notNull(),
  // Matches the "id" field of the bus task file (e.g. "sonja-volvo-s60-20260518")
  busTaskId:      text("bus_task_id"),
  // intake | drive_upload | calendar_event_create | calendar_event_patch |
  // task_create | document_reference | delegate
  busTaskType:    text("bus_task_type"),
  // Short human-readable label shown in the feed
  title:          text("title").notNull(),
  // One-sentence summary of what happened (derived from bus result)
  summary:        text("summary"),
  // Full bus result payload — stored as-is for drill-down
  payload:        jsonb("payload").$type<Record<string, unknown>>(),
  // Optional links to canonical spine objects
  relatedOrderId: varchar("related_order_id").references(() => workshopOrders.id, { onDelete: "set null" }),
  relatedTaskId:  varchar("related_task_id").references(() => boardTasks.id,     { onDelete: "set null" }),
  // ok | error
  status:         text("status").notNull().default("ok"),
  // admin | team  (future: control partner visibility)
  visibility:     text("visibility").notNull().default("admin"),
  createdAt:      timestamp("created_at").notNull().defaultNow(),
});

export type AgentEvent = typeof agentEvents.$inferSelect;

export const insertAgentEventSchema = createInsertSchema(agentEvents).omit({
  id:        true,
  createdAt: true,
});
export type InsertAgentEvent = z.infer<typeof insertAgentEventSchema>;

// ════════════════════════════════════════════════════════════════════════════
// TEAM COORDINATION MESSAGES
//
// Multi-author coordination thread. Channel-scoped so the same table covers:
//   "general"      — app-wide team coordination
//   "order:<id>"   — Auftrag-specific thread (future)
//   "task:<id>"    — Task-specific thread (future)
//
// authorSlug is free-text — not a FK — so the table works before any agent
// registry is built. authorRole categorises the author for display purposes.
//
// Telegram-originated messages carry telegramChatId for traceability.
// No FK constraints on relatedOrderId / relatedTaskId to avoid cascade issues.
// ════════════════════════════════════════════════════════════════════════════

export const coordinationMessages = pgTable("coordination_messages", {
  id:             varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  // Channel key: "general" | "ops" | "order:<uuid>" | "task:<uuid>"
  channel:        text("channel").notNull().default("general"),
  // Who wrote this. "adrian" | "cora" | "claude_worker" | "telegram_worker_bot" | "system"
  authorSlug:     text("author_slug").notNull(),
  // "human" | "orchestrator" | "worker" | "agent"
  authorRole:     text("author_role").notNull().default("agent"),
  body:           text("body").notNull(),
  // Optional context links — plain text, no FK cascade
  relatedOrderId: text("related_order_id"),
  relatedTaskId:  text("related_task_id"),
  // Present when message originated from Telegram
  telegramChatId: text("telegram_chat_id"),
  telegramMsgId:  integer("telegram_msg_id"),
  // Optional intent tag: "note" | "status" | "question" | "direction" | "task_result" | "decision"
  intent:         text("intent"),
  createdAt:      timestamp("created_at").notNull().defaultNow(),
});

export type CoordinationMessage = typeof coordinationMessages.$inferSelect;
export const insertCoordinationMessageSchema = createInsertSchema(coordinationMessages).omit({
  id:        true,
  createdAt: true,
});
export type InsertCoordinationMessage = z.infer<typeof insertCoordinationMessageSchema>;
