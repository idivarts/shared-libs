import { KanbanState, CRMColumnId, KanbanCard } from "./types";

export function moveCardBetweenColumns<T extends KanbanCard>(
  state: KanbanState<T>,
  cardId: string,
  fromColumnId: CRMColumnId,
  toColumnId: CRMColumnId,
  toIndex?: number
): KanbanState<T> {
  if (fromColumnId === toColumnId) return state;

  let movingCard!: T;

  const without = state.map((col) => {
    if (col.id === fromColumnId) {
      return {
        ...col,
        cards: col.cards.filter((c) => {
          if (c.id === cardId) {
            movingCard = c;
            return false;
          }
          return true;
        }),
      };
    }
    return col;
  });

  return without.map((col) => {
    if (col.id === toColumnId) {
      const cards = [...col.cards];
      const index = typeof toIndex === "number" ? toIndex : cards.length;
      cards.splice(index, 0, {
        ...movingCard,
        crmStatus: toColumnId,
      });
      return { ...col, cards };
    }
    return col;
  });
}