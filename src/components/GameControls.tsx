import React from 'react';
import { GameState } from '../types';
import { getCurrentPlayer } from '../utils/gameLogic';
import { Play, Plus, AlertTriangle, Target } from 'lucide-react';

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
    <div className="bg-white bg-opacity-20 backdrop-blur-md rounded-2xl border border-white border-opacity-30 p-6 shadow-xl">
      <div className="flex flex-wrap gap-4 justify-center items-center">
        {/* Play Cards Button */}
        <button
          onClick={onPlayCards}
          disabled={!canPlaySelected || selectedCards.length === 0}
          className={`
            flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 transform
            ${canPlaySelected && selectedCards.length > 0
              ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-lg hover:scale-105' 
              : 'bg-gray-400 text-gray-200 cursor-not-allowed'
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
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            <Plus size={20} />
            <span>Draw {gameState.drawStack} Cards</span>
          </button>
        )}
        
        {/* Niko Kadi Declaration */}
        <button
          onClick={onDeclareNikoKadi}
          className={`
            relative flex items-center space-x-2 px-6 py-3 rounded-xl font-bold transition-all duration-300 transform
            ${currentPlayer.hand.length === 1 && !currentPlayer.nikoKadiCalled
              ? 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black shadow-xl animate-pulse hover:scale-105'
              : 'bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white shadow-lg hover:scale-105'
            }
          `}
        >
          <Target size={20} />
          <span>Declare "Niko Kadi"!</span>
          {currentPlayer.hand.length === 1 && !currentPlayer.nikoKadiCalled && (
            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-bounce">
              !
            </div>
          )}
        </button>
      </div>
      
      {/* Game Status Indicators */}
      <div className="mt-4 flex flex-wrap gap-4 justify-center text-sm">
        <div className="flex items-center space-x-2 text-white">
          <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
          <span>Selected: {selectedCards.length}/6</span>
        </div>
        
        {gameState.pendingQuestion && (
          <div className="flex items-center space-x-2 text-orange-300 font-bold animate-pulse">
            <AlertTriangle size={16} />
            <span>ANSWER NEEDED!</span>
          </div>
        )}
        
        {hasPenalty && (
          <div className="flex items-center space-x-2 text-red-300 font-bold">
            <AlertTriangle size={16} />
            <span>Penalty: {gameState.drawStack} cards</span>
          </div>
        )}
        
        {gameState.selectedSuit && (
          <div className="flex items-center space-x-2 text-yellow-300 font-bold">
            <Target size={16} />
            <span>Suit: {gameState.selectedSuit}</span>
          </div>
        )}
      </div>
      
      {/* Help Text */}
      {selectedCards.length > 1 && (
        <div className="mt-4 bg-blue-500 bg-opacity-20 border border-blue-400 border-opacity-30 rounded-lg p-3">
          <div className="text-blue-200 text-sm text-center">
            <strong>💡 Tip:</strong> Playing multiple cards - they'll be played in sequence!
          </div>
        </div>
      )}
    </div>
  );
};