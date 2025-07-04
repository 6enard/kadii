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
  isOnline?: boolean;
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
  gameId?: string;
  isOnlineGame?: boolean;
  hostId?: string;
  lastMoveTimestamp?: Date;
}

export interface PlayCardOptions {
  cardIds: string[];
  declaredSuit?: Suit;
}

// Firebase/User types
export interface UserData {
  id: string;
  username: string;
  email: string;
  createdAt: Date;
  gamesPlayed: number;
  gamesWon: number;
  friends?: string[];
  isOnline?: boolean;
  lastSeen?: Date;
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  fromUsername: string;
  toUserId: string;
  toUsername: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: any; // Firestore timestamp
  updatedAt?: any; // Firestore timestamp
}

export interface GameChallenge {
  id: string;
  fromUserId: string;
  fromUsername: string;
  toUserId: string;
  toUsername: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  gameType: 'multiplayer';
  createdAt: Date;
  expiresAt: Date;
  updatedAt?: any; // Firestore timestamp
}

export interface OnlineGameSession {
  id: string;
  hostId: string;
  hostName: string;
  guestId: string;
  guestName: string;
  gameState: GameState;
  status: 'waiting' | 'active' | 'completed' | 'abandoned';
  createdAt: Date;
  lastMoveAt: Date;
  winner?: string;
}

export interface GameMove {
  id: string;
  gameId: string;
  playerId: string;
  playerName: string;
  moveType: 'playCards' | 'drawCard' | 'declareNikoKadi' | 'selectSuit' | 'drawPenalty';
  cardIds?: string[];
  selectedSuit?: Suit;
  timestamp: Date;
  gameStateAfter: GameState;
}