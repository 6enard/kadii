import React from 'react';
import { Player } from '../types';
import { Card } from './Card';
import { User, Bot } from 'lucide-react';

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
  const isHuman = player.name === 'Player 1';
  
  return (
    <div className={`
      bg-gradient-to-br backdrop-blur-xl rounded-2xl border-2 transition-all duration-300 p-4
      ${isCurrentPlayer 
        ? 'from-cyan-900/30 to-blue-900/30 border-cyan-500/50 shadow-2xl shadow-cyan-500/20' 
        : 'from-gray-800/30 to-gray-900/30 border-gray-600/30 shadow-xl'
      }
    `}>
      
      {/* Player Header - Urban Style */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-full ${isCurrentPlayer ? 'bg-cyan-500/20' : 'bg-gray-700/50'}`}>
            {isHuman ? <User size={20} className="text-cyan-400" /> : <Bot size={20} className="text-red-400" />}
          </div>
          
          <div>
            <h3 className={`font-bold text-lg ${isCurrentPlayer ? 'text-cyan-300' : 'text-gray-300'}`}>
              {isHuman ? 'YOU' : player.name.toUpperCase()}
            </h3>
            {isCurrentPlayer && (
              <div className="text-xs bg-cyan-500 text-black px-2 py-1 rounded-full font-bold animate-pulse">
                YOUR TURN
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="bg-gray-800/80 text-white px-3 py-1 rounded-full text-sm font-mono border border-gray-600">
            {player.hand.length} CARDS
          </div>
          {player.nikoKadiCalled && (
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-3 py-1 rounded-full text-sm font-bold animate-bounce border-2 border-yellow-300">
              ⚡ NIKO KADI!
            </div>
          )}
        </div>
      </div>
      
      {/* Cards Grid - Responsive Urban Layout */}
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2 justify-items-center">
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
      
      {/* Hand Status */}
      {player.hand.length === 0 && (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">🎉</div>
          <div className="font-bold text-green-400 text-xl">HAND EMPTY!</div>
          <div className="text-gray-400 text-sm">Game Over</div>
        </div>
      )}
      
      {/* Selection Info */}
      {selectedCards.length > 0 && isMyTurn && (
        <div className="mt-4 text-center">
          <div className="bg-cyan-500/20 border border-cyan-500/50 rounded-lg p-2 inline-block">
            <span className="text-cyan-300 text-sm font-bold">
              {selectedCards.length} CARD{selectedCards.length > 1 ? 'S' : ''} SELECTED
            </span>
          </div>
        </div>
      )}
    </div>
  );
};