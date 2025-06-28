import React from 'react';
import { GameState } from '../types';
import { Card } from './Card';
import { getTopCard } from '../utils/gameLogic';

interface GameBoardProps {
  gameState: GameState;
  onDrawCard: () => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({ gameState, onDrawCard }) => {
  const topCard = getTopCard(gameState);
  
  return (
    <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-3 shadow-2xl border border-green-500">
      <div className="flex items-center justify-between">
        {/* Draw Pile */}
        <div className="text-center">
          <div
            className="w-16 h-22 bg-gradient-to-br from-blue-900 to-blue-800 rounded-xl border-2 border-blue-700 
                       cursor-pointer hover:from-blue-800 hover:to-blue-700 transition-all duration-300
                       flex items-center justify-center shadow-xl transform hover:scale-105 relative overflow-hidden"
            onClick={onDrawCard}
          >
            {/* Kenyan coat of arms background */}
            <div className="absolute inset-0 flex items-center justify-center opacity-10">
              <img 
                src="/src/assets/Coat_of_arms_of_Kenya_(Official).svg.png" 
                alt="Kenya Coat of Arms"
                className="w-8 h-8 object-contain"
              />
            </div>
            <div className="text-white font-bold text-xs z-10">DRAW</div>
          </div>
          <div className="mt-1 text-white text-xs font-medium">
            {gameState.drawPile.length} cards
          </div>
        </div>
        
        {/* Game Info - Compact */}
        <div className="text-center text-white flex-1 mx-4">
          <div className="bg-black bg-opacity-30 rounded-xl p-3 backdrop-blur-sm border border-white border-opacity-20">
            {gameState.drawStack > 0 && (
              <div className="mb-1 text-red-300 font-bold text-sm animate-pulse">
                ⚡ Penalty: +{gameState.drawStack} cards
              </div>
            )}
            
            {gameState.selectedSuit && (
              <div className="mb-1 text-yellow-300 font-bold text-sm">
                🎯 Suit: <span className="capitalize">{gameState.selectedSuit}</span>
              </div>
            )}
            
            {gameState.pendingQuestion && (
              <div className="mb-1 text-orange-300 font-bold text-sm animate-bounce">
                ❓ Question needs answer!
              </div>
            )}
            
            <div className="text-xs opacity-90">
              <span className="font-semibold">Turn:</span> {gameState.players[gameState.currentPlayerIndex].name}
            </div>
          </div>
        </div>
        
        {/* Discard Pile */}
        <div className="text-center">
          <div className="transform hover:scale-105 transition-transform duration-300">
            <Card
              card={topCard}
              size="medium"
            />
          </div>
          <div className="mt-1 text-white text-xs font-medium">
            Discard Pile
          </div>
        </div>
      </div>
    </div>
  );
};