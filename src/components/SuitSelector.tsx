import React from 'react';
import { Suit } from '../types';
import { SUIT_SYMBOLS, SUIT_COLORS } from '../utils/cardUtils';
import { Sparkles } from 'lucide-react';

interface SuitSelectorProps {
  onSelectSuit: (suit: Suit) => void;
}

export const SuitSelector: React.FC<SuitSelectorProps> = ({ onSelectSuit }) => {
  const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
  
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl border-2 border-yellow-500/50 shadow-2xl p-8 max-w-md w-full relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-transparent to-purple-500/10 animate-pulse"></div>
        
        <div className="relative z-10 text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Sparkles size={24} className="text-yellow-400" />
            <h3 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
              Choose Your Suit
            </h3>
            <Sparkles size={24} className="text-yellow-400" />
          </div>
          <p className="text-white/80">Select the suit for your Ace (wild card)</p>
        </div>
        
        <div className="relative z-10 grid grid-cols-2 gap-4 mb-6">
          {suits.map((suit) => (
            <button
              key={suit}
              onClick={() => onSelectSuit(suit)}
              className="group relative w-full h-32 rounded-2xl border-2 border-white/20 hover:border-yellow-400/60 
                         bg-gradient-to-br from-slate-800/80 to-slate-900/80 hover:from-slate-700/80 hover:to-slate-800/80
                         flex flex-col items-center justify-center transition-all duration-300 
                         transform hover:scale-105 shadow-xl hover:shadow-2xl backdrop-blur-sm"
            >
              {/* Glow effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-yellow-500/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div className={`text-6xl mb-2 ${SUIT_COLORS[suit]} drop-shadow-lg group-hover:scale-110 transition-transform`}>
                {SUIT_SYMBOLS[suit]}
              </div>
              <div className="text-sm font-bold capitalize text-white/90 group-hover:text-white bg-black/30 px-3 py-1 rounded-full">
                {suit}
              </div>
            </button>
          ))}
        </div>
        
        <div className="relative z-10 text-center">
          <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl p-4 border border-yellow-500/30">
            <p className="text-xs text-yellow-200 flex items-center justify-center space-x-2">
              <span>🎯</span>
              <span>Ace cards can answer questions and counter penalties!</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};