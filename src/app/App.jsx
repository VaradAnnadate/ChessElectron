import { useState } from 'react';
import Board from '../shared/components/Board.jsx';
import GameControls from '../shared/components/GameControls.jsx';
import MoveList from '../shared/components/MoveList.jsx';
import PlayerBar from '../shared/components/PlayerBar.jsx';
import PromotionDialog from '../shared/components/PromotionDialog.jsx';
import useChessGame from '../shared/hooks/useChessGame.js';
import useKeyboardShortcuts from '../shared/hooks/useKeyboardShortcuts.js';
import {
  capturedPieces,
  describeStatus,
  isPromotionMove,
  materialAdvantage,
} from '../shared/chess/game.js';

export default function App() {
  const { game, status: boardStatus, lastMove, makeMove, undo, reset } = useChessGame();
  const [pendingPromotion, setPendingPromotion] = useState(null);
  const [orientation, setOrientation] = useState('w');
  const [resigned, setResigned] = useState(null);

  const status = resigned
    ? { ...boardStatus, over: true, winner: resigned === 'w' ? 'b' : 'w', reason: 'resignation' }
    : boardStatus;
  const captured = capturedPieces(game);
  const advantage = materialAdvantage(game);
  const moveCount = game.history().length;

  const handleMove = (from, to) => {
    if (isPromotionMove(game, from, to)) {
      setPendingPromotion({ from, to });
      return;
    }
    makeMove({ from, to });
  };

  const completePromotion = (piece) => {
    makeMove({ ...pendingPromotion, promotion: piece });
    setPendingPromotion(null);
  };

  const newGame = () => {
    reset();
    setResigned(null);
    setPendingPromotion(null);
  };

  const flip = () => setOrientation((current) => (current === 'w' ? 'b' : 'w'));
  const undoMove = () => moveCount > 0 && !status.over && undo();
  const resign = () => !status.over && setResigned(game.turn());

  useKeyboardShortcuts({ n: newGame, f: flip, 'mod+z': undoMove });

  const top = orientation === 'w' ? 'b' : 'w';
  const bottom = orientation;
  const bar = (color) => (
    <PlayerBar
      name={color === 'w' ? 'White' : 'Black'}
      color={color}
      active={!status.over && status.turn === color}
      captured={captured[color]}
      advantage={color === 'w' ? advantage : -advantage}
    />
  );

  return (
    <main className="app">
      <div className="game-screen">
        <section className="board-column">
          {bar(top)}
          <Board
            game={game}
            orientation={orientation}
            lastMove={lastMove}
            interactive={!status.over}
            onMove={handleMove}
          />
          {bar(bottom)}
        </section>
        <aside className="side-panel">
          <div className={`status-card ${status.over ? 'status-card--over' : ''}`}>
            {describeStatus(status)}
          </div>
          <MoveList history={game.history()} />
          <GameControls
            onNewGame={newGame}
            onUndo={undoMove}
            onFlip={flip}
            onResign={resign}
            canUndo={moveCount > 0 && !status.over}
            canResign={!status.over}
          />
        </aside>
      </div>
      {pendingPromotion && (
        <PromotionDialog
          color={game.turn()}
          onSelect={completePromotion}
          onCancel={() => setPendingPromotion(null)}
        />
      )}
    </main>
  );
}
