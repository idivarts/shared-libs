export const CRM_COLUMNS = [
  "new_leads",
  "in_progress_leads",
  "active_leads",
  "churned_leads",
] as const;

export type CRMColumnId = typeof CRM_COLUMNS[number];

export type KanbanCard = {
  id: string;
  crmStatus: CRMColumnId;
};

export type KanbanColumn<T extends KanbanCard> = {
  id: CRMColumnId;
  title: string;
  cards: T[];
};

export type KanbanState<T extends KanbanCard> = KanbanColumn<T>[];