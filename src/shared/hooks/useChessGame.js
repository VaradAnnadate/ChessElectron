import { useCallback, useMemo, useState } from 'react';
import { cloneGame, createGame, gameStatus } from '../chess/game.js';

function lastMoveOf(game) {
  const history = game.history({ verbose: true });
  const move = history[history.length - 1];
  return move ? { from: move.from, to: move.to } : null;
}

export default function useChessGame(initialFen) {
  const [game, setGame] = useState(() => createGame(initialFen));

  const makeMove = useCallback(
    (move) => {
      const next = cloneGame(game);
      try {
        const result = next.move(move);
        setGame(next);
        return {
          ...result,
          inCheck: next.inCheck(),
          isGameOver: next.isGameOver(),
        };
      } catch {
        return null;
      }
    },
    [game],
  );

  const undo = useCallback(
    (count = 1) => {
      const next = cloneGame(game);
      for (let i = 0; i < count; i += 1) {
        if (!next.undo()) break;
      }
      setGame(next);
    },
    [game],
  );

  const reset = useCallback((fen) => setGame(createGame(fen)), []);

  const loadPgn = useCallback((pgn) => {
    const next = createGame();
    next.loadPgn(pgn);
    setGame(next);
    return next;
  }, []);

  const fen = game.fen();
  const status = useMemo(() => gameStatus(game), [fen]); // eslint-disable-line react-hooks/exhaustive-deps
  const lastMove = useMemo(() => lastMoveOf(game), [fen]); // eslint-disable-line react-hooks/exhaustive-deps

  return { game, fen, status, lastMove, makeMove, undo, reset, loadPgn };
}
