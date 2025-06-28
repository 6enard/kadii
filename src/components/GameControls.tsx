import React from 'react';
import { GameState } from '../types';
import { getCurrentPlayer } from '../utils/gameLogic';
import { Play, Zap, Target } from 'lucide-react';

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
      {/* Dedicated Niko Kadi Button */}
      <div className="text-center">
        <button
          onClick={onDeclareNikoKadi}
          disabled={!isMyTurn}
          className={`
            px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400
            text-black font-bold text-lg rounded-xl transition-all duration-200 transform hover:scale-105
            shadow-2xl border-2 border-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed
            ${isMyTurn ? 'animate-pulse shadow-yellow-500/50' : ''}
            ${currentPlayer.hand.length === 1 && !currentPlayer.nikoKadiCalled ? 'animate-bounce' : ''}
          `}
        >
          <Target className="inline mr-2" size={20} />
          NIKO KADI
        </button>
      </div>

      {/* Main Controls */}
      <div className="space-y-3">
        {/* Play Cards Button */}
        <button
          onClick={onPlayCards}
          disabled={!canPlaySelected || selectedCards.length === 0 || !isMyTurn}
          className={`
            w-full p-4 rounded-xl font-bold transition-all duration-200 transform hover:scale-105
            ${canPlaySelected && selectedCards.length > 0 && isMyTurn
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white shadow-lg shadow-green-500/30' 
              : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          <div className="flex items-center justify-center space-x-2">
            <Play size={20} />
            <div>
              {selectedCards.length > 0 ? (
                <>
                  <div>PLAY {selectedCards.length} CARD{selectedCards.length > 1 ? 'S' : ''}</div>
                  <div className="text-xs opacity-90">({getSelectedCardNames()})</div>
                </>
              ) : (
                <div>SELECT CARDS</div>
              )}
            </div>
          </div>
        </button>
        
        {/* Draw Penalty Button */}
        {hasPenalty && isMyTurn && (
          <button
            onClick={onDrawPenalty}
            className="w-full p-4 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-400 hover:to-pink-400 
                       text-white font-bold rounded-xl transition-all duration-200 transform hover:scale-105
                       shadow-lg shadow-red-500/30"
          >
            <div className="flex items-center justify-center space-x-2">
              <Zap size={20} />
              <span>DRAW {gameState.drawStack} PENALTY</span>
            </div>
          </button>
        )}
      </div>
      
      {/* Status Indicators */}
      <div className="space-y-2 text-center text-sm">
        {gameState.pendingQuestion && (
          <div className="bg-red-500/20 border border-red-500/50 px-3 py-2 rounded-lg text-red-300 animate-pulse">
            🚨 ANSWER REQUIRED
          </div>
        )}
        
        {!isMyTurn && (
          <div className="bg-blue-500/20 border border-blue-500/50 px-3 py-2 rounded-lg text-blue-300">
            🤖 OPPONENT'S TURN
          </div>
        )}
        
        {selectedCards.length > 1 && (
          <div className="bg-cyan-500/20 border border-cyan-500/50 px-3 py-2 rounded-lg text-cyan-300">
            🃏 STACKING: {getSelectedCardNames()}
          </div>
        )}
      </div>
    </div>
  );
};