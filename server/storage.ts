import { 
  type User, 
  type InsertUser, 
  type UpsertUser,
  users, 
  type InsertFranchiseWaitlist, 
  type FranchiseWaitlist, 
  franchiseWaitlist,
  type InsertCourseWaitlist,
  type CourseWaitlist,
  courseWaitlist,
  type InsertRepairRequest,
  type RepairRequest,
  repairRequests,
  type InsertMessage,
  type Message,
  messages,
  type InsertNotification,
  type Notification,
  notifications,
  type PasswordResetToken,
  passwordResetTokens,
  type InsertVehicle,
  type Vehicle,
  vehicles,
  type InsertResource,
  type Resource,
  resources,
  type InsertOrder,
  type Order,
  orders,
  type InsertAppointment,
  type Appointment,
  appointments,
  type InsertMediaFile,
  type MediaFile,
  mediaFiles,
  type InsertLineItem,
  type LineItem,
  lineItems,
  type InsertInvoice,
  type Invoice,
  invoices,
  type InsertFinancialProfile,
  type FinancialProfile,
  financialProfiles,
  type InsertBwaEntry,
  type BwaEntry,
  bwaEntries,
  type InsertExpenseCategory,
  type ExpenseCategory,
  expenseCategories,
  type InsertFinancialTransaction,
  type FinancialTransaction,
  financialTransactions,
  type InsertClient,
  type Client,
  clients,
  type InsertClientInteraction,
  type ClientInteraction,
  clientInteractions,
  type InsertOffer,
  type Offer,
  offers,
  type InsertOfferLineItem,
  type OfferLineItem,
  offerLineItems,
  type InsertPartnerTransaction,
  type PartnerTransaction,
  partnerTransactions,
  type InsertDailyFinancialEntry,
  type DailyFinancialEntry,
  dailyFinancialEntries,
  type InsertFixedCostItem,
  type FixedCostItem,
  fixedCostItems,
  type InsertWorkshopOrder,
  type WorkshopOrder,
  workshopOrders,
  type InsertFileAttachment,
  type FileAttachment,
  fileAttachments,
  type InsertPartnerFinancialEntry,
  type PartnerFinancialEntry,
  partnerFinancialEntries,
  type InsertPartnerFixedCost,
  type PartnerFixedCost,
  partnerFixedCosts,
  type InsertBoardTask,
  type BoardTask,
  documents,
  documentAccess,
  type InsertDocument,
  type Document,
  auftragOrders,
  type InsertAuftragOrder,
  type AuftragOrder,
  partners,
  type InsertPartner,
  type Partner,
  userTokens,
  type UserTokens,
  workshopPayouts,
  type InsertWorkshopPayout,
  type WorkshopPayout,
  tokenLedger,
  type InsertTokenLedger,
  type TokenLedger,
  type InsertDocumentAccess,
  type DocumentAccess,
  boardTasks,
  referrals,
  type Referral,
  type InsertReferral,
  tokenEarnEvents,
  type TokenEarnEvent,
  type InsertTokenEarnEvent,
  reputationScores,
  type ReputationScore,
  escrowHolds,
  type EscrowHold,
  type InsertEscrowHold,
  appointmentWaitlist,
  type AppointmentWaitlistEntry,
  type InsertAppointmentWaitlistEntry,
  stakingPositions,
  type StakingPosition,
  type InsertStakingPosition,
  taskBoardTasks,
  agentActions,
  type TaskBoardTask,
  type InsertTaskBoardTask,
  type AgentAction,
  type InsertAgentAction,
  orderCrmLinks,
  type OrderCrmLink,
  type InsertOrderCrmLink,
  orderFollowUps,
  type OrderFollowUp,
  type InsertOrderFollowUp,
  orderTimelineEvents,
  type OrderTimelineEvent,
  type InsertOrderTimelineEvent,
  orderAiInsights,
  type OrderAiInsight,
  type InsertOrderAiInsight,
  agentTasks,
  agentTaskResults,
  type AgentTask,
  type InsertAgentTask,
  type AgentTaskResult,
  type InsertAgentTaskResult,
  type AgentEvent,
  type InsertAgentEvent,
} from "@shared/schema";
import { db } from "../db/index";
import { eq, desc, and, or, sql, gte, lte, isNull, ne } from "drizzle-orm";

// Workaround for drizzle-orm + @neondatabase/serverless (neon-http) bug:
// nullable varchar FK columns receive `null` from JS but are coerced to the
// empty string "" before the SQL is sent, which breaks FK constraints.
// Replacing the value with the `sql\`NULL\`` token forces a literal SQL NULL.
function nullifyFkFields<T extends Record<string, any>>(data: T, fields: readonly (keyof T)[]): T {
  const out: any = { ...data };
  for (const f of fields) {
    if (out[f] === null || out[f] === "") {
      out[f] = sql`NULL`;
    }
  }
  return out;
}

// Workaround for drizzle-orm + neon-http: timestamp columns deserialize as
// `Invalid Date` (which JSON-serializes to null) on certain rows. Re-fetch
// the timestamp columns via raw SQL with explicit text casting and patch
// them back onto the rows so callers see real Date objects.
const WORKSHOP_ORDER_DATE_COLUMNS = [
  ["order_date", "orderDate"],
  ["delivery_date", "deliveryDate"],
  ["pickup_date", "pickupDate"],
  ["scheduled_date", "scheduledDate"],
  ["split_calculated_at", "splitCalculatedAt"],
  ["tokens_minted_at", "tokensMintedAt"],
  ["partner_notified_at", "partnerNotifiedAt"],
  ["appointment_notified_for", "appointmentNotifiedFor"],
  ["created_at", "createdAt"],
] as const;

async function hydrateWorkshopOrderDates<T extends { id: string } & Record<string, any>>(
  rows: T[],
): Promise<T[]> {
  if (!rows.length) return rows;
  const ids = rows.map((r) => r.id);
  const selects = WORKSHOP_ORDER_DATE_COLUMNS.map(
    ([col]) =>
      sql`to_char(${sql.identifier(col)} AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS ${sql.identifier(col + "_iso")}`,
  );
  const idList = sql.join(ids.map((id) => sql`${id}`), sql`, `);
  const result: any = await db.execute(
    sql`SELECT id, ${sql.join(selects, sql`, `)} FROM workshop_orders WHERE id IN (${idList})`,
  );
  const dbRows: any[] = result?.rows ?? result ?? [];
  const byId = new Map<string, any>(dbRows.map((r) => [r.id, r]));
  return rows.map((row) => {
    const raw = byId.get(row.id);
    if (!raw) return row;
    const patched: any = { ...row };
    for (const [col, jsKey] of WORKSHOP_ORDER_DATE_COLUMNS) {
      const iso = raw[`${col}_iso`];
      const current = (row as any)[jsKey];
      const isInvalid = current instanceof Date && isNaN(current.getTime());
      // Always trust the raw SQL value over Drizzle's deserialization.
      if (iso) patched[jsKey] = new Date(iso);
      else if (isInvalid) patched[jsKey] = null;
    }
    return patched as T;
  });
}

