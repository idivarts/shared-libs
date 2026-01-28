export const CRM_COLUMNS = [
  "new_leads",
  "in_progress_leads",
  "active_leads",
  "churned_leads",
] as const;

export type CRMColumnId = typeof CRM_COLUMNS[number];