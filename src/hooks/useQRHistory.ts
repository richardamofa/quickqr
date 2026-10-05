import { useCallback, useState } from 'react';
import type { QRType, Values } from '../qr/types';

export interface HistoryItem { id: string; type: QRType; values: Values; fg: string; bg: string; rounded: boolean; label: string; key: string }
const KEY = 'qrstudio.recent', MAX = 8
const read = (): HistoryItem[] => { try { const x = JSON.parse(localStorage.getItem(KEY) ?? '[]'); return Array.isArray(x) ? x : [] } catch { return [] } }
const write = (x: HistoryItem[]) => { try { localStorage.setItem(KEY, JSON.stringify(x)) } catch { /* unavailable */ } }

export function useQRHistory() {
  const [items, setItems] = useState<HistoryItem[]>(read)
  const add = useCallback((i: Omit<HistoryItem, 'id'>) => setItems(p => {
    const n = [{ ...i, id: String(Date.now()) }, ...p.filter(o => o.key !== i.key)].slice(0, MAX); write(n); return n
  }), [])
  const remove = useCallback((id: string) => setItems(p => { const n = p.filter(o => o.id !== id); write(n); return n }), [])
  const clear = useCallback(() => { write([]); setItems([]) }, [])
  return { items, add, remove, clear }
}
