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
    <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-4 shadow-2xl border border-green-500">
      <div className="flex items-center justify-between">
        {/* Draw Pile */}
        <div className="text-center">
          <div
            className="w-20 h-28 bg-gradient-to-br from-blue-900 to-blue-800 rounded-xl border-2 border-blue-700 
                       cursor-pointer hover:from-blue-800 hover:to-blue-700 transition-all duration-300
                       flex items-center justify-center shadow-xl transform hover:scale-105 relative overflow-hidden"
            onClick={onDrawCard}
          >
            {/* Kenyan coat of arms background */}
            <div className="absolute inset-0 flex items-center justify-center opacity-10">
              <img 
                src="/src/assets/Coat_of_arms_of_Kenya_(Official).svg.png" 
                alt="Kenya Coat of Arms"
                className="w-12 h-12 object-contain"
              />
            </div>
            <div className="text-white font-bold text-sm z-10">DRAW</div>
          </div>
          <div className="mt-2 text-white text-sm font-medium">
            {gameState.drawPile.length} cards
          </div>
        </div>
        
        {/* Game Info */}
        <div className="text-center text-white flex-1 mx-8">
          <div className="bg-black bg-opacity-30 rounded-xl p-4 backdrop-blur-sm border border-white border-opacity-20">
            {gameState.drawStack > 0 && (
              <div className="mb-2 text-red-300 font-bold text-lg animate-pulse">
                ⚡ Penalty: +{gameState.drawStack} cards
              </div>
            )}
            
            {gameState.selectedSuit && (
              <div className="mb-2 text-yellow-300 font-bold">
                🎯 Current Suit: <span className="capitalize">{gameState.selectedSuit}</span>
              </div>
            )}
            
            {gameState.pendingQuestion && (
              <div className="mb-2 text-orange-300 font-bold animate-bounce">
                ❓ Question needs answer!
              </div>
            )}
            
            <div className="text-sm opacity-90">
              <span className="font-semibold">Turn:</span> {gameState.players[gameState.currentPlayerIndex].name}
            </div>
          </div>
        </div>
        
        {/* Discard Pile */}
        <div className="text-center">
          <div className="transform hover:scale-105 transition-transform duration-300">
            <Card
              card={topCard}
              size="large"
            />
          </div>
          <div className="mt-2 text-white text-sm font-medium">
            Discard Pile
          </div>
        </div>
      </div>
    </div>
  );
};