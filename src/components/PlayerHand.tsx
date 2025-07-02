import React from 'react';
import { Player } from '../types';
import { Card } from './Card';
import { User, Crown, Eye, EyeOff } from 'lucide-react';

interface PlayerHandProps {
  player: Player;
  isCurrentPlayer: boolean;
  selectedCards: string[];
  playableCards: string[];
  onCardClick: (cardId: string) => void;
  isMyTurn: boolean;
  hideCards?: boolean; // New prop to hide computer cards
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
    <div className="bg-white bg-opacity-20 backdrop-blur-md rounded-xl border border-white border-opacity-30 p-4 shadow-xl">
      {/* Player Info */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isCurrentPlayer 
              ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' 
              : 'bg-gradient-to-r from-gray-500 to-gray-600'
          }`}>
            {player.name === 'Player 1' ? (
              <User size={16} className="text-white" />
            ) : (
              <Crown size={16} className="text-white" />
            )}
          </div>
          
          <div>
            <h3 className="text-white font-bold text-sm">{player.name}</h3>
            <p className={`text-xs ${
              isCurrentPlayer ? 'text-emerald-200' : 'text-gray-300'
            }`}>
              {isCurrentPlayer ? (isMyTurn ? 'Your Turn' : 'Waiting') : 'Waiting'}
            </p>
          </div>
          
          {isCurrentPlayer && isMyTurn && (
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <span className="text-emerald-300 font-medium text-xs">Active</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <div className="text-white font-bold text-lg">{player.hand.length}</div>
            <div className="text-gray-300 text-xs">cards</div>
          </div>
          
          {player.nikoKadiCalled && (
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 px-3 py-1 rounded-full shadow-lg">
              <span className="text-black font-bold flex items-center space-x-1 text-xs">
                <span>🎯</span>
                <span>Niko Kadi!</span>
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* Cards */}
      <div className="flex flex-wrap gap-2 justify-center min-h-[6rem]">
        {hideCards ? (
          // Show card backs for computer
          player.hand.map((_, index) => (
            <div
              key={`hidden-${index}`}
              className="w-12 h-16 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg border-2 border-emerald-400/50 
                         flex items-center justify-center shadow-lg relative overflow-hidden"
            >
              {/* Card back design */}
              <div className="flex flex-col items-center justify-center text-emerald-400">
                <EyeOff size={12} className="mb-1" />
                <div className="text-xs font-bold">?</div>
              </div>
              
              {/* Subtle pattern */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-blue-500/10"></div>
            </div>
          ))
        ) : (
          // Show actual cards for player
          player.hand.map((card) => (
            <div
              key={card.id}
              className={`transition-all duration-300 ${
                selectedCards.includes(card.id) 
                  ? 'transform -translate-y-2 scale-110' 
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
          ))
        )}
      </div>
      
      {/* Empty hand message */}
      {player.hand.length === 0 && (
        <div className="text-center py-4">
          <div className="text-2xl mb-1">🎉</div>
          <div className="text-white font-bold text-sm">Hand Empty!</div>
          <div className="text-gray-300 text-xs">Waiting for game to end...</div>
        </div>
      )}
      
      {/* Selection indicator */}
      {selectedCards.length > 0 && !hideCards && (
        <div className="mt-3 text-center">
          <div className="inline-block bg-emerald-500 bg-opacity-30 backdrop-blur-sm rounded-full px-3 py-1 border border-emerald-400 border-opacity-50">
            <span className="text-emerald-200 font-medium text-xs">
              {selectedCards.length} card{selectedCards.length !== 1 ? 's' : ''} selected
            </span>
          </div>
        </div>
      )}
      
      {/* Playability hint */}
      {isMyTurn && playableCards.length === 0 && player.hand.length > 0 && !hideCards && (
        <div className="mt-3 text-center">
          <div className="inline-block bg-red-500 bg-opacity-30 backdrop-blur-sm rounded-full px-3 py-1 border border-red-400 border-opacity-50">
            <span className="text-red-200 text-xs">No playable cards - draw from deck</span>
          </div>
        </div>
      )}
    </div>
  );
};