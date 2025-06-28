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
    <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-xl p-4 shadow-2xl border border-red-500">
      <div className="flex items-center justify-between">
        {/* Draw Pile - Enhanced with Prominent Coat of Arms */}
        <div className="text-center">
          <div
            className="w-20 h-28 bg-gradient-to-br from-red-800 to-red-900 rounded-xl border-2 border-yellow-400 
                       cursor-pointer hover:from-red-700 hover:to-red-800 transition-all duration-300
                       flex items-center justify-center shadow-xl transform hover:scale-105 relative overflow-hidden"
            onClick={onDrawCard}
          >
            {/* VERY PROMINENT Kenyan coat of arms - Much larger and brighter */}
            <div className="absolute inset-0 flex items-center justify-center">
              <img 
                src="/src/assets/Coat_of_arms_of_Kenya_(Official).svg.png" 
                alt="Kenya Coat of Arms"
                className="w-16 h-16 object-contain opacity-90 filter brightness-150 contrast-125 saturate-150"
                style={{
                  filter: 'brightness(1.5) contrast(1.25) saturate(1.5) drop-shadow(0 0 4px rgba(255,255,255,0.3))'
                }}
              />
            </div>
            
            {/* Bright golden border frame */}
            <div className="absolute inset-1 border-2 border-yellow-300 opacity-80 rounded-lg"></div>
            
            {/* Corner golden decorations - larger and brighter */}
            <div className="absolute top-1 left-1 w-4 h-4 bg-yellow-300 opacity-90 rounded-sm"></div>
            <div className="absolute top-1 right-1 w-4 h-4 bg-yellow-300 opacity-90 rounded-sm"></div>
            <div className="absolute bottom-1 left-1 w-4 h-4 bg-yellow-300 opacity-90 rounded-sm"></div>
            <div className="absolute bottom-1 right-1 w-4 h-4 bg-yellow-300 opacity-90 rounded-sm"></div>
            
            {/* "DRAW" text with better contrast */}
            <div className="absolute bottom-2 left-0 right-0 text-center">
              <div className="text-yellow-200 font-bold text-xs z-10 drop-shadow-lg">DRAW</div>
            </div>
            
            {/* "KADI" text at top with better contrast */}
            <div className="absolute top-2 left-0 right-0 text-center">
              <div className="text-yellow-200 font-bold text-xs z-10 drop-shadow-lg">KADI</div>
            </div>
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