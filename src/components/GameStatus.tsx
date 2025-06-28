import React from 'react';
import { GameState } from '../types';

interface GameStatusProps {
  gameState: GameState;
  onNewGame: () => void;
}

export const GameStatus: React.FC<GameStatusProps> = ({ gameState, onNewGame }) => {
  if (gameState.gamePhase === 'gameOver') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg shadow-xl text-center max-w-md">
          <h2 className="text-3xl font-bold mb-4 text-green-600">🎉 Game Over!</h2>
          <p className="text-xl mb-6">
            <span className="font-bold text-blue-600">{gameState.winner}</span> wins!
          </p>
          
          <div className="mb-6 text-gray-600">
            <h4 className="font-semibold mb-2">Final Scores:</h4>
            {gameState.players.map((player) => (
              <div key={player.id} className="flex justify-between">
                <span>{player.name}:</span>
                <span>{player.hand.length} cards remaining</span>
              </div>
            ))}
          </div>
          
          <button
            onClick={onNewGame}
            className="px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold 
                       rounded-lg transition-all duration-200 transform hover:scale-105"
          >
            Play Again
          </button>
        </div>
      </div>
    );
  }
  
  // Game history/turn log
  if (gameState.turnHistory.length > 0) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-semibold mb-2 text-gray-700">Recent Activity:</h4>
        <div className="max-h-20 overflow-y-auto">
          {gameState.turnHistory.slice(-3).map((entry, index) => (
            <div key={index} className="text-sm text-gray-600 mb-1">
              {entry}
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  return null;
};