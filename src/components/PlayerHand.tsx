import React from 'react';
import { Player } from '../types';
import { Card } from './Card';
import { User, Crown } from 'lucide-react';

interface PlayerHandProps {
  player: Player;
  isCurrentPlayer: boolean;
  selectedCards: string[];
  playableCards: string[];
  onCardClick: (cardId: string) => void;
  isMyTurn: boolean;
}

export const PlayerHand: React.FC<PlayerHandProps> = ({
  player,
  isCurrentPlayer,
  selectedCards,
  playableCards,
  onCardClick,
  isMyTurn
}) => {
  return (
    <div className="h-full flex flex-col">
      {/* Player Info Header - Compact */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isCurrentPlayer 
              ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' 
              : 'bg-gradient-to-r from-slate-600 to-slate-700'
          }`}>
            {player.name === 'Player 1' ? (
              <User size={16} className="text-white" />
            ) : (
              <Crown size={16} className="text-white" />
            )}
          </div>
          
          <div>
            <h3 className="text-white font-semibold text-sm">{player.name}</h3>
            <p className={`text-xs ${
              isCurrentPlayer ? 'text-emerald-300' : 'text-white/60'
            }`}>
              {isCurrentPlayer ? (isMyTurn ? 'Your Turn' : 'Waiting') : 'Waiting'}
            </p>
          </div>
          
          {isCurrentPlayer && isMyTurn && (
            <div className="flex items-center space-x-1">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
              <span className="text-emerald-400 text-xs font-medium">Active</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <div className="text-white font-bold text-lg">{player.hand.length}</div>
            <div className="text-white/60 text-xs">cards</div>
          </div>
          
          {player.nikoKadiCalled && (
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 px-3 py-1 rounded-full shadow-lg">
              <span className="text-black font-bold text-xs flex items-center space-x-1">
                <span>🎯</span>
                <span>Niko Kadi!</span>
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* Cards Container - Scrollable */}
      <div className="relative flex-1 min-h-0">
        {/* Selection indicator */}
        {selectedCards.length > 0 && (
          <div className="absolute -top-6 left-0 right-0 text-center z-10">
            <div className="inline-block bg-emerald-500/20 backdrop-blur-sm rounded-full px-3 py-1 border border-emerald-500/30">
              <span className="text-emerald-300 text-xs font-medium">
                {selectedCards.length} selected
              </span>
            </div>
          </div>
        )}
        
        {/* Cards Grid - Scrollable */}
        <div className="h-full overflow-y-auto overflow-x-hidden">
          <div className="flex flex-wrap gap-2 justify-center p-2 bg-black/20 backdrop-blur-sm rounded-xl border border-white/10 min-h-full">
            {player.hand.map((card) => (
              <div
                key={card.id}
                className={`transition-all duration-300 flex-shrink-0 ${
                  selectedCards.includes(card.id) 
                    ? 'transform -translate-y-2 scale-110 z-10' 
                    : isMyTurn && playableCards.includes(card.id)
                      ? 'hover:transform hover:-translate-y-1 hover:scale-105'
                      : ''
                }`}
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
        </div>
        
        {/* Empty hand message */}
        {player.hand.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-2">🎉</div>
              <div className="text-white font-bold text-lg">Hand Empty!</div>
              <div className="text-white/60 text-sm">Waiting for game to end...</div>
            </div>
          </div>
        )}
        
        {/* Playability hint */}
        {isMyTurn && playableCards.length === 0 && player.hand.length > 0 && (
          <div className="absolute -bottom-6 left-0 right-0 text-center">
            <div className="inline-block bg-red-500/20 backdrop-blur-sm rounded-full px-3 py-1 border border-red-500/30">
              <span className="text-red-300 text-xs">No playable cards - draw from deck</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};