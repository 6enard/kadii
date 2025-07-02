import React from 'react';
import { Player } from '../types';
import { Card } from './Card';
import { User, Crown, EyeOff, Zap } from 'lucide-react';

interface PlayerHandProps {
  player: Player;
  isCurrentPlayer: boolean;
  selectedCards: string[];
  playableCards: string[];
  onCardClick: (cardId: string) => void;
  isMyTurn: boolean;
  hideCards?: boolean;
}

export const PlayerHand: React.FC<PlayerHandProps> = ({
  player,
  isCurrentPlayer,
  selectedCards,
  playableCards,
  onCardClick,
  isMyTurn,
  hideCards = false
}) => {
  return (
    <div className="p-2 sm:p-4 md:p-6">
      {/* Player Info Header */}
      <div className="flex items-center justify-between mb-2 sm:mb-4">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-lg ${
            isCurrentPlayer 
              ? 'bg-gradient-to-r from-yellow-500 to-orange-500 animate-pulse' 
              : 'bg-gradient-to-r from-gray-600 to-gray-700'
          }`}>
            {player.name === 'Player 1' ? (
              <User size={14} className="text-white sm:w-[18px] sm:h-[18px]" />
            ) : player.name === 'Computer' ? (
              <Zap size={14} className="text-white sm:w-[18px] sm:h-[18px]" />
            ) : (
              <Crown size={14} className="text-white sm:w-[18px] sm:h-[18px]" />
            )}
          </div>
          
          <div>
            <h3 className="text-white font-bold text-sm sm:text-base md:text-lg">{player.name}</h3>
            <div className="flex items-center space-x-1 sm:space-x-2">
              <p className={`text-xs sm:text-sm ${
                isCurrentPlayer ? 'text-yellow-300' : 'text-gray-400'
              }`}>
                {isCurrentPlayer ? (isMyTurn ? '🎯 Your Turn' : '⏳ Waiting') : '💤 Waiting'}
              </p>
              
              {isCurrentPlayer && isMyTurn && (
                <div className="flex items-center space-x-1">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-yellow-400 rounded-full animate-ping"></div>
                  <span className="text-yellow-300 font-medium text-xs">ACTIVE</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Card Count */}
          <div className="text-right bg-black/30 rounded-lg sm:rounded-xl px-2 py-1 sm:px-3 sm:py-2 border border-white/20">
            <div className="text-white font-bold text-sm sm:text-lg md:text-xl">{player.hand.length}</div>
            <div className="text-gray-300 text-xs">cards</div>
          </div>
          
          {/* Niko Kadi Status */}
          {player.nikoKadiCalled && (
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 px-2 py-1 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl shadow-lg border border-yellow-300/50 animate-pulse">
              <span className="text-black font-bold flex items-center space-x-1 text-xs sm:text-sm">
                <span>🎯</span>
                <span className="hidden sm:inline">NIKO KADI!</span>
                <span className="sm:hidden">KADI!</span>
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* Cards Display */}
      <div className="min-h-[6rem] sm:min-h-[8rem] md:min-h-[10rem]">
        {player.hand.length === 0 ? (
          // Empty hand celebration
          <div className="text-center py-4 sm:py-8 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-lg sm:rounded-xl border border-yellow-500/30">
            <div className="text-2xl sm:text-4xl mb-2 animate-bounce">🏆</div>
            <div className="text-white font-bold text-sm sm:text-lg">Hand Empty!</div>
            <div className="text-yellow-300 text-xs sm:text-sm">Waiting for game to end...</div>
          </div>
        ) : hideCards ? (
          // Hidden cards for computer
          <div className="flex flex-wrap gap-1 sm:gap-2 justify-center">
            {player.hand.map((_, index) => (
              <div
                key={`hidden-${index}`}
                className="w-8 h-12 sm:w-12 sm:h-16 md:w-14 md:h-20 bg-gradient-to-br from-red-900 via-red-800 to-red-900 rounded-md sm:rounded-lg border-2 border-red-500/50 
                           flex items-center justify-center shadow-xl relative overflow-hidden group"
              >
                {/* Mysterious card back */}
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 to-black/40"></div>
                <div className="relative z-10 flex flex-col items-center justify-center text-red-400">
                  <EyeOff size={8} className="mb-0.5 sm:w-3 sm:h-3 sm:mb-1" />
                  <div className="text-xs font-bold">?</div>
                </div>
                
                {/* Subtle glow effect */}
                <div className="absolute inset-0 bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
            ))}
          </div>
        ) : (
          // Actual cards for players
          <div className="flex flex-wrap gap-1 sm:gap-2 justify-center max-w-full overflow-x-auto">
            {player.hand.map((card, index) => (
              <div
                key={card.id}
                className={`transition-all duration-300 transform ${
                  selectedCards.includes(card.id) 
                    ? '-translate-y-2 sm:-translate-y-3 scale-105 sm:scale-110 z-10' 
                    : isMyTurn && playableCards.includes(card.id)
                      ? 'active:scale-95 sm:hover:-translate-y-2 sm:hover:scale-105 cursor-pointer'
                      : ''
                } ${index > 0 ? '-ml-2 sm:-ml-4' : ''}`}
                style={{ zIndex: selectedCards.includes(card.id) ? 20 : 10 - index }}
              >
                <Card
                  card={card}
                  isSelected={selectedCards.includes(card.id)}
                  isPlayable={isMyTurn && playableCards.includes(card.id)}
                  onClick={() => isMyTurn && onCardClick(card.id)}
                  size="small"
                />
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Status Indicators */}
      <div className="mt-2 sm:mt-4 space-y-1 sm:space-y-2">
        {/* Selection indicator */}
        {selectedCards.length > 0 && !hideCards && (
          <div className="text-center">
            <div className="inline-block bg-gradient-to-r from-yellow-500/30 to-orange-500/30 backdrop-blur-sm rounded-full px-3 py-1 sm:px-4 sm:py-2 border border-yellow-400/50">
              <span className="text-yellow-200 font-medium text-xs sm:text-sm">
                ✨ {selectedCards.length} card{selectedCards.length !== 1 ? 's' : ''} selected
              </span>
            </div>
          </div>
        )}
        
        {/* No playable cards hint */}
        {isMyTurn && playableCards.length === 0 && player.hand.length > 0 && !hideCards && (
          <div className="text-center">
            <div className="inline-block bg-gradient-to-r from-red-500/30 to-red-600/30 backdrop-blur-sm rounded-full px-3 py-1 sm:px-4 sm:py-2 border border-red-400/50">
              <span className="text-red-200 text-xs sm:text-sm">🎲 No playable cards - draw from deck</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};