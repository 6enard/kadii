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
    <div className="bg-white bg-opacity-20 backdrop-blur-md rounded-2xl border border-white border-opacity-30 p-6 shadow-xl">
      {/* Player Info */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            isCurrentPlayer 
              ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' 
              : 'bg-gradient-to-r from-gray-500 to-gray-600'
          }`}>
            {player.name === 'Player 1' ? (
              <User size={20} className="text-white" />
            ) : (
              <Crown size={20} className="text-white" />
            )}
          </div>
          
          <div>
            <h3 className="text-white font-bold text-lg">{player.name}</h3>
            <p className={`text-sm ${
              isCurrentPlayer ? 'text-emerald-200' : 'text-gray-300'
            }`}>
              {isCurrentPlayer ? (isMyTurn ? 'Your Turn' : 'Waiting') : 'Waiting'}
            </p>
          </div>
          
          {isCurrentPlayer && isMyTurn && (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
              <span className="text-emerald-300 font-medium">Active</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-white font-bold text-2xl">{player.hand.length}</div>
            <div className="text-gray-300 text-sm">cards</div>
          </div>
          
          {player.nikoKadiCalled && (
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 px-4 py-2 rounded-full shadow-lg">
              <span className="text-black font-bold flex items-center space-x-2">
                <span>🎯</span>
                <span>Niko Kadi!</span>
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* Cards */}
      <div className="flex flex-wrap gap-3 justify-center">
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
          <div className="text-gray-300">Waiting for game to end...</div>
        </div>
      )}
      
      {/* Selection indicator */}
      {selectedCards.length > 0 && (
        <div className="mt-4 text-center">
          <div className="inline-block bg-emerald-500 bg-opacity-30 backdrop-blur-sm rounded-full px-4 py-2 border border-emerald-400 border-opacity-50">
            <span className="text-emerald-200 font-medium">
              {selectedCards.length} card{selectedCards.length !== 1 ? 's' : ''} selected
            </span>
          </div>
        </div>
      )}
      
      {/* Playability hint */}
      {isMyTurn && playableCards.length === 0 && player.hand.length > 0 && (
        <div className="mt-4 text-center">
          <div className="inline-block bg-red-500 bg-opacity-30 backdrop-blur-sm rounded-full px-4 py-2 border border-red-400 border-opacity-50">
            <span className="text-red-200">No playable cards - draw from deck</span>
          </div>
        </div>
      )}
    </div>
  );
};