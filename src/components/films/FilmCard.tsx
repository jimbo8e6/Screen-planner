import { useState } from 'react';
import { Archive, ChevronDown, ChevronUp, X, GripVertical } from 'lucide-react';
import { useStore } from '../../store';
import { IMG_BASE } from '../../utils/tmdb';
import { SCREENING_TYPES } from '../../utils/screeningTypes';
import { minutesToTimeString, timeStringToMinutes } from '../../utils/time';
import { useDragContext } from '../../contexts/DragContext';
import type { Film, FilmTermType, FilmTerms, ScreeningType, ScreenNumber } from '../../types';

const DAYS = ['Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu'];

interface Props {
  film: Film;
  collapsed?: boolean;
}

export function FilmCard({ film, collapsed = false }: Props) {
  const archiveFilm = useStore((s) => s.archiveFilm);
  const updateFilmTerms = useStore((s) => s.updateFilmTerms);
  const setSpecialScreening = useStore((s) => s.setSpecialScreening);
  const setFilmAttributes = useStore((s) => s.setFilmAttributes);
  const { startDrag } = useDragContext();
  const [expanded, setExpanded] = useState(false);

  const ss = film.specialScreening;
  const attrs = film.attributes ?? [];

  const toggleAttribute = (type: ScreeningType) => {
    const next = attrs.includes(type)
      ? attrs.filter((a) => a !== type)
      : [...attrs, type];
    setFilmAttributes(film.id, next);
  };

  const setTermType = (type: FilmTermType) => {
    const terms: FilmTerms = { ...film.terms, type };
    if (type !== 'specific-days') delete terms.specificDays;
    updateFilmTerms(film.id, terms);
  };

  const toggleDay = (dayIdx: number) => {
    const days = film.terms.specificDays ?? [];
    const next = days.includes(dayIdx)
      ? days.filter((d) => d !== dayIdx)
      : [...days, dayIdx];
    updateFilmTerms(film.id, { ...film.terms, specificDays: next });
  };

  const selectScreeningType = (type: ScreeningType) => {
    if (ss?.type === type) {
      setSpecialScreening(film.id, undefined);
    } else if (type === 'senior') {
      // Senior screening defaults: Thursday (6), 10:30 AM (630 min), Screen 2
      setSpecialScreening(film.id, { type: 'senior', day: 6, time: 630, screen: 2 });
    } else {
      setSpecialScreening(film.id, { type, day: ss?.day ?? 3, time: ss?.time, screen: ss?.screen });
    }
  };

  const setScreeningDay = (day: number) => {
    if (!ss) return;
    setSpecialScreening(film.id, { ...ss, day });
  };

  const setScreeningTime = (value: string) => {
    if (!ss) return;
    setSpecialScreening(film.id, {
      ...ss,
      time: value ? timeStringToMinutes(value) : undefined,
    });
  };

  const clearScreeningTime = () => {
    if (!ss) return;
    setSpecialScreening(film.id, { ...ss, time: undefined });
  };

  const setScreeningScreen = (screen: ScreenNumber | undefined) => {
    if (!ss) return;
    setSpecialScreening(film.id, { ...ss, screen });
  };

  if (collapsed) {
    return (
      <div
        className="flex items-center gap-1.5 px-2 py-1 rounded"
        style={{ borderLeft: `3px solid ${film.color}`, backgroundColor: film.color + '18' }}
      >
        <div
          onPointerDown={(e) => {
            e.preventDefault();
            startDrag({ type: 'film', filmId: film.id }, e.clientX, e.clientY, film.title, film.color);
          }}
          className="flex-shrink-0 cursor-grab active:cursor-grabbing text-gray-500 hover:text-gray-300 transition-colors"
          style={{ touchAction: 'none' }}
          title="Drag onto timeline"
        >
          <GripVertical size={12} />
        </div>
        <p className="flex-1 text-white text-xs truncate">{film.title}</p>
        <button
          onClick={() => archiveFilm(film.id)}
          className="flex-shrink-0 text-gray-600 hover:text-yellow-400 transition-colors p-0.5"
          title="Archive film"
        >
          <Archive size={11} />
        </button>
      </div>
    );
  }

  return (
    <div
      className="rounded-lg overflow-hidden border"
      style={{ borderColor: film.color + '55' }}
    >
      {/* Card header */}
      <div className="flex items-center gap-2 p-2" style={{ backgroundColor: film.color + '22' }}>
        {/* Drag handle — drag this film onto the timeline */}
        <div
          onPointerDown={(e) => {
            e.preventDefault();
            startDrag({ type: 'film', filmId: film.id }, e.clientX, e.clientY, film.title, film.color);
          }}
          className="flex-shrink-0 cursor-grab active:cursor-grabbing text-gray-500 hover:text-gray-300 transition-colors"
          style={{ touchAction: 'none' }}
          title="Drag onto timeline to place a show"
        >
          <GripVertical size={14} />
        </div>
        {film.poster ? (
          <img
            src={`${IMG_BASE}${film.poster}`}
            alt=""
            className="w-8 h-12 object-cover rounded flex-shrink-0"
          />
        ) : (
          <div className="w-8 h-12 rounded flex-shrink-0" style={{ backgroundColor: film.color + '44' }} />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-white text-xs font-semibold leading-tight truncate">{film.title}</p>
          <p className="text-gray-400 text-xs">{film.year} · {film.runtime} min</p>
          <div className="flex flex-wrap gap-1 mt-0.5">
            {!ss && (
            <span
              className="inline-block px-1.5 py-0.5 rounded text-xs font-medium"
              style={{ backgroundColor: film.color, color: '#fff' }}
            >
              {film.terms.type === 'all-shows' && 'All shows'}
              {film.terms.type === 'one-per-day' && '1/day'}
              {film.terms.type === 'last-house' && 'Last house'}
              {film.terms.type === 'last-two' && 'Last 2'}
              {film.terms.type === 'split' && 'Split'}
              {film.terms.type === 'specific-days' && 'Specific days'}
            </span>
            )}
            {ss && (
              <span
                className="inline-block px-1.5 py-0.5 rounded text-xs font-medium"
                style={{ backgroundColor: SCREENING_TYPES[ss.type].color, color: '#fff' }}
              >
                {SCREENING_TYPES[ss.type].short} · {DAYS[ss.day]}
                {ss.screen !== undefined ? ` · Sc${ss.screen}` : ''}
                {ss.time !== undefined ? ` · ${minutesToTimeString(ss.time)}` : ' · auto'}
              </span>
            )}
            {attrs.map((a) => (
              <span
                key={a}
                className="inline-block px-1.5 py-0.5 rounded text-xs font-medium"
                style={{ backgroundColor: SCREENING_TYPES[a].color + 'cc', color: '#fff' }}
              >
                {SCREENING_TYPES[a].short}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1 flex-shrink-0">
          <button onClick={() => setExpanded((e) => !e)} className="p-1 text-gray-400 hover:text-white transition-colors">
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          <button
            onClick={() => archiveFilm(film.id)}
            className="p-1 text-gray-500 hover:text-yellow-400 transition-colors"
            title="Archive film"
          >
            <Archive size={12} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="bg-gray-800 p-2 space-y-3">

          {/* Screening term */}
          <div>
            <p className="text-gray-400 text-xs mb-1 font-medium">Screening term</p>
            <div className="grid grid-cols-2 gap-1">
              {(['all-shows', 'one-per-day', 'last-house', 'last-two', 'split', 'specific-days'] as FilmTermType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setTermType(type)}
                  className={`text-xs py-1 px-2 rounded transition-colors ${
                    film.terms.type === type ? 'text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                  style={film.terms.type === type ? { backgroundColor: film.color } : {}}
                >
                  {type === 'all-shows' && 'All shows'}
                  {type === 'one-per-day' && '1 per day'}
                  {type === 'last-house' && 'Last house'}
                  {type === 'last-two' && 'Last 2 shows'}
                  {type === 'split' && 'Split week'}
                  {type === 'specific-days' && 'Specific days'}
                </button>
              ))}
            </div>
          </div>

          {(film.terms.type === 'specific-days' || film.terms.type === 'split') && (
            <div className="space-y-1">
              {film.terms.type === 'split' && (
                <div className="flex gap-1">
                  <button
                    onClick={() => updateFilmTerms(film.id, { ...film.terms, specificDays: [0, 1, 2, 3] })}
                    className="text-xs px-2 py-0.5 rounded bg-gray-700 text-gray-400 hover:bg-gray-600 transition-colors"
                  >
                    Fri–Mon
                  </button>
                  <button
                    onClick={() => updateFilmTerms(film.id, { ...film.terms, specificDays: [4, 5, 6] })}
                    className="text-xs px-2 py-0.5 rounded bg-gray-700 text-gray-400 hover:bg-gray-600 transition-colors"
                  >
                    Tue–Thu
                  </button>
                </div>
              )}
              <div className="flex gap-1 flex-wrap">
                {DAYS.map((day, i) => (
                  <button
                    key={day}
                    onClick={() => toggleDay(i)}
                    className={`text-xs px-1.5 py-0.5 rounded transition-colors ${
                      film.terms.specificDays?.includes(i) ? 'text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                    }`}
                    style={film.terms.specificDays?.includes(i) ? { backgroundColor: film.color } : {}}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Attributes */}
          <div>
            <p className="text-gray-400 text-xs mb-1 font-medium">Attributes</p>
            <p className="text-gray-600 text-xs mb-1.5">Tag the types of screening this film has this week. Mark individual shows with the type in session properties.</p>
            <div className="grid grid-cols-2 gap-1">
              {(Object.keys(SCREENING_TYPES) as ScreeningType[]).map((type) => {
                const meta = SCREENING_TYPES[type];
                const active = attrs.includes(type);
                return (
                  <button
                    key={type}
                    onClick={() => toggleAttribute(type)}
                    className="text-xs py-1 px-2 rounded transition-colors text-left"
                    style={{
                      backgroundColor: active ? meta.color : '#374151',
                      color: active ? '#fff' : '#9CA3AF',
                    }}
                  >
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Special screening */}
          <div>
            <p className="text-gray-400 text-xs mb-1 font-medium">Special screening</p>
            <div className="grid grid-cols-2 gap-1">
              {(Object.keys(SCREENING_TYPES) as ScreeningType[]).map((type) => {
                const meta = SCREENING_TYPES[type];
                const active = ss?.type === type;
                return (
                  <button
                    key={type}
                    onClick={() => selectScreeningType(type)}
                    className="text-xs py-1 px-2 rounded transition-colors text-left"
                    style={{
                      backgroundColor: active ? meta.color : '#374151',
                      color: active ? '#fff' : '#9CA3AF',
                    }}
                  >
                    {meta.label}
                  </button>
                );
              })}
            </div>

            {ss && (
              <div className="mt-2 space-y-1.5">
                {/* Day picker */}
                <div>
                  <p className="text-gray-500 text-xs mb-1">Day</p>
                  <div className="flex gap-1 flex-wrap">
                    {DAYS.map((day, i) => (
                      <button
                        key={day}
                        onClick={() => setScreeningDay(i)}
                        className="text-xs px-1.5 py-0.5 rounded transition-colors"
                        style={{
                          backgroundColor: ss.day === i ? SCREENING_TYPES[ss.type].color : '#374151',
                          color: ss.day === i ? '#fff' : '#9CA3AF',
                        }}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Screen picker */}
                <div>
                  <p className="text-gray-500 text-xs mb-1">Screen</p>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setScreeningScreen(undefined)}
                      className="text-xs px-1.5 py-0.5 rounded transition-colors"
                      style={{
                        backgroundColor: ss.screen === undefined ? SCREENING_TYPES[ss.type].color : '#374151',
                        color: ss.screen === undefined ? '#fff' : '#9CA3AF',
                      }}
                    >
                      Auto
                    </button>
                    {([1, 2, 3] as ScreenNumber[]).map((sc) => (
                      <button
                        key={sc}
                        onClick={() => setScreeningScreen(sc)}
                        className="text-xs px-1.5 py-0.5 rounded transition-colors"
                        style={{
                          backgroundColor: ss.screen === sc ? SCREENING_TYPES[ss.type].color : '#374151',
                          color: ss.screen === sc ? '#fff' : '#9CA3AF',
                        }}
                      >
                        Sc {sc}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time picker */}
                <div>
                  <p className="text-gray-500 text-xs mb-1">
                    Start time{' '}
                    <span className="text-gray-600">(leave blank to auto-place)</span>
                  </p>
                  <div className="flex items-center gap-1">
                    <input
                      type="time"
                      className="flex-1 bg-gray-700 text-white text-xs rounded px-2 py-1 focus:outline-none"
                      value={ss.time !== undefined ? minutesToTimeString(ss.time) : ''}
                      onChange={(e) => setScreeningTime(e.target.value)}
                    />
                    {ss.time !== undefined && (
                      <button
                        onClick={clearScreeningTime}
                        className="text-gray-500 hover:text-white p-1 transition-colors"
                        title="Clear time (auto-place)"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
