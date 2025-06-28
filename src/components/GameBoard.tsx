import React from 'react';
import { GameState } from '../types';
import { Card } from './Card';
import { getTopCard } from '../utils/gameLogic';
import { Zap, Target, AlertTriangle } from 'lucide-react';

interface GameBoardProps {
  gameState: GameState;
  onDrawCard: () => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({ gameState, onDrawCard }) => {
  const topCard = getTopCard(gameState);
  
  return (
    <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl rounded-2xl p-6 border border-gray-600/50 shadow-2xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
        
        {/* Draw Pile */}
        <div className="text-center">
          <div
            className="w-20 h-28 mx-auto bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl border-2 border-blue-500/50 
                       cursor-pointer hover:from-blue-500 hover:to-blue-700 transition-all duration-300
                       flex items-center justify-center shadow-xl transform hover:scale-105 relative overflow-hidden
                       group"
            onClick={onDrawCard}
          >
            {/* Kenyan coat of arms background */}
            <div className="absolute inset-0 flex items-center justify-center opacity-10 group-hover:opacity-20 transition-opacity">
              <img 
                src="/src/assets/Coat_of_arms_of_Kenya_(Official).svg.png" 
                alt="Kenya Coat of Arms"
                className="w-12 h-12 object-contain"
              />
            </div>
            <div className="text-white font-bold text-sm z-10 group-hover:scale-110 transition-transform">
              DRAW
            </div>
          </div>
          <div className="mt-3 text-gray-300 text-sm font-mono bg-gray-800/50 px-3 py-1 rounded-full inline-block">
            {gameState.drawPile.length} CARDS
          </div>
        </div>
        
        {/* Game Status - Urban Command Center */}
        <div className="text-center">
          <div className="bg-black/40 rounded-2xl p-4 backdrop-blur-sm border border-gray-600/30">
            
            {/* Current Turn Indicator */}
            <div className="mb-4">
              <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">CURRENT TURN</div>
              <div className="text-lg font-bold text-white bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                {gameState.players[gameState.currentPlayerIndex].name}
              </div>
            </div>
            
            {/* Active Effects */}
            <div className="space-y-2">
              {gameState.drawStack > 0 && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 animate-pulse">
                  <div className="flex items-center justify-center space-x-2 text-red-300">
                    <Zap size={16} />
                    <span className="font-bold">PENALTY: +{gameState.drawStack} CARDS</span>
                  </div>
                </div>
              )}
              
              {gameState.selectedSuit && (
                <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-3">
                  <div className="flex items-center justify-center space-x-2 text-yellow-300">
                    <Target size={16} />
                    <span className="font-bold">SUIT: {gameState.selectedSuit.toUpperCase()}</span>
                  </div>
                </div>
              )}
              
              {gameState.pendingQuestion && (
                <div className="bg-orange-500/20 border border-orange-500/50 rounded-lg p-3 animate-bounce">
                  <div className="flex items-center justify-center space-x-2 text-orange-300">
                    <AlertTriangle size={16} />
                    <span className="font-bold">QUESTION PENDING!</span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Game Phase */}
            <div className="mt-4 text-xs text-gray-500 uppercase tracking-wider">
              {gameState.gamePhase === 'playing' ? 'IN PROGRESS' : gameState.gamePhase.toUpperCase()}
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
          <div className="mt-3 text-gray-300 text-sm font-mono bg-gray-800/50 px-3 py-1 rounded-full inline-block">
            DISCARD PILE
          </div>
        </div>
      </div>
    </div>
  );
};