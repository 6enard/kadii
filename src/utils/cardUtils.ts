import { Card, Suit, Rank, CardCategory } from '../types';

export const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
export const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export const SUIT_SYMBOLS = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠'
};

export const SUIT_COLORS = {
  hearts: 'text-red-500',
  diamonds: 'text-red-500',
  clubs: 'text-gray-800',
  spades: 'text-gray-800'
};

export function createDeck(): Card[] {
  const deck: Card[] = [];
  
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({
        suit,
        rank,
        id: `${rank}-${suit}`
      });
    }
  }
  
  return shuffleDeck(deck);
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function getCardCategory(rank: Rank): CardCategory {
  switch (rank) {
    case '2':
    case '3':
      return 'penalty';
    case 'J':
      return 'jump';
    case 'K':
      return 'kickback';
    case 'Q':
    case '8':
      return 'question';
    case 'A':
      return 'wild';
    default:
      return 'answer';
  }
}

export function getPenaltyValue(rank: Rank): number {
  if (rank === '2') return 2;
  if (rank === '3') return 3;
  return 0;
}

export function canPlayCard(card: Card, topCard: Card, selectedSuit: Suit | null): boolean {
  // Wild cards can always be played
  if (card.rank === 'A') return true;
  
  // If there's a selected suit from a previous Ace, match that
  if (selectedSuit) {
    return card.suit === selectedSuit;
  }
  
  // Normal matching: same suit or same rank
  return card.suit === topCard.suit || card.rank === topCard.rank;
}

export function isValidStartingCard(card: Card): boolean {
  const invalidStartingRanks: Rank[] = ['2', '3', '8', 'Q', 'K', 'J', 'A'];
  return !invalidStartingRanks.includes(card.rank);
}

export function canWinWithCards(cards: Card[]): boolean {
  // Cannot win with special cards except Question + Answer combos
  const invalidWinningRanks: Rank[] = ['J', 'K', 'A', '2', '3'];
  
  for (const card of cards) {
    if (invalidWinningRanks.includes(card.rank)) {
      return false;
    }
  }
  
  return true;
}

export function isValidQuestionAnswerCombo(cards: Card[]): boolean {
  if (cards.length !== 2) return false;
  
  const [first, second] = cards;
  const firstCategory = getCardCategory(first.rank);
  const secondCategory = getCardCategory(second.rank);
  
  // First card must be question, second must be answer
  if (firstCategory !== 'question' || secondCategory !== 'answer') {
    return false;
  }
  
  // The answer card must be valid to play (this will be checked in canPlayerPlay)
  return true;
}