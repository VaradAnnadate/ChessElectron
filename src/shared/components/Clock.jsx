import { formatClock } from '../hooks/useChessClock.js';

export default function Clock({ ms, active }) {
  const low = ms < 20_000;
  return (
    <div className={`clock ${active ? 'clock--active' : ''} ${low ? 'clock--low' : ''}`}>
      {formatClock(ms)}
    </div>
  );
}
