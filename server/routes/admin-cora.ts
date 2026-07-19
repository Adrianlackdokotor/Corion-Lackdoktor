import type { Express, Request, Response } from "express";
import { isAdmin } from "../auth";
import { adminCoraRequestSchema, runAdminCoraOperation } from "../services/adminCoraOperations";
import { compileConstitutionalAgent } from "../ai-skills/agent-substrate";
import { recordAgentUsage } from "../services/agentUsage";
import { runOpenClawCoriTurn } from "../services/openclawCoriRuntime";

export function registerAdminCoraRoutes(app: Express) {
  app.get("/api/admin/cora/definition", isAdmin, (req: Request, res: Response) => {
    const user = req.user as any;
    const definition = compileConstitutionalAgent("ADMIN_CORA", {
      owner: { kind: "user", id: user.id },
      beneficiaryUserId: user.id,
      dataScope: {
        roles: ["admin"],
        entityTypes: ["workshop_order", "client", "appointment", "file_attachment", "board_task", "partner"],
        ownerUserId: user.id,
      },
      memoryScope: { mode: "user_private", retentionDays: null, shareWithAgentKeys: [] },
    });
    const { systemPrompt: _privatePrompt, ...publicDefinition } = definition;
    return res.json(publicDefinition);
  });

  app.post("/api/admin/cora/operate", isAdmin, async (req: Request, res: Response) => {
    const parsed = adminCoraRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: parsed.error.issues[0]?.message ?? "Ungültige Cora-Anfrage",
        issues: parsed.error.issues,
      });
    }

    try {
      const user = req.user as any;
      const result = await runAdminCoraOperation(parsed.data.message, {
        id: user.id,
        email: user.email ?? null,
        ip: req.ip ?? null,
      });
      const openClaw = await runOpenClawCoriTurn({
        userId: user.id,
        userEmail: user.email ?? null,
        message: parsed.data.message,
        nativeResult: result,
      });

      // Native policy/action output stays authoritative. OpenClaw may enrich a
      // non-actionable conversational turn, but cannot replace an executed,
      // searched, or confirmation-gated canonical result.
      const response = result.status === "unsupported" && openClaw.reply
        ? { ...result, reply: openClaw.reply }
        : result;
      const operation = response.intent || "interaction";
      recordAgentUsage({
        agentSlug: "admin-cora",
        agentKey: "ADMIN_CORA",
        ownerUserId: user.id,
        beneficiaryUserId: user.id,
        surface: "app",
        operation,
        units: response.status === "completed" && response.action === "created" ? 3 : 1,
        relatedTaskId: response.actionData?.entityType === "board_task"
          ? String(response.actionData.entityId ?? "") || null
          : null,
        billable: false,
        debitCredits: false,
      }).catch((error) => console.warn("[admin-cora] usage recording failed", error?.message));
      return res.json({
        ...response,
        runtime: {
          provider: openClaw.provider,
          available: openClaw.available,
          agentId: openClaw.agentId,
          sessionId: openClaw.sessionId,
        },
      });
    } catch (error: any) {
      console.error("[admin-cora] operation failed", error);
      return res.status(500).json({
        message: "Cora konnte die Operation nicht sicher abschließen.",
        detail: process.env.NODE_ENV === "development" ? error?.message : undefined,
      });
    }
  });
}
