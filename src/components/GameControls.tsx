import React from 'react';
import { GameState } from '../types';
import { getCurrentPlayer } from '../utils/gameLogic';
import { Play, Plus, AlertTriangle, Target, Layers } from 'lucide-react';

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
  
  // Get selected card details for better UI feedback
  const selectedCardDetails = selectedCards.map(id => 
    currentPlayer.hand.find(card => card.id === id)
  ).filter(Boolean);
  
  const hasQuestions = selectedCardDetails.some(card => card?.rank === 'Q' || card?.rank === '8');
  const hasSameRank = selectedCardDetails.length > 1 && 
    selectedCardDetails.every(card => card?.rank === selectedCardDetails[0]?.rank);
  
  return (
    <div className="space-y-4">
      {/* Niko Kadi Declaration - Compact */}
      <div className="flex justify-center">
        <button
          onClick={onDeclareNikoKadi}
          disabled={!isMyTurn}
          className={`
            relative px-6 py-2 rounded-xl font-bold text-sm transition-all duration-300 transform
            ${!isMyTurn 
              ? 'opacity-50 cursor-not-allowed bg-slate-700 text-white/60' 
              : currentPlayer.hand.length === 1 && !currentPlayer.nikoKadiCalled
                ? 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black shadow-xl animate-pulse hover:scale-105'
                : 'bg-gradient-to-r from-yellow-500/80 to-orange-600/80 hover:from-yellow-500 hover:to-orange-600 text-white shadow-lg hover:scale-105'
            }
          `}
        >
          <div className="flex items-center space-x-2">
            <Target size={16} />
            <span>DECLARE "NIKO KADI"!</span>
          </div>
          
          {currentPlayer.hand.length === 1 && !currentPlayer.nikoKadiCalled && isMyTurn && (
            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-1 py-0.5 rounded-full animate-pulse">
              !
            </div>
          )}
        </button>
      </div>

      {/* Main Action Controls - Compact */}
      <div className="bg-black/30 backdrop-blur-md rounded-xl border border-white/20 p-4">
        <div className="flex flex-wrap gap-3 justify-center items-center">
          {/* Play Cards Button */}
          <button
            onClick={onPlayCards}
            disabled={!canPlaySelected || selectedCards.length === 0 || !isMyTurn}
            className={`
              flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold transition-all duration-200 transform text-sm
              ${canPlaySelected && selectedCards.length > 0 && isMyTurn
                ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-lg hover:scale-105' 
                : 'bg-slate-600 text-white/60 cursor-not-allowed'
              }
            `}
          >
            <Play size={16} />
            <span>
              Play {selectedCards.length > 0 ? `${selectedCards.length}` : 'Cards'}
            </span>
            {hasSameRank && selectedCards.length > 1 && (
              <Layers size={14} className="text-emerald-300" />
            )}
          </button>
          
          {/* Draw Penalty Button */}
          {hasPenalty && isMyTurn && (
            <button
              onClick={onDrawPenalty}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg text-sm"
            >
              <Plus size={16} />
              <span>Draw {gameState.drawStack}</span>
            </button>
          )}
        </div>
        
        {/* Game Status Indicators - Compact */}
        <div className="mt-3 flex flex-wrap gap-3 justify-center text-xs">
          <div className="flex items-center space-x-1 text-white/80">
            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
            <span>Selected: {selectedCards.length}/6</span>
          </div>
          
          {hasSameRank && selectedCards.length > 1 && (
            <div className="flex items-center space-x-1 text-emerald-300 font-medium">
              <Layers size={12} />
              <span>Stacking {selectedCardDetails[0]?.rank}s</span>
            </div>
          )}
          
          {hasQuestions && (
            <div className="flex items-center space-x-1 text-orange-300 font-medium">
              <AlertTriangle size={12} />
              <span>Questions selected</span>
            </div>
          )}
          
          {gameState.pendingQuestion && (
            <div className="flex items-center space-x-1 text-orange-300 font-bold animate-pulse">
              <AlertTriangle size={12} />
              <span>ANSWER NEEDED!</span>
            </div>
          )}
          
          {!isMyTurn && (
            <div className="flex items-center space-x-1 text-blue-300 font-medium">
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
              <span>Opponent's turn</span>
            </div>
          )}
          
          {hasPenalty && (
            <div className="flex items-center space-x-1 text-red-300 font-bold">
              <AlertTriangle size={12} />
              <span>Penalty: {gameState.drawStack} cards</span>
            </div>
          )}
        </div>
        
        {/* Card Stacking Help - Compact */}
        {selectedCards.length > 1 && (
          <div className="mt-3 bg-blue-500/10 border border-blue-500/20 rounded-lg p-2">
            <div className="text-blue-300 text-xs">
              <strong>💡 Stacking:</strong>
              {hasSameRank 
                ? ` ${selectedCards.length} ${selectedCardDetails[0]?.rank}s together!`
                : ` ${selectedCards.length} cards in sequence!`
              }
            </div>
          </div>
        )}
      </div>
    </div>
  );
};