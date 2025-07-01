import React, { useState } from 'react';
import { GameState } from '../types';
import { History, X, Trophy, Star } from 'lucide-react';

interface GameStatusProps {
  gameState: GameState;
  onNewGame: () => void;
}

export const GameStatus: React.FC<GameStatusProps> = ({ gameState, onNewGame }) => {
  const [showHistory, setShowHistory] = useState(false);

  if (gameState.gamePhase === 'gameOver') {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-slate-800 rounded-3xl border border-white/20 shadow-2xl p-8 text-center max-w-md w-full mx-4">
          {/* Winner celebration */}
          <div className="mb-6">
            <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy size={40} className="text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">🎉 Game Over!</h2>
            <p className="text-xl text-emerald-400 font-semibold">
              <span className="text-yellow-400">{gameState.winner}</span> wins!
            </p>
          </div>
          
          {/* Final scores */}
          <div className="mb-8 bg-black/30 rounded-2xl p-4 border border-white/10">
            <h4 className="font-semibold text-white/80 mb-3 flex items-center justify-center space-x-2">
              <Star size={16} />
              <span>Final Scores</span>
            </h4>
            <div className="space-y-2">
              {gameState.players.map((player) => (
                <div key={player.id} className="flex justify-between items-center text-white">
                  <span className={player.name === gameState.winner ? 'text-yellow-400 font-bold' : ''}>
                    {player.name}:
                  </span>
                  <span className={`font-mono ${player.name === gameState.winner ? 'text-yellow-400 font-bold' : 'text-white/80'}`}>
                    {player.hand.length} cards remaining
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          <button
            onClick={onNewGame}
            className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 
                       text-white py-4 rounded-2xl font-bold text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
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
            className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white rounded-xl transition-all backdrop-blur-sm border border-white/20"
          >
            <History size={16} />
            <span>Game History ({gameState.turnHistory.length})</span>
          </button>
        </div>
      )}

      {/* Recent Activity Preview */}
      {gameState.turnHistory.length > 0 && (
        <div className="bg-black/30 backdrop-blur-sm rounded-2xl border border-white/10 p-4">
          <h4 className="font-semibold mb-3 text-white/80 flex items-center space-x-2">
            <History size={16} />
            <span>Recent Activity:</span>
          </h4>
          <div className="max-h-20 overflow-y-auto space-y-1">
            {gameState.turnHistory.slice(-3).map((entry, index) => (
              <div key={index} className="text-sm text-white/70 bg-white/5 rounded-lg p-2">
                • {entry}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Game History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-3xl border border-white/20 shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 p-6 text-white relative">
              <button
                onClick={() => setShowHistory(false)}
                className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
              <h3 className="text-2xl font-bold flex items-center space-x-2">
                <History size={24} />
                <span>Game History</span>
              </h3>
              <p className="text-emerald-100 mt-1">Complete turn-by-turn log</p>
            </div>
            
            <div className="p-6 max-h-96 overflow-y-auto">
              {gameState.turnHistory.length === 0 ? (
                <div className="text-center text-white/60 py-8">
                  <History size={48} className="mx-auto mb-4 text-white/30" />
                  <p>No game history yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {gameState.turnHistory.map((entry, index) => (
                    <div
                      key={index}
                      className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-white/60 font-mono">Turn {index + 1}</span>
                        <span className="text-xs text-white/40">
                          {new Date().toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-white/90">{entry}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="bg-black/30 p-4 border-t border-white/10">
              <button
                onClick={() => setShowHistory(false)}
                className="w-full px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors"
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