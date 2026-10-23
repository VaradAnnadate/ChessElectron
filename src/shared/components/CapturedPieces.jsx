import { PIECE_SYMBOLS } from '../chess/game.js';

export default function CapturedPieces({ pieces, advantage }) {
  return (
    <div className="captured">
      {pieces.map((piece, index) => (
        <span key={index} className={`captured__piece piece--${piece.color}`}>
          {PIECE_SYMBOLS.b[piece.type]}
        </span>
      ))}
      {advantage > 0 && <span className="captured__advantage">+{advantage}</span>}
    </div>
  );
}
