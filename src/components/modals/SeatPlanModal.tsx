import { useState } from 'react';
import { X, Plus, Minus, Trash2, Monitor } from 'lucide-react';
import { useStore } from '../../store';
import type { ScreenNumber, SeatPlan, SeatCellType, SeatPlanRow } from '../../types';

const SCREEN_NUMS: ScreenNumber[] = [1, 2, 3];

const CELL_CYCLE: SeatCellType[] = ['gap', 'standard', 'dda', 'companion', 'unavailable'];

function nextType(t: SeatCellType): SeatCellType {
  return CELL_CYCLE[(CELL_CYCLE.indexOf(t) + 1) % CELL_CYCLE.length];
}

function defaultPlan(screen: ScreenNumber): SeatPlan {
  return { screen, cols: 12, rows: [] };
}

function blankRow(cols: number, label: string): SeatPlanRow {
  return { label, cells: Array<SeatCellType>(cols).fill('standard') };
}

function nextRowLabel(rows: SeatPlanRow[]): string {
  if (rows.length === 0) return 'A';
  const last = rows[rows.length - 1].label;
  const code = last.charCodeAt(last.length - 1);
  return String.fromCharCode(code + 1);
}

function countSellable(plan: SeatPlan): number {
  return plan.rows.reduce(
    (n, row) => n + row.cells.filter((c) => c === 'standard' || c === 'dda' || c === 'companion').length,
    0
  );
}

const CELL_CLASS: Record<SeatCellType, string> = {
  gap:         'border border-dashed border-gray-700 bg-transparent hover:border-gray-500',
  standard:    'bg-blue-600 hover:bg-blue-500 border border-blue-500',
  dda:         'bg-teal-600 hover:bg-teal-500 border border-teal-500',
  companion:   'bg-amber-600 hover:bg-amber-500 border border-amber-500',
  unavailable: 'bg-gray-700 hover:bg-gray-600 border border-gray-600',
};

const CELL_LABEL: Record<SeatCellType, string> = {
  gap: '', standard: '', dda: '♿', companion: 'C', unavailable: '✕',
};

// ─── Editor ──────────────────────────────────────────────────────────────────

