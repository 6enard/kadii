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
  const isMyTurn = gameState.currentPlayerIndex === 0; // Assuming player 1 is always the human player
  
  // Get card names for display
  const getSelectedCardNames = () => {
    if (selectedCards.length === 0) return '';
    
    const cards = selectedCards.map(id => 
      currentPlayer.hand.find(c => c.id === id)
    ).filter(Boolean);
    
    if (cards.length === 1) {
      return `${cards[0]!.rank}${cards[0]!.suit}`;
    }
    
    // Group by rank for better display
    const rankGroups = new Map<string, number>();
    cards.forEach(card => {
      if (card) {
        rankGroups.set(card.rank, (rankGroups.get(card.rank) || 0) + 1);
      }
    });
    
    const groupStrings = Array.from(rankGroups.entries()).map(([rank, count]) => 
      count > 1 ? `${count}×${rank}` : rank
    );
    
    return groupStrings.join(', ');
  };
  
  return (
    <div className="space-y-4">
      {/* Dedicated Niko Kadi Button - Always visible */}
      <div className="flex justify-center">
        <button
          onClick={onDeclareNikoKadi}
          disabled={!isMyTurn}
          className={`px-12 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 
                     text-white font-bold text-lg rounded-xl transition-all duration-200 transform hover:scale-105
                     shadow-xl border-4 border-yellow-300 ring-4 ring-yellow-200
                     ${!isMyTurn ? 'opacity-50 cursor-not-allowed' : 'animate-pulse'}
                     ${currentPlayer.hand.length === 1 && !currentPlayer.nikoKadiCalled ? 'animate-bounce' : ''}`}
        >
          🎯 DECLARE "NIKO KADI"! 🎯
        </button>
      </div>

      {/* Main Controls */}
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
          {selectedCards.length > 0 ? (
            <span>
              Play {selectedCards.length} Card{selectedCards.length > 1 ? 's' : ''} 
              <span className="text-xs block opacity-90">
                ({getSelectedCardNames()})
              </span>
            </span>
          ) : (
            'Select Cards to Play'
          )}
        </button>
        
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
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-600 w-full">
          <span className="bg-blue-100 px-3 py-1 rounded-full">
            Selected: {selectedCards.length} card{selectedCards.length !== 1 ? 's' : ''}
          </span>
          
          {selectedCards.length > 0 && (
            <span className="bg-green-100 px-3 py-1 rounded-full text-green-700">
              {getSelectedCardNames()}
            </span>
          )}
          
          {gameState.pendingQuestion && (
            <span className="text-red-600 font-bold animate-pulse bg-red-100 px-3 py-1 rounded-full">
              🚨 QUESTION MUST BE ANSWERED! 🚨
            </span>
          )}
          
          {!isMyTurn && (
            <span className="text-blue-600 font-bold bg-blue-100 px-3 py-1 rounded-full">
              🤖 Computer's turn
            </span>
          )}
          
          {hasPenalty && (
            <span className="text-red-600 font-bold bg-red-100 px-3 py-1 rounded-full">
              ⚡ Penalty: {gameState.drawStack} cards - Counter with 2, 3, or A!
            </span>
          )}
        </div>
      </div>
      
      {/* Stacking Help */}
      {selectedCards.length > 1 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="text-center text-blue-800">
            <div className="font-semibold mb-1">🃏 Card Stacking Active!</div>
            <div className="text-sm">
              You can play multiple cards: same ranks (4♥ 4♠ 4♦) or valid sequences (Q♥ Q♠ 8♠)
            </div>
          </div>
        </div>
      )}
    </div>
  );
};