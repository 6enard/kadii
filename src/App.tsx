import React, { useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { MainMenu } from './components/menu/MainMenu';
import { SinglePlayerGame } from './components/game/SinglePlayerGame';
import { MultiplayerGame } from './components/game/MultiplayerGame';

type GameMode = 'menu' | 'singlePlayer' | 'multiplayer' | 'challengeGame';

interface ChallengeInfo {
  opponentId: string;
  opponentName: string;
}

function App() {
  const [gameMode, setGameMode] = useState<GameMode>('menu');
  const [challengeInfo, setChallengeInfo] = useState<ChallengeInfo | null>(null);

  const handleStartSinglePlayer = () => {
    setGameMode('singlePlayer');
  };

  const handleStartMultiplayer = () => {
    setGameMode('multiplayer');
  };

  const handleStartChallengeGame = (opponentId: string, opponentName: string) => {
    setChallengeInfo({ opponentId, opponentName });
    setGameMode('challengeGame');
  };

  const handleBackToMenu = () => {
    setGameMode('menu');
    setChallengeInfo(null);
  };

  return (
    <AuthProvider>
      {gameMode === 'menu' && (
        <MainMenu
          onStartSinglePlayer={handleStartSinglePlayer}
          onStartMultiplayer={handleStartMultiplayer}
          onStartChallengeGame={handleStartChallengeGame}
        />
      )}
      {gameMode === 'singlePlayer' && (
        <SinglePlayerGame onBackToMenu={handleBackToMenu} />
      )}
      {(gameMode === 'multiplayer' || gameMode === 'challengeGame') && (
        <MultiplayerGame 
          onBackToMenu={handleBackToMenu}
          challengeInfo={challengeInfo}
        />
      )}
    </AuthProvider>
  );
}

export default App;