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
  const isMyHand = isHuman && isCurrentPlayer;
  
  return (
    <div className={`
      ${isMyHand ? 'fixed bottom-0 left-0 right-0 z-30' : 'relative'}
      ${isMyHand 
        ? 'bg-gradient-to-t from-gray-900 via-gray-800/95 to-transparent backdrop-blur-xl' 
        : 'bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-xl rounded-2xl border border-gray-600/30'
      }
      transition-all duration-300
      ${isMyHand ? 'pb-4 pt-8' : 'p-4'}
    `}>
      
      {/* Player Header - Only for opponent */}
      {!isMyHand && (
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
                  THEIR TURN
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
      )}

      {/* My Hand Header - Fixed at bottom */}
      {isMyHand && (
        <div className="flex items-center justify-between px-6 pb-2">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-full bg-cyan-500/20">
              <User size={20} className="text-cyan-400" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-cyan-300">YOUR HAND</h3>
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
            {selectedCards.length > 0 && (
              <div className="bg-cyan-500/20 border border-cyan-500/50 px-3 py-1 rounded-full text-cyan-300 text-sm font-bold">
                {selectedCards.length} SELECTED
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Cards Layout */}
      <div className={`
        ${isMyHand 
          ? 'px-6 pb-2' 
          : ''
        }
      `}>
        {isMyHand ? (
          /* My Hand - Realistic Fan Layout */
          <div className="relative flex justify-center items-end min-h-[120px]">
            <div className="flex items-end justify-center space-x-[-40px] max-w-full overflow-x-auto pb-2">
              {player.hand.map((card, index) => {
                const totalCards = player.hand.length;
                const centerIndex = (totalCards - 1) / 2;
                const offsetFromCenter = index - centerIndex;
                
                // Calculate rotation and position for fan effect
                const rotation = offsetFromCenter * 8; // 8 degrees per card
                const yOffset = Math.abs(offsetFromCenter) * 4; // Slight curve
                const zIndex = selectedCards.includes(card.id) ? 50 : 10 + index;
                
                return (
                  <div
                    key={card.id}
                    className="relative transition-all duration-300 hover:z-40"
                    style={{
                      transform: `rotate(${rotation}deg) translateY(${yOffset}px) ${
                        selectedCards.includes(card.id) ? 'translateY(-20px) scale(1.1)' : ''
                      }`,
                      zIndex,
                      marginBottom: selectedCards.includes(card.id) ? '20px' : '0px'
                    }}
                  >
                    <Card
                      card={card}
                      isSelected={selectedCards.includes(card.id)}
                      isPlayable={isMyTurn && playableCards.includes(card.id)}
                      onClick={() => isMyTurn && onCardClick(card.id)}
                      size="medium"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Opponent Hand - Hidden cards in compact grid */
          <div className="grid grid-cols-8 sm:grid-cols-12 md:grid-cols-16 gap-1">
            {player.hand.map((_, index) => (
              <div
                key={index}
                className="aspect-[2/3] bg-gradient-to-br from-blue-800 to-blue-900 rounded-lg border border-blue-600/50 flex items-center justify-center shadow-lg"
              >
                <div className="text-blue-300 text-xs font-bold">K</div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Hand Status */}
      {player.hand.length === 0 && (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">🎉</div>
          <div className="font-bold text-green-400 text-xl">HAND EMPTY!</div>
          <div className="text-gray-400 text-sm">Game Over</div>
        </div>
      )}
    </div>
  );
};