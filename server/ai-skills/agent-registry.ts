import { AGENT_CONSTITUTIONS } from './agent-constitution';

export type AgentSurface = 'site' | 'whatsapp' | 'email' | 'app' | 'api' | 'internal';

export type AgentAction =
  | 'collect_intake_packet'
  | 'route_to_gutachter'
  | 'route_to_lackdoktor'
  | 'create_calendar_entry'
  | 'create_crm_record'
  | 'create_drive_structure'
  | 'suggest_follow_up'
  | 'triage_damage'
  | 'mark_finance_status'
  | 'generate_weekly_report'
  | 'canonical_search'
  | 'navigate_dossier'
  | 'create_task'
  | 'create_workshop_order'
  | 'update_workshop_order'
  | 'schedule_workshop_order'
  | 'attach_order_media'
  | 'create_partner_account'
  | 'track_ai_usage';

export type AgentOutputSchema = {
  type: 'chat_reply' | 'triage_decision' | 'workflow_instruction' | 'finance_report' | 'storage_plan';
  fields: string[];
};

export type RegisteredAgent = {
  key: string;
  label: string;
  surfaces: AgentSurface[];
  constitutionKey: keyof typeof AGENT_CONSTITUTIONS;
  allowedActions: AgentAction[];
  forbiddenActions: string[];
  outputSchema: AgentOutputSchema;
  notes?: string[];
};

export const AGENT_REGISTRY: Record<string, RegisteredAgent> = {
  ADMIN_CORA: {
    key: 'ADMIN_CORA',
    label: 'Cora Admin Operations Agent',
    surfaces: ['app', 'internal', 'api'],
    constitutionKey: 'ADMIN_CORA',
    allowedActions: [
      'canonical_search',
      'navigate_dossier',
      'create_task',
      'create_workshop_order',
      'update_workshop_order',
      'schedule_workshop_order',
      'attach_order_media',
      'create_partner_account',
      'track_ai_usage',
    ],
    forbiddenActions: [
      'Never expose admin operations on public surfaces.',
      'Never bypass confirmation for identity, finance, destructive or outbound actions.',
      'Never write to repair_requests as a new operational truth.',
    ],
    outputSchema: {
      type: 'workflow_instruction',
      fields: ['reply', 'intent', 'status', 'action', 'actionData', 'evidence'],
    },
    notes: ['Primary authenticated agent-first control layer for Corion admin operations.'],
  },
  GUTACHTER_LEAD: {
    key: 'GUTACHTER_LEAD',
    label: 'Gutachter Lead Qualifier',
    surfaces: ['site', 'whatsapp', 'email', 'api'],
    constitutionKey: 'GUTACHTER_LEAD',
    allowedActions: [
      'collect_intake_packet',
      'triage_damage',
      'route_to_gutachter',
      'route_to_lackdoktor',
      'suggest_follow_up',
      'track_ai_usage',
    ],
    forbiddenActions: [
      'Do not promise legal outcomes.',
      'Do not create finance confirmations.',
      'Do not bypass the intake packet for Gutachten qualification.',
    ],
    outputSchema: {
      type: 'triage_decision',
      fields: ['reply', 'leadType', 'damageSeverity', 'nextRoute', 'missingInputs'],
    },
    notes: ['Primary use: fast conversion of accident leads into qualified assessment cases.'],
  },
  LACKDOKTOR_SELF_SERVICE: {
    key: 'LACKDOKTOR_SELF_SERVICE',
    label: 'Lackdoktor Self-Service Guide',
    surfaces: ['site', 'whatsapp', 'email'],
    constitutionKey: 'LACKDOKTOR_SELF_SERVICE',
    allowedActions: [
      'collect_intake_packet',
      'route_to_lackdoktor',
      'suggest_follow_up',
      'track_ai_usage',
    ],
    forbiddenActions: [
      'Do not keep cosmetic-only leads inside the Gutachter pipeline.',
    ],
    outputSchema: {
      type: 'chat_reply',
      fields: ['reply', 'serviceType', 'nextStep'],
    },
  },
  FRONT_DESK: {
    key: 'FRONT_DESK',
    label: 'Front-Desk Communication Agent',
    surfaces: ['site', 'whatsapp', 'email', 'app'],
    constitutionKey: 'FRONT_DESK',
    allowedActions: [
      'collect_intake_packet',
      'triage_damage',
      'route_to_gutachter',
      'route_to_lackdoktor',
      'suggest_follow_up',
      'track_ai_usage',
    ],
    forbiddenActions: [
      'Do not improvise legal explanations beyond the constitution.',
      'Do not ignore the language adaptation rule.',
    ],
    outputSchema: {
      type: 'chat_reply',
      fields: ['reply', 'language', 'nextStep', 'routeHint'],
    },
  },
  CFO_ASSISTANT: {
    key: 'CFO_ASSISTANT',
    label: 'CFO Operations Assistant',
    surfaces: ['app', 'email', 'internal', 'api'],
    constitutionKey: 'CFO_ASSISTANT',
    allowedActions: [
      'mark_finance_status',
      'generate_weekly_report',
      'suggest_follow_up',
      'track_ai_usage',
    ],
    forbiddenActions: [
      'Do not mark payments confirmed without evidence.',
      'Do not overwrite workshop status without finance linkage.',
    ],
    outputSchema: {
      type: 'finance_report',
      fields: ['summary', 'overdueItems', 'paymentStatus', 'automationProposals'],
    },
  },
  SYSTEM_ARCHITECT: {
    key: 'SYSTEM_ARCHITECT',
    label: 'Corion Storage and Workflow Architect',
    surfaces: ['internal', 'api', 'app'],
    constitutionKey: 'SYSTEM_ARCHITECT',
    allowedActions: [
      'create_drive_structure',
      'create_crm_record',
      'create_calendar_entry',
      'suggest_follow_up',
      'track_ai_usage',
    ],
    forbiddenActions: [
      'Do not create non-standard folder structures.',
      'Do not send raw personal data externally without anonymization.',
    ],
    outputSchema: {
      type: 'storage_plan',
      fields: ['rootFolderName', 'subfolders', 'routingPlan', 'linkedEntities'],
    },
    notes: ['This role is the bridge between Drive, CRM, calendar, and task workflows.'],
  },
  REPAIR_STANDARDS_ADVISOR: {
    key: 'REPAIR_STANDARDS_ADVISOR',
    label: 'Repair Standards and Damage Advisor',
    surfaces: ['site', 'whatsapp', 'email', 'app', 'api'],
    constitutionKey: 'REPAIR_STANDARDS_ADVISOR',
    allowedActions: [
      'triage_damage',
      'suggest_follow_up',
      'track_ai_usage',
    ],
    forbiddenActions: [
      'Do not promise guaranteed resale values or legal outcomes.',
      'Do not present cosmetic repair as equal to manufacturer-conforming repair when structural risk exists.',
    ],
    outputSchema: {
      type: 'chat_reply',
      fields: ['reply', 'repairStandardType', 'riskExplanation', 'recommendedNextStep'],
    },
    notes: ['Used to protect clients from low-quality repair choices and explain leasing/value-loss risks.'],
  },
};

export function getRegisteredAgent(agentKey: string): RegisteredAgent | null {
  return AGENT_REGISTRY[agentKey] || null;
}

export function listRegisteredAgents(): RegisteredAgent[] {
  return Object.values(AGENT_REGISTRY);
}
