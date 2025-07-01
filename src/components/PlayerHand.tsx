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
    <div className="space-y-4">
      {/* Player Info Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            isCurrentPlayer 
              ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' 
              : 'bg-gradient-to-r from-slate-600 to-slate-700'
          }`}>
            {player.name === 'Player 1' ? (
              <User size={20} className="text-white" />
            ) : (
              <Crown size={20} className="text-white" />
            )}
          </div>
          
          <div>
            <h3 className="text-white font-semibold text-lg">{player.name}</h3>
            <p className={`text-sm ${
              isCurrentPlayer ? 'text-emerald-300' : 'text-white/60'
            }`}>
              {isCurrentPlayer ? (isMyTurn ? 'Your Turn' : 'Waiting for opponent') : 'Waiting'}
            </p>
          </div>
          
          {isCurrentPlayer && isMyTurn && (
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <span className="text-emerald-400 text-sm font-medium">Active</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-white font-bold text-xl">{player.hand.length}</div>
            <div className="text-white/60 text-xs">cards</div>
          </div>
          
          {player.nikoKadiCalled && (
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 px-4 py-2 rounded-full shadow-lg">
              <span className="text-black font-bold text-sm flex items-center space-x-1">
                <span>🎯</span>
                <span>Niko Kadi!</span>
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* Cards Container */}
      <div className="relative">
        {/* Selection indicator */}
        {selectedCards.length > 0 && (
          <div className="absolute -top-8 left-0 right-0 text-center">
            <div className="inline-block bg-emerald-500/20 backdrop-blur-sm rounded-full px-3 py-1 border border-emerald-500/30">
              <span className="text-emerald-300 text-sm font-medium">
                {selectedCards.length} card{selectedCards.length > 1 ? 's' : ''} selected
              </span>
            </div>
          </div>
        )}
        
        {/* Cards Grid */}
        <div className="flex flex-wrap gap-3 justify-center p-4 bg-black/20 backdrop-blur-sm rounded-2xl border border-white/10">
          {player.hand.map((card) => (
            <div
              key={card.id}
              className={`transition-all duration-300 ${
                selectedCards.includes(card.id) 
                  ? 'transform -translate-y-4 scale-110' 
                  : isMyTurn && playableCards.includes(card.id)
                    ? 'hover:transform hover:-translate-y-2 hover:scale-105'
                    : ''
              }`}
            >
              <Card
                card={card}
                isSelected={selectedCards.includes(card.id)}
                isPlayable={isMyTurn && playableCards.includes(card.id)}
                onClick={() => isMyTurn && onCardClick(card.id)}
                size="medium"
              />
            </div>
          ))}
        </div>
        
        {/* Empty hand message */}
        {player.hand.length === 0 && (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">🎉</div>
            <div className="text-white font-bold text-xl">Hand Empty!</div>
            <div className="text-white/60 text-sm">Waiting for game to end...</div>
          </div>
        )}
        
        {/* Playability hint */}
        {isMyTurn && playableCards.length === 0 && player.hand.length > 0 && (
          <div className="absolute -bottom-8 left-0 right-0 text-center">
            <div className="inline-block bg-red-500/20 backdrop-blur-sm rounded-full px-3 py-1 border border-red-500/30">
              <span className="text-red-300 text-sm">No playable cards - draw from deck</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};