import CapturedPieces from './CapturedPieces.jsx';

export default function PlayerBar({ name, color, active, captured, advantage, children }) {
  return (
    <div className={`player-bar ${active ? 'player-bar--active' : ''}`}>
      <div className="player-bar__info">
        <span className={`player-bar__swatch player-bar__swatch--${color}`} />
        <span className="player-bar__name">{name}</span>
        <CapturedPieces pieces={captured} advantage={advantage} />
      </div>
      {children}
    </div>
  );
}
