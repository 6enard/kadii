import React, { useState } from 'react';
import { GameState } from '../types';
import { History, X } from 'lucide-react';

interface GameStatusProps {
  gameState: GameState;
  onNewGame: () => void;
}

export const GameStatus: React.FC<GameStatusProps> = ({ gameState, onNewGame }) => {
  const [showHistory, setShowHistory] = useState(false);

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
  
  // Game history and status
  return (
    <div className="space-y-4">
      {/* Game History Button */}
      {gameState.turnHistory.length > 0 && (
        <div className="flex justify-center">
          <button
            onClick={() => setShowHistory(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            <History size={16} />
            <span>Game History ({gameState.turnHistory.length})</span>
          </button>
        </div>
      )}

      {/* Recent Activity Preview */}
      {gameState.turnHistory.length > 0 && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold mb-2 text-gray-700">Recent Activity:</h4>
          <div className="max-h-20 overflow-y-auto">
            {gameState.turnHistory.slice(-3).map((entry, index) => (
              <div key={index} className="text-sm text-gray-600 mb-1">
                • {entry}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Game History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 text-white relative">
              <button
                onClick={() => setShowHistory(false)}
                className="absolute top-4 right-4 p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
              <h3 className="text-xl font-bold">Game History</h3>
              <p className="text-blue-100">Complete turn-by-turn log</p>
            </div>
            
            <div className="p-6 max-h-96 overflow-y-auto">
              {gameState.turnHistory.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <History size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>No game history yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {gameState.turnHistory.map((entry, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg ${
                        index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                      } border-l-4 ${
                        entry.includes('Player 1') ? 'border-blue-500' : 
                        entry.includes('Computer') ? 'border-red-500' : 
                        'border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Turn {index + 1}</span>
                        <span className="text-xs text-gray-400">
                          {new Date().toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="font-medium text-gray-800 mt-1">{entry}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="bg-gray-50 p-4 border-t">
              <button
                onClick={() => setShowHistory(false)}
                className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};