async function hydrateWorkshopOrderDate<T extends { id: string } & Record<string, any>>(
  row: T | undefined,
): Promise<T | undefined> {
  if (!row) return row;
  const [hydrated] = await hydrateWorkshopOrderDates([row]);
  return hydrated;
}

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<void>;
  getAllUsers(): Promise<User[]>;
  getUsersByRole(role: string): Promise<User[]>;
  
  // Franchise waitlist
  createFranchiseWaitlistEntry(entry: InsertFranchiseWaitlist): Promise<FranchiseWaitlist>;
  getAllFranchiseWaitlistEntries(): Promise<FranchiseWaitlist[]>;
  
  // Course waitlist
  createCourseWaitlistEntry(entry: InsertCourseWaitlist): Promise<CourseWaitlist>;
  getCourseWaitlistByCourse(courseId: string): Promise<CourseWaitlist[]>;
  
  // Repair requests
  createRepairRequest(request: InsertRepairRequest): Promise<RepairRequest>;
  getRepairRequest(id: string): Promise<RepairRequest | undefined>;
  getRepairRequestsByClient(clientId: string): Promise<RepairRequest[]>;
  getRepairRequestsByPartner(partnerId: string): Promise<RepairRequest[]>;
  getAllRepairRequests(): Promise<RepairRequest[]>;
  updateRepairRequest(id: string, data: Partial<InsertRepairRequest>): Promise<RepairRequest | undefined>;
  
  // Messages
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesByRepairRequest(repairRequestId: string): Promise<Message[]>;
  markMessageAsRead(id: string): Promise<void>;
  
  // Notifications
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotificationsByUser(userId: string): Promise<Notification[]>;
  markNotificationAsRead(id: string): Promise<void>;
  getUnreadNotificationCount(userId: string): Promise<number>;

  // Financial profiles
  createFinancialProfile(profile: InsertFinancialProfile): Promise<FinancialProfile>;
  getFinancialProfile(id: string): Promise<FinancialProfile | undefined>;
  getAllFinancialProfiles(): Promise<FinancialProfile[]>;
  getFinancialProfilesByUser(userId: string): Promise<FinancialProfile[]>;
  updateFinancialProfile(id: string, data: Partial<InsertFinancialProfile>): Promise<FinancialProfile | undefined>;
  deleteFinancialProfile(id: string): Promise<void>;

  // BWA entries
  createBwaEntry(entry: InsertBwaEntry): Promise<BwaEntry>;
  getBwaEntry(id: string): Promise<BwaEntry | undefined>;
  getBwaEntriesByProfile(profileId: string): Promise<BwaEntry[]>;
  updateBwaEntry(id: string, data: Partial<InsertBwaEntry>): Promise<BwaEntry | undefined>;
  deleteBwaEntry(id: string): Promise<void>;

  // Expense categories
  createExpenseCategory(category: InsertExpenseCategory): Promise<ExpenseCategory>;
  getExpenseCategoriesByUser(userId: string): Promise<ExpenseCategory[]>;
  updateExpenseCategory(id: string, data: Partial<InsertExpenseCategory>): Promise<ExpenseCategory | undefined>;
  deleteExpenseCategory(id: string): Promise<void>;

  // Financial transactions
  createFinancialTransaction(tx: InsertFinancialTransaction): Promise<FinancialTransaction>;
  getFinancialTransactionsByUser(userId: string): Promise<FinancialTransaction[]>;
  updateFinancialTransaction(id: string, data: Partial<InsertFinancialTransaction>): Promise<FinancialTransaction | undefined>;
  deleteFinancialTransaction(id: string): Promise<void>;

  // Clients (CRM)
  createClient(client: InsertClient): Promise<Client>;
  getClient(id: string): Promise<Client | undefined>;
  getClientsByPartner(partnerId: string): Promise<Client[]>;
  getAllClients(): Promise<Client[]>;
  updateClient(id: string, data: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: string): Promise<void>;

  // Client interactions
  createClientInteraction(interaction: InsertClientInteraction): Promise<ClientInteraction>;
  getInteractionsByClient(clientId: string): Promise<ClientInteraction[]>;

  // Offers
  createOffer(offer: InsertOffer): Promise<Offer>;
  getOffer(id: string): Promise<Offer | undefined>;
  getOffersByPartner(partnerId: string): Promise<Offer[]>;
  getAllOffers(): Promise<Offer[]>;
  updateOffer(id: string, data: Partial<InsertOffer>): Promise<Offer | undefined>;
  deleteOffer(id: string): Promise<void>;

  // Offer line items
  createOfferLineItem(item: InsertOfferLineItem): Promise<OfferLineItem>;
  getOfferLineItems(offerId: string): Promise<OfferLineItem[]>;
  deleteOfferLineItem(id: string): Promise<void>;
  deleteOfferLineItemsByOffer(offerId: string): Promise<void>;

  // Partner transactions
  createPartnerTransaction(tx: InsertPartnerTransaction): Promise<PartnerTransaction>;
  getPartnerTransactions(partnerId: string): Promise<PartnerTransaction[]>;
  getAllPartnerTransactions(): Promise<PartnerTransaction[]>;
  updatePartnerTransaction(id: string, data: Partial<InsertPartnerTransaction>): Promise<PartnerTransaction | undefined>;

  // Daily financial entries
  createDailyFinancialEntry(entry: InsertDailyFinancialEntry): Promise<DailyFinancialEntry>;
  getDailyFinancialEntryById(id: string): Promise<DailyFinancialEntry | undefined>;
  getDailyFinancialEntriesByPartner(partnerId: string, year: number, month: number): Promise<DailyFinancialEntry[]>;
  getAllDailyFinancialEntries(year: number, month: number): Promise<DailyFinancialEntry[]>;
  updateDailyFinancialEntry(id: string, data: Partial<InsertDailyFinancialEntry>): Promise<DailyFinancialEntry | undefined>;
  deleteDailyFinancialEntry(id: string): Promise<void>;

  // Fixed cost items
  createFixedCostItem(item: InsertFixedCostItem): Promise<FixedCostItem>;
  getFixedCostItemById(id: string): Promise<FixedCostItem | undefined>;
  getFixedCostItemsByPartner(partnerId: string): Promise<FixedCostItem[]>;
  updateFixedCostItem(id: string, data: Partial<InsertFixedCostItem>): Promise<FixedCostItem | undefined>;
  deleteFixedCostItem(id: string): Promise<void>;

  // Workshop orders
  createWorkshopOrder(order: InsertWorkshopOrder): Promise<WorkshopOrder>;
  getWorkshopOrder(id: string): Promise<WorkshopOrder | undefined>;
  getWorkshopOrderByReference(refNumber: string): Promise<WorkshopOrder | undefined>;
  getWorkshopOrdersByPartner(partnerId: string): Promise<WorkshopOrder[]>;
  getWorkshopOrdersByClient(clientUserId: string): Promise<WorkshopOrder[]>;
  getAllWorkshopOrders(): Promise<WorkshopOrder[]>;
  updateWorkshopOrder(id: string, data: Partial<InsertWorkshopOrder>): Promise<WorkshopOrder | undefined>;
  deleteWorkshopOrder(id: string): Promise<void>;

  // Offers by client
  getOffersByClientUser(clientUserId: string): Promise<Offer[]>;

  // File attachments
  createFileAttachment(data: InsertFileAttachment): Promise<FileAttachment>;
  getFileAttachment(id: string): Promise<FileAttachment | undefined>;
  getFileAttachmentsByOrder(workshopOrderId: string): Promise<Omit<FileAttachment, 'data'>[]>;
  deleteFileAttachment(id: string): Promise<void>;

  // Order CRM (links / follow-ups / timeline / AI insights)
  listOrderCrmLinks(orderId: string): Promise<OrderCrmLink[]>;
  createOrderCrmLink(data: InsertOrderCrmLink): Promise<OrderCrmLink>;
  deleteOrderCrmLink(id: string): Promise<void>;
  listOrderFollowUps(orderId: string): Promise<OrderFollowUp[]>;
  createOrderFollowUp(data: InsertOrderFollowUp): Promise<OrderFollowUp>;
  updateOrderFollowUp(id: string, data: Partial<InsertOrderFollowUp>): Promise<OrderFollowUp | undefined>;
  deleteOrderFollowUp(id: string): Promise<void>;
  listOrderTimelineEvents(orderId: string, limit?: number): Promise<OrderTimelineEvent[]>;
  createOrderTimelineEvent(data: InsertOrderTimelineEvent): Promise<OrderTimelineEvent>;
  getOrderAiInsight(orderId: string): Promise<OrderAiInsight | undefined>;
  upsertOrderAiInsight(data: InsertOrderAiInsight): Promise<OrderAiInsight>;

  // Partner financial entries (Break-Even)
  createPartnerFinancialEntry(data: InsertPartnerFinancialEntry): Promise<PartnerFinancialEntry>;
  getPartnerFinancialEntries(partnerId: string, month: number, year: number): Promise<PartnerFinancialEntry[]>;
  updatePartnerFinancialEntry(id: string, data: Partial<InsertPartnerFinancialEntry>): Promise<PartnerFinancialEntry | undefined>;
  deletePartnerFinancialEntry(id: string): Promise<void>;
  getAllPartnerFinancialEntries(partnerId: string, year: number): Promise<PartnerFinancialEntry[]>;

  // Partner fixed costs
  createPartnerFixedCost(data: InsertPartnerFixedCost): Promise<PartnerFixedCost>;
  getPartnerFixedCosts(partnerId: string): Promise<PartnerFixedCost[]>;
  updatePartnerFixedCost(id: string, data: Partial<InsertPartnerFixedCost>): Promise<PartnerFixedCost | undefined>;
  deletePartnerFixedCost(id: string): Promise<void>;

  // Board tasks (Trello)
  createBoardTask(data: InsertBoardTask): Promise<BoardTask>;
  getBoardTask(id: string): Promise<BoardTask | undefined>;
  getAllBoardTasks(): Promise<BoardTask[]>;
  updateBoardTask(id: string, data: Partial<InsertBoardTask>): Promise<BoardTask | undefined>;
  deleteBoardTask(id: string): Promise<void>;

  // Documents library
  createDocument(data: InsertDocument): Promise<Document>;
  getDocument(id: string): Promise<Document | undefined>;
  getAllDocuments(filters?: { category?: string; fileType?: string; language?: string; templateKey?: string }): Promise<Document[]>;
  updateDocument(id: string, data: Partial<InsertDocument>): Promise<Document | undefined>;
  deleteDocument(id: string): Promise<void>;

  // Document access (admin always allowed; designated users via this table)
  grantDocumentAccess(data: InsertDocumentAccess): Promise<DocumentAccess>;
  revokeDocumentAccess(userId: string): Promise<void>;
  getAllDocumentAccess(): Promise<(DocumentAccess & { user?: User })[]>;
  hasDocumentAccess(userId: string, requireEdit?: boolean): Promise<boolean>;

  // Auftrag (Hub+1 calculator) orders
  createAuftragOrder(data: InsertAuftragOrder & { referenceNumber: string }): Promise<AuftragOrder>;
  getAuftragOrder(id: string): Promise<AuftragOrder | undefined>;
  getAllAuftragOrders(): Promise<AuftragOrder[]>;
  getAuftragOrdersForUser(userId: string): Promise<AuftragOrder[]>;
  updateAuftragOrder(id: string, data: Partial<InsertAuftragOrder>): Promise<AuftragOrder | undefined>;
  // Business-entity partners (separate from users with role='partner').
  getPartners(filter?: { status?: string }): Promise<Partner[]>;
  getPartner(id: string): Promise<Partner | undefined>;
  createPartner(data: InsertPartner): Promise<Partner>;
  updatePartner(id: string, data: Partial<InsertPartner>): Promise<Partner | undefined>;
  deletePartner(id: string): Promise<void>;
  /**
   * Sum of all Sicherheitseinbehalt cents already retained for a partner
   * across past saved orders. Used to enforce the 3.000 € cap. Optionally
   * exclude one order id (so re-saves don't double-count themselves).
   */
  getPartnerRetentionTotalCents(partnerId: string, excludeOrderId?: string): Promise<number>;

  // Faza A — Workshop payouts (per-order partner ledger driving token mint)
  createWorkshopPayout(data: InsertWorkshopPayout): Promise<WorkshopPayout>;
  getWorkshopPayoutByOrder(workshopOrderId: string): Promise<WorkshopPayout | undefined>;
  updateWorkshopPayout(id: string, data: Partial<InsertWorkshopPayout>): Promise<WorkshopPayout | undefined>;
  /** Sum of warranty_retention_cents currently HELD (not yet released, not forfeit) for a partner — for the 3.000 € cap. */
  getPartnerWorkshopRetentionTotalCents(partnerId: string, excludeOrderId?: string): Promise<number>;
  /** Returns true if a token_ledger entry already exists for (userId, reason, relatedAuftragId) — used to make token mint idempotent across retries. */
  hasTokenLedgerEntry(userId: string, reason: string, relatedAuftragId: string): Promise<boolean>;
  /**
   * Race-safe single-statement mint: inserts a token_ledger row and bumps the
   * balance in ONE SQL via CTE, relying on a partial UNIQUE index on
   * (user_id, reason, related_auftrag_id) WHERE reason IN
   * ('job_completed','warranty_retention_released'). On conflict, no rows are
   * inserted and balance stays untouched. Returns whether a credit happened.
   */
  creditTokensIdempotent(userId: string, amount: number, reason: string, relatedAuftragId: string): Promise<{ balance: number; credited: boolean }>;
  /** Paid payouts older than `beforeDate` whose retention has not yet been released. */
  listWorkshopPayoutsDueForRetentionRelease(beforeDate: Date): Promise<WorkshopPayout[]>;

  // Hub+1 token economy (1 token = 1 EUR)
  ensureUserTokenBalance(userId: string, bootstrap: number): Promise<number>;
  getTokenBalance(userId: string): Promise<number>;
  creditTokens(userId: string, amount: number, reason: string, relatedAuftragId?: string | null): Promise<number>;
  debitTokens(userId: string, amount: number, reason: string, relatedAuftragId?: string | null): Promise<number>;
  getTokenLedger(userId: string, limit?: number): Promise<TokenLedger[]>;

  // Hub+1 contribution economy
  createReferral(data: InsertReferral): Promise<Referral>;
  getReferralByReferred(referredUserId: string): Promise<Referral | undefined>;
  getReferralsByReferrer(referrerId: string): Promise<Referral[]>;
  markReferralRewarded(id: string, rewardTokens: number): Promise<void>;
  recordTokenEarnEvent(data: InsertTokenEarnEvent): Promise<TokenEarnEvent>;
  countAuftragOrdersByCreator(userId: string): Promise<number>;
  getReputation(userId: string): Promise<ReputationScore | undefined>;
  ensureReputation(userId: string): Promise<ReputationScore>;
  bumpReputation(
    userId: string,
    delta: { score?: number; completedJobs?: number; cancellations?: number; noShows?: number; reviewsAvgX10?: number; reviewsCount?: number },
  ): Promise<ReputationScore>;

  // Hub+1 escrow
  createEscrowHold(data: InsertEscrowHold): Promise<EscrowHold>;
  getEscrowHold(id: string): Promise<EscrowHold | undefined>;
  getEscrowsByAuftrag(auftragId: string): Promise<EscrowHold[]>;
  getEscrowsByUser(userId: string, status?: string): Promise<EscrowHold[]>;
  resolveEscrowHold(id: string, status: string, reason?: string): Promise<EscrowHold | undefined>;

  // Hub+1 appointment waitlist
  createWaitlistEntry(data: InsertAppointmentWaitlistEntry): Promise<AppointmentWaitlistEntry>;
  getWaitlistEntry(id: string): Promise<AppointmentWaitlistEntry | undefined>;
  getWaitlistByUser(userId: string): Promise<AppointmentWaitlistEntry[]>;
  getWaitingCandidates(opts: { locationId?: string | null; serviceKind?: string | null; at?: Date | null }): Promise<AppointmentWaitlistEntry[]>;
  updateWaitlistEntry(id: string, data: Partial<InsertAppointmentWaitlistEntry> & { status?: string; notifiedAt?: Date }): Promise<AppointmentWaitlistEntry | undefined>;

  // Hub+1 staking positions
  createStakingPosition(data: InsertStakingPosition): Promise<StakingPosition>;
  getStakingPosition(id: string): Promise<StakingPosition | undefined>;
  getStakingPositionsByUser(userId: string): Promise<StakingPosition[]>;
  updateStakingPositionStatus(id: string, status: string): Promise<StakingPosition | undefined>;
  getPoolTotals(): Promise<Array<{ pool: string; totalStaked: number; positions: number }>>;

  // ============== Task Board (AI Agents) ==============
  createTaskBoardTask(data: InsertTaskBoardTask): Promise<TaskBoardTask>;
  getTaskBoardTask(id: string): Promise<TaskBoardTask | undefined>;
  listTaskBoardTasks(filters: {
    column?: string;
    assignedAgent?: string;
    assignedUserId?: string;
    createdById?: string;
    sourceType?: string;
    limit?: number;
  }): Promise<TaskBoardTask[]>;
  // Atomic claim: only succeeds when assignedAgent is null OR equals the
  // requesting agent and column='todo'. Returns undefined on race-loss.
  claimTaskBoardTask(id: string, agentRole: string, userId?: string | null): Promise<TaskBoardTask | undefined>;
  // Atomic move from in_progress -> review|done depending on requiresReview.
  completeTaskBoardTask(id: string, result: Record<string, unknown>): Promise<TaskBoardTask | undefined>;
  approveTaskBoardTask(id: string, approverId: string): Promise<TaskBoardTask | undefined>;
  rejectTaskBoardTask(id: string, approverId: string, reason: string): Promise<TaskBoardTask | undefined>;
  updateTaskBoardColumn(id: string, column: string): Promise<TaskBoardTask | undefined>;
  recordAgentAction(data: InsertAgentAction): Promise<AgentAction>;
  listAgentActions(taskId: string): Promise<AgentAction[]>;

  // ============== Claude Worker Bridge ==============
  createAgentTask(data: InsertAgentTask): Promise<AgentTask>;
  getAgentTask(id: string): Promise<AgentTask | undefined>;
  getAgentTaskWithResult(id: string): Promise<{ task: AgentTask; result: AgentTaskResult | undefined } | undefined>;
  listAgentTasks(filters: { status?: string; agentType?: string; limit?: number }): Promise<AgentTask[]>;
  // Atomic claim: transitions status queued→running; returns undefined on race-loss.
  claimAgentTask(id: string): Promise<AgentTask | undefined>;
  // Low-level primitive: mark a running task completed or failed and record finishedAt.
  // Not called in the normal execution path — createAgentTaskResult handles the full
  // running→pending_review transition including finishedAt. Kept for manual recovery use.
  finishAgentTask(id: string, status: "completed" | "failed"): Promise<AgentTask | undefined>;
  createAgentTaskResult(data: InsertAgentTaskResult): Promise<AgentTaskResult>;
  getAgentTaskResult(taskId: string): Promise<AgentTaskResult | undefined>;
  // Update review_status on the result row (pending_review → approved | needs_rework).
  setResultReviewStatus(taskId: string, reviewStatus: string, notes?: string): Promise<AgentTaskResult | undefined>;
  // Reset a stuck/rejected task back to queued. Only valid from: running | failed | needs_rework.
  // Clears startedAt and finishedAt. Existing result rows are preserved as audit history.
  // Returns undefined if the task is not in a resettable state.
  resetAgentTask(id: string): Promise<AgentTask | undefined>;

  // ============== Agent Activity Feed (append-only event log) ==============
  insertAgentEvent(data: InsertAgentEvent): Promise<AgentEvent>;
  listAgentEvents(filters: {
    agentSlug?: string;
    status?: string;
    busTaskType?: string;
    limit?: number;
    offset?: number;
  }): Promise<AgentEvent[]>;
  getAgentEvent(id: string): Promise<AgentEvent | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const rows = await safeSelect(() => db.select().from(users).where(eq(users.id, id)));
    return rows[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const rows = await safeSelect(() => db.select().from(users).where(eq(users.email, email)));
    return rows[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const rows = await db.insert(users).values(insertUser).returning();
    if (rows.length > 0) return rows[0];
    // neon-http occasionally returns null/empty for RETURNING; refetch by email.
    if (!insertUser.email) {
      throw new Error("createUser: insert returned no row and no email available to refetch");
    }
    const fetched = await this.getUserByEmail(insertUser.email);
    if (!fetched) throw new Error("createUser: insert succeeded but row not found");
    return fetched;
  }

  // Upsert for Replit Auth
  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        id: userData.id,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        profileImageUrl: userData.profileImageUrl,
        role: "client", // Default role for new OAuth users
        emailVerified: true, // OAuth emails are verified
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined> {
    try {
      const [user] = await db
        .update(users)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning();
      if (user) return user;
    } catch (err: any) {
      // Swallow the neon-http parser bug on empty RETURNING and fall back
      // to a re-query. Re-throw anything else.
      const msg = String(err?.message ?? "");
      const stack = String(err?.stack ?? "");
      const isNeonParserBug =
        msg.includes("Cannot read properties of null") &&
        msg.includes("'map'") &&
        stack.includes("@neondatabase/serverless");
      if (!isNeonParserBug) throw err;
    }
    // Fallback: the UPDATE may have succeeded but RETURNING came back empty
    // (neon-http parser quirk). Re-query the row and merge the patch on top
    // so callers see the value we just wrote even if the read hits a stale
    // Neon replica.
    const refreshed = await this.getUser(id);
    if (!refreshed) return undefined;
    return { ...refreshed, ...data, updatedAt: new Date() } as User;
  }

  async deleteUser(id: string): Promise<void> {
    const user = await this.getUser(id);
    if (!user) throw new Error("Benutzer nicht gefunden");
    await db.delete(users).where(eq(users.id, id));
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, role)).orderBy(desc(users.createdAt));
  }

  // Franchise waitlist
  async createFranchiseWaitlistEntry(entry: InsertFranchiseWaitlist): Promise<FranchiseWaitlist> {
    const [waitlistEntry] = await db.insert(franchiseWaitlist).values(entry).returning();
    return waitlistEntry;
  }

  async getAllFranchiseWaitlistEntries(): Promise<FranchiseWaitlist[]> {
    return await db.select().from(franchiseWaitlist).orderBy(desc(franchiseWaitlist.createdAt));
  }

  // Course waitlist
  async createCourseWaitlistEntry(entry: InsertCourseWaitlist): Promise<CourseWaitlist> {
    const [waitlistEntry] = await db.insert(courseWaitlist).values(entry).returning();
    return waitlistEntry;
  }

  async getCourseWaitlistByCourse(courseId: string): Promise<CourseWaitlist[]> {
    return await db.select().from(courseWaitlist).where(eq(courseWaitlist.courseId, courseId));
  }

  // Repair requests
  async createRepairRequest(request: InsertRepairRequest): Promise<RepairRequest> {
    const [repairRequest] = await db.insert(repairRequests).values(request).returning();
    return repairRequest;
  }

  async getRepairRequest(id: string): Promise<RepairRequest | undefined> {
    const [request] = await db.select().from(repairRequests).where(eq(repairRequests.id, id));
    return request;
  }

  async getRepairRequestsByClient(clientId: string): Promise<RepairRequest[]> {
    return await safeSelect(() =>
      db
        .select()
        .from(repairRequests)
        .where(eq(repairRequests.clientId, clientId))
        .orderBy(desc(repairRequests.createdAt)),
    );
  }

  async getRepairRequestsByPartner(partnerId: string): Promise<RepairRequest[]> {
    return await safeSelect(() =>
      db
        .select()
        .from(repairRequests)
        .where(eq(repairRequests.partnerId, partnerId))
        .orderBy(desc(repairRequests.createdAt)),
    );
  }

  async getAllRepairRequests(): Promise<RepairRequest[]> {
    const result = await db.select().from(repairRequests).orderBy(desc(repairRequests.createdAt));
    return result ?? [];
  }

  async updateRepairRequest(id: string, data: Partial<InsertRepairRequest>): Promise<RepairRequest | undefined> {
    const before = await db.select().from(repairRequests).where(eq(repairRequests.id, id)).limit(1);
    const prevStatus = before[0]?.status;
    const [request] = await db
      .update(repairRequests)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(repairRequests.id, id))
      .returning();
    // Fleet webhook hook: if this RR originated from an external fleet
    // (admin_notes carries the [fleet:<slug>:<externalRef>] tag) and the
    // status actually changed, fire an outbound notification.
    if (request && data.status && data.status !== prevStatus) {
      try {
        const m = /\[fleet:([a-z0-9-]+):([^\]]+)\]/.exec(request.adminNotes || "");
        if (m) {
          const [, slug, externalRef] = m;
          // Lazy require to avoid circular import.
          const { enqueueFleetWebhook } = await import("./services/fleetWebhooks");
          const { applyGdprPolicy } = await import("./services/fleetGdpr");
          const r: any = await db.execute(
            sql`SELECT id, gdpr_allow_full_pii FROM fleet_partners WHERE slug = ${slug} LIMIT 1`,
          );
          const fleet = (r?.rows ?? r ?? [])[0];
          if (fleet) {
            const payload = applyGdprPolicy(
              {
                externalRef,
                status: request.status,
                vehicleVin: request.licensePlate ?? null,
                vehicleMake: request.vehicleMake ?? null,
                vehicleModel: request.vehicleModel ?? null,
                damageType: request.damageType ?? null,
                description: request.description,
                estimatedCostCents: request.estimatedCost ?? null,
                finalCostCents: request.finalCost ?? null,
                createdAt: request.createdAt?.toISOString?.() ?? null,
                updatedAt: request.updatedAt?.toISOString?.() ?? null,
              } as any,
              { fleetId: String(fleet.id), allowFullPii: !!fleet.gdpr_allow_full_pii },
            );
            await enqueueFleetWebhook({
              fleetId: String(fleet.id),
              eventType: "repair_request.status_changed",
              payload: payload as any,
              repairRequestId: request.id,
            });
          }
        }
      } catch (err) {
        console.error("[storage] fleet webhook hook failed", err);
      }
    }
    return request;
  }

  // Messages
  async createMessage(message: InsertMessage): Promise<Message> {
    const [msg] = await db.insert(messages).values(message).returning();
    return msg;
  }

  async getMessagesByRepairRequest(repairRequestId: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.repairRequestId, repairRequestId))
      .orderBy(messages.createdAt);
  }

  async markMessageAsRead(id: string): Promise<void> {
    await db.update(messages).set({ isRead: true }).where(eq(messages.id, id));
  }

  // Notifications
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [notif] = await db.insert(notifications).values(notification).returning();
    return notif;
  }

  async getNotificationsByUser(userId: string): Promise<Notification[]> {
    return await safeSelect(() =>
      db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt)),
    );
  }

  async markNotificationAsRead(id: string): Promise<void> {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    return Number(result[0]?.count || 0);
  }

  // Password reset tokens
  async createPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<PasswordResetToken> {
    const [resetToken] = await db.insert(passwordResetTokens).values({
      userId,
      token,
      expiresAt,
    }).returning();
    return resetToken;
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    const [resetToken] = await db.select().from(passwordResetTokens)
      .where(and(
        eq(passwordResetTokens.token, token),
        isNull(passwordResetTokens.usedAt),
        gte(passwordResetTokens.expiresAt, new Date())
      ));
    return resetToken;
  }

  async markPasswordResetTokenUsed(id: string): Promise<void> {
    await db.update(passwordResetTokens).set({ usedAt: new Date() }).where(eq(passwordResetTokens.id, id));
  }

  // Vehicles
  async createVehicle(vehicle: InsertVehicle): Promise<Vehicle> {
    const [v] = await db.insert(vehicles).values(vehicle).returning();
    return v;
  }

  async getVehicle(id: string): Promise<Vehicle | undefined> {
    const [v] = await db.select().from(vehicles).where(eq(vehicles.id, id));
    return v;
  }

  async getVehiclesByOwner(ownerId: string): Promise<Vehicle[]> {
    return await db.select().from(vehicles).where(eq(vehicles.ownerId, ownerId));
  }

  async getAllVehicles(): Promise<Vehicle[]> {
    return await db.select().from(vehicles).orderBy(desc(vehicles.createdAt));
  }

  // Resources
  async createResource(resource: InsertResource): Promise<Resource> {
    const [r] = await db.insert(resources).values(resource).returning();
    return r;
  }

  async getResource(id: string): Promise<Resource | undefined> {
    const [r] = await db.select().from(resources).where(eq(resources.id, id));
    return r;
  }

  async getAllResources(): Promise<Resource[]> {
    return await db.select().from(resources).where(eq(resources.isActive, true)).orderBy(resources.name);
  }

  async getResourcesByType(type: string): Promise<Resource[]> {
    return await db.select().from(resources).where(and(eq(resources.type, type), eq(resources.isActive, true)));
  }

  // Orders
  async createOrder(order: InsertOrder): Promise<Order> {
    const refNum = `DE${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const result = await db.insert(orders).values({ ...order, referenceNumber: refNum }).returning();
    if (result[0]) return result[0];
    // neon-http .returning() bug on tables with timestamps — re-fetch by referenceNumber.
    const [latest] = await db.select().from(orders).where(eq(orders.referenceNumber, refNum));
    return latest as Order;
  }

  async getOrder(id: string): Promise<Order | undefined> {
    const rows = await safeSelect(() =>
      db.select().from(orders).where(eq(orders.id, id))
    );
    return rows[0];
  }

  async getOrderByReference(referenceNumber: string): Promise<Order | undefined> {
    const [o] = await db.select().from(orders).where(eq(orders.referenceNumber, referenceNumber));
    return o;
  }

  async getAllOrders(): Promise<Order[]> {
    return await db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async getOrdersByStatus(status: string): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.status, status)).orderBy(desc(orders.createdAt));
  }

  async getOrdersByClient(clientId: string): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.clientId, clientId)).orderBy(desc(orders.createdAt));
  }

  async updateOrder(id: string, data: Partial<InsertOrder>): Promise<Order | undefined> {
    const [o] = await db.update(orders).set({ ...data, updatedAt: new Date() }).where(eq(orders.id, id)).returning();
    return o;
  }

  // Appointments
  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const safe = nullifyFkFields(appointment as any, ["orderId"] as const);
    const result = await db.insert(appointments).values(safe).returning();
    console.log("[storage.createAppointment] returning len:", result.length, "first:", JSON.stringify(result[0]));
    if (result[0]) return result[0] as Appointment;
    // Fallback: neon-http occasionally returns empty for .returning(); re-fetch latest matching row.
    const [latest] = await db
      .select()
      .from(appointments)
      .where(and(
        eq(appointments.resourceId, appointment.resourceId),
        eq(appointments.startTime, appointment.startTime as Date),
      ))
      .orderBy(desc(appointments.createdAt))
      .limit(1);
    return latest as Appointment;
  }

  async getAppointment(id: string): Promise<Appointment | undefined> {
    const [a] = await db.select().from(appointments).where(eq(appointments.id, id));
    return a;
  }

  async getAppointmentsByResource(resourceId: string, startDate?: Date, endDate?: Date): Promise<Appointment[]> {
    let query = db.select().from(appointments).where(eq(appointments.resourceId, resourceId));
    if (startDate && endDate) {
      query = db.select().from(appointments).where(and(
        eq(appointments.resourceId, resourceId),
        gte(appointments.startTime, startDate),
        lte(appointments.endTime, endDate)
      ));
    }
    return await query.orderBy(appointments.startTime);
  }

  async getAppointmentsInRange(startDate: Date, endDate: Date): Promise<Appointment[]> {
    return await safeSelect(() => db.select().from(appointments)
      .where(and(gte(appointments.startTime, startDate), lte(appointments.endTime, endDate)))
      .orderBy(appointments.startTime));
  }

  async updateAppointment(id: string, data: Partial<InsertAppointment>): Promise<Appointment | undefined> {
    const result = await db.update(appointments).set({ ...data, updatedAt: new Date() }).where(eq(appointments.id, id)).returning();
    if (result[0]) return result[0];
    // neon-http .returning() can be empty for tables w/ timestamps; re-fetch.
    return await this.getAppointment(id);
  }

  async deleteAppointment(id: string): Promise<void> {
    await db.delete(appointments).where(eq(appointments.id, id));
  }

  // Media files
  async createMediaFile(file: InsertMediaFile): Promise<MediaFile> {
    const [f] = await db.insert(mediaFiles).values(file).returning();
    return f;
  }

  async getMediaFilesByOrder(orderId: string): Promise<MediaFile[]> {
    return await db.select().from(mediaFiles).where(eq(mediaFiles.orderId, orderId));
  }

  // Line items
  async createLineItem(item: InsertLineItem): Promise<LineItem> {
    const [li] = await db.insert(lineItems).values(item).returning();
    return li;
  }

  async getLineItemsByOrder(orderId: string): Promise<LineItem[]> {
    return await db.select().from(lineItems).where(eq(lineItems.orderId, orderId));
  }

  async deleteLineItem(id: string): Promise<void> {
    await db.delete(lineItems).where(eq(lineItems.id, id));
  }

  // Invoices
  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const [inv] = await db.insert(invoices).values(invoice).returning();
    return inv;
  }

  async getInvoiceByOrder(orderId: string): Promise<Invoice | undefined> {
    const [inv] = await db.select().from(invoices).where(eq(invoices.orderId, orderId));
    return inv;
  }

  // Dashboard KPIs
  async getDashboardStats(): Promise<{
    todayOrders: number;
    inProgressOrders: number;
    completedToday: number;
    estimatedRevenueToday: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [todayStats] = await db.select({
      count: sql<number>`count(*)`
    }).from(orders).where(and(
      gte(orders.createdAt, today),
      lte(orders.createdAt, tomorrow)
    ));

    const [inProgress] = await db.select({
      count: sql<number>`count(*)`
    }).from(orders).where(eq(orders.status, 'in_repair'));

    const [completedToday] = await db.select({
      count: sql<number>`count(*)`
    }).from(orders).where(and(
      eq(orders.status, 'completed'),
      gte(orders.completedAt, today)
    ));

    const [revenue] = await db.select({
      total: sql<number>`COALESCE(SUM(total_gross_cents), 0)`
    }).from(orders).where(and(
      eq(orders.status, 'completed'),
      gte(orders.completedAt, today)
    ));

    return {
      todayOrders: Number(todayStats?.count || 0),
      inProgressOrders: Number(inProgress?.count || 0),
      completedToday: Number(completedToday?.count || 0),
      estimatedRevenueToday: Number(revenue?.total || 0),
    };
  }

  // Financial profiles
  async createFinancialProfile(profile: InsertFinancialProfile): Promise<FinancialProfile> {
    const [result] = await db.insert(financialProfiles).values(profile).returning();
    return result;
  }

  async getFinancialProfile(id: string): Promise<FinancialProfile | undefined> {
    const [result] = await db.select().from(financialProfiles).where(eq(financialProfiles.id, id));
    return result;
  }

  async getAllFinancialProfiles(): Promise<FinancialProfile[]> {
    return db.select().from(financialProfiles).orderBy(desc(financialProfiles.createdAt));
  }

  async getFinancialProfilesByUser(userId: string): Promise<FinancialProfile[]> {
    return db.select().from(financialProfiles)
      .where(eq(financialProfiles.userId, userId))
      .orderBy(desc(financialProfiles.createdAt));
  }

  async updateFinancialProfile(id: string, data: Partial<InsertFinancialProfile>): Promise<FinancialProfile | undefined> {
    const [result] = await db
      .update(financialProfiles)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(financialProfiles.id, id))
      .returning();
    return result;
  }

  async deleteFinancialProfile(id: string): Promise<void> {
    await db.delete(bwaEntries).where(eq(bwaEntries.profileId, id));
    await db.delete(financialProfiles).where(eq(financialProfiles.id, id));
  }

  // BWA entries
  async createBwaEntry(entry: InsertBwaEntry): Promise<BwaEntry> {
    const [result] = await db.insert(bwaEntries).values(entry).returning();
    return result;
  }

  async getBwaEntry(id: string): Promise<BwaEntry | undefined> {
    const [result] = await db.select().from(bwaEntries).where(eq(bwaEntries.id, id));
    return result;
  }

  async getBwaEntriesByProfile(profileId: string): Promise<BwaEntry[]> {
    return db.select().from(bwaEntries)
      .where(eq(bwaEntries.profileId, profileId))
      .orderBy(desc(bwaEntries.period));
  }

  async updateBwaEntry(id: string, data: Partial<InsertBwaEntry>): Promise<BwaEntry | undefined> {
    const [result] = await db
      .update(bwaEntries)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(bwaEntries.id, id))
      .returning();
    return result;
  }

  async deleteBwaEntry(id: string): Promise<void> {
    await db.delete(bwaEntries).where(eq(bwaEntries.id, id));
  }

  // Expense categories
  async createExpenseCategory(category: InsertExpenseCategory): Promise<ExpenseCategory> {
    const [result] = await db.insert(expenseCategories).values(category).returning();
    return result;
  }

  async getExpenseCategoriesByUser(userId: string): Promise<ExpenseCategory[]> {
    return db.select().from(expenseCategories)
      .where(eq(expenseCategories.userId, userId))
      .orderBy(expenseCategories.name);
  }

  async updateExpenseCategory(id: string, data: Partial<InsertExpenseCategory>): Promise<ExpenseCategory | undefined> {
    const [result] = await db
      .update(expenseCategories)
      .set(data)
      .where(eq(expenseCategories.id, id))
      .returning();
    return result;
  }

  async deleteExpenseCategory(id: string): Promise<void> {
    await db.delete(expenseCategories).where(eq(expenseCategories.id, id));
  }

  // Financial transactions
  async createFinancialTransaction(tx: InsertFinancialTransaction): Promise<FinancialTransaction> {
    const [result] = await db.insert(financialTransactions).values(tx).returning();
    return result;
  }

  async getFinancialTransactionsByUser(userId: string): Promise<FinancialTransaction[]> {
    return db.select().from(financialTransactions)
      .where(eq(financialTransactions.userId, userId))
      .orderBy(desc(financialTransactions.date));
  }

  async updateFinancialTransaction(id: string, data: Partial<InsertFinancialTransaction>): Promise<FinancialTransaction | undefined> {
    const [result] = await db
      .update(financialTransactions)
      .set(data)
      .where(eq(financialTransactions.id, id))
      .returning();
    return result;
  }

  async deleteFinancialTransaction(id: string): Promise<void> {
    await db.delete(financialTransactions).where(eq(financialTransactions.id, id));
  }

  // Clients (CRM)
  async createClient(client: InsertClient): Promise<Client> {
    const [result] = await db.insert(clients).values(client).returning();
    return result;
  }

  async getClient(id: string): Promise<Client | undefined> {
    const [result] = await db.select().from(clients).where(eq(clients.id, id));
    return result;
  }

  async getClientsByPartner(partnerId: string): Promise<Client[]> {
    return db.select().from(clients).where(eq(clients.partnerId, partnerId)).orderBy(desc(clients.createdAt));
  }

  async getAllClients(): Promise<Client[]> {
    return db.select().from(clients).orderBy(desc(clients.createdAt));
  }

  async updateClient(id: string, data: Partial<InsertClient>): Promise<Client | undefined> {
    const [result] = await db.update(clients).set({ ...data, updatedAt: new Date() }).where(eq(clients.id, id)).returning();
    return result;
  }

  async deleteClient(id: string): Promise<void> {
    await db.delete(clientInteractions).where(eq(clientInteractions.clientId, id));
    await db.delete(clients).where(eq(clients.id, id));
  }

  // Client interactions
  async createClientInteraction(interaction: InsertClientInteraction): Promise<ClientInteraction> {
    const [result] = await db.insert(clientInteractions).values(interaction).returning();
    return result;
  }

  async getInteractionsByClient(clientId: string): Promise<ClientInteraction[]> {
    return db.select().from(clientInteractions).where(eq(clientInteractions.clientId, clientId)).orderBy(desc(clientInteractions.createdAt));
  }

  // Offers
  async createOffer(offer: InsertOffer): Promise<Offer> {
    // Add 4 random base36 chars to Date.now() to avoid same-millisecond collisions
    // under parallel POSTs (the column has a UNIQUE constraint, so a collision would
    // otherwise cause one INSERT to fail and the refetch fallback to return the wrong row).
    const rand = Math.floor(Math.random() * 36 ** 4).toString(36).toUpperCase().padStart(4, "0");
    const num = `AG${Date.now().toString(36).toUpperCase()}${rand}`;
    const rows = await db.insert(offers).values({ ...offer, offerNumber: num }).returning();
    if (rows.length > 0 && rows[0]) return rows[0];
    // neon-http occasionally returns null/empty for RETURNING; refetch by unique offerNumber.
    const refetched = await safeSelect(() =>
      db.select().from(offers).where(eq(offers.offerNumber, num)).limit(1)
    );
    if (refetched[0]) return refetched[0];
    throw new Error("createOffer: insert succeeded but row not found");
  }

  async getOffer(id: string): Promise<Offer | undefined> {
    const rows = await safeSelect(() => db.select().from(offers).where(eq(offers.id, id)));
    return rows[0];
  }

  async getOffersByPartner(partnerId: string): Promise<Offer[]> {
    return await safeSelect(() => db.select().from(offers).where(eq(offers.partnerId, partnerId)).orderBy(desc(offers.createdAt)));
  }

  async getAllOffers(): Promise<Offer[]> {
    return await safeSelect(() => db.select().from(offers).orderBy(desc(offers.createdAt)));
  }

  async updateOffer(id: string, data: Partial<InsertOffer>): Promise<Offer | undefined> {
    const rows = await db.update(offers).set({ ...data, updatedAt: new Date() }).where(eq(offers.id, id)).returning();
    if (rows.length > 0 && rows[0]) return rows[0];
    const refetched = await safeSelect(() => db.select().from(offers).where(eq(offers.id, id)).limit(1));
    return refetched[0];
  }

  async deleteOffer(id: string): Promise<void> {
    await db.delete(offerLineItems).where(eq(offerLineItems.offerId, id));
    await db.delete(offers).where(eq(offers.id, id));
  }

  // Offer line items
  async createOfferLineItem(item: InsertOfferLineItem): Promise<OfferLineItem> {
    const rows = await db.insert(offerLineItems).values(item).returning();
    if (rows.length > 0 && rows[0]) return rows[0];
    // neon-http occasionally returns null/empty for RETURNING; refetch the most recent row for this offer.
    const refetched = await safeSelect(() =>
      db.select().from(offerLineItems)
        .where(eq(offerLineItems.offerId, item.offerId))
        .orderBy(desc(offerLineItems.createdAt))
        .limit(1)
    );
    if (refetched[0]) return refetched[0];
    throw new Error("createOfferLineItem: insert succeeded but row not found");
  }

  async getOfferLineItems(offerId: string): Promise<OfferLineItem[]> {
    return await safeSelect(() => db.select().from(offerLineItems).where(eq(offerLineItems.offerId, offerId)).orderBy(offerLineItems.createdAt));
  }

  async deleteOfferLineItem(id: string): Promise<void> {
    await db.delete(offerLineItems).where(eq(offerLineItems.id, id));
  }

  async deleteOfferLineItemsByOffer(offerId: string): Promise<void> {
    await db.delete(offerLineItems).where(eq(offerLineItems.offerId, offerId));
  }

  // Partner transactions
  async createPartnerTransaction(tx: InsertPartnerTransaction): Promise<PartnerTransaction> {
    const [result] = await db.insert(partnerTransactions).values(tx).returning();
    return result;
  }

  async getPartnerTransactions(partnerId: string): Promise<PartnerTransaction[]> {
    return await safeSelect(() => db.select().from(partnerTransactions).where(eq(partnerTransactions.partnerId, partnerId)).orderBy(desc(partnerTransactions.createdAt)));
  }

  async getAllPartnerTransactions(): Promise<PartnerTransaction[]> {
    return await safeSelect(() => db.select().from(partnerTransactions).orderBy(desc(partnerTransactions.createdAt)));
  }

  async updatePartnerTransaction(id: string, data: Partial<InsertPartnerTransaction>): Promise<PartnerTransaction | undefined> {
    const [result] = await db.update(partnerTransactions).set(data).where(eq(partnerTransactions.id, id)).returning();
    return result;
  }

  // Daily financial entries
  async createDailyFinancialEntry(entry: InsertDailyFinancialEntry): Promise<DailyFinancialEntry> {
    const rows = await db.insert(dailyFinancialEntries).values(entry).returning();
    if (rows.length > 0) return rows[0];
    // neon-http occasionally returns null/empty for RETURNING; refetch most recent
    // matching entry for this partner+date as a defensive fallback.
    const refetched = await safeSelect(() =>
      db.select().from(dailyFinancialEntries)
        .where(and(
          eq(dailyFinancialEntries.partnerId, entry.partnerId),
          eq(dailyFinancialEntries.entryDate, entry.entryDate as any),
        ))
        .orderBy(desc(dailyFinancialEntries.createdAt))
        .limit(1)
    );
    if (refetched[0]) return refetched[0];
    throw new Error("createDailyFinancialEntry: insert succeeded but row not found");
  }

  async getDailyFinancialEntryById(id: string): Promise<DailyFinancialEntry | undefined> {
    const rows = await safeSelect(() => db.select().from(dailyFinancialEntries).where(eq(dailyFinancialEntries.id, id)));
    return rows[0];
  }

  async getDailyFinancialEntriesByPartner(partnerId: string, year: number, month: number): Promise<DailyFinancialEntry[]> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    const result = await db.select().from(dailyFinancialEntries)
      .where(and(
        eq(dailyFinancialEntries.partnerId, partnerId),
        gte(dailyFinancialEntries.entryDate, startDate),
        lte(dailyFinancialEntries.entryDate, endDate)
      ))
      .orderBy(dailyFinancialEntries.entryDate);
    return result ?? [];
  }

  async getAllDailyFinancialEntries(year: number, month: number): Promise<DailyFinancialEntry[]> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    const result = await db.select().from(dailyFinancialEntries)
      .where(and(
        gte(dailyFinancialEntries.entryDate, startDate),
        lte(dailyFinancialEntries.entryDate, endDate)
      ))
      .orderBy(dailyFinancialEntries.entryDate);
    return result ?? [];
  }

  async updateDailyFinancialEntry(id: string, data: Partial<InsertDailyFinancialEntry>): Promise<DailyFinancialEntry | undefined> {
    const [result] = await db.update(dailyFinancialEntries).set(data).where(eq(dailyFinancialEntries.id, id)).returning();
    return result;
  }

  async deleteDailyFinancialEntry(id: string): Promise<void> {
    await db.delete(dailyFinancialEntries).where(eq(dailyFinancialEntries.id, id));
  }

  // Fixed cost items
  async createFixedCostItem(item: InsertFixedCostItem): Promise<FixedCostItem> {
    const [result] = await db.insert(fixedCostItems).values(item).returning();
    return result;
  }

  async getFixedCostItemById(id: string): Promise<FixedCostItem | undefined> {
    const [result] = await db.select().from(fixedCostItems).where(eq(fixedCostItems.id, id));
    return result;
  }

  async getFixedCostItemsByPartner(partnerId: string): Promise<FixedCostItem[]> {
    return db.select().from(fixedCostItems).where(eq(fixedCostItems.partnerId, partnerId)).orderBy(fixedCostItems.name);
  }

  async updateFixedCostItem(id: string, data: Partial<InsertFixedCostItem>): Promise<FixedCostItem | undefined> {
    const [result] = await db.update(fixedCostItems).set(data).where(eq(fixedCostItems.id, id)).returning();
    return result;
  }

  async deleteFixedCostItem(id: string): Promise<void> {
    await db.delete(fixedCostItems).where(eq(fixedCostItems.id, id));
  }

  // Workshop orders
  async createWorkshopOrder(order: InsertWorkshopOrder): Promise<WorkshopOrder> {
    const refNum = "WO-" + Math.random().toString(36).substring(2, 10).toUpperCase();
    const safe = nullifyFkFields({ ...order, referenceNumber: refNum }, ["partnerId", "clientUserId"] as const);
    const rows = await db.insert(workshopOrders).values(safe).returning();
    let row = rows[0];
    if (!row) {
      const [fetched] = await db.select().from(workshopOrders).where(eq(workshopOrders.referenceNumber, refNum));
      if (!fetched) throw new Error("Workshop order creation failed - record not found after insert");
      row = fetched;
    }
    return (await hydrateWorkshopOrderDate(row))!;
  }

  async getWorkshopOrder(id: string): Promise<WorkshopOrder | undefined> {
    const [result] = await db.select().from(workshopOrders).where(eq(workshopOrders.id, id));
    return await hydrateWorkshopOrderDate(result);
  }

  async getWorkshopOrderByReference(refNumber: string): Promise<WorkshopOrder | undefined> {
    const [result] = await db.select().from(workshopOrders).where(eq(workshopOrders.referenceNumber, refNumber));
    return await hydrateWorkshopOrderDate(result);
  }

  async getWorkshopOrdersByPartner(partnerId: string): Promise<WorkshopOrder[]> {
    const rows = await db.select().from(workshopOrders).where(eq(workshopOrders.partnerId, partnerId)).orderBy(desc(workshopOrders.createdAt));
    return await hydrateWorkshopOrderDates(rows);
  }

  async getAllWorkshopOrders(): Promise<WorkshopOrder[]> {
    const rows = await db.select().from(workshopOrders).orderBy(desc(workshopOrders.createdAt));
    return await hydrateWorkshopOrderDates(rows);
  }

  async updateWorkshopOrder(id: string, data: Partial<InsertWorkshopOrder>): Promise<WorkshopOrder | undefined> {
    const safe = nullifyFkFields(data, ["partnerId", "clientUserId"] as const);
    // Faza B — capture pre-state via raw SQL (drizzle returns Invalid Date for
    // `timestamp` columns on neon-http) so the dispatcher can detect changes.
    const { readOrderDispatchSnapshot, dispatchOrderUpdateNotifications } = await import(
      "./services/notificationService"
    );
    const beforeSnapshot = await readOrderDispatchSnapshot(id).catch(() => null);
    const before = await this.getWorkshopOrder(id);
    const rows = await db.update(workshopOrders).set(safe).where(eq(workshopOrders.id, id)).returning();
    const rawAfter = rows.length > 0 ? rows[0] : await this.getWorkshopOrder(id);
    const after = await hydrateWorkshopOrderDate(rawAfter as any);
    // Fire-and-forget notification dispatcher (never throws to caller)
    try {
      dispatchOrderUpdateNotifications(before, after, beforeSnapshot ?? undefined);
    } catch (err: any) {
      console.error("[updateWorkshopOrder] dispatch failed", err?.message);
    }
    return after;
  }

  async createWorkshopPayout(data: InsertWorkshopPayout): Promise<WorkshopPayout> {
    const rows = await db.insert(workshopPayouts).values(data).returning();
    if (rows.length > 0) return rows[0];
    const [fetched] = await db
      .select()
      .from(workshopPayouts)
      .where(eq(workshopPayouts.workshopOrderId, data.workshopOrderId))
      .orderBy(desc(workshopPayouts.createdAt));
    if (!fetched) throw new Error("Workshop payout creation failed");
    return fetched;
  }

  async getWorkshopPayoutByOrder(workshopOrderId: string): Promise<WorkshopPayout | undefined> {
    const rows = await safeSelect(() =>
      db
        .select()
        .from(workshopPayouts)
        .where(eq(workshopPayouts.workshopOrderId, workshopOrderId))
        .orderBy(desc(workshopPayouts.createdAt)),
    );
    return rows[0];
  }

  async updateWorkshopPayout(
    id: string,
    data: Partial<InsertWorkshopPayout>,
  ): Promise<WorkshopPayout | undefined> {
    const rows = await db
      .update(workshopPayouts)
      .set(data)
      .where(eq(workshopPayouts.id, id))
      .returning();
    if (rows.length > 0) return rows[0];
    const [fetched] = await db
      .select()
      .from(workshopPayouts)
      .where(eq(workshopPayouts.id, id));
    return fetched;
  }

  async getPartnerWorkshopRetentionTotalCents(
    partnerId: string,
    excludeOrderId?: string,
  ): Promise<number> {
    const filters = [
      eq(workshopPayouts.partnerId, partnerId),
      isNull(workshopPayouts.retentionReleasedAt),
      ne(workshopPayouts.status, "forfeit"),
    ];
    if (excludeOrderId) {
      filters.push(ne(workshopPayouts.workshopOrderId, excludeOrderId));
    }
    const rows = await db
      .select({ total: sql<string>`COALESCE(SUM(${workshopPayouts.warrantyRetentionCents}), 0)` })
      .from(workshopPayouts)
      .where(and(...filters));
    const raw = rows[0]?.total ?? "0";
    const n = typeof raw === "string" ? parseInt(raw, 10) : Number(raw);
    return Number.isFinite(n) ? n : 0;
  }

  async hasTokenLedgerEntry(userId: string, reason: string, relatedAuftragId: string): Promise<boolean> {
    const rows = await safeSelect(() =>
      db
        .select({ id: tokenLedger.id })
        .from(tokenLedger)
        .where(
          and(
            eq(tokenLedger.userId, userId),
            eq(tokenLedger.reason, reason),
            eq(tokenLedger.relatedAuftragId, relatedAuftragId),
          ),
        )
        .limit(1),
    );
    return rows.length > 0;
  }

  async creditTokensIdempotent(
    userId: string,
    amount: number,
    reason: string,
    relatedAuftragId: string,
  ): Promise<{ balance: number; credited: boolean }> {
    if (amount <= 0) {
      return { balance: await this.getTokenBalance(userId), credited: false };
    }
    await this.ensureUserTokenBalance(userId, 0);
    const result: any = await db.execute(sql`
      WITH current AS (
        SELECT balance FROM user_tokens WHERE user_id = ${userId}
      ),
      ins AS (
        INSERT INTO token_ledger (user_id, delta, balance_after, reason, related_auftrag_id)
        SELECT ${userId}, ${amount}, COALESCE((SELECT balance FROM current), 0) + ${amount}, ${reason}, ${relatedAuftragId}
        ON CONFLICT (user_id, reason, related_auftrag_id)
          WHERE reason IN ('job_completed','warranty_retention_released') AND related_auftrag_id IS NOT NULL
        DO NOTHING
        RETURNING balance_after
      ),
      upd AS (
        UPDATE user_tokens
        SET balance = balance + ${amount}, updated_at = now()
        WHERE user_id = ${userId} AND EXISTS (SELECT 1 FROM ins)
        RETURNING balance
      )
      SELECT
        COALESCE((SELECT balance FROM upd), (SELECT balance FROM current), 0)::int AS balance,
        EXISTS (SELECT 1 FROM ins) AS credited;
    `);
    const row: any = (result?.rows ?? result)[0] ?? {};
    return { balance: Number(row.balance ?? 0), credited: !!row.credited };
  }

  async listWorkshopPayoutsDueForRetentionRelease(beforeDate: Date): Promise<WorkshopPayout[]> {
    return safeSelect(() =>
      db
        .select()
        .from(workshopPayouts)
        .where(
          and(
            eq(workshopPayouts.status, "paid"),
            isNull(workshopPayouts.retentionReleasedAt),
            lte(workshopPayouts.paidAt, beforeDate),
          ),
        )
        .orderBy(workshopPayouts.paidAt),
    );
  }

  async deleteWorkshopOrder(id: string): Promise<void> {
    await db.delete(workshopOrders).where(eq(workshopOrders.id, id));
  }

  async getWorkshopOrdersByClient(clientUserId: string): Promise<WorkshopOrder[]> {
    const rows = await db.select().from(workshopOrders).where(eq(workshopOrders.clientUserId, clientUserId)).orderBy(desc(workshopOrders.createdAt));
    return await hydrateWorkshopOrderDates(rows);
  }

  async getOffersByClientUser(clientUserId: string): Promise<Offer[]> {
    return db.select().from(offers).where(eq(offers.clientUserId, clientUserId)).orderBy(desc(offers.createdAt));
  }

  async createFileAttachment(data: InsertFileAttachment): Promise<FileAttachment> {
    const id = (data as any).id ?? (await import("crypto")).randomUUID();
    await db.insert(fileAttachments).values({ ...(data as any), id });
    const [row] = await db.select().from(fileAttachments).where(eq(fileAttachments.id, id));
    if (!row) throw new Error("createFileAttachment: row not found after insert");
    return row as FileAttachment;
  }

  async getFileAttachment(id: string): Promise<FileAttachment | undefined> {
    const [result] = await db.select().from(fileAttachments).where(eq(fileAttachments.id, id));
    return result;
  }

  async getFileAttachmentsByOrder(workshopOrderId: string): Promise<Omit<FileAttachment, 'data'>[]> {
    return db.select({
      id: fileAttachments.id,
      workshopOrderId: fileAttachments.workshopOrderId,
      filename: fileAttachments.filename,
      originalName: fileAttachments.originalName,
      mimeType: fileAttachments.mimeType,
      size: fileAttachments.size,
      uploadedBy: fileAttachments.uploadedBy,
      driveFileId: fileAttachments.driveFileId,
      driveLink: fileAttachments.driveLink,
      category: fileAttachments.category,
      createdAt: fileAttachments.createdAt,
    }).from(fileAttachments).where(eq(fileAttachments.workshopOrderId, workshopOrderId)).orderBy(desc(fileAttachments.createdAt));
  }

  async deleteFileAttachment(id: string): Promise<void> {
    await db.delete(fileAttachments).where(eq(fileAttachments.id, id));
  }

  // ============== Order CRM ==============
  async listOrderCrmLinks(orderId: string): Promise<OrderCrmLink[]> {
    return db.select().from(orderCrmLinks)
      .where(eq(orderCrmLinks.workshopOrderId, orderId))
      .orderBy(desc(orderCrmLinks.createdAt));
  }
  async createOrderCrmLink(data: InsertOrderCrmLink): Promise<OrderCrmLink> {
    const safe = nullifyFkFields(data, ["createdBy"] as const);
    const [row] = await db.insert(orderCrmLinks).values(safe as any).returning();
    return row;
  }
  async deleteOrderCrmLink(id: string): Promise<void> {
    await db.delete(orderCrmLinks).where(eq(orderCrmLinks.id, id));
  }

  async listOrderFollowUps(orderId: string): Promise<OrderFollowUp[]> {
    return db.select().from(orderFollowUps)
      .where(eq(orderFollowUps.workshopOrderId, orderId))
      .orderBy(orderFollowUps.dueAt);
  }
  async createOrderFollowUp(data: InsertOrderFollowUp): Promise<OrderFollowUp> {
    const safe = nullifyFkFields(data, ["assigneeId", "createdBy"] as const);
    const [row] = await db.insert(orderFollowUps).values(safe as any).returning();
    return row;
  }
  async updateOrderFollowUp(id: string, data: Partial<InsertOrderFollowUp>): Promise<OrderFollowUp | undefined> {
    const safe = nullifyFkFields(data as any, ["assigneeId", "createdBy"] as const);
    const [row] = await db.update(orderFollowUps).set(safe as any).where(eq(orderFollowUps.id, id)).returning();
    return row;
  }
  async deleteOrderFollowUp(id: string): Promise<void> {
    await db.delete(orderFollowUps).where(eq(orderFollowUps.id, id));
  }

  async listOrderTimelineEvents(orderId: string, limit = 100): Promise<OrderTimelineEvent[]> {
    return db.select().from(orderTimelineEvents)
      .where(eq(orderTimelineEvents.workshopOrderId, orderId))
      .orderBy(desc(orderTimelineEvents.createdAt))
      .limit(limit);
  }
  async createOrderTimelineEvent(data: InsertOrderTimelineEvent): Promise<OrderTimelineEvent> {
    const safe = nullifyFkFields(data, ["actorId"] as const);
    const [row] = await db.insert(orderTimelineEvents).values(safe as any).returning();
    return row;
  }

  async getOrderAiInsight(orderId: string): Promise<OrderAiInsight | undefined> {
    const [row] = await db.select().from(orderAiInsights)
      .where(eq(orderAiInsights.workshopOrderId, orderId));
    return row;
  }
  async upsertOrderAiInsight(data: InsertOrderAiInsight): Promise<OrderAiInsight> {
    const existing = await this.getOrderAiInsight(data.workshopOrderId);
    if (existing) {
      const [row] = await db.update(orderAiInsights)
        .set({ ...(data as any), generatedAt: new Date() })
        .where(eq(orderAiInsights.id, existing.id))
        .returning();
      return row;
    }
    const safe = nullifyFkFields(data, ["generatedBy"] as const);
    const [row] = await db.insert(orderAiInsights).values(safe as any).returning();
    return row;
  }

  // Partner financial entries (Break-Even)
  async createPartnerFinancialEntry(data: InsertPartnerFinancialEntry): Promise<PartnerFinancialEntry> {
    const [entry] = await db.insert(partnerFinancialEntries).values(data).returning();
    return entry;
  }

  async getPartnerFinancialEntries(partnerId: string, month: number, year: number): Promise<PartnerFinancialEntry[]> {
    return safeSelect(() =>
      db.select().from(partnerFinancialEntries).where(
        and(
          eq(partnerFinancialEntries.partnerId, partnerId),
          eq(partnerFinancialEntries.month, month),
          eq(partnerFinancialEntries.year, year)
        )
      ).orderBy(partnerFinancialEntries.entryDate),
    );
  }

  async updatePartnerFinancialEntry(id: string, data: Partial<InsertPartnerFinancialEntry>): Promise<PartnerFinancialEntry | undefined> {
    const [updated] = await db.update(partnerFinancialEntries).set(data).where(eq(partnerFinancialEntries.id, id)).returning();
    return updated;
  }

  async deletePartnerFinancialEntry(id: string): Promise<void> {
    await db.delete(partnerFinancialEntries).where(eq(partnerFinancialEntries.id, id));
  }

  async getAllPartnerFinancialEntries(partnerId: string, year: number): Promise<PartnerFinancialEntry[]> {
    return safeSelect(() =>
      db.select().from(partnerFinancialEntries).where(
        and(
          eq(partnerFinancialEntries.partnerId, partnerId),
          eq(partnerFinancialEntries.year, year)
        )
      ).orderBy(partnerFinancialEntries.entryDate),
    );
  }

  // Partner fixed costs
  async createPartnerFixedCost(data: InsertPartnerFixedCost): Promise<PartnerFixedCost> {
    const [cost] = await db.insert(partnerFixedCosts).values(data).returning();
    return cost;
  }

  async getPartnerFixedCosts(partnerId: string): Promise<PartnerFixedCost[]> {
    return safeSelect(() =>
      db.select().from(partnerFixedCosts).where(eq(partnerFixedCosts.partnerId, partnerId)).orderBy(partnerFixedCosts.sortOrder),
    );
  }

  async updatePartnerFixedCost(id: string, data: Partial<InsertPartnerFixedCost>): Promise<PartnerFixedCost | undefined> {
    const [updated] = await db.update(partnerFixedCosts).set(data).where(eq(partnerFixedCosts.id, id)).returning();
    return updated;
  }

  async deletePartnerFixedCost(id: string): Promise<void> {
    await db.delete(partnerFixedCosts).where(eq(partnerFixedCosts.id, id));
  }

  // Board tasks (Trello)
  async createBoardTask(data: InsertBoardTask): Promise<BoardTask> {
    const [task] = await db.insert(boardTasks).values(data).returning();
    return task;
  }

  async getBoardTask(id: string): Promise<BoardTask | undefined> {
    const [task] = await db.select().from(boardTasks).where(eq(boardTasks.id, id));
    return task;
  }

  async getAllBoardTasks(): Promise<BoardTask[]> {
    return db.select().from(boardTasks).orderBy(boardTasks.sortOrder, desc(boardTasks.createdAt));
  }

  async updateBoardTask(id: string, data: Partial<InsertBoardTask>): Promise<BoardTask | undefined> {
    // neon-http / current driver path can fail or return empty rows on UPDATE ... RETURNING.
    // Keep TaskBoard updates consistent with the rest of the repo: update first, then re-select.
    await db.update(boardTasks).set(data as any).where(eq(boardTasks.id, id));
    return this.getBoardTask(id);
  }

  async deleteBoardTask(id: string): Promise<void> {
    await db.delete(boardTasks).where(eq(boardTasks.id, id));
  }

  // ===== Documents =====
  async createDocument(data: InsertDocument): Promise<Document> {
    // neon-http currently returns empty rows for INSERT...RETURNING; use a generated id + follow-up SELECT.
    const id = (data as any).id || crypto.randomUUID();
    await db.insert(documents).values({ ...data, id } as any);
    const doc = await this.getDocument(id);
    if (!doc) throw new Error("createDocument: insert succeeded but row not found");
    return doc;
  }
  async getDocument(id: string): Promise<Document | undefined> {
    const [doc] = await db.select().from(documents).where(eq(documents.id, id));
    return doc;
  }
  async getAllDocuments(filters?: { category?: string; fileType?: string; language?: string; templateKey?: string }): Promise<Document[]> {
    const conds: any[] = [];
    if (filters?.category) conds.push(eq(documents.category, filters.category));
    if (filters?.fileType) conds.push(eq(documents.fileType, filters.fileType));
    if (filters?.language) conds.push(eq(documents.language, filters.language));
    if (filters?.templateKey) conds.push(eq(documents.templateKey, filters.templateKey));
    // Workaround for neon-http driver bug: empty result sets in arrayMode crash
    // with "Cannot read properties of null (reading 'map')". Treat that as [].
    try {
      if (conds.length) {
        return await db.select().from(documents).where(and(...conds)).orderBy(desc(documents.updatedAt));
      }
      return await db.select().from(documents).orderBy(desc(documents.updatedAt));
    } catch (e: any) {
      if (typeof e?.message === "string" && e.message.includes("Cannot read properties of null")) {
        return [];
      }
      throw e;
    }
  }
  async updateDocument(id: string, data: Partial<InsertDocument>): Promise<Document | undefined> {
    // neon-http currently returns empty rows for UPDATE...RETURNING; fall back to UPDATE + SELECT
    await db.update(documents).set({ ...data, updatedAt: new Date() }).where(eq(documents.id, id));
    return this.getDocument(id);
  }
  async deleteDocument(id: string): Promise<void> {
    await db.delete(documents).where(eq(documents.id, id));
  }

  async grantDocumentAccess(data: InsertDocumentAccess): Promise<DocumentAccess> {
    await db.delete(documentAccess).where(eq(documentAccess.userId, data.userId));
    // neon-http currently returns empty rows for INSERT...RETURNING; insert + follow-up SELECT.
    await db.insert(documentAccess).values(data);
    const [row] = await db.select().from(documentAccess).where(eq(documentAccess.userId, data.userId));
    return row;
  }
  async revokeDocumentAccess(userId: string): Promise<void> {
    await db.delete(documentAccess).where(eq(documentAccess.userId, userId));
  }
  async getAllDocumentAccess(): Promise<(DocumentAccess & { user?: User })[]> {
    const rows = await db.select().from(documentAccess);
    const result: (DocumentAccess & { user?: User })[] = [];
    for (const r of rows) {
      const u = await this.getUser(r.userId);
      result.push({ ...r, user: u });
    }
    return result;
  }
  async hasDocumentAccess(userId: string, requireEdit?: boolean): Promise<boolean> {
    const u = await this.getUser(userId);
    if (u?.role === "admin") return true;
    const [row] = await db.select().from(documentAccess).where(eq(documentAccess.userId, userId));
    if (!row) return false;
    if (requireEdit) return row.permission === "edit";
    return true;
  }

  // ============== Auftrag (Hub+1) orders ==============
  // NOTE: neon-http occasionally returns null instead of [] for SELECTs; we
  // defensively wrap reads to surface a sane empty result in that case.
  async createAuftragOrder(data: InsertAuftragOrder & { referenceNumber: string }): Promise<AuftragOrder> {
    const safe = nullifyFkFields(data, ["assignedPartnerId", "createdById"] as const);
    await db.insert(auftragOrders).values(safe);
    const rows = await safeSelect(() =>
      db.select().from(auftragOrders).where(eq(auftragOrders.referenceNumber, data.referenceNumber))
    );
    const row = rows[0];
    if (!row) throw new Error("createAuftragOrder: insert succeeded but row not found");
    return row;
  }
  async getAuftragOrder(id: string): Promise<AuftragOrder | undefined> {
    const rows = await safeSelect(() => db.select().from(auftragOrders).where(eq(auftragOrders.id, id)));
    return rows[0];
  }
  async getAllAuftragOrders(): Promise<AuftragOrder[]> {
    return await safeSelect(() => db.select().from(auftragOrders).orderBy(desc(auftragOrders.createdAt)));
  }
  async getAuftragOrdersForUser(userId: string): Promise<AuftragOrder[]> {
    return await safeSelect(() =>
      db
        .select()
        .from(auftragOrders)
        .where(or(eq(auftragOrders.createdById, userId), eq(auftragOrders.assignedPartnerId, userId)))
        .orderBy(desc(auftragOrders.createdAt))
    );
  }
  async updateAuftragOrder(id: string, data: Partial<InsertAuftragOrder>): Promise<AuftragOrder | undefined> {
    await db.update(auftragOrders).set({ ...data, updatedAt: new Date() }).where(eq(auftragOrders.id, id));
    return this.getAuftragOrder(id);
  }

  // ============== Business-entity Partners (Roadmap step 3) ==============
  async getPartners(filter?: { status?: string }): Promise<Partner[]> {
    const rows = await safeSelect(() =>
      filter?.status
        ? db.select().from(partners).where(eq(partners.status, filter.status)).orderBy(desc(partners.createdAt))
        : db.select().from(partners).orderBy(desc(partners.createdAt))
    );
    return rows;
  }
  async getPartner(id: string): Promise<Partner | undefined> {
    const rows = await safeSelect(() => db.select().from(partners).where(eq(partners.id, id)));
    return rows[0];
  }
  async createPartner(data: InsertPartner): Promise<Partner> {
    const payload = { ...data, email: data.email ?? "" };
    await db.insert(partners).values(payload);
    // Read back the most recent matching name+email (insert above doesn't return reliably on neon-http).
    const rows = await safeSelect(() =>
      db
        .select()
        .from(partners)
        .where(and(eq(partners.name, payload.name), eq(partners.email, payload.email)))
        .orderBy(desc(partners.createdAt))
    );
    const row = rows[0];
    if (!row) throw new Error("createPartner: insert succeeded but row not found");
    return row;
  }
  async updatePartner(id: string, data: Partial<InsertPartner>): Promise<Partner | undefined> {
    await db.update(partners).set({ ...data, updatedAt: new Date() }).where(eq(partners.id, id));
    return this.getPartner(id);
  }
  async deletePartner(id: string): Promise<void> {
    await db.delete(partners).where(eq(partners.id, id));
  }

  async getPartnerRetentionTotalCents(
    partnerId: string,
    excludeOrderId?: string,
  ): Promise<number> {
    // Sum warrantyRetentionCents across saved orders for this partner.
    // Used by /api/auftrag to enforce the 3.000 € Sicherheitseinbehalt cap.
    const where = excludeOrderId
      ? and(eq(auftragOrders.partnerId, partnerId), ne(auftragOrders.id, excludeOrderId))
      : eq(auftragOrders.partnerId, partnerId);
    const rows = await safeSelect(() =>
      db
        .select({ total: sql<string>`COALESCE(SUM(${auftragOrders.warrantyRetentionCents}), 0)` })
        .from(auftragOrders)
        .where(where),
    );
    const raw = rows[0]?.total ?? "0";
    const n = typeof raw === "string" ? parseInt(raw, 10) : Number(raw);
    return Number.isFinite(n) ? n : 0;
  }

  // ============== Hub+1 token economy ==============
  async ensureUserTokenBalance(userId: string, bootstrap: number): Promise<number> {
    const existing = (await safeSelect(() =>
      db.select().from(userTokens).where(eq(userTokens.userId, userId))
    ))[0];
    if (existing) return existing.balance;
    // Race-safe upsert: two concurrent first-time mints would both run the
    // SELECT above, see no row, and both try to INSERT — the loser would
    // crash on the user_tokens.user_id PK. ON CONFLICT DO NOTHING turns
    // that into a clean no-op so the loser then re-reads the winner's row.
    const inserted: any = await db.execute(sql`
      INSERT INTO user_tokens (user_id, balance)
      VALUES (${userId}, ${bootstrap})
      ON CONFLICT (user_id) DO NOTHING
      RETURNING balance;
    `);
    const insertedRow: any = (inserted?.rows ?? inserted)[0];
    if (insertedRow && bootstrap > 0) {
      await db.insert(tokenLedger).values({
        userId,
        delta: bootstrap,
        balanceAfter: bootstrap,
        reason: "bootstrap",
      });
    }
    if (insertedRow) return Number(insertedRow.balance ?? bootstrap);
    // Conflict — another caller created the row first. Re-read it.
    const reread = (await safeSelect(() =>
      db.select().from(userTokens).where(eq(userTokens.userId, userId))
    ))[0];
    return reread?.balance ?? bootstrap;
  }
  async getTokenBalance(userId: string): Promise<number> {
    const existing = (await safeSelect(() =>
      db.select().from(userTokens).where(eq(userTokens.userId, userId))
    ))[0];
    return existing?.balance ?? 0;
  }
  async creditTokens(userId: string, amount: number, reason: string, relatedAuftragId?: string | null): Promise<number> {
    if (!Number.isFinite(amount) || amount <= 0) throw new Error("Invalid credit amount");
    const current = await this.ensureUserTokenBalance(userId, 0);
    const next = current + Math.round(amount);
    await db.update(userTokens).set({ balance: next, updatedAt: new Date() }).where(eq(userTokens.userId, userId));
    await db.insert(tokenLedger).values({
      userId,
      delta: Math.round(amount),
      balanceAfter: next,
      reason,
      relatedAuftragId: relatedAuftragId || null,
    });
    return next;
  }
  async debitTokens(userId: string, amount: number, reason: string, relatedAuftragId?: string | null): Promise<number> {
    if (!Number.isFinite(amount) || amount <= 0) throw new Error("Invalid debit amount");
    const current = await this.ensureUserTokenBalance(userId, 0);
    const cost = Math.round(amount);
    if (current < cost) throw new Error("INSUFFICIENT_TOKENS");
    const next = current - cost;
    await db.update(userTokens).set({ balance: next, updatedAt: new Date() }).where(eq(userTokens.userId, userId));
    await db.insert(tokenLedger).values({
      userId,
      delta: -cost,
      balanceAfter: next,
      reason,
      relatedAuftragId: relatedAuftragId || null,
    });
    return next;
  }
  async createReferral(data: InsertReferral): Promise<Referral> {
    // Set createdAt explicitly — neon-http occasionally drops DEFAULT now() on returning().
    const [row] = await db
      .insert(referrals)
      .values({ ...data, createdAt: new Date() } as any)
      .returning();
    return row;
  }
  async getReferralByReferred(referredUserId: string): Promise<Referral | undefined> {
    const rows = await safeSelect(() =>
      db.select().from(referrals).where(eq(referrals.referredUserId, referredUserId))
    );
    return rows[0];
  }
  async getReferralsByReferrer(referrerId: string): Promise<Referral[]> {
    return await safeSelect(() =>
      db.select().from(referrals)
        .where(eq(referrals.referrerId, referrerId))
        .orderBy(desc(referrals.createdAt))
    );
  }
  async markReferralRewarded(id: string, rewardTokens: number): Promise<void> {
    await db.update(referrals)
      .set({ status: "rewarded", rewardTokens, rewardedAt: new Date() })
      .where(eq(referrals.id, id));
  }
  async recordTokenEarnEvent(data: InsertTokenEarnEvent): Promise<TokenEarnEvent> {
    const [row] = await db.insert(tokenEarnEvents).values(data).returning();
    return row;
  }
  async getReputation(userId: string): Promise<ReputationScore | undefined> {
    const rows = await safeSelect(() =>
      db.select().from(reputationScores).where(eq(reputationScores.userId, userId))
    );
    return rows[0];
  }
  async ensureReputation(userId: string): Promise<ReputationScore> {
    const existing = await this.getReputation(userId);
    if (existing) return existing;
    const [row] = await db
      .insert(reputationScores)
      .values({ userId, score: 500, lastEventAt: new Date(), updatedAt: new Date() } as any)
      .onConflictDoNothing()
      .returning();
    return row ?? (await this.getReputation(userId))!;
  }
  async bumpReputation(
    userId: string,
    delta: { score?: number; completedJobs?: number; cancellations?: number; noShows?: number; reviewsAvgX10?: number; reviewsCount?: number },
  ): Promise<ReputationScore> {
    // Ensure row exists (idempotent insert)
    await this.ensureReputation(userId);

    // Atomic SQL update — clamps score to [0..1000], increments counters in-place,
    // computes running mean for reviews. Avoids read-modify-write race.
    const scoreD = delta.score ?? 0;
    const cjD = delta.completedJobs ?? 0;
    const cnD = delta.cancellations ?? 0;
    const nsD = delta.noShows ?? 0;
    const hasReview = delta.reviewsAvgX10 !== undefined && !!delta.reviewsCount;
    const newReviewX10 = delta.reviewsAvgX10 ?? 0;
    const newReviewCount = delta.reviewsCount ?? 0;

    const setClause: any = {
      score: sql`LEAST(1000, GREATEST(0, ${reputationScores.score} + ${scoreD}))`,
      completedJobs: sql`${reputationScores.completedJobs} + ${cjD}`,
      cancellations: sql`${reputationScores.cancellations} + ${cnD}`,
      noShows: sql`${reputationScores.noShows} + ${nsD}`,
      lastEventAt: new Date(),
      updatedAt: new Date(),
    };
    if (hasReview) {
      // running mean: ((old_avg * old_count) + (new_avg * new_count)) / (old_count + new_count)
      setClause.reviewsAvgX10 = sql`ROUND(((${reputationScores.reviewsAvgX10} * ${reputationScores.reviewsCount}) + (${newReviewX10} * ${newReviewCount}))::numeric / GREATEST(1, ${reputationScores.reviewsCount} + ${newReviewCount}))`;
      setClause.reviewsCount = sql`${reputationScores.reviewsCount} + ${newReviewCount}`;
    }
    const [row] = await db
      .update(reputationScores)
      .set(setClause)
      .where(eq(reputationScores.userId, userId))
      .returning();
    return row ?? (await this.getReputation(userId))!;
  }
  // ============== Hub+1 escrow ==============
  async createEscrowHold(data: InsertEscrowHold): Promise<EscrowHold> {
    const safe = nullifyFkFields({ ...data, createdAt: new Date() } as any, ["partnerId"] as const);
    const result = await db
      .insert(escrowHolds)
      .values(safe)
      .returning();
    if (result[0]) return result[0];
    // Fallback: re-fetch latest held row matching auftrag for this user.
    const [latest] = await db
      .select()
      .from(escrowHolds)
      .where(and(
        eq(escrowHolds.userId, data.userId as string),
        eq(escrowHolds.auftragId, data.auftragId as string),
      ))
      .orderBy(desc(escrowHolds.createdAt))
      .limit(1);
    return latest as EscrowHold;
  }
  async getEscrowHold(id: string): Promise<EscrowHold | undefined> {
    const rows = await safeSelect(() =>
      db.select().from(escrowHolds).where(eq(escrowHolds.id, id))
    );
    return rows[0];
  }
  async getEscrowsByAuftrag(auftragId: string): Promise<EscrowHold[]> {
    return await safeSelect(() =>
      db.select().from(escrowHolds)
        .where(eq(escrowHolds.auftragId, auftragId))
        .orderBy(desc(escrowHolds.createdAt))
    );
  }
  async getEscrowsByUser(userId: string, status?: string): Promise<EscrowHold[]> {
    const where = status
      ? and(eq(escrowHolds.userId, userId), eq(escrowHolds.status, status))
      : eq(escrowHolds.userId, userId);
    return await safeSelect(() =>
      db.select().from(escrowHolds).where(where).orderBy(desc(escrowHolds.createdAt))
    );
  }
  async resolveEscrowHold(id: string, status: string, reason?: string): Promise<EscrowHold | undefined> {
    const setClause: any = { status, resolvedAt: new Date() };
    if (reason) setClause.reason = reason;
    const result = await db
      .update(escrowHolds)
      .set(setClause)
      .where(eq(escrowHolds.id, id))
      .returning();
    if (result[0]) return result[0];
    return await this.getEscrowHold(id);
  }

  // ============== Hub+1 appointment waitlist ==============
  async createWaitlistEntry(data: InsertAppointmentWaitlistEntry): Promise<AppointmentWaitlistEntry> {
    const result = await db.insert(appointmentWaitlist).values(data as any).returning();
    if (result[0]) return result[0];
    const [latest] = await db
      .select()
      .from(appointmentWaitlist)
      .where(eq(appointmentWaitlist.userId, data.userId as string))
      .orderBy(desc(appointmentWaitlist.createdAt))
      .limit(1);
    return latest as AppointmentWaitlistEntry;
  }

  async getWaitlistEntry(id: string): Promise<AppointmentWaitlistEntry | undefined> {
    const rows = await safeSelect(() =>
      db.select().from(appointmentWaitlist).where(eq(appointmentWaitlist.id, id))
    );
    return rows[0];
  }

  async getWaitlistByUser(userId: string): Promise<AppointmentWaitlistEntry[]> {
    return await safeSelect(() =>
      db.select().from(appointmentWaitlist)
        .where(eq(appointmentWaitlist.userId, userId))
        .orderBy(desc(appointmentWaitlist.createdAt))
    );
  }

  async getWaitingCandidates(opts: { locationId?: string | null; serviceKind?: string | null; at?: Date | null }): Promise<AppointmentWaitlistEntry[]> {
    // Raw SQL bypass — neon-http drizzle parsing returns boolean / timestamp
    // columns as wrong values (e.g. auto_accept=true → false). The matcher
    // strictly needs the real auto_accept flag to decide auto-fill vs offer.
    const loc = opts.locationId ?? null;
    const svc = opts.serviceKind ?? null;
    const at = opts.at ?? null;
    const result: any = await db.execute(sql`
      SELECT id, user_id, location_id, preferred_from, preferred_to,
             service_kind, auto_accept::int AS auto_accept_int,
             contact_pref, status,
             created_at, notified_at
      FROM appointment_waitlist
      WHERE status = 'waiting'
        AND (${loc}::text IS NULL OR location_id IS NULL OR location_id = ${loc})
        AND (${svc}::text IS NULL OR service_kind IS NULL OR service_kind = ${svc})
        AND (${at}::timestamp IS NULL OR preferred_from IS NULL OR preferred_from <= ${at})
        AND (${at}::timestamp IS NULL OR preferred_to   IS NULL OR preferred_to   >= ${at})
      ORDER BY created_at ASC
    `);
    const rows: any[] = (result as any).rows ?? result ?? [];
    return rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      locationId: r.location_id,
      preferredFrom: r.preferred_from ? new Date(r.preferred_from) : null,
      preferredTo: r.preferred_to ? new Date(r.preferred_to) : null,
      serviceKind: r.service_kind,
      // neon-http misreads boolean cols → cast to int in SQL and compare here.
      autoAccept: Number(r.auto_accept_int) === 1,
      contactPref: r.contact_pref,
      status: r.status,
      createdAt: r.created_at ? new Date(r.created_at) : null,
      notifiedAt: r.notified_at ? new Date(r.notified_at) : null,
    })) as AppointmentWaitlistEntry[];
  }

  async updateWaitlistEntry(id: string, data: Partial<InsertAppointmentWaitlistEntry> & { status?: string; notifiedAt?: Date }): Promise<AppointmentWaitlistEntry | undefined> {
    const result = await db
      .update(appointmentWaitlist)
      .set(data as any)
      .where(eq(appointmentWaitlist.id, id))
      .returning();
    if (result[0]) return result[0];
    return await this.getWaitlistEntry(id);
  }

  // ============== Hub+1 staking positions ==============
  // neon-http drizzle drops integer/timestamp values from .returning() and
  // sometimes from select() too — we use raw SQL with explicit projection
  // for reads.
  private mapStakingRow(r: any): StakingPosition {
    return {
      id: r.id,
      userId: r.user_id,
      amountTokens: Number(r.amount_tokens),
      pool: r.pool,
      apyBps: Number(r.apy_bps),
      lockUntil: r.lock_until ? new Date(r.lock_until) : null,
      status: r.status,
      createdAt: r.created_at ? new Date(r.created_at) : null,
    } as StakingPosition;
  }

  async createStakingPosition(data: InsertStakingPosition): Promise<StakingPosition> {
    const id = (await import("crypto")).randomUUID();
    const lockIso = data.lockUntil ? (data.lockUntil as Date).toISOString() : null;
    // Branch the INSERT so we don't try to cast NULL::timestamp (neon-http picky).
    if (lockIso) {
      await db.execute(sql`
        INSERT INTO staking_positions (id, user_id, amount_tokens, pool, apy_bps, lock_until, status, created_at)
        VALUES (${id}, ${data.userId}, ${data.amountTokens}, ${data.pool}, ${data.apyBps},
                ${lockIso}::timestamp, ${data.status ?? "active"}, NOW())
      `);
    } else {
      await db.execute(sql`
        INSERT INTO staking_positions (id, user_id, amount_tokens, pool, apy_bps, status, created_at)
        VALUES (${id}, ${data.userId}, ${data.amountTokens}, ${data.pool}, ${data.apyBps},
                ${data.status ?? "active"}, NOW())
      `);
    }
    const fetched = await this.getStakingPosition(id);
    if (!fetched) throw new Error("createStakingPosition failed to insert");
    return fetched;
  }

  async getStakingPosition(id: string): Promise<StakingPosition | undefined> {
    try {
      const result: any = await db.execute(sql`
        SELECT id, user_id, amount_tokens, pool, apy_bps,
               lock_until, status, created_at
        FROM staking_positions WHERE id = ${id} LIMIT 1
      `);
      const rows: any[] = result?.rows ?? (Array.isArray(result) ? result : []);
      return rows[0] ? this.mapStakingRow(rows[0]) : undefined;
    } catch (err) {
      // neon-http throws on empty result sets — treat as not found.
      console.warn("[Staking] getStakingPosition empty/err:", String(err));
      return undefined;
    }
  }

  async getStakingPositionsByUser(userId: string): Promise<StakingPosition[]> {
    try {
      const result: any = await db.execute(sql`
        SELECT id, user_id, amount_tokens, pool, apy_bps,
               lock_until, status, created_at
        FROM staking_positions WHERE user_id = ${userId}
        ORDER BY created_at DESC
      `);
      const rows: any[] = result?.rows ?? (Array.isArray(result) ? result : []);
      return rows.map((r) => this.mapStakingRow(r));
    } catch (err) {
      console.warn("[Staking] getStakingPositionsByUser empty/err:", String(err));
      return [];
    }
  }

  async updateStakingPositionStatus(id: string, status: string): Promise<StakingPosition | undefined> {
    // Atomic: only flip if currently active. Returns rowCount we use for race detection.
    const upd: any = await db.execute(sql`
      UPDATE staking_positions SET status = ${status}
      WHERE id = ${id} AND status = 'active'
    `);
    const count = Number(upd?.rowCount ?? 0);
    if (count !== 1) return undefined;
    return await this.getStakingPosition(id);
  }

  async getPoolTotals(): Promise<Array<{ pool: string; totalStaked: number; positions: number }>> {
    // Aggregate active stake per pool. neon-http throws on empty aggregate
    // results — wrap and return [] on error or null result.
    try {
      const result: any = await db.execute(sql`
        SELECT pool, COALESCE(SUM(amount_tokens), 0)::int AS total_staked, COUNT(*)::int AS positions
        FROM staking_positions
        WHERE status = 'active'
        GROUP BY pool
      `);
      const rows: any[] = result?.rows ?? (Array.isArray(result) ? result : []);
      if (!rows || rows.length === 0) return [];
      return rows.map((r) => ({
        pool: r.pool,
        totalStaked: Number(r.total_staked) || 0,
        positions: Number(r.positions) || 0,
      }));
    } catch (err) {
      console.warn("[Staking] getPoolTotals failed (returning empty):", err);
      return [];
    }
  }

  async countAuftragOrdersByCreator(userId: string): Promise<number> {
    const rows = await safeSelect(() =>
      db.select({ id: auftragOrders.id }).from(auftragOrders).where(eq(auftragOrders.createdById, userId))
    );
    return rows.length;
  }

  async getTokenLedger(userId: string, limit = 50): Promise<TokenLedger[]> {
    return await safeSelect(() =>
      db
        .select()
        .from(tokenLedger)
        .where(eq(tokenLedger.userId, userId))
        .orderBy(desc(tokenLedger.createdAt))
        .limit(limit)
    );
  }

  // ============== Task Board (AI Agents) ==============
  // Use raw SQL throughout (neon-http drizzle drops int/timestamp columns).
  private mapTaskRow(r: any): TaskBoardTask {
    return {
      id: r.id,
      title: r.title,
      description: r.description,
      column: r.column,
      assignedAgent: r.assigned_agent,
      assignedUserId: r.assigned_user_id,
      createdById: r.created_by_id,
      sourceType: r.source_type,
      sourceId: r.source_id,
      priority: r.priority,
      impactValueCents: Number(r.impact_value_cents ?? 0),
      payload: r.payload ?? {},
      result: r.result ?? {},
      requiresReview: r.requires_review === true || Number(r.requires_review) === 1,
      autoClaimEligible: r.auto_claim_eligible === true || Number(r.auto_claim_eligible) === 1,
      claimedAt: r.claimed_at ? new Date(r.claimed_at) : null,
      completedAt: r.completed_at ? new Date(r.completed_at) : null,
      approvedAt: r.approved_at ? new Date(r.approved_at) : null,
      approvedById: r.approved_by_id,
      createdAt: r.created_at ? new Date(r.created_at) : new Date(),
      updatedAt: r.updated_at ? new Date(r.updated_at) : new Date(),
    } as TaskBoardTask;
  }

  async createTaskBoardTask(data: InsertTaskBoardTask): Promise<TaskBoardTask> {
    const id = (await import("crypto")).randomUUID();
    const payload = JSON.stringify(data.payload ?? {});
    const result = JSON.stringify(data.result ?? {});
    await db.execute(sql`
      INSERT INTO task_board_tasks (
        id, title, description, "column", assigned_agent, assigned_user_id,
        created_by_id, source_type, source_id, priority, impact_value_cents,
        payload, result, requires_review, auto_claim_eligible,
        created_at, updated_at
      ) VALUES (
        ${id}, ${data.title}, ${data.description ?? null},
        ${data.column ?? "todo"}, ${data.assignedAgent ?? null},
        NULLIF(${data.assignedUserId ?? ""}::text, '')::varchar,
        NULLIF(${data.createdById ?? ""}::text, '')::varchar,
        ${data.sourceType ?? "manual"},
        NULLIF(${data.sourceId ?? ""}::text, '')::varchar,
        ${data.priority ?? "normal"}, ${data.impactValueCents ?? 0},
        ${payload}::jsonb, ${result}::jsonb,
        ${data.requiresReview ?? false}::boolean, ${data.autoClaimEligible ?? false}::boolean,
        NOW(), NOW()
      )
    `);
    const t = await this.getTaskBoardTask(id);
    if (!t) throw new Error("createTaskBoardTask insert failed");
    return t;
  }

  async getTaskBoardTask(id: string): Promise<TaskBoardTask | undefined> {
    try {
      const r: any = await db.execute(sql`
        SELECT id, title, description, "column", assigned_agent, assigned_user_id,
               created_by_id, source_type, source_id, priority, impact_value_cents,
               payload, result,
               requires_review::int AS requires_review,
               auto_claim_eligible::int AS auto_claim_eligible,
               claimed_at, completed_at, approved_at, approved_by_id,
               created_at, updated_at
        FROM task_board_tasks WHERE id = ${id} LIMIT 1
      `);
      const rows: any[] = r?.rows ?? (Array.isArray(r) ? r : []);
      return rows[0] ? this.mapTaskRow(rows[0]) : undefined;
    } catch (e) {
      console.warn("[TaskBoard] getTaskBoardTask err:", String(e));
      return undefined;
    }
  }

  async listTaskBoardTasks(filters: {
    column?: string;
    assignedAgent?: string;
    assignedUserId?: string;
    createdById?: string;
    sourceType?: string;
    limit?: number;
  }): Promise<TaskBoardTask[]> {
    try {
      const limit = Math.min(Math.max(filters.limit ?? 200, 1), 500);
      // Build WHERE dynamically — neon-http chokes on parameterized null
      // filters, so only include conditions for filters actually provided.
      const conds: any[] = [sql`1=1`];
      if (filters.column) conds.push(sql`"column" = ${filters.column}`);
      if (filters.assignedAgent) conds.push(sql`assigned_agent = ${filters.assignedAgent}`);
      if (filters.assignedUserId) conds.push(sql`assigned_user_id = ${filters.assignedUserId}`);
      if (filters.createdById) conds.push(sql`created_by_id = ${filters.createdById}`);
      if (filters.sourceType) conds.push(sql`source_type = ${filters.sourceType}`);
      const whereSql = sql.join(conds, sql` AND `);
      const r: any = await db.execute(sql`
        SELECT id, title, description, "column", assigned_agent, assigned_user_id,
               created_by_id, source_type, source_id, priority, impact_value_cents,
               payload, result,
               requires_review::int AS requires_review,
               auto_claim_eligible::int AS auto_claim_eligible,
               claimed_at, completed_at, approved_at, approved_by_id,
               created_at, updated_at
        FROM task_board_tasks
        WHERE ${whereSql}
        ORDER BY
          CASE "column"
            WHEN 'todo' THEN 1
            WHEN 'in_progress' THEN 2
            WHEN 'review' THEN 3
            WHEN 'done' THEN 4
            WHEN 'failed' THEN 5
            ELSE 9
          END,
          CASE priority
            WHEN 'critical' THEN 1
            WHEN 'high' THEN 2
            WHEN 'normal' THEN 3
            WHEN 'routine' THEN 4
            ELSE 9
          END,
          created_at DESC
        LIMIT ${limit}
      `);
      const rows: any[] = r?.rows ?? (Array.isArray(r) ? r : []);
      return rows.map((row) => this.mapTaskRow(row));
    } catch (e) {
      console.warn("[TaskBoard] listTaskBoardTasks err:", String(e));
      return [];
    }
  }

  async claimTaskBoardTask(id: string, agentRole: string, userId?: string | null): Promise<TaskBoardTask | undefined> {
    // Atomic: only succeed if task is in 'todo' AND (no agent assigned yet
    // OR already assigned to this same role). Move to in_progress.
    const upd: any = await db.execute(sql`
      UPDATE task_board_tasks
      SET "column" = 'in_progress',
          assigned_agent = ${agentRole},
          assigned_user_id = COALESCE(NULLIF(${userId ?? ""}::text, '')::varchar, assigned_user_id),
          claimed_at = NOW(),
          updated_at = NOW()
      WHERE id = ${id}
        AND "column" = 'todo'
        AND (assigned_agent IS NULL OR assigned_agent = ${agentRole})
    `);
    const count = Number(upd?.rowCount ?? 0);
    if (count !== 1) return undefined;
    return this.getTaskBoardTask(id);
  }

  async completeTaskBoardTask(id: string, result: Record<string, unknown>): Promise<TaskBoardTask | undefined> {
    // Routing rule:
    //   requires_review = true -> column='review'
    //   else                   -> column='done'
    // Atomic on column='in_progress' to prevent double-completion.
    const resultJson = JSON.stringify(result ?? {});
    const upd: any = await db.execute(sql`
      UPDATE task_board_tasks
      SET "column" = CASE WHEN requires_review THEN 'review' ELSE 'done' END,
          result = ${resultJson}::jsonb,
          completed_at = NOW(),
          updated_at = NOW()
      WHERE id = ${id} AND "column" = 'in_progress'
    `);
    const count = Number(upd?.rowCount ?? 0);
    if (count !== 1) return undefined;
    return this.getTaskBoardTask(id);
  }

  async approveTaskBoardTask(id: string, approverId: string): Promise<TaskBoardTask | undefined> {
    const upd: any = await db.execute(sql`
      UPDATE task_board_tasks
      SET "column" = 'done',
          approved_at = NOW(),
          approved_by_id = NULLIF(${approverId ?? ""}::text, '')::varchar,
          updated_at = NOW()
      WHERE id = ${id} AND "column" = 'review'
    `);
    if (Number(upd?.rowCount ?? 0) !== 1) return undefined;
    return this.getTaskBoardTask(id);
  }

  async rejectTaskBoardTask(id: string, approverId: string, reason: string): Promise<TaskBoardTask | undefined> {
    const upd: any = await db.execute(sql`
      UPDATE task_board_tasks
      SET "column" = 'todo',
          assigned_agent = NULL,
          assigned_user_id = NULL,
          claimed_at = NULL,
          completed_at = NULL,
          result = jsonb_build_object('rejectedBy', ${approverId}::text, 'reason', ${reason}::text),
          updated_at = NOW()
      WHERE id = ${id} AND "column" = 'review'
    `);
    if (Number(upd?.rowCount ?? 0) !== 1) return undefined;
    return this.getTaskBoardTask(id);
  }

  async updateTaskBoardColumn(id: string, column: string): Promise<TaskBoardTask | undefined> {
    const upd: any = await db.execute(sql`
      UPDATE task_board_tasks
      SET "column" = ${column}, updated_at = NOW()
      WHERE id = ${id}
    `);
    if (Number(upd?.rowCount ?? 0) !== 1) return undefined;
    return this.getTaskBoardTask(id);
  }

  async recordAgentAction(data: InsertAgentAction): Promise<AgentAction> {
    const id = (await import("crypto")).randomUUID();
    const input = JSON.stringify(data.input ?? {});
    const output = JSON.stringify(data.output ?? {});
    await db.execute(sql`
      INSERT INTO agent_actions (
        id, task_id, actor, actor_user_id, action,
        input, output, success, message, created_at
      ) VALUES (
        ${id}, ${data.taskId}, ${data.actor},
        NULLIF(${data.actorUserId ?? ""}::text, '')::varchar,
        ${data.action}, ${input}::jsonb, ${output}::jsonb,
        ${data.success ?? true}, ${data.message ?? null}, NOW()
      )
    `);
    return {
      id,
      taskId: data.taskId,
      actor: data.actor,
      actorUserId: data.actorUserId ?? null,
      action: data.action,
      input: data.input ?? {},
      output: data.output ?? {},
      success: data.success ?? true,
      message: data.message ?? null,
      createdAt: new Date(),
    } as AgentAction;
  }

  async listAgentActions(taskId: string): Promise<AgentAction[]> {
    try {
      const r: any = await db.execute(sql`
        SELECT id, task_id, actor, actor_user_id, action,
               input, output, success, message, created_at
        FROM agent_actions WHERE task_id = ${taskId}
        ORDER BY created_at DESC LIMIT 200
      `);
      const rows: any[] = r?.rows ?? (Array.isArray(r) ? r : []);
      return rows.map((row) => ({
        id: row.id,
        taskId: row.task_id,
        actor: row.actor,
        actorUserId: row.actor_user_id,
        action: row.action,
        input: row.input ?? {},
        output: row.output ?? {},
        success: !!row.success,
        message: row.message,
        createdAt: row.created_at ? new Date(row.created_at) : new Date(),
      }) as AgentAction);
    } catch (e) {
      console.warn("[TaskBoard] listAgentActions err:", String(e));
      return [];
    }
  }

  // ── Claude Worker Bridge ──────────────────────────────────────────────────

  private mapAgentTaskRow(row: any): AgentTask {
    return {
      id: row.id,
      title: row.title,
      agentType: row.agent_type,
      taskType: row.task_type,
      taskPrompt: row.task_prompt,
      workingDirectory: row.working_directory,
      contextRefs: row.context_refs ?? [],
      status: row.status,
      createdById: row.created_by_id ?? null,
      createdAt: row.created_at ? new Date(row.created_at) : new Date(),
      startedAt: row.started_at ? new Date(row.started_at) : null,
      finishedAt: row.finished_at ? new Date(row.finished_at) : null,
    } as AgentTask;
  }

  private mapAgentTaskResultRow(row: any): AgentTaskResult {
    return {
      id: row.id,
      taskId: row.task_id,
      summary: row.summary ?? null,
      rawOutput: row.raw_output ?? null,
      structuredOutputJson: row.structured_output_json ?? {},
      exitCode: row.exit_code ?? null,
      changedFilesJson: row.changed_files_json ?? [],
      risksJson: row.risks_json ?? [],
      verificationNeededJson: row.verification_needed_json ?? [],
      reviewStatus: row.review_status,
      reviewNotes: row.review_notes ?? null,
      createdAt: row.created_at ? new Date(row.created_at) : new Date(),
    } as AgentTaskResult;
  }

  async createAgentTask(data: InsertAgentTask): Promise<AgentTask> {
    const id = (await import("crypto")).randomUUID();
    const contextRefs = JSON.stringify(data.contextRefs ?? []);
    await db.execute(sql`
      INSERT INTO agent_tasks (
        id, title, agent_type, task_type, task_prompt,
        working_directory, context_refs, status, created_by_id, created_at
      ) VALUES (
        ${id}, ${data.title}, ${data.agentType ?? "claude_worker"},
        ${data.taskType ?? "coding"}, ${data.taskPrompt},
        ${data.workingDirectory}, ${contextRefs}::jsonb,
        ${data.status ?? "queued"},
        NULLIF(${data.createdById ?? ""}::text, '')::varchar,
        NOW()
      )
    `);
    const t = await this.getAgentTask(id);
    if (!t) throw new Error("createAgentTask insert failed");
    return t;
  }

  async getAgentTask(id: string): Promise<AgentTask | undefined> {
    try {
      const r: any = await db.execute(sql`
        SELECT id, title, agent_type, task_type, task_prompt,
               working_directory, context_refs, status, created_by_id,
               created_at, started_at, finished_at
        FROM agent_tasks WHERE id = ${id} LIMIT 1
      `);
      const rows: any[] = r?.rows ?? (Array.isArray(r) ? r : []);
      return rows[0] ? this.mapAgentTaskRow(rows[0]) : undefined;
    } catch (e) {
      console.warn("[AgentTask] getAgentTask err:", String(e));
      return undefined;
    }
  }

  async getAgentTaskWithResult(id: string): Promise<{ task: AgentTask; result: AgentTaskResult | undefined } | undefined> {
    const task = await this.getAgentTask(id);
    if (!task) return undefined;
    const result = await this.getAgentTaskResult(id);
    return { task, result };
  }

  async listAgentTasks(filters: { status?: string; agentType?: string; limit?: number }): Promise<AgentTask[]> {
    try {
      const limit = Math.min(Math.max(filters.limit ?? 100, 1), 500);
      const conds: any[] = [sql`1=1`];
      if (filters.status) conds.push(sql`status = ${filters.status}`);
      if (filters.agentType) conds.push(sql`agent_type = ${filters.agentType}`);
      const whereSql = sql.join(conds, sql` AND `);
      const r: any = await db.execute(sql`
        SELECT id, title, agent_type, task_type, task_prompt,
               working_directory, context_refs, status, created_by_id,
               created_at, started_at, finished_at
        FROM agent_tasks
        WHERE ${whereSql}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `);
      const rows: any[] = r?.rows ?? (Array.isArray(r) ? r : []);
      return rows.map((row) => this.mapAgentTaskRow(row));
    } catch (e) {
      console.warn("[AgentTask] listAgentTasks err:", String(e));
      return [];
    }
  }

  async claimAgentTask(id: string): Promise<AgentTask | undefined> {
    try {
      // Atomic: only transitions queued → running; concurrent claims lose the race.
      await db.execute(sql`
        UPDATE agent_tasks
        SET status = 'running', started_at = NOW()
        WHERE id = ${id} AND status = 'queued'
      `);
      const t = await this.getAgentTask(id);
      return t?.status === "running" ? t : undefined;
    } catch (e) {
      console.warn("[AgentTask] claimAgentTask err:", String(e));
      return undefined;
    }
  }

  async finishAgentTask(id: string, status: "completed" | "failed"): Promise<AgentTask | undefined> {
    try {
      // Only valid from running state.
      await db.execute(sql`
        UPDATE agent_tasks
        SET status = ${status}, finished_at = NOW()
        WHERE id = ${id} AND status = 'running'
      `);
      return await this.getAgentTask(id);
    } catch (e) {
      console.warn("[AgentTask] finishAgentTask err:", String(e));
      return undefined;
    }
  }

  async createAgentTaskResult(data: InsertAgentTaskResult): Promise<AgentTaskResult> {
    const id = (await import("crypto")).randomUUID();
    const structured = JSON.stringify(data.structuredOutputJson ?? {});
    const changedFiles = JSON.stringify(data.changedFilesJson ?? []);
    const risks = JSON.stringify(data.risksJson ?? []);
    const verifications = JSON.stringify(data.verificationNeededJson ?? []);
    // Truncate rawOutput to 64 KB to avoid bloating the DB.
    const rawOutput = data.rawOutput ? data.rawOutput.slice(0, 65_536) : null;
    await db.execute(sql`
      INSERT INTO agent_task_results (
        id, task_id, summary, raw_output, structured_output_json,
        exit_code, changed_files_json, risks_json, verification_needed_json,
        review_status, review_notes, created_at
      ) VALUES (
        ${id}, ${data.taskId}, ${data.summary ?? null}, ${rawOutput},
        ${structured}::jsonb, ${data.exitCode ?? null},
        ${changedFiles}::jsonb, ${risks}::jsonb, ${verifications}::jsonb,
        ${data.reviewStatus ?? "pending_review"}, ${data.reviewNotes ?? null},
        NOW()
      )
    `);
    // Transition running → pending_review and stamp finishedAt in one step.
    // 'completed' and 'failed' are kept in the WHERE for legacy rows only —
    // normal execution no longer passes through those states.
    await db.execute(sql`
      UPDATE agent_tasks
      SET status = 'pending_review', finished_at = NOW()
      WHERE id = ${data.taskId} AND status IN ('running', 'completed', 'failed')
    `);
    const result = await this.getAgentTaskResult(data.taskId);
    if (!result) throw new Error("createAgentTaskResult insert failed");
    return result;
  }

  async getAgentTaskResult(taskId: string): Promise<AgentTaskResult | undefined> {
    try {
      const r: any = await db.execute(sql`
        SELECT id, task_id, summary, raw_output, structured_output_json,
               exit_code, changed_files_json, risks_json, verification_needed_json,
               review_status, review_notes, created_at
        FROM agent_task_results WHERE task_id = ${taskId}
        ORDER BY created_at DESC LIMIT 1
      `);
      const rows: any[] = r?.rows ?? (Array.isArray(r) ? r : []);
      return rows[0] ? this.mapAgentTaskResultRow(rows[0]) : undefined;
    } catch (e) {
      console.warn("[AgentTask] getAgentTaskResult err:", String(e));
      return undefined;
    }
  }

  async setResultReviewStatus(taskId: string, reviewStatus: string, notes?: string): Promise<AgentTaskResult | undefined> {
    try {
      await db.execute(sql`
        UPDATE agent_task_results
        SET review_status = ${reviewStatus},
            review_notes = COALESCE(${notes ?? null}, review_notes)
        WHERE task_id = ${taskId}
      `);
      // Mirror the review decision back onto the task row for easy filtering.
      if (reviewStatus === "approved" || reviewStatus === "needs_rework") {
        await db.execute(sql`
          UPDATE agent_tasks SET status = ${reviewStatus} WHERE id = ${taskId}
        `);
      }
      return await this.getAgentTaskResult(taskId);
    } catch (e) {
      console.warn("[AgentTask] setResultReviewStatus err:", String(e));
      return undefined;
    }
  }

  async resetAgentTask(id: string): Promise<AgentTask | undefined> {
    try {
      // Only reset from states where a re-run is meaningful and safe.
      // - running:      server crashed or task timed out without writing a result
      // - failed:       finishAgentTask wrote failed but createAgentTaskResult threw (phantom state)
      // - needs_rework: operator reviewed and decided to re-run
      await db.execute(sql`
        UPDATE agent_tasks
        SET status = 'queued',
            started_at = NULL,
            finished_at = NULL
        WHERE id = ${id}
          AND status IN ('running', 'failed', 'needs_rework')
      `);
      const t = await this.getAgentTask(id);
      return t?.status === "queued" ? t : undefined;
    } catch (e) {
      console.warn("[AgentTask] resetAgentTask err:", String(e));
      return undefined;
    }
  }

  // ── Agent Activity Feed ─────────────────────────────────────────────────────

  async insertAgentEvent(data: InsertAgentEvent): Promise<AgentEvent> {
    const id = (await import("crypto")).randomUUID();
    await db.execute(sql`
      INSERT INTO agent_events (
        id, agent_slug, event_type, bus_task_id, bus_task_type,
        title, summary, payload, related_order_id, related_task_id,
        status, visibility, created_at
      ) VALUES (
        ${id},
        ${data.agentSlug},
        ${data.eventType},
        ${data.busTaskId ?? null},
        ${data.busTaskType ?? null},
        ${data.title},
        ${data.summary ?? null},
        ${data.payload ? JSON.stringify(data.payload) : null}::jsonb,
        NULLIF(${data.relatedOrderId ?? ""}::text, '')::varchar,
        NULLIF(${data.relatedTaskId  ?? ""}::text, '')::varchar,
        ${data.status ?? "ok"},
        ${data.visibility ?? "admin"},
        NOW()
      )
    `);
    const ev = await this.getAgentEvent(id);
    if (!ev) throw new Error("insertAgentEvent: insert failed");
    return ev;
  }

  async listAgentEvents(filters: {
    agentSlug?: string;
    status?: string;
    busTaskType?: string;
    limit?: number;
    offset?: number;
  }): Promise<AgentEvent[]> {
    const limit  = filters.limit  ?? 50;
    const offset = filters.offset ?? 0;
    try {
      const r: any = await db.execute(sql`
        SELECT id, agent_slug, event_type, bus_task_id, bus_task_type,
               title, summary, payload, related_order_id, related_task_id,
               status, visibility, created_at
        FROM agent_events
        WHERE
          (${filters.agentSlug   ?? null}::text IS NULL OR agent_slug    = ${filters.agentSlug   ?? null})
          AND (${filters.status      ?? null}::text IS NULL OR status     = ${filters.status      ?? null})
          AND (${filters.busTaskType ?? null}::text IS NULL OR bus_task_type = ${filters.busTaskType ?? null})
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `);
      const rows: any[] = r?.rows ?? (Array.isArray(r) ? r : []);
      return rows.map(this.mapAgentEventRow);
    } catch (e) {
      console.warn("[AgentEvent] listAgentEvents err:", String(e));
      return [];
    }
  }

  async getAgentEvent(id: string): Promise<AgentEvent | undefined> {
    try {
      const r: any = await db.execute(sql`
        SELECT id, agent_slug, event_type, bus_task_id, bus_task_type,
               title, summary, payload, related_order_id, related_task_id,
               status, visibility, created_at
        FROM agent_events WHERE id = ${id} LIMIT 1
      `);
      const rows: any[] = r?.rows ?? (Array.isArray(r) ? r : []);
      return rows[0] ? this.mapAgentEventRow(rows[0]) : undefined;
    } catch (e) {
      console.warn("[AgentEvent] getAgentEvent err:", String(e));
      return undefined;
    }
  }

  private mapAgentEventRow(row: any): AgentEvent {
    return {
      id:             row.id,
      agentSlug:      row.agent_slug,
      eventType:      row.event_type,
      busTaskId:      row.bus_task_id   ?? null,
      busTaskType:    row.bus_task_type ?? null,
      title:          row.title,
      summary:        row.summary       ?? null,
      payload:        row.payload       ?? null,
      relatedOrderId: row.related_order_id ?? null,
      relatedTaskId:  row.related_task_id  ?? null,
      status:         row.status,
      visibility:     row.visibility,
      createdAt:      row.created_at instanceof Date ? row.created_at : new Date(row.created_at),
    };
  }
}

// Defensive wrapper for neon-http: occasionally a SELECT resolves to null
// (or throws "Cannot read properties of null (reading 'map')") instead of [].
// Treat that as an empty result.
async function safeSelect<T>(fn: () => Promise<T[]>): Promise<T[]> {
  try {
    const out = await fn();
    return Array.isArray(out) ? out : [];
  } catch (e: any) {
    const msg = typeof e?.message === "string" ? e.message : "";
    if (msg.includes("Cannot read properties of null")) return [];
    throw e;
  }
}

export const storage = new DatabaseStorage();
