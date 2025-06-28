import { GameState, Player, Card, PlayCardOptions } from '../types';
import { 
  createDeck, 
  getCardCategory, 
  getPenaltyValue, 
  canPlayCard, 
  isValidStartingCard,
  canWinWithCards,
  isValidQuestionAnswerCombo,
  shuffleDeck
} from './cardUtils';

export function initializeGame(): GameState {
  const deck = createDeck();
  
  // Find a valid starting card
  let startingCardIndex = deck.findIndex(card => isValidStartingCard(card));
  if (startingCardIndex === -1) {
    // If no valid starting card found, reshuffle and try again
    const reshuffled = shuffleDeck(deck);
    startingCardIndex = reshuffled.findIndex(card => isValidStartingCard(card));
  }
  
  const startingCard = deck.splice(startingCardIndex, 1)[0];
  
  // Deal 4 cards to each player
  const player1Hand = deck.splice(0, 4);
  const player2Hand = deck.splice(0, 4);
  
  const players: Player[] = [
    { id: '1', name: 'Player 1', hand: player1Hand, nikoKadiCalled: false },
    { id: '2', name: 'Player 2', hand: player2Hand, nikoKadiCalled: false }
  ];
  
  return {
    players,
    currentPlayerIndex: 0,
    drawPile: deck,
    discardPile: [startingCard],
    drawStack: 0,
    pendingQuestion: false,
    selectedSuit: null,
    gamePhase: 'playing',
    winner: null,
    turnHistory: []
  };
}

export function getTopCard(gameState: GameState): Card {
  return gameState.discardPile[gameState.discardPile.length - 1];
}

export function getCurrentPlayer(gameState: GameState): Player {
  return gameState.players[gameState.currentPlayerIndex];
}

export function canPlayerPlay(gameState: GameState, cardIds: string[]): boolean {
  const currentPlayer = getCurrentPlayer(gameState);
  const cards = cardIds.map(id => currentPlayer.hand.find(c => c.id === id)!).filter(Boolean);
  
  if (cards.length === 0) return false;
  
  const topCard = getTopCard(gameState);
  
  // Single card play
  if (cards.length === 1) {
    return canPlayCard(cards[0], topCard, gameState.selectedSuit);
  }
  
  // Multiple cards - only valid for Question + Answer combo
  if (cards.length === 2) {
    return isValidQuestionAnswerCombo(cards);
  }
  
  return false;
}

export function playCards(gameState: GameState, options: PlayCardOptions): GameState {
  const newState = { ...gameState };
  const currentPlayer = getCurrentPlayer(newState);
  
  // Remove cards from player's hand
  const playedCards = options.cardIds.map(id => 
    currentPlayer.hand.find(c => c.id === id)!
  ).filter(Boolean);
  
  currentPlayer.hand = currentPlayer.hand.filter(card => 
    !options.cardIds.includes(card.id)
  );
  
  // Add cards to discard pile
  newState.discardPile.push(...playedCards);
  
  // Reset selected suit
  newState.selectedSuit = null;
  
  // Handle special card effects
  const lastPlayedCard = playedCards[playedCards.length - 1];
  const category = getCardCategory(lastPlayedCard.rank);
  
  switch (category) {
    case 'penalty':
      newState.drawStack += getPenaltyValue(lastPlayedCard.rank);
      break;
      
    case 'wild':
      if (options.declaredSuit) {
        newState.selectedSuit = options.declaredSuit;
      } else {
        newState.gamePhase = 'selectingSuit';
        return newState;
      }
      // Wild cancels any pending penalty
      newState.drawStack = 0;
      break;
      
    case 'question':
      if (playedCards.length === 1) {
        newState.pendingQuestion = true;
      }
      break;
      
    case 'jump':
      // In 2-player mode, current player plays again
      return newState;
  }
  
  // Check for win condition
  if (currentPlayer.hand.length === 0) {
    if (currentPlayer.nikoKadiCalled && canWinWithCards(playedCards)) {
      newState.winner = currentPlayer.name;
      newState.gamePhase = 'gameOver';
      return newState;
    } else {
      // Invalid win - player must draw a card
      drawCard(newState, newState.currentPlayerIndex);
    }
  }
  
  // Check if player should declare "Niko Kadi"
  if (currentPlayer.hand.length === 1) {
    currentPlayer.nikoKadiCalled = false; // Reset for next declaration
  }
  
  // Move to next player (unless it's a jump)
  if (category !== 'jump') {
    nextTurn(newState);
  }
  
  return newState;
}

export function drawCard(gameState: GameState, playerIndex: number): GameState {
  const newState = { ...gameState };
  
  // Check if draw pile is empty
  if (newState.drawPile.length === 0) {
    // Reshuffle discard pile except top card
    const topCard = newState.discardPile.pop()!;
    newState.drawPile = shuffleDeck(newState.discardPile);
    newState.discardPile = [topCard];
  }
  
  if (newState.drawPile.length > 0) {
    const drawnCard = newState.drawPile.pop()!;
    newState.players[playerIndex].hand.push(drawnCard);
  }
  
  return newState;
}

export function handlePenaltyDraw(gameState: GameState): GameState {
  let newState = { ...gameState };
  
  if (newState.drawStack > 0) {
    const currentPlayer = getCurrentPlayer(newState);
    
    // Draw the penalty cards
    for (let i = 0; i < newState.drawStack; i++) {
      newState = drawCard(newState, newState.currentPlayerIndex);
    }
    
    newState.drawStack = 0;
    nextTurn(newState);
  }
  
  return newState;
}

export function declareNikoKadi(gameState: GameState): GameState {
  const newState = { ...gameState };
  const currentPlayer = getCurrentPlayer(newState);
  
  if (currentPlayer.hand.length === 1) {
    currentPlayer.nikoKadiCalled = true;
    newState.turnHistory.push(`${currentPlayer.name} declared "Niko Kadi"!`);
  }
  
  return newState;
}

export function selectSuit(gameState: GameState, suit: string): GameState {
  const newState = { ...gameState };
  newState.selectedSuit = suit as any;
  newState.gamePhase = 'playing';
  
  // Move to next player after suit selection
  nextTurn(newState);
  
  return newState;
}

function nextTurn(gameState: GameState): void {
  gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
  
  // Reset niko kadi if not called when having 1 card
  const currentPlayer = getCurrentPlayer(gameState);
  if (currentPlayer.hand.length === 1 && !currentPlayer.nikoKadiCalled) {
    // Player must draw a card for not declaring
    drawCard(gameState, gameState.currentPlayerIndex);
    gameState.turnHistory.push(`${currentPlayer.name} forgot to declare "Niko Kadi" and drew a card`);
  }
}