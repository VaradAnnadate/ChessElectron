import { useEffect, useRef } from 'react';
import { movePairs } from '../chess/game.js';

export default function MoveList({ history, viewingPly = history.length, onSelectPly }) {
  const listRef = useRef(null);
  const pairs = movePairs(history);
  const currentPly = viewingPly ?? history.length;

  useEffect(() => {
    const list = listRef.current;
    if (list && currentPly === history.length) {
      list.scrollTop = list.scrollHeight;
    }
  }, [history.length, currentPly]);

  return (
    <div className="move-list-wrapper">
      <div className="move-list" ref={listRef}>
        {pairs.length === 0 && <p className="muted move-list__empty">No moves yet</p>}
        {pairs.map((pair, index) => {
          const whitePly = index * 2 + 1;
          const blackPly = index * 2 + 2;
          const isWhiteActive = currentPly === whitePly;
          const isBlackActive = currentPly === blackPly;

          return (
            <div className="move-row" key={pair.number}>
              <span className="move-row__number">{pair.number}.</span>
              <button
                type="button"
                className={`move-btn ${isWhiteActive ? 'move-btn--active' : ''}`}
                onClick={() => onSelectPly?.(whitePly)}
              >
                {pair.white}
              </button>
              {pair.black ? (
                <button
                  type="button"
                  className={`move-btn ${isBlackActive ? 'move-btn--active' : ''}`}
                  onClick={() => onSelectPly?.(blackPly)}
                >
                  {pair.black}
                </button>
              ) : (
                <span className="move-btn move-btn--empty" />
              )}
            </div>
          );
        })}
      </div>

      {history.length > 0 && (
        <div className="move-nav">
          <button
            type="button"
            className="btn btn--ghost move-nav__btn"
            onClick={() => onSelectPly?.(0)}
            disabled={currentPly === 0}
            title="Start position"
          >
            ⏮
          </button>
          <button
            type="button"
            className="btn btn--ghost move-nav__btn"
            onClick={() => onSelectPly?.(Math.max(0, currentPly - 1))}
            disabled={currentPly === 0}
            title="Previous move (Left arrow)"
          >
            ◀
          </button>
          <span className="move-nav__status">
            {currentPly === history.length ? 'Live' : `${currentPly} / ${history.length}`}
          </span>
          <button
            type="button"
            className="btn btn--ghost move-nav__btn"
            onClick={() => onSelectPly?.(Math.min(history.length, currentPly + 1))}
            disabled={currentPly === history.length}
            title="Next move (Right arrow)"
          >
            ▶
          </button>
          <button
            type="button"
            className="btn btn--ghost move-nav__btn"
            onClick={() => onSelectPly?.(history.length)}
            disabled={currentPly === history.length}
            title="Current live position"
          >
            ⏭
          </button>
        </div>
      )}
    </div>
  );
}
