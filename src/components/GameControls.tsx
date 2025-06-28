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
  const canDeclareNikoKadi = currentPlayer.hand.length === 1 && !currentPlayer.nikoKadiCalled;
  const hasPenalty = gameState.drawStack > 0;
  const isMyTurn = gameState.currentPlayerIndex === 0; // Assuming player 1 is always the human player
  
  return (
    <div className="flex flex-wrap gap-3 justify-center p-4 bg-gray-100 rounded-lg">
      {/* Play Cards Button */}
      <button
        onClick={onPlayCards}
        disabled={!canPlaySelected || selectedCards.length === 0 || !isMyTurn}
        className={`
          px-6 py-3 rounded-lg font-bold text-white transition-all duration-200
          ${canPlaySelected && selectedCards.length > 0 && isMyTurn
            ? 'bg-green-500 hover:bg-green-600 transform hover:scale-105' 
            : 'bg-gray-400 cursor-not-allowed'
          }
        `}
      >
        Play {selectedCards.length > 0 ? `${selectedCards.length} Card${selectedCards.length > 1 ? 's' : ''}` : 'Cards'}
      </button>
      
      {/* Niko Kadi Button - Always visible when player has 1 card */}
      {canDeclareNikoKadi && isMyTurn && (
        <button
          onClick={onDeclareNikoKadi}
          className="px-8 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 
                     text-white font-bold rounded-lg transition-all duration-200 transform hover:scale-105
                     animate-pulse shadow-lg border-2 border-yellow-300"
        >
          🎯 Declare "Niko Kadi"!
        </button>
      )}
      
      {/* Draw Penalty Button */}
      {hasPenalty && isMyTurn && (
        <button
          onClick={onDrawPenalty}
          className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold 
                     rounded-lg transition-all duration-200 transform hover:scale-105"
        >
          Draw {gameState.drawStack} Penalty Cards
        </button>
      )}
      
      {/* Game Status Info */}
      <div className="flex items-center space-x-4 text-sm text-gray-600">
        <span>Selected: {selectedCards.length}</span>
        {gameState.pendingQuestion && (
          <span className="text-yellow-600 font-bold">⚠ Question card needs answer!</span>
        )}
        {!isMyTurn && (
          <span className="text-blue-600 font-bold">🤖 Computer's turn</span>
        )}
        {canDeclareNikoKadi && isMyTurn && (
          <span className="text-yellow-600 font-bold animate-bounce">
            ⚡ You must declare "Niko Kadi"!
          </span>
        )}
      </div>
    </div>
  );
};