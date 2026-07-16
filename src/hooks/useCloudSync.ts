import { useEffect, useRef, useCallback } from 'react';
import { useStore } from '../store';
import { supabase } from '../lib/supabase';

const DEBOUNCE_MS = 2000;

function extractPayload(state: ReturnType<typeof useStore.getState>) {
  return {
    weekStart: state.weekStart,
    films: state.films,
    shows: state.shows,
    tmdbApiKey: state.tmdbApiKey,
    zoom: state.zoom,
    colorMode: state.colorMode,
    ticketTypes: state.ticketTypes,
    priceCards: state.priceCards,
    screenCapacities: state.screenCapacities,
    seatPlans: state.seatPlans,
  };
}

export function useCloudSync() {
  const syncCode = useStore((s) => s.syncCode);
  const setSyncCode = useStore((s) => s.setSyncCode);
  const setSyncStatus = useStore((s) => s.setSyncStatus);

  const payloadRef = useRef('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const codeRef = useRef(syncCode);
  codeRef.current = syncCode;

  const loadFromCloud = useCallback(async (code: string) => {
    if (!supabase || !code) return;
    setSyncStatus('syncing');
    try {
      const { data, error } = await supabase
        .from('schedules')
        .select('data')
        .eq('id', code)
        .maybeSingle();
      if (error) throw error;
      if (data?.data) {
        // Stamp payloadRef before setState so the subscriber doesn't re-save what we just loaded
        payloadRef.current = JSON.stringify(data.data);
        useStore.setState(data.data);
      } else {
        // No cloud record yet — push the current local state up immediately
        const localPayload = extractPayload(useStore.getState());
        const str = JSON.stringify(localPayload);
        await supabase.from('schedules').upsert({
          id: code,
          data: localPayload,
          updated_at: new Date().toISOString(),
        });
        payloadRef.current = str;
      }
      setSyncStatus('synced');
    } catch {
      setSyncStatus('error');
    }
  }, [setSyncStatus]);

  // On first mount: ensure we have a sync code then load from cloud
  useEffect(() => {
    if (!supabase) return;
    let code = codeRef.current;
    if (!code) {
      code = crypto.randomUUID();
      setSyncCode(code);
    }
    loadFromCloud(code);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-save whenever syncable data changes
  useEffect(() => {
    if (!supabase || !syncCode) return;

    const save = async () => {
      if (!supabase) return;
      const state = useStore.getState();
      const payload = extractPayload(state);
      const str = JSON.stringify(payload);
      if (str === payloadRef.current) return; // nothing changed, skip

      setSyncStatus('syncing');
      try {
        await supabase.from('schedules').upsert({
          id: codeRef.current,
          data: payload,
          updated_at: new Date().toISOString(),
        });
        payloadRef.current = str;
        setSyncStatus('synced');
      } catch {
        setSyncStatus('error');
      }
    };

    const unsub = useStore.subscribe((state) => {
      const str = JSON.stringify(extractPayload(state));
      if (str === payloadRef.current) return; // only meta (syncStatus etc) changed — skip
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(save, DEBOUNCE_MS);
    });

    return () => {
      unsub();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [syncCode, setSyncStatus]);

  // Called by SyncModal when user pastes a code from another device
  const switchToCode = useCallback(async (newCode: string) => {
    setSyncCode(newCode);
    await loadFromCloud(newCode);
  }, [setSyncCode, loadFromCloud]);

  return { switchToCode };
}
