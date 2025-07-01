import React from 'react';
import { GameState } from '../types';
import { Card } from './Card';
import { getTopCard } from '../utils/gameLogic';
import { Shuffle, Target, AlertTriangle } from 'lucide-react';

interface GameBoardProps {
  gameState: GameState;
  onDrawCard: () => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({ gameState, onDrawCard }) => {
  const topCard = getTopCard(gameState);
  
  // Get the last 5 cards from discard pile for fanning effect
  const recentCards = gameState.discardPile.slice(-5);
  
  return (
    <div className="relative">
      {/* Main Game Table */}
      <div className="bg-gradient-to-br from-emerald-900/30 to-emerald-800/30 backdrop-blur-sm rounded-2xl border border-emerald-500/20 p-4 shadow-2xl">
        {/* Table felt pattern */}
        <div className="absolute inset-0 rounded-2xl opacity-10" style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, #10b981 0%, transparent 70%)`
        }}></div>
        
        <div className="relative z-10 flex items-center justify-between">
          {/* Draw Pile */}
          <div className="flex flex-col items-center space-y-2">
            <div
              className="w-16 h-24 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg border-2 border-emerald-400/50 
                         cursor-pointer hover:border-emerald-400 transition-all duration-300
                         flex items-center justify-center transform hover:scale-105 relative overflow-hidden group shadow-xl"
              onClick={onDrawCard}
            >
              {/* Animated background */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              {/* Card back design */}
              <div className="relative z-10 flex flex-col items-center justify-center text-emerald-400">
                <Shuffle size={16} className="mb-1 group-hover:rotate-180 transition-transform duration-500" />
                <div className="text-xs font-bold">DRAW</div>
              </div>
              
              {/* Glow effect */}
              <div className="absolute inset-0 rounded-lg bg-emerald-400/20 opacity-0 group-hover:opacity-100 transition-opacity blur-sm"></div>
            </div>
            
            <div className="text-center">
              <div className="text-white font-bold text-sm">{gameState.drawPile.length}</div>
              <div className="text-white/60 text-xs">left</div>
            </div>
          </div>
          
          {/* Center Game Info */}
          <div className="flex-1 mx-6">
            <div className="bg-black/30 backdrop-blur-md rounded-xl border border-white/20 p-4 text-center">
              {/* Current Turn Indicator */}
              <div className="mb-3">
                <div className="text-white/60 text-xs mb-1">Current Turn</div>
                <div className="text-white font-bold text-sm flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                  <span>{gameState.players[gameState.currentPlayerIndex].name}</span>
                </div>
              </div>
              
              {/* Game Status Messages */}
              <div className="space-y-2">
                {gameState.drawStack > 0 && (
                  <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-2">
                    <div className="flex items-center justify-center space-x-1 text-red-300">
                      <AlertTriangle size={14} />
                      <span className="font-bold text-xs">+{gameState.drawStack} penalty</span>
                    </div>
                  </div>
                )}
                
                {gameState.selectedSuit && (
                  <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-2">
                    <div className="flex items-center justify-center space-x-1 text-yellow-300">
                      <Target size={14} />
                      <span className="font-bold text-xs capitalize">{gameState.selectedSuit}</span>
                    </div>
                  </div>
                )}
                
                {gameState.pendingQuestion && (
                  <div className="bg-orange-500/20 border border-orange-500/30 rounded-lg p-2">
                    <div className="text-orange-300 font-bold animate-pulse text-xs">
                      ❓ Answer needed!
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Discard Pile with Fanning Effect */}
          <div className="flex flex-col items-center space-y-2">
            <div className="relative">
              {/* Fanned out cards showing history */}
              <div className="relative w-16 h-24">
                {recentCards.map((card, index) => {
                  const isTopCard = index === recentCards.length - 1;
                  const rotation = (index - 2) * 3; // Spread cards with slight rotation
                  const xOffset = (index - 2) * 2; // Slight horizontal offset
                  const zIndex = index + 1;
                  
                  return (
                    <div
                      key={`${card.id}-${index}`}
                      className="absolute inset-0 transition-all duration-300"
                      style={{
                        transform: `rotate(${rotation}deg) translateX(${xOffset}px)`,
                        zIndex: zIndex,
                        opacity: isTopCard ? 1 : 0.7
                      }}
                    >
                      <Card
                        card={card}
                        size="medium"
                      />
                      {isTopCard && (
                        <div className="absolute inset-0 rounded-lg bg-emerald-400/20 blur-lg -z-10"></div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-white font-bold text-sm">{gameState.discardPile.length}</div>
              <div className="text-white/60 text-xs">played</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Floating game stats */}
      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
        <div className="bg-black/50 backdrop-blur-md rounded-full px-3 py-1 border border-white/20">
          <div className="text-white/80 text-xs font-medium">
            Game in Progress
          </div>
        </div>
      </div>
    </div>
  );
};