import React from 'react';
import { Player } from '../types';
import { Card } from './Card';

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
    <div className={`
      flex-1 flex flex-col p-3 rounded-xl border-2 transition-all duration-300 backdrop-blur-sm min-h-0
      ${isCurrentPlayer 
        ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-xl shadow-blue-200' 
        : 'border-gray-400 bg-gradient-to-r from-gray-50 to-slate-50 shadow-lg'
      }
    `}>
      <div className="flex items-center justify-between mb-2 flex-shrink-0">
        <h3 className={`font-bold text-base flex items-center space-x-2 ${
          isCurrentPlayer ? 'text-blue-700' : 'text-gray-700'
        }`}>
          <span>{player.name === 'Player 1' ? '👤' : '🤖'} {player.name}</span>
          {isCurrentPlayer && (
            <span className="text-xs bg-blue-600 text-white px-3 py-1 rounded-full animate-pulse">
              Your Turn
            </span>
          )}
        </h3>
        
        <div className="flex items-center space-x-2">
          <span className="bg-gray-600 text-white px-3 py-1 rounded-full text-sm font-medium">
            {player.hand.length} cards
          </span>
          {player.nikoKadiCalled && (
            <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold animate-bounce">
              🎯 Niko Kadi!
            </span>
          )}
        </div>
      </div>
      
      {/* Cards Container - Scrollable */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2 p-2">
          {player.hand.map((card) => (
            <Card
              key={card.id}
              card={card}
              isSelected={selectedCards.includes(card.id)}
              isPlayable={isMyTurn && playableCards.includes(card.id)}
              onClick={() => isMyTurn && onCardClick(card.id)}
              size="small"
            />
          ))}
        </div>
      </div>
      
      {/* Hand status */}
      {player.hand.length === 0 && (
        <div className="text-center py-4 flex-shrink-0">
          <div className="text-2xl">🎉</div>
          <div className="font-bold text-green-600">Hand Empty!</div>
        </div>
      )}
    </div>
  );
};