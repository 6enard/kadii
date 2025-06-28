import React from 'react';
import { Suit } from '../types';
import { SUIT_SYMBOLS, SUIT_COLORS } from '../utils/cardUtils';

interface SuitSelectorProps {
  onSelectSuit: (suit: Suit) => void;
}

export const SuitSelector: React.FC<SuitSelectorProps> = ({ onSelectSuit }) => {
  const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl">
        <h3 className="text-xl font-bold mb-6 text-center">Select a Suit</h3>
        
        <div className="grid grid-cols-2 gap-4">
          {suits.map((suit) => (
            <button
              key={suit}
              onClick={() => onSelectSuit(suit)}
              className={`
                w-24 h-24 rounded-lg border-2 flex flex-col items-center justify-center
                hover:bg-gray-50 transition-all duration-200 transform hover:scale-105
                ${SUIT_COLORS[suit]} border-gray-300 hover:border-gray-400
              `}
            >
              <div className="text-3xl mb-1">{SUIT_SYMBOLS[suit]}</div>
              <div className="text-sm font-medium capitalize">{suit}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};