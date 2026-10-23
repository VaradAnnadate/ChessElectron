import { useCallback, useEffect, useRef, useState } from 'react';

export const TIME_CONTROLS = {
  none: { label: 'No clock', initial: 0, increment: 0 },
  bullet: { label: '1 + 0', initial: 60, increment: 0 },
  blitz: { label: '3 + 2', initial: 180, increment: 2 },
  rapid: { label: '10 + 0', initial: 600, increment: 0 },
  classical: { label: '30 + 0', initial: 1800, increment: 0 },
};

export function formatClock(ms) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (ms < 10_000 && ms > 0) {
    return `0:${(ms / 1000).toFixed(1).padStart(4, '0')}`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export default function useChessClock(timeControlKey, { turn, running, onFlag }) {
  const control = TIME_CONTROLS[timeControlKey] ?? TIME_CONTROLS.none;
  const enabled = control.initial > 0;
  const [remaining, setRemaining] = useState({ w: control.initial * 1000, b: control.initial * 1000 });
  const tickRef = useRef(null);
  const previousTurn = useRef(turn);
  const flagRef = useRef(onFlag);
  flagRef.current = onFlag;

  const reset = useCallback(() => {
    setRemaining({ w: control.initial * 1000, b: control.initial * 1000 });
    previousTurn.current = 'w';
  }, [control.initial]);

  useEffect(() => {
    if (!enabled) return;
    if (previousTurn.current !== turn) {
      const mover = previousTurn.current;
      previousTurn.current = turn;
      if (control.increment && running) {
        setRemaining((current) => ({ ...current, [mover]: current[mover] + control.increment * 1000 }));
      }
    }
  }, [turn, enabled, running, control.increment]);

  useEffect(() => {
    if (!enabled || !running) return undefined;
    let last = performance.now();
    tickRef.current = setInterval(() => {
      const now = performance.now();
      const elapsed = now - last;
      last = now;
      setRemaining((current) => {
        const next = Math.max(0, current[turn] - elapsed);
        if (next === 0 && current[turn] > 0) setTimeout(() => flagRef.current?.(turn), 0);
        return { ...current, [turn]: next };
      });
    }, 100);
    return () => clearInterval(tickRef.current);
  }, [enabled, running, turn]);

  return { enabled, remaining, reset, setRemaining };
}
