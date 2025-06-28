import React from 'react';
import { Suit } from '../types';
import { SUIT_SYMBOLS, SUIT_COLORS } from '../utils/cardUtils';

interface SuitSelectorProps {
  onSelectSuit: (suit: Suit) => void;
}

export const SuitSelector: React.FC<SuitSelectorProps> = ({ onSelectSuit }) => {
  const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full border border-gray-600">
        <div className="text-center mb-8">
          <h3 className="text-3xl font-bold text-white mb-3">CHOOSE SUIT</h3>
          <p className="text-gray-400">Select the suit for your Ace (wild card)</p>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {suits.map((suit) => (
            <button
              key={suit}
              onClick={() => onSelectSuit(suit)}
              className={`
                w-full h-28 rounded-xl border-2 flex flex-col items-center justify-center
                hover:bg-gray-700/50 transition-all duration-300 transform hover:scale-105
                ${SUIT_COLORS[suit]} border-gray-600 hover:border-gray-400 shadow-lg hover:shadow-xl
                bg-gradient-to-br from-gray-800 to-gray-900
              `}
            >
              <div className="text-5xl mb-2">{SUIT_SYMBOLS[suit]}</div>
              <div className="text-sm font-bold capitalize text-white">{suit}</div>
            </button>
          ))}
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            🎯 Ace cards can answer questions and counter penalties!
          </p>
        </div>
      </div>
    </div>
  );
};