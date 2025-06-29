import React from 'react';
import { Suit } from '../types';
import { SUIT_SYMBOLS, SUIT_COLORS } from '../utils/cardUtils';

interface SuitSelectorProps {
  onSelectSuit: (suit: Suit) => void;
}

export const SuitSelector: React.FC<SuitSelectorProps> = ({ onSelectSuit }) => {
  const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Choose a Suit</h3>
          <p className="text-gray-600">Select the suit for your Ace (wild card)</p>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {suits.map((suit) => (
            <button
              key={suit}
              onClick={() => onSelectSuit(suit)}
              className={`
                w-full h-24 rounded-xl border-2 flex flex-col items-center justify-center
                hover:bg-gray-50 transition-all duration-300 transform hover:scale-105
                border-gray-300 hover:border-gray-400 shadow-lg hover:shadow-xl
                bg-gradient-to-br from-white to-gray-50
              `}
            >
              <div className={`text-4xl mb-1 ${SUIT_COLORS[suit]}`}>{SUIT_SYMBOLS[suit]}</div>
              <div className="text-sm font-bold capitalize text-gray-700">{suit}</div>
            </button>
          ))}
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            🎯 Ace cards can answer questions and counter penalties!
          </p>
        </div>
      </div>
    </div>
  );
};