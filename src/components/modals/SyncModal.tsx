import { useState } from 'react';
import { X, Copy, Check, Cloud, RefreshCw, AlertTriangle } from 'lucide-react';
import { useStore } from '../../store';

interface Props {
  onClose: () => void;
  switchToCode: (code: string) => Promise<void>;
}

export function SyncModal({ onClose, switchToCode }: Props) {
  const syncCode = useStore((s) => s.syncCode);
  const syncStatus = useStore((s) => s.syncStatus);
  const [copied, setCopied] = useState(false);
  const [inputCode, setInputCode] = useState('');
  const [linking, setLinking] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(syncCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLink = async () => {
    const code = inputCode.trim();
    if (!code || code === syncCode) return;
    setLinking(true);
    await switchToCode(code);
    setLinking(false);
    setInputCode('');
  };

  const statusInfo = {
    idle:    { label: 'Waiting for first change…', color: 'text-gray-400' },
    syncing: { label: 'Syncing…',                  color: 'text-yellow-400' },
    synced:  { label: 'Saved to cloud',            color: 'text-green-400' },
    error:   { label: 'Sync error — check connection', color: 'text-red-400' },
  }[syncStatus];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      <div className="relative bg-gray-900 rounded-t-2xl sm:rounded-xl shadow-2xl w-full sm:max-w-sm border border-gray-700">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-700 transition-colors"
        >
          <X size={18} />
        </button>

        <div className="p-5 space-y-5">
          <div className="flex items-center gap-2">
            <Cloud size={18} className="text-blue-400" />
            <h2 className="text-white font-bold text-base">Cross-device sync</h2>
          </div>

          {/* Current code */}
          <div>
            <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1.5">
              Your sync code
            </p>
            <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2.5">
              <code className="flex-1 text-blue-300 text-sm font-mono break-all leading-snug">
                {syncCode || '—'}
              </code>
              <button
                onClick={copy}
                className="flex-shrink-0 text-gray-400 hover:text-white transition-colors p-1"
                title="Copy"
              >
                {copied
                  ? <Check size={15} className="text-green-400" />
                  : <Copy size={15} />}
              </button>
            </div>
            <div className={`flex items-center gap-1.5 mt-1.5 text-xs ${statusInfo.color}`}>
              {syncStatus === 'syncing' && <RefreshCw size={11} className="animate-spin" />}
              {statusInfo.label}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-800" />

          {/* Link another device */}
          <div>
            <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1.5">
              Link another device
            </p>
            <p className="text-gray-400 text-xs mb-3">
              Open this app on your other device, copy its sync code from here, then paste it below to share your schedule.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Paste sync code…"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLink()}
                className="flex-1 bg-gray-800 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-600 font-mono"
              />
              <button
                onClick={handleLink}
                disabled={!inputCode.trim() || inputCode.trim() === syncCode || linking}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors flex items-center gap-1.5"
              >
                {linking ? <RefreshCw size={14} className="animate-spin" /> : 'Link'}
              </button>
            </div>
            <div className="flex items-start gap-1.5 mt-2">
              <AlertTriangle size={12} className="text-yellow-500/80 flex-shrink-0 mt-0.5" />
              <p className="text-yellow-500/80 text-xs">
                This replaces your current schedule with the one stored under that code.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
