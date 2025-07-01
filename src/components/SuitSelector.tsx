import React from 'react';
import { Suit } from '../types';
import { SUIT_SYMBOLS, SUIT_COLORS } from '../utils/cardUtils';

interface SuitSelectorProps {
  onSelectSuit: (suit: Suit) => void;
}

export const SuitSelector: React.FC<SuitSelectorProps> = ({ onSelectSuit }) => {
  const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-3xl border border-white/20 shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h3 className="text-3xl font-bold text-white mb-3">Choose a Suit</h3>
          <p className="text-white/70">Select the suit for your Ace (wild card)</p>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {suits.map((suit) => (
            <button
              key={suit}
              onClick={() => onSelectSuit(suit)}
              className="group relative w-full h-28 rounded-2xl border-2 border-white/20 hover:border-white/40 
                         bg-gradient-to-br from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700
                         flex flex-col items-center justify-center transition-all duration-300 
                         transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              {/* Glow effect */}
              <div className="absolute inset-0 rounded-2xl bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div className={`text-5xl mb-2 ${SUIT_COLORS[suit]} drop-shadow-lg`}>
                {SUIT_SYMBOLS[suit]}
              </div>
              <div className="text-sm font-bold capitalize text-white/90 group-hover:text-white">
                {suit}
              </div>
            </button>
          ))}
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-xs text-white/50 bg-white/5 rounded-lg p-3">
            🎯 Ace cards can answer questions and counter penalties!
          </p>
        </div>
      </div>
    </div>
  );
};