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
  
  // Multiple cards - check if they're all the same rank and at least one matches
  if (cards.length > 1) {
    // All cards must have the same rank
    const firstRank = cards[0].rank;
    const allSameRank = cards.every(card => card.rank === firstRank);
    
    if (!allSameRank) {
      // Special case: Question + Answer combo
      if (cards.length === 2) {
        return isValidQuestionAnswerCombo(cards);
      }
      return false;
    }
    
    // At least one card must be playable
    return cards.some(card => canPlayCard(card, topCard, gameState.selectedSuit));
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
  
  // Reset selected suit and pending question
  newState.selectedSuit = null;
  newState.pendingQuestion = false;
  
  // Handle special card effects based on the last played card
  const lastPlayedCard = playedCards[playedCards.length - 1];
  const category = getCardCategory(lastPlayedCard.rank);
  
  let skipNextTurn = false;
  
  switch (category) {
    case 'penalty':
      // Add penalty for each penalty card played
      const totalPenalty = playedCards.reduce((sum, card) => {
        return sum + getPenaltyValue(card.rank);
      }, 0);
      newState.drawStack += totalPenalty;
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
      // In 2-player mode, current player plays again (skip opponent's turn)
      skipNextTurn = true;
      break;
      
    case 'kickback':
      // Reverse turn order - in 2-player mode, this acts like a jump
      skipNextTurn = true;
      break;
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
  
  // Move to next player (unless it's a jump/kickback)
  if (!skipNextTurn) {
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
  
  // After drawing a card (when no valid play), turn goes to next player
  if (newState.pendingQuestion || newState.drawStack === 0) {
    nextTurn(newState);
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
    // Turn automatically moves to next player after penalty draw
    // (this is handled in the drawCard function)
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
    const drawnState = drawCard(gameState, gameState.currentPlayerIndex);
    // Copy the updated hand back
    gameState.players[gameState.currentPlayerIndex].hand = drawnState.players[gameState.currentPlayerIndex].hand;
    gameState.turnHistory.push(`${currentPlayer.name} forgot to declare "Niko Kadi" and drew a card`);
  }
}