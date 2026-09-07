import React from 'react';

export type MemoryCardData = {
  id: string;
  pairId: string;
  symbol: string;
  position: number;
};

interface MemoryCardProps {
  card: MemoryCardData;
  revealed: boolean;
  matched: boolean;
  disabled: boolean;
  onSelect: (card: MemoryCardData) => void;
}

export const MemoryCard: React.FC<MemoryCardProps> = ({ card, revealed, matched, disabled, onSelect }) => (
  <button
    type="button"
    aria-label={revealed ? `Memory card ${card.position + 1}: ${card.symbol}` : `Memory card ${card.position + 1}`}
    aria-pressed={revealed}
    disabled={disabled}
    onClick={() => onSelect(card)}
    className={`aspect-square min-h-14 rounded-xl border text-xl sm:text-2xl font-bold transition-transform duration-200 select-none touch-manipulation active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 ${
      matched
        ? 'border-emerald-300 bg-emerald-50 text-emerald-700 shadow-inner'
        : revealed
        ? 'border-cyan-300 bg-white text-slate-800 shadow-sm rotate-y-0'
        : 'border-slate-200 bg-slate-100 text-slate-400 hover:bg-slate-200'
    } disabled:cursor-default`}
  >
    {revealed ? card.symbol : '?'}
  </button>
);
