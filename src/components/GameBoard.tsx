import React from 'react';
import { GameState } from '../types';
import { Card } from './Card';
import { getTopCard } from '../utils/gameLogic';
import { Shuffle, Target, AlertTriangle, Zap } from 'lucide-react';

interface GameBoardProps {
  gameState: GameState;
  onDrawCard: () => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({ gameState, onDrawCard }) => {
  const topCard = getTopCard(gameState);
  
  // Get the last 3 cards from discard pile for fanning effect
  const recentCards = gameState.discardPile.slice(-3);
  
  return (
    <div className="p-4 sm:p-6">
      {/* Casino-style Game Table */}
      <div className="bg-gradient-to-br from-emerald-800/60 via-emerald-900/60 to-emerald-800/60 backdrop-blur-sm rounded-2xl border border-emerald-400/30 p-4 sm:p-6 shadow-2xl relative overflow-hidden">
        {/* Felt texture background */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, #10b981 0%, transparent 50%), radial-gradient(circle at 75% 75%, #059669 0%, transparent 50%)`
        }}></div>
        
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0 sm:space-x-6">
          {/* Draw Pile */}
          <div className="flex flex-col items-center space-y-3">
            <div
              className="w-16 h-22 sm:w-18 sm:h-24 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 rounded-xl border-2 border-emerald-400/60 
                         cursor-pointer hover:border-emerald-300 transition-all duration-300
                         flex items-center justify-center transform hover:scale-110 relative overflow-hidden group shadow-2xl"
              onClick={onDrawCard}
            >
              {/* Animated background */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              {/* Card back design */}
              <div className="relative z-10 flex flex-col items-center justify-center text-emerald-400">
                <Shuffle size={18} className="mb-2 group-hover:rotate-180 transition-transform duration-500" />
                <div className="text-xs font-bold">DRAW</div>
              </div>
              
              {/* Glow effect */}
              <div className="absolute inset-0 rounded-xl bg-emerald-400/30 opacity-0 group-hover:opacity-100 transition-opacity blur-sm"></div>
            </div>
            
            <div className="text-center bg-black/40 rounded-lg px-3 py-1 border border-emerald-500/30">
              <div className="text-white font-bold text-sm">{gameState.drawPile.length}</div>
              <div className="text-emerald-300 text-xs">remaining</div>
            </div>
          </div>
          
          {/* Center Game Info */}
          <div className="flex-1 max-w-xs">
            <div className="bg-black/50 backdrop-blur-md rounded-xl border border-yellow-500/30 p-4 text-center shadow-xl">
              {/* Current Turn Indicator */}
              <div className="mb-3">
                <div className="text-yellow-400 text-xs mb-1 font-medium">CURRENT TURN</div>
                <div className="text-white font-bold text-sm flex items-center justify-center space-x-2">
                  <Zap size={16} className="text-yellow-400 animate-pulse" />
                  <span>{gameState.players[gameState.currentPlayerIndex].name}</span>
                </div>
              </div>
              
              {/* Game Status Messages */}
              <div className="space-y-2">
                {gameState.drawStack > 0 && (
                  <div className="bg-red-500/30 border border-red-400/50 rounded-lg p-2 animate-pulse">
                    <div className="flex items-center justify-center space-x-1 text-red-200">
                      <AlertTriangle size={14} />
                      <span className="font-bold text-xs">+{gameState.drawStack} PENALTY</span>
                    </div>
                  </div>
                )}
                
                {gameState.selectedSuit && (
                  <div className="bg-yellow-500/30 border border-yellow-400/50 rounded-lg p-2">
                    <div className="flex items-center justify-center space-x-1 text-yellow-200">
                      <Target size={14} />
                      <span className="font-bold text-xs capitalize">SUIT: {gameState.selectedSuit}</span>
                    </div>
                  </div>
                )}
                
                {gameState.pendingQuestion && (
                  <div className="bg-orange-500/30 border border-orange-400/50 rounded-lg p-2 animate-bounce">
                    <div className="text-orange-200 font-bold text-xs">
                      ❓ ANSWER REQUIRED!
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Discard Pile with Casino Fanning Effect */}
          <div className="flex flex-col items-center space-y-3">
            <div className="relative">
              {/* Fanned out cards showing history */}
              <div className="relative w-16 h-22 sm:w-18 sm:h-24">
                {recentCards.map((card, index) => {
                  const isTopCard = index === recentCards.length - 1;
                  const rotation = (index - 1) * 3; // Spread cards with rotation
                  const xOffset = (index - 1) * 2; // Horizontal offset
                  const yOffset = (index - 1) * 1; // Slight vertical offset
                  const zIndex = index + 1;
                  
                  return (
                    <div
                      key={`${card.id}-${index}`}
                      className="absolute inset-0 transition-all duration-500"
                      style={{
                        transform: `rotate(${rotation}deg) translateX(${xOffset}px) translateY(${yOffset}px)`,
                        zIndex: zIndex,
                        opacity: isTopCard ? 1 : 0.8
                      }}
                    >
                      <Card
                        card={card}
                        size="small"
                      />
                      {isTopCard && (
                        <div className="absolute inset-0 rounded-xl bg-yellow-400/30 blur-lg -z-10 animate-pulse"></div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="text-center bg-black/40 rounded-lg px-3 py-1 border border-yellow-500/30">
              <div className="text-white font-bold text-sm">{gameState.discardPile.length}</div>
              <div className="text-yellow-300 text-xs">played</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Floating game status */}
      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 backdrop-blur-md rounded-full px-4 py-2 border border-emerald-400/50 shadow-lg">
          <div className="text-white font-medium text-xs flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>GAME ACTIVE</span>
          </div>
        </div>
      </div>
    </div>
  );
};