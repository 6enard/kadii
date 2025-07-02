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
    small: 'w-10 h-14 text-xs sm:w-12 sm:h-16 sm:text-xs md:w-14 md:h-20',
    medium: 'w-12 h-16 text-xs sm:w-16 sm:h-24 sm:text-sm md:w-18 md:h-26',
    large: 'w-14 h-20 text-sm sm:w-20 sm:h-28 sm:text-base md:w-24 md:h-32'
  };
  
  const getCategoryStyles = () => {
    switch (category) {
      case 'penalty': 
        return 'bg-gradient-to-br from-white to-red-50 border-red-400 shadow-red-200';
      case 'jump': 
        return 'bg-gradient-to-br from-white to-blue-50 border-blue-400 shadow-blue-200';
      case 'kickback': 
        return 'bg-gradient-to-br from-white to-purple-50 border-purple-400 shadow-purple-200';
      case 'question': 
        return 'bg-gradient-to-br from-white to-orange-50 border-orange-400 shadow-orange-200';
      case 'wild': 
        return 'bg-gradient-to-br from-white to-yellow-50 border-yellow-400 shadow-yellow-200';
      default: 
        return 'bg-gradient-to-br from-white to-gray-50 border-gray-300 shadow-gray-200';
    }
  };
  
  return (
    <div
      className={`
        ${sizeClasses[size]}
        rounded-lg border-2 flex flex-col relative overflow-hidden
        cursor-pointer transition-all duration-300 shadow-lg
        ${getCategoryStyles()}
        ${isSelected ? 'ring-2 ring-emerald-400 shadow-xl shadow-emerald-200/50 sm:ring-4' : ''}
        ${isPlayable ? 'hover:shadow-xl hover:shadow-emerald-200/50 border-emerald-300' : ''}
        ${!isPlayable && onClick ? 'opacity-60 cursor-not-allowed' : ''}
        ${onClick ? 'active:scale-95 sm:hover:scale-105' : ''}
        touch-manipulation
      `}
      onClick={onClick}
    >
      {/* Card Header */}
      <div className={`${suitColor} p-0.5 sm:p-1 bg-white/90 backdrop-blur-sm`}>
        <div className="text-center leading-none">
          <div className="font-black text-sm sm:text-lg">{card.rank}</div>
          <div className="text-sm sm:text-xl">{SUIT_SYMBOLS[card.suit]}</div>
        </div>
      </div>
      
      {/* Card Body */}
      <div className="flex-1 flex items-center justify-center relative p-1 sm:p-2">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="w-full h-full bg-gradient-to-br from-gray-400 to-gray-600 rounded-b-lg"></div>
        </div>
        
        {/* Main suit symbol */}
        <div className={`${suitColor} text-xl sm:text-4xl font-black z-10 drop-shadow-sm`}>
          {SUIT_SYMBOLS[card.suit]}
        </div>
      </div>
      
      {/* Special card indicator */}
      {category !== 'answer' && (
        <div className="absolute top-0.5 right-0.5 w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 border border-white shadow-sm"></div>
      )}
      
      {/* Selection glow */}
      {isSelected && (
        <div className="absolute inset-0 rounded-lg bg-emerald-400/20 animate-pulse"></div>
      )}
      
      {/* Playable indicator */}
      {isPlayable && !isSelected && (
        <div className="absolute inset-0 rounded-lg bg-emerald-400/10 opacity-0 hover:opacity-100 transition-opacity"></div>
      )}
    </div>
  );
};