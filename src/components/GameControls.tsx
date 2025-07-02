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
    <div className="p-4 sm:p-6">
      {/* Main Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center mb-6">
        {/* Play Cards Button */}
        <button
          onClick={onPlayCards}
          disabled={!canPlaySelected || selectedCards.length === 0}
          className={`
            flex items-center justify-center space-x-2 px-6 py-4 rounded-xl font-bold transition-all duration-300 transform shadow-lg
            ${canPlaySelected && selectedCards.length > 0
              ? 'bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-700 hover:from-emerald-600 hover:via-emerald-700 hover:to-emerald-800 text-white hover:scale-105 border-2 border-emerald-400/50' 
              : 'bg-gradient-to-r from-gray-600 to-gray-700 text-gray-300 cursor-not-allowed border-2 border-gray-500/30'
            }
          `}
        >
          <Play size={20} />
          <span>Play {selectedCards.length > 0 ? `${selectedCards.length} ` : ''}Card{selectedCards.length !== 1 ? 's' : ''}</span>
        </button>
        
        {/* Draw Penalty Button */}
        {hasPenalty && (
          <button
            onClick={onDrawPenalty}
            className="flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-red-500 via-red-600 to-red-700 hover:from-red-600 hover:via-red-700 hover:to-red-800 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg border-2 border-red-400/50 animate-pulse"
          >
            <Plus size={20} />
            <span>Draw {gameState.drawStack} Cards</span>
          </button>
        )}
        
        {/* Niko Kadi Declaration */}
        <button
          onClick={onDeclareNikoKadi}
          className={`
            relative flex items-center justify-center space-x-2 px-6 py-4 rounded-xl font-bold transition-all duration-300 transform shadow-lg border-2
            ${currentPlayer.hand.length === 1 && !currentPlayer.nikoKadiCalled
              ? 'bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 hover:from-yellow-500 hover:via-yellow-600 hover:to-orange-600 text-black animate-pulse hover:scale-105 border-yellow-300/50'
              : 'bg-gradient-to-r from-yellow-500 via-yellow-600 to-orange-600 hover:from-yellow-600 hover:via-yellow-700 hover:to-orange-700 text-white hover:scale-105 border-yellow-400/50'
            }
          `}
        >
          <Target size={20} />
          <span>Declare "NIKO KADI"!</span>
          {currentPlayer.hand.length === 1 && !currentPlayer.nikoKadiCalled && (
            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-bounce border border-red-400">
              !
            </div>
          )}
        </button>
      </div>
      
      {/* Game Status Indicators */}
      <div className="flex flex-wrap gap-4 justify-center text-sm mb-4">
        <div className="flex items-center space-x-2 bg-black/30 rounded-lg px-3 py-2 border border-blue-500/30">
          <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
          <span className="text-blue-300 font-medium">Selected: {selectedCards.length}</span>
        </div>
        
        {gameState.pendingQuestion && (
          <div className="flex items-center space-x-2 bg-orange-500/20 rounded-lg px-3 py-2 border border-orange-400/50 animate-bounce">
            <AlertTriangle size={16} className="text-orange-300" />
            <span className="text-orange-200 font-bold">ANSWER NEEDED!</span>
          </div>
        )}
        
        {hasPenalty && (
          <div className="flex items-center space-x-2 bg-red-500/20 rounded-lg px-3 py-2 border border-red-400/50">
            <AlertTriangle size={16} className="text-red-300" />
            <span className="text-red-200 font-bold">Penalty: {gameState.drawStack} cards</span>
          </div>
        )}
        
        {gameState.selectedSuit && (
          <div className="flex items-center space-x-2 bg-yellow-500/20 rounded-lg px-3 py-2 border border-yellow-400/50">
            <Target size={16} className="text-yellow-300" />
            <span className="text-yellow-200 font-bold">Suit: {gameState.selectedSuit}</span>
          </div>
        )}
      </div>
      
      {/* Help Text */}
      {selectedCards.length > 1 && (
        <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30 rounded-xl p-4">
          <div className="text-blue-200 text-sm text-center flex items-center justify-center space-x-2">
            <Zap size={16} className="text-blue-400" />
            <span><strong>Casino Rule:</strong> Multiple cards must all be the same rank!</span>
          </div>
        </div>
      )}
    </div>
  );
};