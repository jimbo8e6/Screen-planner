import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { useStore } from '../store';
import type { ScreenNumber } from '../types';

export type DragItem =
  | { type: 'film'; filmId: string }
  | { type: 'show'; showId: string; offsetMinutes: number };

interface ActiveTarget {
  screen: ScreenNumber;
  date: string;
  minute: number;
}

interface DragState {
  item: DragItem;
  x: number;
  y: number;
  label: string;
  color: string;
}

interface DragContextValue {
  drag: DragState | null;
  activeTarget: ActiveTarget | null;
  startDrag: (item: DragItem, x: number, y: number, label: string, color: string) => void;
}

const DragContext = createContext<DragContextValue>({
  drag: null,
  activeTarget: null,
  startDrag: () => {},
});

export function useDragContext() {
  return useContext(DragContext);
}

function resolveTrack(x: number, y: number) {
  const els = document.elementsFromPoint(x, y);
  const el = els.find(
    (e) => (e as HTMLElement).dataset?.screen !== undefined
  ) as HTMLElement | undefined;
  if (!el) return null;
  const { screen, date, zoom, timelineStart } = el.dataset;
  if (!screen || !date || !zoom || !timelineStart) return null;
  return {
    el,
    screen: parseInt(screen) as ScreenNumber,
    date,
    zoom: parseFloat(zoom),
    timelineStart: parseInt(timelineStart),
  };
}

export function DragProvider({ children }: { children: React.ReactNode }) {
  const [drag, setDrag] = useState<DragState | null>(null);
  const [activeTarget, setActiveTarget] = useState<ActiveTarget | null>(null);
  const dragRef = useRef<DragState | null>(null);

  const moveShow = useStore((s) => s.moveShow);
  const addFixedShow = useStore((s) => s.addFixedShow);

  const startDrag = useCallback(
    (item: DragItem, x: number, y: number, label: string, color: string) => {
      const state: DragState = { item, x, y, label, color };
      dragRef.current = state;
      setDrag(state);

      const onMove = (e: PointerEvent) => {
        if (!dragRef.current) return;
        const next = { ...dragRef.current, x: e.clientX, y: e.clientY };
        dragRef.current = next;
        setDrag(next);

        const t = resolveTrack(e.clientX, e.clientY);
        if (t) {
          const rect = t.el.getBoundingClientRect();
          const raw = Math.round((e.clientX - rect.left) / t.zoom) + t.timelineStart;
          const snapped = Math.round(raw / 5) * 5;
          const it = dragRef.current.item;
          const minute = it.type === 'show'
            ? Math.max(t.timelineStart, snapped - it.offsetMinutes)
            : snapped;
          setActiveTarget({ screen: t.screen, date: t.date, minute });
        } else {
          setActiveTarget(null);
        }
      };

      const onUp = (e: PointerEvent) => {
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onUp);

        if (dragRef.current) {
          const t = resolveTrack(e.clientX, e.clientY);
          if (t) {
            const rect = t.el.getBoundingClientRect();
            const raw = Math.round((e.clientX - rect.left) / t.zoom) + t.timelineStart;
            const minute = Math.round(raw / 5) * 5;
            const { item: it } = dragRef.current;

            if (it.type === 'show') {
              moveShow(it.showId, t.screen, Math.max(t.timelineStart, minute - it.offsetMinutes));
            } else {
              addFixedShow({
                filmId: it.filmId,
                screen: t.screen,
                date: t.date,
                startMinute: Math.max(t.timelineStart, minute),
                isFixed: true,
                isSenior: false,
              });
            }
          }
        }

        dragRef.current = null;
        setDrag(null);
        setActiveTarget(null);
      };

      document.addEventListener('pointermove', onMove, { passive: true });
      document.addEventListener('pointerup', onUp);
    },
    [moveShow, addFixedShow]
  );

  return (
    <DragContext.Provider value={{ drag, activeTarget, startDrag }}>
      {children}

      {/* Drag ghost */}
      {drag && (
        <div
          className="fixed pointer-events-none select-none z-[9999] px-2.5 py-1.5 rounded-lg text-white text-xs font-semibold shadow-2xl truncate"
          style={{
            left: drag.x + 16,
            top: drag.y - 28,
            backgroundColor: drag.color,
            maxWidth: 180,
            opacity: 0.93,
            border: '2px solid rgba(255,255,255,0.3)',
          }}
        >
          {drag.label}
        </div>
      )}
    </DragContext.Provider>
  );
}
