import React, { useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { MainMenu } from './components/menu/MainMenu';
import { SinglePlayerGame } from './components/game/SinglePlayerGame';
import { OnlineMultiplayerGame } from './components/game/OnlineMultiplayerGame';
import { ErrorFallback } from './components/common/ErrorBoundary';
import { createErrorBoundary } from './utils/errorHandling';

type GameMode = 'menu' | 'singlePlayer' | 'onlineMultiplayer';

interface OnlineGameData {
  gameSessionId: string;
  opponentId: string;
  opponentName: string;
}

const AppErrorBoundary = createErrorBoundary(ErrorFallback);

function App() {
  const [gameMode, setGameMode] = useState<GameMode>('menu');
  const [onlineGameData, setOnlineGameData] = useState<OnlineGameData | null>(null);

  const handleStartSinglePlayer = () => {
    setGameMode('singlePlayer');
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
    <AppErrorBoundary>
      <AuthProvider>
        {gameMode === 'menu' && (
          <MainMenu
            onStartSinglePlayer={handleStartSinglePlayer}
            onStartOnlineGame={handleStartOnlineGame}
          />
        )}
        {gameMode === 'singlePlayer' && (
          <SinglePlayerGame onBackToMenu={handleBackToMenu} />
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
    </AppErrorBoundary>
  );
}

export default App;