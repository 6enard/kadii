import React from 'react';
import { GameState } from '../types';
import { getCurrentPlayer } from '../utils/gameLogic';

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
  const isMyTurn = gameState.currentPlayerIndex === 0;
  
  return (
    <div className="space-y-4">
      {/* Main Action Buttons - Casino Style */}
      <div className="flex justify-center space-x-6">
        {/* Play Cards Button */}
        <button
          onClick={onPlayCards}
          disabled={!canPlaySelected || selectedCards.length === 0 || !isMyTurn}
          className={`
            px-8 py-4 rounded-xl font-bold text-lg transition-all duration-200 shadow-lg
            ${canPlaySelected && selectedCards.length > 0 && isMyTurn
              ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white transform hover:scale-105 shadow-green-500/30' 
              : 'bg-gray-400 text-gray-200 cursor-not-allowed'
            }
          `}
        >
          {selectedCards.length > 0 
            ? `Play ${selectedCards.length} Card${selectedCards.length > 1 ? 's' : ''}` 
            : 'Select Cards'
          }
        </button>
        
        {/* Draw Penalty Button */}
        {hasPenalty && isMyTurn && (
          <button
            onClick={onDrawPenalty}
            className="px-8 py-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 
                       text-white font-bold text-lg rounded-xl transition-all duration-200 transform hover:scale-105 
                       shadow-lg shadow-red-500/30"
          >
            Draw {gameState.drawStack} Cards
          </button>
        )}
      </div>

      {/* Niko Kadi Declaration - Prominent */}
      <div className="flex justify-center">
        <button
          onClick={onDeclareNikoKadi}
          disabled={!isMyTurn}
          className={`px-12 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 
                     text-black font-bold text-xl rounded-xl transition-all duration-200 transform hover:scale-105
                     shadow-xl border-4 border-yellow-300 shadow-yellow-500/30
                     ${!isMyTurn ? 'opacity-50 cursor-not-allowed' : 'animate-pulse'}
                     ${currentPlayer.hand.length === 1 && !currentPlayer.nikoKadiCalled ? 'animate-bounce' : ''}`}
        >
          🎯 DECLARE "NIKO KADI"! 🎯
        </button>
      </div>

      {/* Game Status Info */}
      <div className="flex justify-center">
        <div className="bg-black bg-opacity-30 rounded-xl px-6 py-3 backdrop-blur-sm border border-green-600">
          <div className="flex items-center space-x-6 text-sm text-white">
            <span className="font-medium">
              Selected: <span className="text-yellow-300 font-bold">{selectedCards.length}/6</span>
            </span>
            
            {gameState.pendingQuestion && (
              <span className="text-red-300 font-bold animate-pulse">
                🚨 QUESTION MUST BE ANSWERED! 🚨
              </span>
            )}
            
            {!isMyTurn && (
              <span className="text-blue-300 font-bold">
                {gameState.players[gameState.currentPlayerIndex].name}'s turn
              </span>
            )}
            
            {hasPenalty && (
              <span className="text-red-300 font-bold">
                ⚡ Penalty: {gameState.drawStack} cards - Counter with 2, 3, or A!
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};