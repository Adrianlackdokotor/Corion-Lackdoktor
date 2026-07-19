import { AGENT_REGISTRY } from './agent-registry';

export type ApprovalMode = 'auto' | 'human_review' | 'human_required';

export type RuntimeActionPolicy = {
  action: string;
  mode: ApprovalMode;
  writesTo?: Array<'crm' | 'calendar' | 'drive' | 'task_board' | 'finance_log' | 'usage_log'>;
  notes?: string[];
};

export type RuntimeContract = {
  agentKey: keyof typeof AGENT_REGISTRY;
  acceptedInputs: string[];
  producedOutputs: string[];
  autoExecutableActions: RuntimeActionPolicy[];
  suggestionOnlyActions: string[];
  forbiddenExecution: string[];
  loggingEvents: string[];
  sharedWorkflowState: string[];
};

export const AGENT_RUNTIME_CONTRACTS: Record<string, RuntimeContract> = {
  ADMIN_CORA: {
    agentKey: 'ADMIN_CORA',
    acceptedInputs: ['authenticated admin message', 'conversation context', 'selected canonical entity', 'uploaded media'],
    producedOutputs: ['canonical search results', 'bounded action result', 'navigation target', 'confirmation request', 'audit evidence'],
    autoExecutableActions: [
      { action: 'canonical_search', mode: 'auto', writesTo: ['usage_log'] },
      { action: 'navigate_dossier', mode: 'auto', writesTo: ['usage_log'] },
      { action: 'create_task', mode: 'auto', writesTo: ['task_board', 'usage_log'] },
      { action: 'update_crm_record', mode: 'auto', writesTo: ['crm', 'usage_log'] },
      { action: 'attach_order_media', mode: 'auto', writesTo: ['crm', 'drive', 'usage_log'] },
      { action: 'draft_document', mode: 'auto', writesTo: ['crm', 'usage_log'] },
      { action: 'create_workshop_order', mode: 'auto', writesTo: ['crm', 'drive', 'usage_log'] },
      { action: 'update_workshop_order', mode: 'auto', writesTo: ['crm', 'usage_log'] },
      { action: 'schedule_workshop_order', mode: 'auto', writesTo: ['crm', 'calendar', 'usage_log'] },
      { action: 'change_operational_status', mode: 'auto', writesTo: ['crm', 'usage_log'] },
      { action: 'create_improvement_task', mode: 'auto', writesTo: ['task_board', 'usage_log'] },
      { action: 'report_friction_observation', mode: 'auto', writesTo: ['task_board', 'usage_log'] },
      { action: 'suggest_business_optimization', mode: 'auto', writesTo: ['usage_log'] },
      { action: 'create_partner_account', mode: 'human_required', writesTo: ['crm', 'usage_log'] },
      { action: 'change_pricing', mode: 'human_required', writesTo: ['crm', 'finance_log', 'usage_log'] },
      { action: 'financial_sensitive_change', mode: 'human_required', writesTo: ['finance_log', 'usage_log'] },
      { action: 'major_contractual_change', mode: 'human_required', writesTo: ['crm', 'usage_log'] },
      { action: 'delete_canonical_record', mode: 'human_required', writesTo: ['usage_log'] },
    ],
    suggestionOnlyActions: ['send_customer_message', 'confirm_payment'],
    forbiddenExecution: ['public admin execution', 'cross-tenant disclosure', 'unverified payment confirmation', 'hard delete without explicit policy'],
    loggingEvents: ['intent_classified', 'policy_checked', 'action_executed', 'action_refused', 'usage_recorded'],
    sharedWorkflowState: ['selectedEntity', 'pendingAction', 'requiredInputs', 'confirmationState', 'executionEvidence'],
  },
  GUTACHTER_LEAD: {
    agentKey: 'GUTACHTER_LEAD',
    acceptedInputs: [
      'lead message',
      'damage photo',
      'registration photo',
      'fault-status confirmation',
      'phone number',
    ],
    producedOutputs: [
      'triage decision',
      'missing intake items',
      'suggested route: gutachter or lackdoktor',
      'structured lead summary',
    ],
    autoExecutableActions: [
      {
        action: 'triage_damage',
        mode: 'auto',
        writesTo: ['usage_log'],
      },
      {
        action: 'suggest_follow_up',
        mode: 'auto',
        writesTo: ['task_board', 'usage_log'],
      },
    ],
    suggestionOnlyActions: [
      'create_calendar_entry',
      'create_crm_record',
      'create_drive_structure',
    ],
    forbiddenExecution: [
      'finance confirmation',
      'legal commitment',
      'insurance settlement promise',
    ],
    loggingEvents: [
      'lead_triaged',
      'intake_packet_missing',
      'route_selected',
      'ai_usage_recorded',
    ],
    sharedWorkflowState: [
      'leadType',
      'damageSeverity',
      'faultStatus',
      'missingInputs',
      'recommendedRoute',
    ],
  },
  FRONT_DESK: {
    agentKey: 'FRONT_DESK',
    acceptedInputs: [
      'client chat message',
      'language hint',
      'damage description',
      'uploaded media',
    ],
    producedOutputs: [
      'structured reply',
      'route hint',
      'next-step request',
    ],
    autoExecutableActions: [
      {
        action: 'collect_intake_packet',
        mode: 'auto',
        writesTo: ['usage_log'],
      },
      {
        action: 'triage_damage',
        mode: 'auto',
        writesTo: ['usage_log'],
      },
    ],
    suggestionOnlyActions: [
      'route_to_gutachter',
      'route_to_lackdoktor',
      'create_calendar_entry',
    ],
    forbiddenExecution: [
      'raw external data export',
      'binding legal/insurance advice',
    ],
    loggingEvents: [
      'frontdesk_reply_sent',
      'language_selected',
      'triage_classified',
      'ai_usage_recorded',
    ],
    sharedWorkflowState: [
      'clientLanguage',
      'triageCategory',
      'nextRequest',
      'routeHint',
    ],
  },
  LACKDOKTOR_SELF_SERVICE: {
    agentKey: 'LACKDOKTOR_SELF_SERVICE',
    acceptedInputs: ['damage photo', 'damage description', 'vehicle reference'],
    producedOutputs: ['service routing reply', 'estimate-prep request'],
    autoExecutableActions: [
      {
        action: 'route_to_lackdoktor',
        mode: 'auto',
        writesTo: ['usage_log'],
      },
    ],
    suggestionOnlyActions: ['create_crm_record', 'suggest_follow_up'],
    forbiddenExecution: ['gutachter escalation without reason'],
    loggingEvents: ['lackdoktor_route_selected', 'ai_usage_recorded'],
    sharedWorkflowState: ['serviceType', 'estimateNeeded'],
  },
  CFO_ASSISTANT: {
    agentKey: 'CFO_ASSISTANT',
    acceptedInputs: ['invoice pdf', 'kontoauszug', 'finance status query', 'payment evidence'],
    producedOutputs: ['finance status recommendation', 'weekly report', 'overdue list', 'automation suggestions'],
    autoExecutableActions: [
      {
        action: 'track_ai_usage',
        mode: 'auto',
        writesTo: ['usage_log'],
      },
    ],
    suggestionOnlyActions: ['mark_finance_status', 'generate_weekly_report'],
    forbiddenExecution: ['payment confirmation without evidence'],
    loggingEvents: ['finance_document_reviewed', 'overdue_detected', 'weekly_report_prepared', 'ai_usage_recorded'],
    sharedWorkflowState: ['invoiceStatus', 'paymentEvidence', 'overdueAgeDays', 'reportPeriod'],
  },
  SYSTEM_ARCHITECT: {
    agentKey: 'SYSTEM_ARCHITECT',
    acceptedInputs: ['new lead data', 'client identity', 'vehicle data', 'document/media bundle'],
    producedOutputs: ['storage plan', 'folder naming', 'routing map', 'linked entity summary'],
    autoExecutableActions: [
      {
        action: 'create_drive_structure',
        mode: 'human_review',
        writesTo: ['drive', 'usage_log'],
        notes: ['Allowed after naming/data sanity check in early phase.'],
      },
      {
        action: 'create_crm_record',
        mode: 'human_review',
        writesTo: ['crm', 'usage_log'],
      },
      {
        action: 'create_calendar_entry',
        mode: 'human_review',
        writesTo: ['calendar', 'usage_log'],
      },
    ],
    suggestionOnlyActions: ['suggest_follow_up'],
    forbiddenExecution: ['non-standard folder tree', 'external raw-data export without anonymization'],
    loggingEvents: ['storage_plan_created', 'crm_link_prepared', 'calendar_link_prepared', 'ai_usage_recorded'],
    sharedWorkflowState: ['caseFolderName', 'crmLinked', 'calendarLinked', 'driveLinked', 'documentRoutingState'],
  },
  REPAIR_STANDARDS_ADVISOR: {
    agentKey: 'REPAIR_STANDARDS_ADVISOR',
    acceptedInputs: ['damage photos', 'repair discussion', 'leasing concern', 'vehicle panel context'],
    producedOutputs: ['repair standards explanation', 'risk warning', 'recommended compliant next step'],
    autoExecutableActions: [
      {
        action: 'track_ai_usage',
        mode: 'auto',
        writesTo: ['usage_log'],
      },
    ],
    suggestionOnlyActions: ['triage_damage', 'suggest_follow_up'],
    forbiddenExecution: ['binding legal guarantee', 'resale-value guarantee'],
    loggingEvents: ['repair_standard_explained', 'leasing_risk_flagged', 'ai_usage_recorded'],
    sharedWorkflowState: ['repairStandardType', 'leasingRisk', 'structuralConcern', 'measurementRiskHint'],
  },
};

export function getRuntimeContract(agentKey: string): RuntimeContract | null {
  return AGENT_RUNTIME_CONTRACTS[agentKey] || null;
}
