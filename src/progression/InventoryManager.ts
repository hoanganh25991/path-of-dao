import type { PlayerSaveV1 } from '@/core/save/SaveSchema';

export function inventoryQty(
  items: PlayerSaveV1['inventory']['items'],
  itemId: string,
): number {
  return items.find((entry) => entry.id === itemId)?.qty ?? 0;
}

export function addInventoryItem(
  items: PlayerSaveV1['inventory']['items'],
  itemId: string,
  qty: number,
): PlayerSaveV1['inventory']['items'] {
  const next = items.map((entry) =>
    entry.id === itemId ? { ...entry, qty: entry.qty + qty } : entry,
  );
  if (!next.some((entry) => entry.id === itemId)) {
    next.push({ id: itemId, qty });
  }
  return next;
}

export function consumeInventoryItem(
  items: PlayerSaveV1['inventory']['items'],
  itemId: string,
  qty: number,
): PlayerSaveV1['inventory']['items'] {
  return items
    .map((entry) => (entry.id === itemId ? { ...entry, qty: entry.qty - qty } : entry))
    .filter((entry) => entry.qty > 0);
}
