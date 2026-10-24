import { useEffect, useRef, useState } from 'react';
import Board from '../../shared/components/Board.jsx';
import Clock from '../../shared/components/Clock.jsx';
import GameControls from '../../shared/components/GameControls.jsx';
import MoveList from '../../shared/components/MoveList.jsx';
import PlayerBar from '../../shared/components/PlayerBar.jsx';
import PromotionDialog from '../../shared/components/PromotionDialog.jsx';
import useChessClock from '../../shared/hooks/useChessClock.js';
import useChessGame from '../../shared/hooks/useChessGame.js';
import useKeyboardShortcuts from '../../shared/hooks/useKeyboardShortcuts.js';
import { DIFFICULTIES } from '../../shared/chess/ai.js';
import { requestBestMove } from '../../shared/chess/engineClient.js';
import {
  isSoundEnabled,
  playCaptureSound,
  playCheckSound,
  playGameOverSound,
  playMoveSound,
  playPromotionSound,
  toggleSound,
} from '../../shared/sound/chessAudio.js';
import {
  capturedPieces,
  describeStatus,
  isPromotionMove,
  materialAdvantage,
} from '../../shared/chess/game.js';

const MODE_LABELS = { local: 'Local game', computer: 'vs Computer', online: 'Online' };

export default function GameScreen({ config, onExit }) {
  const { game, fen, status: boardStatus, lastMove, makeMove, undo, reset } = useChessGame();
  const isComputer = config.mode === 'computer';
  const playerColor = isComputer ? config.playerColor ?? 'w' : null;

  const [pendingPromotion, setPendingPromotion] = useState(null);
  const [orientation, setOrientation] = useState(playerColor ?? 'w');
  const [ended, setEnded] = useState(null);
  const [thinking, setThinking] = useState(false);
  const [soundOn, setSoundOn] = useState(isSoundEnabled);
  const searchToken = useRef(0);

  const status = ended ? { ...boardStatus, over: true, ...ended } : boardStatus;
  const captured = capturedPieces(game);
  const advantage = materialAdvantage(game);
  const moveCount = game.history().length;
  const computerToMove = isComputer && !status.over && game.turn() !== playerColor;

  const handleGameOverSound = (winner) => {
    playGameOverSound(isComputer ? winner === playerColor : true);
  };

  const clock = useChessClock(config.timeControl, {
    turn: game.turn(),
    running: !status.over && moveCount > 0,
    onFlag: (color) => {
      const winner = color === 'w' ? 'b' : 'w';
      setEnded({ winner, reason: 'timeout' });
      handleGameOverSound(winner);
    },
  });

  const applyMove = (move) => {
    const res = makeMove(move);
    if (res) {
      if (res.isGameOver) {
        handleGameOverSound(res.color);
      } else if (res.inCheck) {
        playCheckSound();
      } else if (res.promotion) {
        playPromotionSound();
      } else if (res.captured) {
        playCaptureSound();
      } else {
        playMoveSound();
      }
    }
    return res;
  };

  useEffect(() => {
    if (!computerToMove) return undefined;
    const token = (searchToken.current += 1);
    setThinking(true);
    const timer = setTimeout(async () => {
      const move = await requestBestMove(fen, config.difficulty);
      if (token !== searchToken.current) return;
      setThinking(false);
      if (move) applyMove(move);
    }, 250);
    return () => {
      clearTimeout(timer);
      searchToken.current += 1;
      setThinking(false);
    };
  }, [computerToMove, fen, config.difficulty]);

  const handleMove = (from, to) => {
    if (isPromotionMove(game, from, to)) {
      setPendingPromotion({ from, to });
      return;
    }
    applyMove({ from, to });
  };

  const completePromotion = (piece) => {
    applyMove({ ...pendingPromotion, promotion: piece });
    setPendingPromotion(null);
  };

  const newGame = () => {
    reset();
    clock.reset();
    setEnded(null);
    setPendingPromotion(null);
  };

  const undoCount = isComputer ? (game.turn() === playerColor ? 2 : 0) : 1;
  const canUndo = !status.over && undoCount > 0 && moveCount >= undoCount;
  const undoMove = () => canUndo && undo(undoCount);
  const flip = () => setOrientation((current) => (current === 'w' ? 'b' : 'w'));
  const resign = () => {
    if (status.over) return;
    const loser = isComputer ? playerColor : game.turn();
    const winner = loser === 'w' ? 'b' : 'w';
    setEnded({ winner, reason: 'resignation' });
    handleGameOverSound(winner);
  };

  const toggleAudio = () => setSoundOn(toggleSound());

  useKeyboardShortcuts({ n: newGame, f: flip, 'mod+z': undoMove, m: toggleAudio });

  const nameOf = (color) => {
    if (!isComputer) return color === 'w' ? 'White' : 'Black';
    if (color === playerColor) return 'You';
    return `Computer (${DIFFICULTIES[config.difficulty]?.label ?? 'Medium'})`;
  };

  const bar = (color) => (
    <PlayerBar
      name={nameOf(color)}
      color={color}
      active={!status.over && status.turn === color}
      captured={captured[color]}
      advantage={color === 'w' ? advantage : -advantage}
    >
      {clock.enabled && (
        <Clock ms={clock.remaining[color]} active={!status.over && moveCount > 0 && status.turn === color} />
      )}
    </PlayerBar>
  );

  return (
    <>
      <div className="game-screen">
        <section className="board-column">
          {bar(orientation === 'w' ? 'b' : 'w')}
          <Board
            game={game}
            orientation={orientation}
            lastMove={lastMove}
            interactive={!status.over && !computerToMove}
            movableColor={playerColor}
            onMove={handleMove}
          />
          {bar(orientation)}
        </section>
        <aside className="side-panel">
          <div className="side-panel__header">
            <button type="button" className="btn btn--ghost" onClick={onExit}>
              ← Menu
            </button>
            <div className="side-panel__header-actions">
              <button
                type="button"
                className="btn btn--ghost btn--icon"
                onClick={toggleAudio}
                title={soundOn ? 'Mute sound (M)' : 'Unmute sound (M)'}
              >
                {soundOn ? '🔊' : '🔇'}
              </button>
              <span className="muted">{MODE_LABELS[config.mode]}</span>
            </div>
          </div>
          <div className={`status-card ${status.over ? 'status-card--over' : ''}`}>
            {thinking ? 'Computer is thinking…' : describeStatus(status)}
          </div>
          <MoveList history={game.history()} />
          <GameControls
            onNewGame={newGame}
            onUndo={undoMove}
            onFlip={flip}
            onResign={resign}
            canUndo={canUndo}
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
    </>
  );
}
