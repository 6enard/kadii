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
    <div className="relative z-10">
      <div className="flex items-center justify-center space-x-12">
        {/* Draw Pile */}
        <div className="text-center">
          <div
            className="w-24 h-32 bg-gradient-to-br from-blue-900 to-blue-800 rounded-xl border-2 border-blue-700 
                       cursor-pointer hover:from-blue-800 hover:to-blue-700 transition-all duration-300
                       flex items-center justify-center shadow-2xl transform hover:scale-105 relative overflow-hidden"
            onClick={onDrawCard}
          >
            {/* Card back pattern */}
            <div className="absolute inset-0 opacity-20">
              <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl"></div>
              <div className="absolute inset-2 border-2 border-blue-300 rounded-lg"></div>
              <div className="absolute inset-4 border border-blue-200 rounded-md"></div>
            </div>
            <div className="text-white font-bold text-lg z-10">DRAW</div>
          </div>
          <div className="mt-3 text-white text-sm font-medium bg-black bg-opacity-30 px-3 py-1 rounded-full">
            {gameState.drawPile.length} cards
          </div>
        </div>
        
        {/* Game Info Center */}
        <div className="text-center text-white flex-1 max-w-md">
          <div className="bg-black bg-opacity-40 rounded-2xl p-6 backdrop-blur-sm border border-yellow-500 shadow-xl">
            {gameState.drawStack > 0 && (
              <div className="mb-4 text-red-300 font-bold text-xl animate-pulse">
                ⚡ PENALTY: +{gameState.drawStack} cards
              </div>
            )}
            
            {gameState.selectedSuit && (
              <div className="mb-4 text-yellow-300 font-bold text-lg">
                🎯 Current Suit: <span className="capitalize text-yellow-100">{gameState.selectedSuit}</span>
              </div>
            )}
            
            {gameState.pendingQuestion && (
              <div className="mb-4 text-orange-300 font-bold text-lg animate-bounce">
                ❓ Question needs answer!
              </div>
            )}
            
            <div className="text-lg font-semibold">
              <span className="text-yellow-300">Current Turn:</span>
              <div className="text-white mt-1">
                {gameState.players[gameState.currentPlayerIndex].name}
              </div>
            </div>
          </div>
        </div>
        
        {/* Discard Pile */}
        <div className="text-center">
          <div className="transform hover:scale-105 transition-transform duration-300 shadow-2xl">
            <div className="w-24 h-32 bg-white rounded-xl border-2 border-gray-300 flex flex-col justify-between p-3 shadow-2xl">
              {/* Top corner */}
              <div className={`font-bold text-center leading-tight ${
                topCard.suit === 'hearts' || topCard.suit === 'diamonds' ? 'text-red-500' : 'text-black'
              }`}>
                <div className="font-black text-sm">{topCard.rank}</div>
                <div className="text-lg">
                  {topCard.suit === 'hearts' ? '♥' : 
                   topCard.suit === 'diamonds' ? '♦' : 
                   topCard.suit === 'clubs' ? '♣' : '♠'}
                </div>
              </div>
              
              {/* Center suit symbol */}
              <div className="flex-1 flex items-center justify-center">
                <div className={`text-3xl font-bold ${
                  topCard.suit === 'hearts' || topCard.suit === 'diamonds' ? 'text-red-500' : 'text-black'
                }`}>
                  {topCard.suit === 'hearts' ? '♥' : 
                   topCard.suit === 'diamonds' ? '♦' : 
                   topCard.suit === 'clubs' ? '♣' : '♠'}
                </div>
              </div>
              
              {/* Bottom corner (rotated) */}
              <div className={`font-bold rotate-180 text-center leading-tight ${
                topCard.suit === 'hearts' || topCard.suit === 'diamonds' ? 'text-red-500' : 'text-black'
              }`}>
                <div className="font-black text-sm">{topCard.rank}</div>
                <div className="text-lg">
                  {topCard.suit === 'hearts' ? '♥' : 
                   topCard.suit === 'diamonds' ? '♦' : 
                   topCard.suit === 'clubs' ? '♣' : '♠'}
                </div>
              </div>
            </div>
          </div>
          <div className="mt-3 text-white text-sm font-medium bg-black bg-opacity-30 px-3 py-1 rounded-full">
            Discard Pile
          </div>
        </div>
      </div>
    </div>
  );
};