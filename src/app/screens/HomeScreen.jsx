import { useState } from 'react';
import { DIFFICULTIES } from '../../shared/chess/ai.js';
import { TIME_CONTROLS } from '../../shared/hooks/useChessClock.js';

const MODES = [
  { id: 'local', title: 'Local game', description: 'Two players on the same computer.' },
  { id: 'computer', title: 'Play vs Computer', description: 'Challenge the built-in engine.' },
  { id: 'online', title: 'Play online', description: 'Play against others via the chess server.', soon: true },
];

const COLORS = [
  { id: 'w', label: 'White' },
  { id: 'random', label: 'Random' },
  { id: 'b', label: 'Black' },
];

function OptionGroup({ label, options, value, onChange }) {
  return (
    <div className="option-group">
      <span className="option-group__label">{label}</span>
      <div className="segmented">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            className={`segmented__item ${value === option.id ? 'segmented__item--active' : ''}`}
            onClick={() => onChange(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function HomeScreen({ onStart }) {
  const [mode, setMode] = useState('local');
  const [color, setColor] = useState('w');
  const [difficulty, setDifficulty] = useState('medium');
  const [timeControl, setTimeControl] = useState('none');

  const start = () => {
    const playerColor = color === 'random' ? (Math.random() < 0.5 ? 'w' : 'b') : color;
    onStart({ mode, playerColor, difficulty, timeControl });
  };

  return (
    <div className="home">
      <header className="home__header">
        <h1 className="home__title">♞ Chess</h1>
        <p className="muted">Desktop edition</p>
      </header>

      <div className="mode-grid">
        {MODES.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`mode-card ${mode === item.id ? 'mode-card--selected' : ''}`}
            disabled={item.soon}
            onClick={() => setMode(item.id)}
          >
            <span className="mode-card__title">{item.title}</span>
            <span className="muted">{item.soon ? 'Coming soon' : item.description}</span>
          </button>
        ))}
      </div>

      <div className="options">
        <OptionGroup
          label="Time control"
          options={Object.entries(TIME_CONTROLS).map(([id, item]) => ({ id, label: item.label }))}
          value={timeControl}
          onChange={setTimeControl}
        />
        {mode === 'computer' && (
          <>
          <OptionGroup label="Play as" options={COLORS} value={color} onChange={setColor} />
          <OptionGroup
            label="Difficulty"
            options={Object.entries(DIFFICULTIES).map(([id, item]) => ({ id, label: item.label }))}
            value={difficulty}
            onChange={setDifficulty}
          />
          </>
        )}
      </div>

      <button type="button" className="btn btn--primary btn--large" onClick={start}>
        Start game
      </button>
    </div>
  );
}
