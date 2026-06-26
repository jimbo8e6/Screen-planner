import { useEffect } from 'react';
import { useStore } from '../store';
import { supabase } from '../lib/supabase';

interface TillItem {
  kind: string;
  showId?: string;
  ticketTypeId?: string;
  quantity?: number;
}

function computeSalesData(rows: { items: TillItem[] }[]) {
  const counts: Record<string, number> = {};
  const breakdown: Record<string, Record<string, number>> = {};
  for (const row of rows) {
    if (!Array.isArray(row.items)) continue;
    for (const item of row.items) {
      if (item.kind !== 'ticket' || !item.showId) continue;
      const qty = item.quantity ?? 1;
      counts[item.showId] = (counts[item.showId] ?? 0) + qty;
      if (item.ticketTypeId) {
        breakdown[item.showId] ??= {};
        breakdown[item.showId][item.ticketTypeId] =
          (breakdown[item.showId][item.ticketTypeId] ?? 0) + qty;
      }
    }
  }
  return { counts, breakdown };
}

export function useTicketSync() {
  const syncCode = useStore((s) => s.syncCode);
  const setTicketSalesData = useStore((s) => s.setTicketSalesData);

  useEffect(() => {
    if (!supabase || !syncCode) return;

    let cancelled = false;

    const load = async () => {
      if (!supabase) return;
      const { data, error } = await supabase
        .from('transactions')
        .select('items')
        .eq('cinema_id', syncCode);
      if (error || !data || cancelled) return;
      const { counts, breakdown } = computeSalesData(data as { items: TillItem[] }[]);
      setTicketSalesData(counts, breakdown);
    };

    load();

    const channel = supabase
      .channel(`tickets-${syncCode}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transactions',
          filter: `cinema_id=eq.${syncCode}`,
        },
        () => load()
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase?.removeChannel(channel);
    };
  }, [syncCode, setTicketSalesData]);
}
