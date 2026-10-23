import { useState } from 'react';
import GameScreen from './screens/GameScreen.jsx';
import HomeScreen from './screens/HomeScreen.jsx';

export default function App() {
  const [screen, setScreen] = useState({ name: 'home' });

  return (
    <main className="app">
      {screen.name === 'home' && (
        <HomeScreen onStart={(config) => setScreen({ name: 'game', config, key: Date.now() })} />
      )}
      {screen.name === 'game' && (
        <GameScreen key={screen.key} config={screen.config} onExit={() => setScreen({ name: 'home' })} />
      )}
    </main>
  );
}
