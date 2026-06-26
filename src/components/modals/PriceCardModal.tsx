import { useState } from 'react';
import { X, Pencil, Trash2, Check } from 'lucide-react';
import { useStore } from '../../store';
import type { TicketType, PriceCard } from '../../types';

interface Props {
  onClose: () => void;
}

type Tab = 'types' | 'cards';

// ─── Ticket Types tab ────────────────────────────────────────────────────────

function TicketTypesTab() {
  const ticketTypes = useStore((s) => s.ticketTypes);
  const addTicketType = useStore((s) => s.addTicketType);
  const updateTicketType = useStore((s) => s.updateTicketType);
  const removeTicketType = useStore((s) => s.removeTicketType);

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [editing, setEditing] = useState<TicketType | null>(null);

  const reset = () => { setName(''); setPrice(''); setEditing(null); };

  const startEdit = (t: TicketType) => {
    setEditing(t);
    setName(t.name);
    setPrice(t.price.toFixed(2));
  };

  const save = () => {
    const n = name.trim();
    const p = parseFloat(price);
    if (!n || isNaN(p) || p < 0) return;
    if (editing) {
      updateTicketType(editing.id, n, p);
    } else {
      addTicketType(n, p);
    }
    reset();
  };

  return (
    <div className="space-y-4">
      {/* Form */}
      <div className="bg-gray-800 rounded-lg p-3 space-y-2">
        <p className="text-gray-400 text-xs font-medium uppercase tracking-wide">
          {editing ? 'Edit ticket type' : 'New ticket type'}
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Name (e.g. Adult)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && save()}
            className="flex-1 bg-gray-700 text-white text-sm rounded px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-500"
          />
          <div className="flex items-center gap-1 bg-gray-700 rounded px-2">
            <span className="text-gray-400 text-sm">£</span>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && save()}
              className="w-16 bg-transparent text-white text-sm py-1.5 focus:outline-none"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={save}
            disabled={!name.trim() || price === ''}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs rounded transition-colors"
          >
            <Check size={12} />
            {editing ? 'Update' : 'Add'}
          </button>
          {editing && (
            <button onClick={reset} className="px-3 py-1.5 text-gray-400 hover:text-white text-xs transition-colors">
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* List */}
      {ticketTypes.length === 0 ? (
        <p className="text-gray-600 text-xs text-center py-4">No ticket types yet. Add one above.</p>
      ) : (
        <div className="space-y-1">
          {ticketTypes.map((t) => (
            <div key={t.id} className="flex items-center gap-2 bg-gray-800 rounded px-3 py-2">
              <span className="flex-1 text-white text-sm">{t.name}</span>
              <span className="text-gray-300 text-sm font-mono">£{t.price.toFixed(2)}</span>
              <button
                onClick={() => startEdit(t)}
                className="text-gray-500 hover:text-blue-400 transition-colors p-0.5"
                title="Edit"
              >
                <Pencil size={12} />
              </button>
              <button
                onClick={() => removeTicketType(t.id)}
                className="text-gray-500 hover:text-red-400 transition-colors p-0.5"
                title="Delete"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Price Cards tab ─────────────────────────────────────────────────────────

function PriceCardsTab() {
  const ticketTypes = useStore((s) => s.ticketTypes);
  const priceCards = useStore((s) => s.priceCards);
  const addPriceCard = useStore((s) => s.addPriceCard);
  const updatePriceCard = useStore((s) => s.updatePriceCard);
  const removePriceCard = useStore((s) => s.removePriceCard);

  const [name, setName] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [editing, setEditing] = useState<PriceCard | null>(null);

  const reset = () => { setName(''); setSelected([]); setEditing(null); };

  const startEdit = (pc: PriceCard) => {
    setEditing(pc);
    setName(pc.name);
    setSelected([...pc.ticketTypeIds]);
  };

  const toggleType = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const save = () => {
    const n = name.trim();
    if (!n || selected.length === 0) return;
    if (editing) {
      updatePriceCard(editing.id, n, selected);
    } else {
      addPriceCard(n, selected);
    }
    reset();
  };

  return (
    <div className="space-y-4">
      {ticketTypes.length === 0 && (
        <div className="bg-yellow-900/30 border border-yellow-700/50 rounded-lg px-3 py-2">
          <p className="text-yellow-400 text-xs">Create ticket types first before building a price card.</p>
        </div>
      )}

      {/* Form */}
      <div className="bg-gray-800 rounded-lg p-3 space-y-3">
        <p className="text-gray-400 text-xs font-medium uppercase tracking-wide">
          {editing ? 'Edit price card' : 'New price card'}
        </p>
        <input
          type="text"
          placeholder="Card name (e.g. U/PG/12A)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-gray-700 text-white text-sm rounded px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-500"
        />

        {ticketTypes.length > 0 && (
          <div>
            <p className="text-gray-500 text-xs mb-1.5">Ticket types on this card:</p>
            <div className="grid grid-cols-2 gap-1">
              {ticketTypes.map((t) => {
                const on = selected.includes(t.id);
                return (
                  <button
                    key={t.id}
                    onClick={() => toggleType(t.id)}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs text-left transition-colors ${
                      on ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <span className={`w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center ${
                      on ? 'bg-white border-white' : 'border-gray-500'
                    }`}>
                      {on && <Check size={9} className="text-blue-600" />}
                    </span>
                    <span className="flex-1 truncate">{t.name}</span>
                    <span className="text-xs opacity-70 font-mono">£{t.price.toFixed(2)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={save}
            disabled={!name.trim() || selected.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs rounded transition-colors"
          >
            <Check size={12} />
            {editing ? 'Update' : 'Save card'}
          </button>
          {editing && (
            <button onClick={reset} className="px-3 py-1.5 text-gray-400 hover:text-white text-xs transition-colors">
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* List */}
      {priceCards.length === 0 ? (
        <p className="text-gray-600 text-xs text-center py-4">No price cards yet.</p>
      ) : (
        <div className="space-y-2">
          {priceCards.map((pc) => {
            const types = pc.ticketTypeIds
              .map((tid) => ticketTypes.find((t) => t.id === tid))
              .filter(Boolean) as TicketType[];
            return (
              <div key={pc.id} className="bg-gray-800 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="flex-1 text-white text-sm font-medium">{pc.name}</span>
                  <button onClick={() => startEdit(pc)} className="text-gray-500 hover:text-blue-400 transition-colors p-0.5" title="Edit">
                    <Pencil size={12} />
                  </button>
                  <button onClick={() => removePriceCard(pc.id)} className="text-gray-500 hover:text-red-400 transition-colors p-0.5" title="Delete">
                    <Trash2 size={12} />
                  </button>
                </div>
                <p className="text-gray-500 text-xs mt-0.5">
                  {types.map((t) => t.name).join(' · ')}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Modal shell ─────────────────────────────────────────────────────────────

export function PriceCardModal({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('types');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-gray-900 rounded-xl shadow-2xl w-full max-w-md border border-gray-700 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-0 flex-shrink-0">
          <h2 className="text-white font-bold text-base">Price Cards</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-700 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700 mt-3 px-4 flex-shrink-0">
          {(['types', 'cards'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-2 pr-4 text-xs font-medium transition-colors border-b-2 -mb-px ${
                tab === t ? 'text-white border-blue-500' : 'text-gray-400 border-transparent hover:text-white'
              }`}
            >
              {t === 'types' ? 'Ticket Types' : 'Price Cards'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-4">
          {tab === 'types' ? <TicketTypesTab /> : <PriceCardsTab />}
        </div>
      </div>
    </div>
  );
}
