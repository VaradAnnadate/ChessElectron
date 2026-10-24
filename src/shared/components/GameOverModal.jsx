import { COLOR_NAMES } from '../chess/game.js';

export default function GameOverModal({
  status,
  isComputer,
  playerColor,
  moveCount,
  onRematch,
  onReview,
  onCopyPgn,
  onExit,
}) {
  const winner = status.winner;
  const isDraw = !winner;

  let title = 'Game Over';
  let bannerClass = 'game-over-banner--neutral';

  if (isDraw) {
    title = 'Draw';
  } else if (isComputer) {
    if (winner === playerColor) {
      title = '🏆 Victory!';
      bannerClass = 'game-over-banner--win';
    } else {
      title = 'Defeat';
      bannerClass = 'game-over-banner--loss';
    }
  } else {
    title = `${COLOR_NAMES[winner]} Wins!`;
    bannerClass = winner === 'w' ? 'game-over-banner--white' : 'game-over-banner--black';
  }

  const reasonLabel = {
    checkmate: 'by checkmate',
    resignation: 'by resignation',
    timeout: 'on time',
    stalemate: 'by stalemate',
    'threefold repetition': 'by threefold repetition',
    'insufficient material': 'by insufficient material',
    '50-move rule': 'by 50-move rule',
    agreement: 'by agreement',
    abandonment: 'by abandonment',
  }[status.reason] ?? (status.reason ? `by ${status.reason}` : '');

  return (
    <div className="overlay" onClick={onReview}>
      <div className="dialog game-over-dialog" onClick={(event) => event.stopPropagation()}>
        <div className={`game-over-banner ${bannerClass}`}>
          <h2 className="game-over-title">{title}</h2>
          {reasonLabel && <p className="game-over-subtitle">{reasonLabel}</p>}
        </div>

        <div className="game-over-score">
          <span className="score-badge">{status.result ?? (winner === 'w' ? '1-0' : winner === 'b' ? '0-1' : '½-½')}</span>
        </div>

        <div className="game-over-stats">
          <div className="stat-pill">
            <span className="stat-label">Moves</span>
            <span className="stat-value">{Math.ceil(moveCount / 2)}</span>
          </div>
          <div className="stat-pill">
            <span className="stat-label">Total Plies</span>
            <span className="stat-value">{moveCount}</span>
          </div>
          <div className="stat-pill">
            <span className="stat-label">Mode</span>
            <span className="stat-value">{isComputer ? 'vs Computer' : 'Local 2P'}</span>
          </div>
        </div>

        <div className="game-over-actions">
          <button type="button" className="btn btn--primary btn--action" onClick={onRematch}>
            Play Again
          </button>
          <button type="button" className="btn btn--action" onClick={onReview}>
            Review Board
          </button>
          <button type="button" className="btn btn--action" onClick={onCopyPgn}>
            Copy PGN
          </button>
          <button type="button" className="btn btn--ghost btn--action" onClick={onExit}>
            Main Menu
          </button>
        </div>
      </div>
    </div>
  );
}
