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
  
  return (
    <div className="relative">
      {/* Main Game Table */}
      <div className="bg-gradient-to-br from-emerald-900/30 to-emerald-800/30 backdrop-blur-sm rounded-3xl border border-emerald-500/20 p-8 shadow-2xl">
        {/* Table felt pattern */}
        <div className="absolute inset-0 rounded-3xl opacity-10" style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, #10b981 0%, transparent 70%)`
        }}></div>
        
        <div className="relative z-10 flex items-center justify-between">
          {/* Draw Pile */}
          <div className="flex flex-col items-center space-y-4">
            <div
              className="w-24 h-32 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border-2 border-emerald-400/50 
                         cursor-pointer hover:border-emerald-400 transition-all duration-300
                         flex items-center justify-center transform hover:scale-105 relative overflow-hidden group shadow-xl"
              onClick={onDrawCard}
            >
              {/* Animated background */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              {/* Card back design */}
              <div className="relative z-10 flex flex-col items-center justify-center text-emerald-400">
                <Shuffle size={24} className="mb-2 group-hover:rotate-180 transition-transform duration-500" />
                <div className="text-xs font-bold">DRAW</div>
              </div>
              
              {/* Glow effect */}
              <div className="absolute inset-0 rounded-xl bg-emerald-400/20 opacity-0 group-hover:opacity-100 transition-opacity blur-sm"></div>
            </div>
            
            <div className="text-center">
              <div className="text-white font-bold text-lg">{gameState.drawPile.length}</div>
              <div className="text-white/60 text-sm">cards left</div>
            </div>
          </div>
          
          {/* Center Game Info */}
          <div className="flex-1 mx-8">
            <div className="bg-black/30 backdrop-blur-md rounded-2xl border border-white/20 p-6 text-center">
              {/* Current Turn Indicator */}
              <div className="mb-4">
                <div className="text-white/60 text-sm mb-1">Current Turn</div>
                <div className="text-white font-bold text-xl flex items-center justify-center space-x-2">
                  <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                  <span>{gameState.players[gameState.currentPlayerIndex].name}</span>
                </div>
              </div>
              
              {/* Game Status Messages */}
              <div className="space-y-2">
                {gameState.drawStack > 0 && (
                  <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
                    <div className="flex items-center justify-center space-x-2 text-red-300">
                      <AlertTriangle size={18} />
                      <span className="font-bold">Penalty: +{gameState.drawStack} cards</span>
                    </div>
                    <div className="text-red-200 text-xs mt-1">Counter with 2, 3, or Ace!</div>
                  </div>
                )}
                
                {gameState.selectedSuit && (
                  <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3">
                    <div className="flex items-center justify-center space-x-2 text-yellow-300">
                      <Target size={18} />
                      <span className="font-bold">Active Suit: <span className="capitalize">{gameState.selectedSuit}</span></span>
                    </div>
                  </div>
                )}
                
                {gameState.pendingQuestion && (
                  <div className="bg-orange-500/20 border border-orange-500/30 rounded-lg p-3">
                    <div className="text-orange-300 font-bold animate-pulse">
                      ❓ Question needs answer!
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Discard Pile */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative transform hover:scale-105 transition-transform duration-300">
              <Card
                card={topCard}
                size="large"
              />
              {/* Glow effect for top card */}
              <div className="absolute inset-0 rounded-xl bg-emerald-400/20 blur-lg -z-10"></div>
            </div>
            
            <div className="text-center">
              <div className="text-white font-bold text-lg">{gameState.discardPile.length}</div>
              <div className="text-white/60 text-sm">played cards</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Floating game stats */}
      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
        <div className="bg-black/50 backdrop-blur-md rounded-full px-4 py-2 border border-white/20">
          <div className="text-white/80 text-sm font-medium">
            Game in Progress
          </div>
        </div>
      </div>
    </div>
  );
};