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
  const isMyTurn = gameState.currentPlayerIndex === 0; // Assuming player 1 is always the human player
  
  return (
    <div className="space-y-6">
      {/* Niko Kadi Declaration - Prominent Button */}
      <div className="flex justify-center">
        <button
          onClick={onDeclareNikoKadi}
          disabled={!isMyTurn}
          className={`
            relative px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 transform
            ${!isMyTurn 
              ? 'opacity-50 cursor-not-allowed bg-slate-700 text-white/60' 
              : currentPlayer.hand.length === 1 && !currentPlayer.nikoKadiCalled
                ? 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black shadow-2xl animate-bounce hover:scale-110'
                : 'bg-gradient-to-r from-yellow-500/80 to-orange-600/80 hover:from-yellow-500 hover:to-orange-600 text-white shadow-xl hover:scale-105'
            }
          `}
        >
          {/* Glow effect for urgent declaration */}
          {currentPlayer.hand.length === 1 && !currentPlayer.nikoKadiCalled && isMyTurn && (
            <div className="absolute inset-0 rounded-2xl bg-yellow-400/50 blur-lg animate-pulse -z-10"></div>
          )}
          
          <div className="flex items-center space-x-2">
            <Target size={24} />
            <span>DECLARE "NIKO KADI"!</span>
            <Target size={24} />
          </div>
          
          {currentPlayer.hand.length === 1 && !currentPlayer.nikoKadiCalled && isMyTurn && (
            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
              URGENT!
            </div>
          )}
        </button>
      </div>

      {/* Main Action Controls */}
      <div className="bg-black/30 backdrop-blur-md rounded-2xl border border-white/20 p-6">
        <div className="flex flex-wrap gap-4 justify-center items-center">
          {/* Play Cards Button */}
          <button
            onClick={onPlayCards}
            disabled={!canPlaySelected || selectedCards.length === 0 || !isMyTurn}
            className={`
              flex items-center space-x-3 px-6 py-3 rounded-xl font-semibold transition-all duration-200 transform
              ${canPlaySelected && selectedCards.length > 0 && isMyTurn
                ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-lg hover:scale-105' 
                : 'bg-slate-600 text-white/60 cursor-not-allowed'
              }
            `}
          >
            <Play size={20} />
            <span>
              Play {selectedCards.length > 0 ? `${selectedCards.length} Card${selectedCards.length > 1 ? 's' : ''}` : 'Cards'}
            </span>
          </button>
          
          {/* Draw Penalty Button */}
          {hasPenalty && isMyTurn && (
            <button
              onClick={onDrawPenalty}
              className="flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              <Plus size={20} />
              <span>Draw {gameState.drawStack} Penalty Cards</span>
            </button>
          )}
        </div>
        
        {/* Game Status Indicators */}
        <div className="mt-4 flex flex-wrap gap-4 justify-center text-sm">
          <div className="flex items-center space-x-2 text-white/80">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            <span>Selected: {selectedCards.length}/6</span>
          </div>
          
          {gameState.pendingQuestion && (
            <div className="flex items-center space-x-2 text-orange-300 font-bold animate-pulse">
              <AlertTriangle size={16} />
              <span>QUESTION MUST BE ANSWERED!</span>
            </div>
          )}
          
          {!isMyTurn && (
            <div className="flex items-center space-x-2 text-blue-300 font-medium">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <span>Opponent's turn</span>
            </div>
          )}
          
          {hasPenalty && (
            <div className="flex items-center space-x-2 text-red-300 font-bold">
              <AlertTriangle size={16} />
              <span>Penalty: {gameState.drawStack} cards - Counter with 2, 3, or A!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};