import { z } from "zod";
import { getAgentConstitution, buildAgentSystemPrompt } from "./agent-constitution";
import { getRegisteredAgent, type AgentAction, type AgentSurface } from "./agent-registry";
import { getRuntimeContract, type ApprovalMode } from "./agent-runtime-contracts";
import { BASE_AGENT_CONSTITUTION_VERSION } from "./base-agent-constitution";

export type AgentOwner =
  | { kind: "system"; id: "corion" | "hub1" }
  | { kind: "user"; id: string }
  | { kind: "organization"; id: string };

export type AgentMemoryScope = {
  mode: "none" | "session" | "user_private" | "entity_scoped" | "organization_scoped";
  entityTypes?: string[];
  retentionDays?: number | null;
  shareWithAgentKeys?: string[];
};

export type AgentDataScope = {
  roles: string[];
  entityTypes: string[];
  tenantId?: string | null;
  ownerUserId?: string | null;
};

export type AgentEconomics = {
  meterUsage: boolean;
  billingMode: "unmetered" | "measure_only" | "quota" | "credit_debit";
  accountOwner: "agent_owner" | "beneficiary_user" | "organization";
  unitPolicy: Record<string, number>;
  entitlementKey?: string | null;
};

export type ConstitutionalAgentDefinition = {
  key: string;
  slug: string;
  label: string;
  constitutionVersion: string;
  constitutionKey: string;
  owner: AgentOwner;
  beneficiaryUserId?: string | null;
  role: string;
  surfaces: AgentSurface[];
  allowedActions: AgentAction[];
  actionPolicies: Array<{ action: string; mode: ApprovalMode }>;
  forbiddenActions: string[];
  dataScope: AgentDataScope;
  memoryScope: AgentMemoryScope;
  workflowPacks: string[];
  escalationPolicy: string[];
  economics: AgentEconomics;
  systemPrompt: string;
};

const userAgentOptionsSchema = z.object({
  userId: z.string().min(1),
  role: z.string().min(1),
  templateAgentKey: z.string().min(1).default("FRONT_DESK"),
  label: z.string().min(1).optional(),
  surfaces: z.array(z.enum(["site", "whatsapp", "email", "app", "api", "internal"])).optional(),
});

const DEFAULT_ECONOMICS: AgentEconomics = {
  meterUsage: true,
  billingMode: "measure_only",
  accountOwner: "beneficiary_user",
  unitPolicy: { interaction: 1, search: 1, mutation: 3, document_page: 1, media_minute: 2 },
};

export function compileConstitutionalAgent(
  agentKey: string,
  options: {
    owner?: AgentOwner;
    beneficiaryUserId?: string | null;
    dataScope?: Partial<AgentDataScope>;
    memoryScope?: AgentMemoryScope;
    economics?: Partial<AgentEconomics>;
    label?: string;
    slug?: string;
  } = {},
): ConstitutionalAgentDefinition {
  const registered = getRegisteredAgent(agentKey);
  const constitution = getAgentConstitution(agentKey);
  const runtime = getRuntimeContract(agentKey);
  if (!registered || !constitution) throw new Error(`Unknown constitutional agent: ${agentKey}`);

  const owner = options.owner ?? { kind: "system", id: "corion" };
  const ownerUserId = owner.kind === "user" ? owner.id : null;
  return {
    key: agentKey,
    slug: options.slug ?? agentKey.toLowerCase().replace(/_/g, "-"),
    label: options.label ?? registered.label,
    constitutionVersion: BASE_AGENT_CONSTITUTION_VERSION,
    constitutionKey: registered.constitutionKey,
    owner,
    beneficiaryUserId: options.beneficiaryUserId ?? ownerUserId,
    role: constitution.role,
    surfaces: [...registered.surfaces],
    allowedActions: [...registered.allowedActions],
    actionPolicies: (runtime?.autoExecutableActions ?? []).map((policy) => ({
      action: policy.action,
      mode: policy.mode,
    })),
    forbiddenActions: [...registered.forbiddenActions, ...(runtime?.forbiddenExecution ?? [])],
    dataScope: {
      roles: options.dataScope?.roles ?? [],
      entityTypes: options.dataScope?.entityTypes ?? [],
      tenantId: options.dataScope?.tenantId ?? null,
      ownerUserId: options.dataScope?.ownerUserId ?? ownerUserId,
    },
    memoryScope: options.memoryScope ?? { mode: "session", retentionDays: 7 },
    workflowPacks: runtime?.sharedWorkflowState ?? [],
    escalationPolicy: constitution.escalationRules ?? [],
    economics: { ...DEFAULT_ECONOMICS, ...options.economics },
    systemPrompt: buildAgentSystemPrompt(agentKey),
  };
}

export function createUserSpecificAgent(input: z.input<typeof userAgentOptionsSchema>): ConstitutionalAgentDefinition {
  const options = userAgentOptionsSchema.parse(input);
  const compiled = compileConstitutionalAgent(options.templateAgentKey, {
    owner: { kind: "user", id: options.userId },
    beneficiaryUserId: options.userId,
    label: options.label ?? `Dedicated agent for ${options.userId}`,
    slug: `user-${options.userId}-${options.templateAgentKey.toLowerCase().replace(/_/g, "-")}`,
    dataScope: {
      roles: [options.role],
      entityTypes: ["user", "workshop_order", "file_attachment", "appointment", "board_task"],
      ownerUserId: options.userId,
    },
    memoryScope: {
      mode: "user_private",
      entityTypes: ["user", "workshop_order", "appointment", "board_task"],
      retentionDays: null,
      shareWithAgentKeys: [],
    },
  });
  if (options.surfaces) compiled.surfaces = options.surfaces;
  return compiled;
}

export function canAgentExecute(definition: ConstitutionalAgentDefinition, action: string) {
  if (!definition.allowedActions.includes(action as AgentAction)) {
    return { allowed: false, mode: "human_required" as ApprovalMode, reason: "Action is not in the allowlist." };
  }
  const policy = definition.actionPolicies.find((item) => item.action === action);
  return {
    allowed: true,
    mode: policy?.mode ?? "human_review" as ApprovalMode,
    reason: policy ? "Runtime policy found." : "No explicit auto policy; defaulting to human review.",
  };
}
