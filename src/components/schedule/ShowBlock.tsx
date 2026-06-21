import React, { useRef, useState } from 'react';
import { X, Lock } from 'lucide-react';
import { useStore } from '../../store';
import { minutesToTimeString, showDurationMinutes } from '../../utils/time';
import type { Show, Film } from '../../types';
import { hexToRgba } from '../../utils/colors';
import { SCREENING_TYPES } from '../../utils/screeningTypes';
import { useDragContext } from '../../contexts/DragContext';

interface Props {
  show: Show;
  film: Film;
  zoom: number;
  timelineStart: number;
  onShowClick: (showId: string) => void;
}

export function ShowBlock({ show, film, zoom, timelineStart, onShowClick }: Props) {
  const removeShow = useStore((s) => s.removeShow);
  const [hovered, setHovered] = useState(false);
  const { startDrag } = useDragContext();

  const showDur = showDurationMinutes(film.runtime);
  const left = (show.startMinute - timelineStart) * zoom;
  const width = showDur * zoom;
  const endMinute = show.startMinute + showDur;

  const canDrag = !show.isSenior;

  const pointerRef = useRef<{ x: number; y: number; id: number; dragging: boolean } | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!canDrag) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.stopPropagation();
    pointerRef.current = { x: e.clientX, y: e.clientY, id: e.pointerId, dragging: false };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!pointerRef.current || pointerRef.current.dragging) return;
    const dx = e.clientX - pointerRef.current.x;
    const dy = e.clientY - pointerRef.current.y;
    if (Math.sqrt(dx * dx + dy * dy) > 6) {
      pointerRef.current.dragging = true;
      const rect = e.currentTarget.getBoundingClientRect();
      const offsetMinutes = Math.round((pointerRef.current.x - rect.left) / zoom);
      (e.currentTarget as HTMLElement).releasePointerCapture(pointerRef.current.id);
      startDrag(
        { type: 'show', showId: show.id, offsetMinutes },
        e.clientX, e.clientY,
        film.title, film.color
      );
    }
  };

  const handlePointerUp = (_e: React.PointerEvent) => {
    if (!pointerRef.current) return;
    const wasDragging = pointerRef.current.dragging;
    pointerRef.current = null;
    if (!wasDragging) {
      onShowClick(show.id);
    }
  };

  return (
    <div
      className="absolute top-1 bottom-1 rounded select-none overflow-hidden"
      style={{
        left,
        width: Math.max(width, 24),
        backgroundColor: hexToRgba(film.color, show.isSenior ? 0.9 : 0.75),
        borderLeft: `3px solid ${film.color}`,
        cursor: canDrag ? 'grab' : 'default',
        zIndex: hovered ? 10 : 1,
        touchAction: 'none',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Trailers/ads buffer at front */}
      <div
        className="absolute top-0 left-0 bottom-0 opacity-30"
        style={{ width: 20 * zoom, backgroundColor: '#000' }}
        title="20 min trailers/ads"
      />

      <div className="relative px-1.5 py-0.5 h-full flex flex-col justify-between overflow-hidden">
        <div className="flex items-start justify-between gap-1">
          <p
            className="text-white font-semibold leading-tight"
            style={{ fontSize: width > 80 ? 12 : 10 }}
          >
            {width > 50 ? film.title : ''}
            {show.isSenior && (
              <span className="ml-1 text-yellow-300 text-xs">★</span>
            )}
            {show.isFixed && !show.isSenior && (
              <Lock size={10} className="inline ml-1 text-white/60" />
            )}
            {show.screeningType && (
              <span
                className="ml-1 text-xs font-bold px-0.5 rounded"
                style={{ backgroundColor: SCREENING_TYPES[show.screeningType].color, color: '#fff' }}
              >
                {SCREENING_TYPES[show.screeningType].short}
              </span>
            )}
          </p>
          {hovered && (
            <button
              className="flex-shrink-0 text-white/60 hover:text-white transition-colors"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                removeShow(show.id);
              }}
            >
              <X size={10} />
            </button>
          )}
        </div>
        {width > 70 && (
          <p className="text-white/70 text-xs">
            {minutesToTimeString(show.startMinute)}–{minutesToTimeString(endMinute)}
          </p>
        )}
      </div>

      {/* Tooltip */}
      {hovered && (
        <div
          className="absolute z-20 bg-gray-900 border border-gray-600 rounded p-2 shadow-xl pointer-events-none"
          style={{ top: '100%', left: 0, minWidth: 160, marginTop: 4 }}
        >
          <p className="text-white text-xs font-semibold">{film.title}</p>
          <p className="text-gray-400 text-xs">
            {minutesToTimeString(show.startMinute)} – {minutesToTimeString(endMinute)}
          </p>
          <p className="text-gray-400 text-xs">
            Runtime: {film.runtime} min + 20 trailers
          </p>
          {show.isSenior && (
            <p className="text-yellow-400 text-xs">★ Senior screening</p>
          )}
          {show.isFixed && !show.isSenior && (
            <p className="text-purple-400 text-xs">🔒 Fixed position</p>
          )}
          {show.screeningType && (
            <p className="text-xs font-semibold" style={{ color: SCREENING_TYPES[show.screeningType].color }}>
              {SCREENING_TYPES[show.screeningType].label}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
