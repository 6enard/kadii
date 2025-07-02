import React, { useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { MainMenu } from './components/menu/MainMenu';
import { SinglePlayerGame } from './components/game/SinglePlayerGame';
import { MultiplayerGame } from './components/game/MultiplayerGame';
import { OnlineMultiplayerGame } from './components/game/OnlineMultiplayerGame';

type GameMode = 'menu' | 'singlePlayer' | 'multiplayer' | 'onlineMultiplayer';

interface OnlineGameData {
  gameSessionId: string;
  opponentId: string;
  opponentName: string;
}

function App() {
  const [gameMode, setGameMode] = useState<GameMode>('menu');
  const [onlineGameData, setOnlineGameData] = useState<OnlineGameData | null>(null);

  const handleStartSinglePlayer = () => {
    setGameMode('singlePlayer');
  };

  const handleStartMultiplayer = () => {
    setGameMode('multiplayer');
  };

  const handleStartOnlineGame = (gameSessionId: string, opponentId: string, opponentName: string) => {
    setOnlineGameData({ gameSessionId, opponentId, opponentName });
    setGameMode('onlineMultiplayer');
  };

  const handleBackToMenu = () => {
    setGameMode('menu');
    setOnlineGameData(null);
  };

  return (
    <AuthProvider>
      {gameMode === 'menu' && (
        <MainMenu
          onStartSinglePlayer={handleStartSinglePlayer}
          onStartMultiplayer={handleStartMultiplayer}
          onStartOnlineGame={handleStartOnlineGame}
        />
      )}
      {gameMode === 'singlePlayer' && (
        <SinglePlayerGame onBackToMenu={handleBackToMenu} />
      )}
      {gameMode === 'multiplayer' && (
        <MultiplayerGame onBackToMenu={handleBackToMenu} />
      )}
      {gameMode === 'onlineMultiplayer' && onlineGameData && (
        <OnlineMultiplayerGame 
          onBackToMenu={handleBackToMenu}
          gameSessionId={onlineGameData.gameSessionId}
          opponentId={onlineGameData.opponentId}
          opponentName={onlineGameData.opponentName}
        />
      )}
    </AuthProvider>
  );
}

export default App;