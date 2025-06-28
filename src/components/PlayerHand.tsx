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
      p-4 rounded-xl border-2 transition-all duration-300 backdrop-blur-sm
      ${isCurrentPlayer 
        ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-xl shadow-blue-200' 
        : 'border-gray-400 bg-gradient-to-r from-gray-50 to-slate-50 shadow-lg'
      }
    `}>
      <div className="flex items-center justify-between mb-3">
        <h3 className={`font-bold text-lg flex items-center space-x-2 ${
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
      
      {/* Cards */}
      <div className="flex flex-wrap gap-2 justify-center">
        {player.hand.map((card) => (
          <Card
            key={card.id}
            card={card}
            isSelected={selectedCards.includes(card.id)}
            isPlayable={isMyTurn && playableCards.includes(card.id)}
            onClick={() => isMyTurn && onCardClick(card.id)}
            size="medium"
          />
        ))}
      </div>
      
      {/* Hand status */}
      {player.hand.length === 0 && (
        <div className="text-center py-4">
          <div className="text-2xl">🎉</div>
          <div className="font-bold text-green-600">Hand Empty!</div>
        </div>
      )}
    </div>
  );
};