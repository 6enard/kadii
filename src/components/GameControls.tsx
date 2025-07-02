import React from 'react';
import { GameState } from '../types';
import { getCurrentPlayer } from '../utils/gameLogic';
import { Play, Plus, AlertTriangle, Target, Zap } from 'lucide-react';

interface GameControlsProps {
  gameState: GameState;
  selectedCards: string[];
  onPlayCards: () => void;
  onDeclareNikoKadi: () => void;
  onDrawPenalty: () => void;
  canPlaySelected: boolean;
}

export const GameControls: React.FC<GameControlsProps> = ({
  gameState,
  selectedCards,
  onPlayCards,
  onDeclareNikoKadi,
  onDrawPenalty,
  canPlaySelected
}) => {
  const currentPlayer = getCurrentPlayer(gameState);
  const hasPenalty = gameState.drawStack > 0;
  
  return (
    <div className="p-2 sm:p-4 md:p-6">
      {/* Main Action Buttons */}
      <div className="flex flex-col space-y-2 sm:space-y-3 md:flex-row md:gap-3 md:space-y-0 justify-center items-stretch md:items-center mb-4 sm:mb-6">
        {/* Play Cards Button */}
        <button
          onClick={onPlayCards}
          disabled={!canPlaySelected || selectedCards.length === 0}
          className={`
            flex items-center justify-center space-x-2 px-4 py-3 sm:px-6 sm:py-4 rounded-lg sm:rounded-xl font-bold transition-all duration-300 transform shadow-lg
            touch-manipulation active:scale-95
            ${canPlaySelected && selectedCards.length > 0
              ? 'bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-700 hover:from-emerald-600 hover:via-emerald-700 hover:to-emerald-800 text-white sm:hover:scale-105 border-2 border-emerald-400/50' 
              : 'bg-gradient-to-r from-gray-600 to-gray-700 text-gray-300 cursor-not-allowed border-2 border-gray-500/30'
            }
          `}
        >
          <Play size={16} className="sm:w-5 sm:h-5" />
          <span className="text-sm sm:text-base">
            Play {selectedCards.length > 0 ? `${selectedCards.length} ` : ''}Card{selectedCards.length !== 1 ? 's' : ''}
          </span>
        </button>
        
        {/* Draw Penalty Button */}
        {hasPenalty && (
          <button
            onClick={onDrawPenalty}
            className="flex items-center justify-center space-x-2 px-4 py-3 sm:px-6 sm:py-4 bg-gradient-to-r from-red-500 via-red-600 to-red-700 hover:from-red-600 hover:via-red-700 hover:to-red-800 text-white font-bold rounded-lg sm:rounded-xl transition-all duration-300 transform sm:hover:scale-105 shadow-lg border-2 border-red-400/50 animate-pulse touch-manipulation active:scale-95"
          >
            <Plus size={16} className="sm:w-5 sm:h-5" />
            <span className="text-sm sm:text-base">Draw {gameState.drawStack} Cards</span>
          </button>
        )}
        
        {/* Niko Kadi Declaration */}
        <button
          onClick={onDeclareNikoKadi}
          className={`
            relative flex items-center justify-center space-x-2 px-4 py-3 sm:px-6 sm:py-4 rounded-lg sm:rounded-xl font-bold transition-all duration-300 transform shadow-lg border-2 touch-manipulation active:scale-95
            ${currentPlayer.hand.length === 1 && !currentPlayer.nikoKadiCalled
              ? 'bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 hover:from-yellow-500 hover:via-yellow-600 hover:to-orange-600 text-black animate-pulse sm:hover:scale-105 border-yellow-300/50'
              : 'bg-gradient-to-r from-yellow-500 via-yellow-600 to-orange-600 hover:from-yellow-600 hover:via-yellow-700 hover:to-orange-700 text-white sm:hover:scale-105 border-yellow-400/50'
            }
          `}
        >
          <Target size={16} className="sm:w-5 sm:h-5" />
          <span className="text-sm sm:text-base">
            <span className="hidden sm:inline">Declare "NIKO KADI"!</span>
            <span className="sm:hidden">NIKO KADI!</span>
          </span>
          {currentPlayer.hand.length === 1 && !currentPlayer.nikoKadiCalled && (
            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full animate-bounce border border-red-400">
              !
            </div>
          )}
        </button>
      </div>
      
      {/* Game Status Indicators */}
      <div className="flex flex-wrap gap-2 sm:gap-4 justify-center text-sm mb-3 sm:mb-4">
        <div className="flex items-center space-x-1 sm:space-x-2 bg-black/30 rounded-md sm:rounded-lg px-2 py-1 sm:px-3 sm:py-2 border border-blue-500/30">
          <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-400 rounded-full animate-pulse"></div>
          <span className="text-blue-300 font-medium text-xs sm:text-sm">Selected: {selectedCards.length}</span>
        </div>
        
        {gameState.pendingQuestion && (
          <div className="flex items-center space-x-1 sm:space-x-2 bg-orange-500/20 rounded-md sm:rounded-lg px-2 py-1 sm:px-3 sm:py-2 border border-orange-400/50 animate-bounce">
            <AlertTriangle size={12} className="text-orange-300 sm:w-4 sm:h-4" />
            <span className="text-orange-200 font-bold text-xs sm:text-sm">ANSWER NEEDED!</span>
          </div>
        )}
        
        {hasPenalty && (
          <div className="flex items-center space-x-1 sm:space-x-2 bg-red-500/20 rounded-md sm:rounded-lg px-2 py-1 sm:px-3 sm:py-2 border border-red-400/50">
            <AlertTriangle size={12} className="text-red-300 sm:w-4 sm:h-4" />
            <span className="text-red-200 font-bold text-xs sm:text-sm">Penalty: {gameState.drawStack} cards</span>
          </div>
        )}
        
        {gameState.selectedSuit && (
          <div className="flex items-center space-x-1 sm:space-x-2 bg-yellow-500/20 rounded-md sm:rounded-lg px-2 py-1 sm:px-3 sm:py-2 border border-yellow-400/50">
            <Target size={12} className="text-yellow-300 sm:w-4 sm:h-4" />
            <span className="text-yellow-200 font-bold text-xs sm:text-sm">Suit: {gameState.selectedSuit}</span>
          </div>
        )}
      </div>
      
      {/* Help Text */}
      {selectedCards.length > 1 && (
        <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30 rounded-lg sm:rounded-xl p-3 sm:p-4">
          <div className="text-blue-200 text-xs sm:text-sm text-center flex items-center justify-center space-x-1 sm:space-x-2">
            <Zap size={12} className="text-blue-400 sm:w-4 sm:h-4" />
            <span><strong>Casino Rule:</strong> Multiple cards must all be the same rank!</span>
          </div>
        </div>
      )}
    </div>
  );
};