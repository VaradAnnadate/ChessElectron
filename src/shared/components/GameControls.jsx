export default function GameControls({
  onNewGame,
  onUndo,
  onFlip,
  onResign,
  onCopyFen,
  onCopyPgn,
  canUndo,
  canResign,
}) {
  return (
    <div className="controls">
      <button type="button" className="btn" onClick={onNewGame} title="New game (N)">
        New game
      </button>
      <button type="button" className="btn" onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)">
        Undo
      </button>
      <button type="button" className="btn" onClick={onFlip} title="Flip board (F)">
        Flip
      </button>
      <button type="button" className="btn btn--danger" onClick={onResign} disabled={!canResign}>
        Resign
      </button>
      <button type="button" className="btn" onClick={onCopyFen} title="Copy current position in FEN notation">
        Copy FEN
      </button>
      <button type="button" className="btn" onClick={onCopyPgn} title="Copy full game notation in PGN format">
        Copy PGN
      </button>
    </div>
  );
}
