import { useEffect, useRef } from 'react';
import { movePairs } from '../chess/game.js';

export default function MoveList({ history }) {
  const listRef = useRef(null);
  const pairs = movePairs(history);

  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [history.length]);

  return (
    <div className="move-list" ref={listRef}>
      {pairs.length === 0 && <p className="muted move-list__empty">No moves yet</p>}
      {pairs.map((pair, index) => {
        const isLastPair = index === pairs.length - 1;
        const lastIsWhite = history.length % 2 === 1;
        return (
          <div className="move-row" key={pair.number}>
            <span className="move-row__number">{pair.number}.</span>
            <span className={`move ${isLastPair && lastIsWhite ? 'move--current' : ''}`}>
              {pair.white}
            </span>
            <span className={`move ${isLastPair && !lastIsWhite ? 'move--current' : ''}`}>
              {pair.black ?? ''}
            </span>
          </div>
        );
      })}
    </div>
  );
}
