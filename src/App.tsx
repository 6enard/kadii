import React, { useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { MainMenu } from './components/menu/MainMenu';
import { SinglePlayerGame } from './components/game/SinglePlayerGame';
import { MultiplayerGame } from './components/game/MultiplayerGame';

type GameMode = 'menu' | 'singlePlayer' | 'multiplayer';

function App() {
  const [gameMode, setGameMode] = useState<GameMode>('menu');

  const handleStartSinglePlayer = () => {
    setGameMode('singlePlayer');
  };

  const handleStartMultiplayer = () => {
    setGameMode('multiplayer');
  };

  const handleBackToMenu = () => {
    setGameMode('menu');
  };

  return (
    <AuthProvider>
      {gameMode === 'menu' && (
        <MainMenu
          onStartSinglePlayer={handleStartSinglePlayer}
          onStartMultiplayer={handleStartMultiplayer}
        />
      )}
      {gameMode === 'singlePlayer' && (
        <SinglePlayerGame onBackToMenu={handleBackToMenu} />
      )}
      {gameMode === 'multiplayer' && (
        <MultiplayerGame onBackToMenu={handleBackToMenu} />
      )}
    </AuthProvider>
  );
}

export default App;