import { PIECE_SYMBOLS } from '../chess/game.js';

const CHOICES = ['q', 'r', 'b', 'n'];
const NAMES = { q: 'Queen', r: 'Rook', b: 'Bishop', n: 'Knight' };

export default function PromotionDialog({ color, onSelect, onCancel }) {
  return (
    <div className="overlay" onClick={onCancel}>
      <div className="dialog" onClick={(event) => event.stopPropagation()}>
        <h3 className="dialog__title">Promote pawn</h3>
        <div className="promotion-choices">
          {CHOICES.map((type) => (
            <button
              key={type}
              type="button"
              className="promotion-choice"
              title={NAMES[type]}
              onClick={() => onSelect(type)}
            >
              <span className={`piece piece--${color}`}>{PIECE_SYMBOLS.b[type]}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
