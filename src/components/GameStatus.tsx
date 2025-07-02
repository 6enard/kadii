import React, { useState } from 'react';
import { GameState } from '../types';
import { History, X, Trophy, Star, Clock } from 'lucide-react';

interface GameStatusProps {
  gameState: GameState;
  onNewGame: () => void;
}

export const GameStatus: React.FC<GameStatusProps> = ({ gameState, onNewGame }) => {
  const [showHistory, setShowHistory] = useState(false);

  if (gameState.gamePhase === 'gameOver') {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl sm:rounded-3xl border-2 border-yellow-500/50 shadow-2xl p-6 sm:p-8 text-center max-w-md w-full mx-4 relative overflow-hidden">
          {/* Animated background */}
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-transparent to-purple-500/10 animate-pulse"></div>
          
          {/* Winner celebration */}
          <div className="relative z-10 mb-4 sm:mb-6">
            <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-2xl animate-bounce">
              <Trophy size={32} className="text-white drop-shadow-lg sm:w-12 sm:h-12" />
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-2">
              🎉 WINNER! 🎉
            </h2>
            <p className="text-xl sm:text-2xl text-yellow-400 font-bold">
              {gameState.winner} wins!
            </p>
          </div>
          
          {/* Final scores */}
          <div className="relative z-10 mb-6 sm:mb-8 bg-black/40 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-yellow-500/30">
            <h4 className="font-bold text-yellow-400 mb-3 sm:mb-4 flex items-center justify-center space-x-2">
              <Star size={16} className="sm:w-5 sm:h-5" />
              <span>Final Scores</span>
            </h4>
            <div className="space-y-2 sm:space-y-3">
              {gameState.players.map((player) => (
                <div key={player.id} className="flex justify-between items-center">
                  <span className={`font-semibold text-sm sm:text-base ${player.name === gameState.winner ? 'text-yellow-400' : 'text-white/80'}`}>
                    {player.name}:
                  </span>
                  <span className={`font-mono text-base sm:text-lg ${player.name === gameState.winner ? 'text-yellow-400 font-bold' : 'text-white/60'}`}>
                    {player.hand.length} cards
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          <button
            onClick={onNewGame}
            className="relative z-10 w-full bg-gradient-to-r from-yellow-500 via-yellow-600 to-orange-600 hover:from-yellow-600 hover:via-yellow-700 hover:to-orange-700 
                       text-black py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg transition-all duration-300 transform active:scale-95 sm:hover:scale-105 shadow-xl
                       border-2 border-yellow-400/50 hover:border-yellow-300 touch-manipulation"
          >
            🎮 Play Again
          </button>
        </div>
      </div>
    );
  }
  
  // Game history button - only show if there's history
  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Game History Button - Only visible when clicked */}
      {gameState.turnHistory.length > 0 && (
        <div className="flex justify-center">
          <button
            onClick={() => setShowHistory(true)}
            className="flex items-center space-x-2 px-3 py-2 sm:px-4 sm:py-2 bg-black/40 hover:bg-black/60 text-white/80 hover:text-white 
                       rounded-lg sm:rounded-xl transition-all backdrop-blur-sm border border-white/20 hover:border-white/40
                       shadow-lg hover:shadow-xl transform active:scale-95 sm:hover:scale-105 touch-manipulation"
          >
            <History size={14} className="sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm font-medium">Game History ({gameState.turnHistory.length})</span>
          </button>
        </div>
      )}

      {/* Game History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl sm:rounded-3xl border-2 border-emerald-500/50 shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-600 p-4 sm:p-6 text-white relative">
              <button
                onClick={() => setShowHistory(false)}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 p-1.5 sm:p-2 hover:bg-white/20 rounded-full transition-colors touch-manipulation"
              >
                <X size={16} className="sm:w-5 sm:h-5" />
              </button>
              <h3 className="text-xl sm:text-2xl font-bold flex items-center space-x-2 sm:space-x-3">
                <History size={20} className="sm:w-7 sm:h-7" />
                <span>Game History</span>
              </h3>
              <p className="text-emerald-100 mt-1 text-sm sm:text-base">Complete turn-by-turn log</p>
            </div>
            
            <div className="p-4 sm:p-6 max-h-96 overflow-y-auto">
              {gameState.turnHistory.length === 0 ? (
                <div className="text-center text-white/60 py-8">
                  <History size={40} className="mx-auto mb-4 text-white/30 sm:w-12 sm:h-12" />
                  <p className="text-sm sm:text-base">No game history yet</p>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {gameState.turnHistory.map((entry, index) => (
                    <div
                      key={index}
                      className="bg-black/30 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-white/10 hover:bg-black/40 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1 sm:mb-2">
                        <span className="text-xs sm:text-sm text-emerald-400 font-mono font-bold">Turn {index + 1}</span>
                        <span className="text-xs text-white/40 flex items-center space-x-1">
                          <Clock size={10} className="sm:w-3 sm:h-3" />
                          <span>Just now</span>
                        </span>
                      </div>
                      <p className="text-white/90 text-xs sm:text-sm">{entry}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="bg-black/40 p-3 sm:p-4 border-t border-white/10">
              <button
                onClick={() => setShowHistory(false)}
                className="w-full px-4 py-2 sm:py-3 bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 
                           text-white rounded-lg sm:rounded-xl transition-all font-medium text-sm sm:text-base touch-manipulation"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};