import { KanbanCard, KanbanState } from './types';

export function findColumn<T extends KanbanCard>(
  columns: KanbanState<T>,
  columnId: string
) {
  return columns.find((c) => c.id === columnId);
}