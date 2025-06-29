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
  const suitColor = SUIT_COLORS[card.suit];
  
  const sizeClasses = {
    small: 'w-12 h-16 text-xs',
    medium: 'w-16 h-24 text-sm',
    large: 'w-20 h-28 text-base'
  };
  
  const getCategoryGradient = () => {
    switch (category) {
      case 'penalty': return 'bg-white border-red-400';
      case 'jump': return 'bg-white border-red-500';
      case 'kickback': return 'bg-white border-red-600';
      case 'question': return 'bg-white border-red-700';
      case 'wild': return 'bg-white border-red-800';
      default: return 'bg-white border-gray-300';
    }
  };
  
  return (
    <div
      className={`
        ${sizeClasses[size]}
        rounded-xl border-2 flex flex-col relative
        cursor-pointer transition-all duration-300
        ${getCategoryGradient()}
        ${isSelected ? 'ring-4 ring-yellow-400 transform -translate-y-3 scale-110' : ''}
        ${isPlayable ? 'hover:transform hover:-translate-y-2 hover:scale-105' : ''}
        ${!isPlayable && onClick ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      onClick={onClick}
    >
      {/* Top corner - MUCH LARGER AND CLEARER */}
      <div className={`${suitColor} text-center leading-none p-1 bg-white rounded-tl-xl rounded-br-lg`}>
        <div className="font-black text-lg">{card.rank}</div>
        <div className="text-xl">{SUIT_SYMBOLS[card.suit]}</div>
      </div>
      
      {/* Center - Kenyan Coat of Arms with PROMINENT suit symbol */}
      <div className="flex-1 flex items-center justify-center relative">
        {/* Background coat of arms - subtle */}
        <div className="absolute inset-0 flex items-center justify-center opacity-10">
          <img 
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Coat_of_arms_of_Kenya_%28Official%29.svg/1200px-Coat_of_arms_of_Kenya_%28Official%29.svg.png" 
            alt="Kenya Coat of Arms"
            className="w-8 h-8 object-contain filter grayscale"
          />
        </div>
        
        {/* PROMINENT suit symbol in center */}
        <div className={`${suitColor} text-3xl font-black z-10 bg-white rounded-full w-12 h-12 flex items-center justify-center`}>
          {SUIT_SYMBOLS[card.suit]}
        </div>
      </div>
      
      {/* Bottom corner (rotated) - MUCH LARGER AND CLEARER */}
      <div className={`${suitColor} rotate-180 text-center leading-none p-1 bg-white rounded-br-xl rounded-tl-lg`}>
        <div className="font-black text-lg">{card.rank}</div>
        <div className="text-xl">{SUIT_SYMBOLS[card.suit]}</div>
      </div>
      
      {/* Special card indicator */}
      {category !== 'answer' && (
        <div className="absolute top-1 right-1 w-3 h-3 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 animate-pulse border border-white"></div>
      )}
      
      {/* Glow effect for selected cards */}
      {isSelected && (
        <div className="absolute inset-0 rounded-xl bg-yellow-400 opacity-20 animate-pulse"></div>
      )}
    </div>
  );
};