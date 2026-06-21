import { useState } from 'react';
import { Key, X, ExternalLink } from 'lucide-react';
import { useStore } from '../../store';

interface Props {
  onClose: () => void;
}

export function ApiKeyModal({ onClose }: Props) {
  const saved = useStore((s) => s.tmdbApiKey);
  const setKey = useStore((s) => s.setTmdbApiKey);
  const [value, setValue] = useState(saved);

  const handleSave = () => {
    setKey(value.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl p-5 w-96 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Key size={16} className="text-blue-400" />
            <h2 className="text-white font-semibold">TMDB API Key</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <p className="text-gray-400 text-sm mb-3">
          A free TMDB API key lets the app look up film runtimes and details automatically.
        </p>

        <a
          href="https://www.themoviedb.org/settings/api"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-blue-400 text-xs hover:text-blue-300 mb-3"
        >
          Get a free key at themoviedb.org <ExternalLink size={10} />
        </a>

        <input
          className="w-full bg-gray-700 text-white text-sm rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
          placeholder="Paste API key (v3 auth) here…"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />

        <div className="flex gap-2 mt-4">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded py-2 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded py-2 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
