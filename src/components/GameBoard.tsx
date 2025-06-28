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
    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
      <div className="bg-gradient-to-br from-green-800/80 to-emerald-800/80 backdrop-blur-xl rounded-3xl p-8 border border-green-600/50 shadow-2xl">
        <div className="grid grid-cols-3 gap-8 items-center">
          
          {/* Draw Pile */}
          <div className="text-center">
            <div
              className="w-24 h-32 mx-auto bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl border-2 border-blue-500/50 
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
                  className="w-16 h-16 object-contain"
                />
              </div>
              <div className="text-white font-bold text-lg z-10 group-hover:scale-110 transition-transform">
                DRAW
              </div>
            </div>
            <div className="mt-3 text-green-200 text-sm font-mono bg-green-900/50 px-3 py-1 rounded-full inline-block">
              {gameState.drawPile.length} CARDS
            </div>
          </div>
          
          {/* Game Status - Central Command */}
          <div className="text-center">
            <div className="bg-black/40 rounded-2xl p-6 backdrop-blur-sm border border-green-600/30 min-w-[280px]">
              
              {/* Current Turn Indicator */}
              <div className="mb-4">
                <div className="text-xs text-green-300 uppercase tracking-wider mb-2">CURRENT TURN</div>
                <div className="text-xl font-bold text-white bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  {gameState.players[gameState.currentPlayerIndex].name}
                </div>
              </div>
              
              {/* Active Effects */}
              <div className="space-y-3">
                {gameState.drawStack > 0 && (
                  <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 animate-pulse">
                    <div className="flex items-center justify-center space-x-2 text-red-300">
                      <Zap size={18} />
                      <span className="font-bold">PENALTY: +{gameState.drawStack} CARDS</span>
                    </div>
                  </div>
                )}
                
                {gameState.selectedSuit && (
                  <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-3">
                    <div className="flex items-center justify-center space-x-2 text-yellow-300">
                      <Target size={18} />
                      <span className="font-bold">SUIT: {gameState.selectedSuit.toUpperCase()}</span>
                    </div>
                  </div>
                )}
                
                {gameState.pendingQuestion && (
                  <div className="bg-orange-500/20 border border-orange-500/50 rounded-lg p-3 animate-bounce">
                    <div className="flex items-center justify-center space-x-2 text-orange-300">
                      <AlertTriangle size={18} />
                      <span className="font-bold">QUESTION PENDING!</span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Game Phase */}
              <div className="mt-4 text-xs text-green-400 uppercase tracking-wider">
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
            <div className="mt-3 text-green-200 text-sm font-mono bg-green-900/50 px-3 py-1 rounded-full inline-block">
              DISCARD PILE
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};