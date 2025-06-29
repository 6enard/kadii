export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
  suit: Suit;
  rank: Rank;
  id: string;
}

export type CardCategory = 'penalty' | 'jump' | 'kickback' | 'question' | 'answer' | 'wild';
export type AIDifficulty = 'easy' | 'medium' | 'hard';

export interface Player {
  id: string;
  name: string;
  hand: Card[];
  nikoKadiCalled: boolean;
}

export interface GameState {
  players: Player[];
  currentPlayerIndex: number;
  drawPile: Card[];
  discardPile: Card[];
  drawStack: number;
  pendingQuestion: boolean;
  selectedSuit: Suit | null;
  gamePhase: 'setup' | 'playing' | 'selectingSuit' | 'gameOver';
  winner: string | null;
  turnHistory: string[];
  aiDifficulty?: AIDifficulty;
}

export interface PlayCardOptions {
  cardIds: string[];
  declaredSuit?: Suit;
}