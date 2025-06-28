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
  
  const getCategoryColor = () => {
    switch (category) {
      case 'penalty': return 'border-red-400 bg-red-50';
      case 'jump': return 'border-blue-400 bg-blue-50';
      case 'kickback': return 'border-purple-400 bg-purple-50';
      case 'question': return 'border-yellow-400 bg-yellow-50';
      case 'wild': return 'border-green-400 bg-green-50';
      default: return 'border-gray-300 bg-white';
    }
  };
  
  return (
    <div
      className={`
        ${sizeClasses[size]}
        rounded-lg border-2 flex flex-col justify-between p-1
        cursor-pointer transition-all duration-200
        ${getCategoryColor()}
        ${isSelected ? 'ring-2 ring-blue-500 transform -translate-y-2' : ''}
        ${isPlayable ? 'hover:transform hover:-translate-y-1 hover:shadow-lg' : ''}
        ${!isPlayable && onClick ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      onClick={onClick}
    >
      <div className={`font-bold ${suitColor}`}>
        <div>{card.rank}</div>
        <div>{SUIT_SYMBOLS[card.suit]}</div>
      </div>
      
      <div className={`text-center ${suitColor} text-xl`}>
        {SUIT_SYMBOLS[card.suit]}
      </div>
      
      <div className={`font-bold ${suitColor} rotate-180 text-right`}>
        <div>{card.rank}</div>
        <div>{SUIT_SYMBOLS[card.suit]}</div>
      </div>
    </div>
  );
};