import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Clock3, MoveRight, Target } from 'lucide-react';
import { CognitionMemoryResult, MemoryAttempt, MemoryInteractionEvent } from '../../types';
import { calculateCognitionMemoryResult } from '../../utils/cognitionMetrics';
import { MemoryCard, MemoryCardData } from './MemoryCard';

const PAIRS = ['◆', '●', '▲', '■', '★', '✦', '♥', '☀'];

function createDeck(): MemoryCardData[] {
  const deck = PAIRS.flatMap((symbol, pairIndex) => [0, 1].map(copyIndex => ({
    id: `card-${pairIndex}-${copyIndex}`,
    pairId: `pair-${pairIndex}`,
    symbol,
    position: 0
  })));
  for (let index = deck.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [deck[index], deck[swapIndex]] = [deck[swapIndex], deck[index]];
  }
  return deck.map((card, position) => ({ ...card, position }));
}

interface MemoryGameProps {
  sessionKey: number;
  locale: 'zh' | 'en';
  onComplete: (result: CognitionMemoryResult) => void;
}

export const MemoryGame: React.FC<MemoryGameProps> = ({ sessionKey, locale, onComplete }) => {
  const [deck, setDeck] = useState<MemoryCardData[]>(createDeck);
  const [faceUpIds, setFaceUpIds] = useState<Set<string>>(() => new Set());
  const [matchedIds, setMatchedIds] = useState<Set<string>>(() => new Set());
  const [attemptCount, setAttemptCount] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const firstSelectionRef = useRef<{ card: MemoryCardData; timestamp: number; attemptIndex: number } | null>(null);
  const attemptsRef = useRef<MemoryAttempt[]>([]);
  const interactionsRef = useRef<MemoryInteractionEvent[]>([]);
  const matchedIdsRef = useRef(new Set<string>());
  const lockedRef = useRef(false);
  const completedRef = useRef(false);
  const startedAtRef = useRef(Date.now());
  const timeoutIdsRef = useRef<number[]>([]);

  const addTimeout = (callback: () => void, delay: number) => {
    const timeoutId = window.setTimeout(callback, delay);
    timeoutIdsRef.current.push(timeoutId);
  };

  useEffect(() => {
    const nextDeck = createDeck();
    setDeck(nextDeck);
    setFaceUpIds(new Set());
    setMatchedIds(new Set());
    matchedIdsRef.current = new Set();
    attemptsRef.current = [];
    interactionsRef.current = [];
    firstSelectionRef.current = null;
    lockedRef.current = false;
    completedRef.current = false;
    startedAtRef.current = Date.now();
    setAttemptCount(0);
    setElapsedSeconds(0);
    return () => timeoutIdsRef.current.forEach(window.clearTimeout);
  }, [sessionKey]);

  useEffect(() => {
    const intervalId = window.setInterval(() => setElapsedSeconds(Math.floor((Date.now() - startedAtRef.current) / 1000)), 1000);
    return () => window.clearInterval(intervalId);
  }, [sessionKey]);

  const finish = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    const completedAt = Date.now();
    onComplete(calculateCognitionMemoryResult(startedAtRef.current, completedAt, PAIRS.length, attemptsRef.current, interactionsRef.current));
  }, [onComplete]);

  const selectCard = (card: MemoryCardData) => {
    if (completedRef.current || lockedRef.current || matchedIdsRef.current.has(card.id) || faceUpIds.has(card.id)) return;
    const timestamp = Date.now();
    const firstSelection = firstSelectionRef.current;
    if (!firstSelection) {
      const attemptIndex = attemptsRef.current.length + 1;
      firstSelectionRef.current = { card, timestamp, attemptIndex };
      interactionsRef.current.push({ timestamp, cardId: card.id, pairId: card.pairId, attemptIndex, position: card.position, isFirstSelection: true, matched: null });
      setFaceUpIds(new Set([card.id]));
      return;
    }
    if (firstSelection.card.id === card.id) return;

    lockedRef.current = true;
    const matched = firstSelection.card.pairId === card.pairId;
    const attempt: MemoryAttempt = {
      attemptIndex: firstSelection.attemptIndex,
      firstCardId: firstSelection.card.id,
      secondCardId: card.id,
      firstPairId: firstSelection.card.pairId,
      secondPairId: card.pairId,
      startedAt: firstSelection.timestamp,
      completedAt: timestamp,
      responseTimeMs: Math.max(0, timestamp - firstSelection.timestamp),
      matched
    };
    attemptsRef.current.push(attempt);
    const firstEvent = interactionsRef.current.findLast(event => event.attemptIndex === attempt.attemptIndex && event.isFirstSelection);
    if (firstEvent) firstEvent.matched = matched;
    interactionsRef.current.push({ timestamp, cardId: card.id, pairId: card.pairId, attemptIndex: attempt.attemptIndex, position: card.position, isFirstSelection: false, matched });
    setAttemptCount(attemptsRef.current.length);
    setFaceUpIds(new Set([firstSelection.card.id, card.id]));

    if (matched) {
      addTimeout(() => {
        const nextMatched = new Set([...matchedIdsRef.current, firstSelection.card.id, card.id]);
        matchedIdsRef.current = nextMatched;
        setMatchedIds(nextMatched);
        setFaceUpIds(new Set());
        firstSelectionRef.current = null;
        lockedRef.current = false;
        if (nextMatched.size === deck.length) finish();
      }, 320);
    } else {
      addTimeout(() => {
        setFaceUpIds(new Set());
        firstSelectionRef.current = null;
        lockedRef.current = false;
      }, 650);
    }
  };

  const copy = locale === 'zh'
    ? { title: '空间记忆配对', helper: '翻开两个方块，找出相同图案。每次配对均记录实际点击时间。', attempts: '尝试', pairs: '已配对', time: '用时' }
    : { title: 'Spatial Memory Matching', helper: 'Reveal two cards and match identical symbols. Every selection is recorded from this test.', attempts: 'Attempts', pairs: 'Matched', time: 'Time' };

  return (
    <section className="max-w-xl mx-auto space-y-5 select-none">
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-start justify-between gap-4">
          <div><h2 className="text-lg font-bold text-slate-900">{copy.title}</h2><p className="text-xs text-slate-500 mt-1 leading-relaxed">{copy.helper}</p></div>
          <span className="shrink-0 text-[10px] font-mono bg-violet-50 text-violet-700 border border-violet-200 px-2 py-1 rounded-full">4 × 4</span>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-5 text-center text-xs">
          <Stat icon={<Clock3 className="w-3.5 h-3.5" />} label={copy.time} value={`${elapsedSeconds}s`} />
          <Stat icon={<MoveRight className="w-3.5 h-3.5" />} label={copy.attempts} value={String(attemptCount)} />
          <Stat icon={<Target className="w-3.5 h-3.5" />} label={copy.pairs} value={`${matchedIds.size / 2}/8`} />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2 sm:gap-3 p-3 sm:p-4 rounded-2xl border border-slate-200 bg-slate-50 touch-manipulation">
        {deck.map(card => <MemoryCard key={card.id} card={card} revealed={faceUpIds.has(card.id) || matchedIds.has(card.id)} matched={matchedIds.has(card.id)} disabled={lockedRef.current || faceUpIds.has(card.id) || matchedIds.has(card.id)} onSelect={selectCard} />)}
      </div>
    </section>
  );
};

const Stat: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => <div className="rounded-xl border border-slate-200 bg-slate-50 p-2"><div className="flex items-center justify-center gap-1 text-[10px] text-slate-400">{icon}{label}</div><div className="font-mono font-bold text-slate-800 mt-0.5">{value}</div></div>;
