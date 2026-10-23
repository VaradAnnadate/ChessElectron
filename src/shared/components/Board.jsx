import { useMemo, useState } from 'react';
import {
  PIECE_SYMBOLS,
  boardSquares,
  findKingSquare,
  isLightSquare,
  legalTargets,
} from '../chess/game.js';

export default function Board({
  game,
  orientation = 'w',
  interactive = true,
  movableColor = null,
  lastMove = null,
  onMove,
}) {
  const [selected, setSelected] = useState(null);
  const [dragFrom, setDragFrom] = useState(null);

  const squares = useMemo(() => boardSquares(orientation), [orientation]);
  const fen = game.fen();
  const targets = useMemo(
    () => (selected ? legalTargets(game, selected) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fen, selected],
  );
  const checkSquare = game.inCheck() ? findKingSquare(game, game.turn()) : null;

  const canPick = (square) => {
    if (!interactive) return false;
    const piece = game.get(square);
    if (!piece || piece.color !== game.turn()) return false;
    return movableColor === null || movableColor === piece.color;
  };

  const tryMove = (from, to) => {
    setSelected(null);
    if (from !== to && legalTargets(game, from).includes(to)) onMove?.(from, to);
  };

  const handleClick = (square) => {
    if (selected && targets.includes(square)) {
      tryMove(selected, square);
    } else if (canPick(square)) {
      setSelected(square === selected ? null : square);
    } else {
      setSelected(null);
    }
  };

  return (
    <div className={`board ${interactive ? '' : 'board--locked'}`}>
      {squares.map((square, index) => {
        const piece = game.get(square);
        const classes = [
          'square',
          isLightSquare(square) ? 'square--light' : 'square--dark',
          selected === square && 'square--selected',
          lastMove && (lastMove.from === square || lastMove.to === square) && 'square--last',
          checkSquare === square && 'square--check',
          targets.includes(square) && (piece ? 'square--capture' : 'square--target'),
        ]
          .filter(Boolean)
          .join(' ');

        const col = index % 8;
        const row = Math.floor(index / 8);

        return (
          <div
            key={square}
            className={classes}
            data-square={square}
            onClick={() => handleClick(square)}
            onDragOver={(event) => dragFrom && event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              if (dragFrom) tryMove(dragFrom, square);
              setDragFrom(null);
            }}
          >
            {col === 0 && <span className="coord coord--rank">{square[1]}</span>}
            {row === 7 && <span className="coord coord--file">{square[0]}</span>}
            {piece && (
              <span
                className={`piece piece--${piece.color}`}
                draggable={canPick(square)}
                onDragStart={(event) => {
                  event.dataTransfer.effectAllowed = 'move';
                  setDragFrom(square);
                  setSelected(square);
                }}
                onDragEnd={() => setDragFrom(null)}
              >
                {PIECE_SYMBOLS.b[piece.type]}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