function PlanEditor({ plan, onChange }: { plan: SeatPlan; onChange: (p: SeatPlan) => void }) {
  const patch = (p: Partial<SeatPlan>) => onChange({ ...plan, ...p });

  const cycleCell = (ri: number, ci: number) =>
    patch({
      rows: plan.rows.map((r, i) =>
        i !== ri ? r : { ...r, cells: r.cells.map((c, j) => (j !== ci ? c : nextType(c))) }
      ),
    });

  const addRow = () =>
    patch({ rows: [...plan.rows, blankRow(plan.cols, nextRowLabel(plan.rows))] });

  const removeRow = (ri: number) =>
    patch({ rows: plan.rows.filter((_, i) => i !== ri) });

  const updateLabel = (ri: number, label: string) =>
    patch({ rows: plan.rows.map((r, i) => (i !== ri ? r : { ...r, label })) });

  const addCol = () =>
    patch({
      cols: plan.cols + 1,
      rows: plan.rows.map((r) => ({ ...r, cells: [...r.cells, 'gap' as SeatCellType] })),
    });

  const removeCol = () => {
    if (plan.cols <= 1) return;
    patch({
      cols: plan.cols - 1,
      rows: plan.rows.map((r) => ({ ...r, cells: r.cells.slice(0, -1) })),
    });
  };

  if (plan.rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-10">
        <Monitor size={32} className="text-gray-600" />
        <p className="text-gray-500 text-sm text-center">
          No rows yet — add a row to start building the seat plan.
        </p>
        <button
          onClick={addRow}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded transition-colors"
        >
          <Plus size={12} /> Add Row
        </button>
      </div>
    );
  }

  const sellable = countSellable(plan);

  return (
    <div className="space-y-3">
      {/* Screen indicator */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-px bg-gray-700" />
        <span className="text-gray-500 text-xs font-medium uppercase tracking-widest px-2">
          ▲ Screen
        </span>
        <div className="flex-1 h-px bg-gray-700" />
      </div>

      {/* Grid — horizontally scrollable for wide plans */}
      <div className="overflow-x-auto pb-1">
        <div className="inline-block">
          {plan.rows.map((row, ri) => (
            <div key={ri} className="flex items-center gap-1 mb-1">
              <input
                type="text"
                value={row.label}
                onChange={(e) => updateLabel(ri, e.target.value)}
                maxLength={2}
                className="w-7 shrink-0 bg-transparent text-gray-400 text-xs text-center focus:outline-none focus:text-white"
              />
              <div className="flex gap-0.5">
                {row.cells.map((cell, ci) => (
                  <button
                    key={ci}
                    onClick={() => cycleCell(ri, ci)}
                    title={cell}
                    className={`w-6 h-6 rounded-sm flex items-center justify-center text-white transition-colors cursor-pointer ${CELL_CLASS[cell]}`}
                    style={{ fontSize: 8 }}
                  >
                    {CELL_LABEL[cell]}
                  </button>
                ))}
              </div>
              <button
                onClick={() => removeRow(ri)}
                className="text-gray-600 hover:text-red-400 transition-colors ml-1 shrink-0"
                title="Remove row"
              >
                <Trash2 size={11} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={addRow}
          className="flex items-center gap-1 px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded transition-colors"
        >
          <Plus size={10} /> Add row
        </button>
        <div className="flex items-center gap-0.5 border-l border-gray-700 pl-2">
          <button
            onClick={removeCol}
            disabled={plan.cols <= 1}
            className="p-1 text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
            title="Remove last column"
          >
            <Minus size={12} />
          </button>
          <span className="text-gray-500 text-xs w-14 text-center">{plan.cols} cols</span>
          <button
            onClick={addCol}
            className="p-1 text-gray-400 hover:text-white transition-colors"
            title="Add column"
          >
            <Plus size={12} />
          </button>
        </div>
        <span className="text-gray-500 text-xs ml-auto">{sellable} sellable seats</span>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 pt-2 border-t border-gray-800 flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-sm bg-blue-600 border border-blue-500" />
          <span className="text-gray-500 text-xs">Standard</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-sm bg-teal-600 border border-teal-500 flex items-center justify-center text-white" style={{ fontSize: 8 }}>♿</div>
          <span className="text-gray-500 text-xs">DDA</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-sm bg-amber-600 border border-amber-500 flex items-center justify-center text-white font-bold" style={{ fontSize: 8 }}>C</div>
          <span className="text-gray-500 text-xs">Companion</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-sm bg-gray-700 border border-gray-600 flex items-center justify-center text-white" style={{ fontSize: 8 }}>✕</div>
          <span className="text-gray-500 text-xs">Unavailable</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-sm border border-dashed border-gray-600" />
          <span className="text-gray-500 text-xs">Gap / aisle</span>
        </div>
        <span className="text-gray-600 text-xs ml-auto">Click a cell to cycle type</span>
      </div>
    </div>
  );
}

// ─── Modal shell ─────────────────────────────────────────────────────────────

interface Props {
  onClose: () => void;
}

export function SeatPlanModal({ onClose }: Props) {
  const storedPlans = useStore((s) => s.seatPlans);
  const setSeatPlan = useStore((s) => s.setSeatPlan);

  const [plans, setPlans] = useState<Record<ScreenNumber, SeatPlan>>({
    1: storedPlans[1] ?? defaultPlan(1),
    2: storedPlans[2] ?? defaultPlan(2),
    3: storedPlans[3] ?? defaultPlan(3),
  });
  const [activeScreen, setActiveScreen] = useState<ScreenNumber>(1);

  const save = () => {
    SCREEN_NUMS.forEach((s) => setSeatPlan(s, plans[s]));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl border border-gray-700 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-0 flex-shrink-0">
          <h2 className="text-white font-bold text-base">Seat Plans</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Screen tabs */}
        <div className="flex border-b border-gray-700 mt-3 px-4 flex-shrink-0">
          {SCREEN_NUMS.map((s) => {
            const hasRows = plans[s].rows.length > 0;
            return (
              <button
                key={s}
                onClick={() => setActiveScreen(s)}
                className={`pb-2 pr-6 text-xs font-medium transition-colors border-b-2 -mb-px ${
                  activeScreen === s
                    ? 'text-white border-blue-500'
                    : 'text-gray-400 border-transparent hover:text-white'
                }`}
              >
                Screen {s}
                {hasRows && (
                  <span className="ml-1.5 text-xs text-gray-500">
                    ({countSellable(plans[s])})
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Editor */}
        <div className="overflow-y-auto flex-1 p-4">
          <PlanEditor
            plan={plans[activeScreen]}
            onChange={(p) => setPlans((prev) => ({ ...prev, [activeScreen]: p }))}
          />
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-700 flex items-center gap-2 flex-shrink-0">
          <button
            onClick={save}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded transition-colors font-medium"
          >
            Save all screens
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-gray-400 hover:text-white text-xs transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
