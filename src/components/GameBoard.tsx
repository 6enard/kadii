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
    <div className="flex items-center justify-center space-x-8 p-6 bg-green-600 rounded-lg">
      {/* Draw Pile */}
      <div className="text-center">
        <div
          className="w-20 h-28 bg-blue-900 rounded-lg border-2 border-blue-700 
                     cursor-pointer hover:bg-blue-800 transition-colors duration-200
                     flex items-center justify-center shadow-lg"
          onClick={onDrawCard}
        >
          <div className="text-white font-bold text-sm">DRAW</div>
        </div>
        <div className="mt-2 text-white text-sm">
          {gameState.drawPile.length} cards
        </div>
      </div>
      
      {/* Game Info */}
      <div className="text-center text-white">
        <div className="bg-black bg-opacity-30 rounded-lg p-4">
          {gameState.drawStack > 0 && (
            <div className="mb-2 text-red-300 font-bold">
              Penalty: +{gameState.drawStack} cards
            </div>
          )}
          
          {gameState.selectedSuit && (
            <div className="mb-2 text-yellow-300 font-bold">
              Current Suit: {gameState.selectedSuit}
            </div>
          )}
          
          <div className="text-sm opacity-75">
            Turn: {gameState.players[gameState.currentPlayerIndex].name}
          </div>
        </div>
      </div>
      
      {/* Discard Pile */}
      <div className="text-center">
        <Card
          card={topCard}
          size="large"
        />
        <div className="mt-2 text-white text-sm">
          Discard Pile
        </div>
      </div>
    </div>
  );
};