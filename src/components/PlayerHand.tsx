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
      p-4 rounded-lg border-2 transition-all duration-300
      ${isCurrentPlayer ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'}
    `}>
      <div className="flex items-center justify-between mb-3">
        <h3 className={`font-bold text-lg ${isCurrentPlayer ? 'text-blue-700' : 'text-gray-700'}`}>
          {player.name}
          {isCurrentPlayer && <span className="ml-2 text-sm bg-blue-200 px-2 py-1 rounded">Your Turn</span>}
        </h3>
        
        <div className="flex items-center space-x-2">
          <span className="bg-gray-200 px-2 py-1 rounded text-sm">
            {player.hand.length} cards
          </span>
          {player.nikoKadiCalled && (
            <span className="bg-yellow-200 px-2 py-1 rounded text-sm font-bold">
              Niko Kadi!
            </span>
          )}
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2">
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
    </div>
  );
};