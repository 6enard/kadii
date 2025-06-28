import React from 'react';
import { Card as CardType } from '../types';
import { SUIT_SYMBOLS, SUIT_COLORS, getCardCategory } from '../utils/cardUtils';

interface CardProps {
  card: CardType;
  isSelected?: boolean;
  isPlayable?: boolean;
  onClick?: () => void;
  size?: 'small' | 'medium' | 'large';
}

export const Card: React.FC<CardProps> = ({ 
  card, 
  isSelected = false, 
  isPlayable = false, 
  onClick,
  size = 'medium'
}) => {
  const category = getCardCategory(card.rank);
  
  const sizeClasses = {
    small: 'w-12 h-16 text-xs',
    medium: 'w-16 h-24 text-sm',
    large: 'w-20 h-28 text-base'
  };
  
  const getCategoryGradient = () => {
    switch (category) {
      case 'penalty': return 'bg-gradient-to-br from-white to-red-50 border-red-400 shadow-red-200';
      case 'jump': return 'bg-gradient-to-br from-white to-red-50 border-red-500 shadow-red-300';
      case 'kickback': return 'bg-gradient-to-br from-white to-red-50 border-red-600 shadow-red-400';
      case 'question': return 'bg-gradient-to-br from-white to-red-50 border-red-700 shadow-red-500';
      case 'wild': return 'bg-gradient-to-br from-white to-red-50 border-red-800 shadow-red-600';
      default: return 'bg-gradient-to-br from-white to-gray-50 border-red-300 shadow-red-200';
    }
  };
  
  return (
    <div
      className={`
        ${sizeClasses[size]}
        rounded-xl border-2 flex flex-col justify-between p-2 relative
        cursor-pointer transition-all duration-300 shadow-lg
        ${getCategoryGradient()}
        ${isSelected ? 'ring-4 ring-yellow-400 transform -translate-y-3 scale-110 shadow-2xl' : ''}
        ${isPlayable ? 'hover:transform hover:-translate-y-2 hover:shadow-xl hover:scale-105' : ''}
        ${!isPlayable && onClick ? 'opacity-50 cursor-not-allowed' : ''}
        backdrop-blur-sm
      `}
      onClick={onClick}
    >
      {/* Top corner */}
      <div className="font-bold text-red-600 text-center leading-tight drop-shadow-sm">
        <div className="font-black text-shadow-red">{card.rank}</div>
        <div className="text-lg text-red-500">{SUIT_SYMBOLS[card.suit]}</div>
      </div>
      
      {/* Center - Kenyan Coat of Arms */}
      <div className="flex-1 flex items-center justify-center relative">
        <div className="absolute inset-0 flex items-center justify-center opacity-15">
          <img 
            src="/src/assets/Coat_of_arms_of_Kenya_(Official).svg.png" 
            alt="Kenya Coat of Arms"
            className="w-8 h-8 object-contain filter grayscale"
          />
        </div>
        
        {/* Main suit symbol */}
        <div className="text-red-500 text-2xl font-bold z-10 drop-shadow-sm">
          {SUIT_SYMBOLS[card.suit]}
        </div>
      </div>
      
      {/* Bottom corner (rotated) */}
      <div className="font-bold text-red-600 rotate-180 text-center leading-tight drop-shadow-sm">
        <div className="font-black text-shadow-red">{card.rank}</div>
        <div className="text-lg text-red-500">{SUIT_SYMBOLS[card.suit]}</div>
      </div>
      
      {/* Special card indicator */}
      {category !== 'answer' && (
        <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 animate-pulse"></div>
      )}
      
      {/* Glow effect for selected cards */}
      {isSelected && (
        <div className="absolute inset-0 rounded-xl bg-yellow-400 opacity-20 animate-pulse"></div>
      )}
      
      {/* Enhanced text shadow for better readability */}
      <style jsx>{`
        .text-shadow-red {
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
        }
      `}</style>
    </div>
  );
};