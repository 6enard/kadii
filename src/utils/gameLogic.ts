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
  
  // If there's a penalty stack, can only play penalty cards (2, 3) or Ace to counter
  if (gameState.drawStack > 0) {
    return cards.every(card => {
      const category = getCardCategory(card.rank);
      return category === 'penalty' || card.rank === 'A';
    });
  }
  
  // If there's a pending question, only the person who played it can answer
  if (gameState.pendingQuestion) {
    // Can play answer cards or another question card
    if (cards.length === 1) {
      const category = getCardCategory(cards[0].rank);
      if (category === 'answer' || category === 'question') {
        return canPlayCard(cards[0], topCard, gameState.selectedSuit);
      }
    }
    
    // Question + Answer combo
    if (cards.length === 2) {
      return isValidQuestionAnswerCombo(cards) && 
             canPlayCard(cards[0], topCard, gameState.selectedSuit);
    }
    
    return false;
  }
  
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
        return isValidQuestionAnswerCombo(cards) && 
               canPlayCard(cards[0], topCard, gameState.selectedSuit);
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
      newState.turnHistory.push(`${currentPlayer.name} played penalty cards (+${totalPenalty} cards)`);
      break;
      
    case 'wild':
      if (options.declaredSuit) {
        newState.selectedSuit = options.declaredSuit;
        newState.turnHistory.push(`${currentPlayer.name} played Ace and chose ${options.declaredSuit}`);
      } else {
        newState.gamePhase = 'selectingSuit';
        return newState;
      }
      // Wild cancels any pending penalty
      if (newState.drawStack > 0) {
        newState.turnHistory.push(`${currentPlayer.name} countered penalty with Ace`);
        newState.drawStack = 0;
      }
      break;
      
    case 'question':
      if (playedCards.length === 1) {
        // Question card played - same player must answer immediately
        newState.pendingQuestion = true;
        newState.turnHistory.push(`${currentPlayer.name} played a question card - must answer immediately`);
        // Don't change turn - same player continues
        return newState;
      } else {
        // Question + Answer combo
        newState.pendingQuestion = false;
        newState.turnHistory.push(`${currentPlayer.name} played question + answer combo`);
      }
      break;
      
    case 'jump':
      // In 2-player mode, current player plays again (skip opponent's turn)
      skipNextTurn = true;
      newState.turnHistory.push(`${currentPlayer.name} played Jack - plays again!`);
      break;
      
    case 'kickback':
      // King means turn goes to next player (not back to current player)
      newState.turnHistory.push(`${currentPlayer.name} played King`);
      break;
      
    default:
      if (newState.pendingQuestion) {
        newState.pendingQuestion = false;
        newState.turnHistory.push(`${currentPlayer.name} answered the question`);
      }
  }
  
  // Reset selected suit if not wild card
  if (category !== 'wild') {
    newState.selectedSuit = null;
  }
  
  // Check for win condition
  if (currentPlayer.hand.length === 0) {
    if (currentPlayer.nikoKadiCalled && canWinWithCards(playedCards)) {
      newState.winner = currentPlayer.name;
      newState.gamePhase = 'gameOver';
      newState.turnHistory.push(`${currentPlayer.name} wins the game!`);
      return newState;
    } else {
      // Invalid win - player must draw a card
      drawCard(newState, newState.currentPlayerIndex);
      newState.turnHistory.push(`${currentPlayer.name} tried to win illegally and drew a card`);
    }
  }
  
  // CRITICAL: Reset Niko Kadi status if player doesn't finish
  if (currentPlayer.hand.length > 1 && currentPlayer.nikoKadiCalled) {
    currentPlayer.nikoKadiCalled = false;
    newState.turnHistory.push(`${currentPlayer.name}'s Niko Kadi status reset - didn't finish`);
  }
  
  // Move to next player (unless it's a jump or pending question)
  if (!skipNextTurn && !newState.pendingQuestion) {
    nextTurn(newState);
  }
  
  return newState;
}

export function drawCard(gameState: GameState, playerIndex: number): GameState {
  const newState = { ...gameState };
  const player = newState.players[playerIndex];
  
  // Check if draw pile is empty
  if (newState.drawPile.length === 0) {
    // Reshuffle discard pile except top card
    const topCard = newState.discardPile.pop()!;
    newState.drawPile = shuffleDeck(newState.discardPile);
    newState.discardPile = [topCard];
  }
  
  if (newState.drawPile.length > 0) {
    const drawnCard = newState.drawPile.pop()!;
    player.hand.push(drawnCard);
    newState.turnHistory.push(`${player.name} drew a card`);
  }
  
  // CRITICAL: Reset Niko Kadi status when drawing cards
  if (player.nikoKadiCalled) {
    player.nikoKadiCalled = false;
    newState.turnHistory.push(`${player.name}'s Niko Kadi status reset - drew a card`);
  }
  
  // CRITICAL FIX: When a player draws a card, the question is cleared and game continues normally
  if (newState.pendingQuestion) {
    newState.pendingQuestion = false;
    newState.turnHistory.push(`${player.name} drew a card - question cleared, game continues normally`);
  }
  
  // Turn moves to next player after drawing
  nextTurn(newState);
  
  return newState;
}

export function handlePenaltyDraw(gameState: GameState): GameState {
  let newState = { ...gameState };
  
  if (newState.drawStack > 0) {
    const penaltyAmount = newState.drawStack;
    const player = getCurrentPlayer(newState);
    
    // Draw the penalty cards
    for (let i = 0; i < penaltyAmount; i++) {
      // Check if draw pile is empty
      if (newState.drawPile.length === 0) {
        // Reshuffle discard pile except top card
        const topCard = newState.discardPile.pop()!;
        newState.drawPile = shuffleDeck(newState.discardPile);
        newState.discardPile = [topCard];
      }
      
      if (newState.drawPile.length > 0) {
        const drawnCard = newState.drawPile.pop()!;
        player.hand.push(drawnCard);
      }
    }
    
    newState.turnHistory.push(`${player.name} drew ${penaltyAmount} penalty cards`);
    newState.drawStack = 0; // Clear penalty stack
    
    // CRITICAL: Reset Niko Kadi status when drawing penalty cards
    if (player.nikoKadiCalled) {
      player.nikoKadiCalled = false;
      newState.turnHistory.push(`${player.name}'s Niko Kadi status reset - drew penalty cards`);
    }
    
    // Turn automatically moves to next player after penalty draw
    nextTurn(newState);
  }
  
  return newState;
}

export function declareNikoKadi(gameState: GameState): GameState {
  const newState = { ...gameState };
  const currentPlayer = getCurrentPlayer(newState);
  
  // Allow declaring Niko Kadi at any time (not just when having 1 card)
  currentPlayer.nikoKadiCalled = true;
  newState.turnHistory.push(`${currentPlayer.name} declared "Niko Kadi"!`);
  
  return newState;
}

export function selectSuit(gameState: GameState, suit: string): GameState {
  const newState = { ...gameState };
  newState.selectedSuit = suit as any;
  newState.gamePhase = 'playing';
  newState.turnHistory.push(`Suit selected: ${suit}`);
  
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
    if (gameState.drawPile.length === 0) {
      // Reshuffle discard pile except top card
      const topCard = gameState.discardPile.pop()!;
      gameState.drawPile = shuffleDeck(gameState.discardPile);
      gameState.discardPile = [topCard];
    }
    
    if (gameState.drawPile.length > 0) {
      const drawnCard = gameState.drawPile.pop()!;
      currentPlayer.hand.push(drawnCard);
    }
    
    gameState.turnHistory.push(`${currentPlayer.name} forgot to declare "Niko Kadi" and drew a card`);
  }
}

// AI Computer Logic
export type AIDifficulty = 'easy' | 'medium' | 'hard';

export function makeAIMove(gameState: GameState, difficulty: AIDifficulty): GameState {
  const currentPlayer = getCurrentPlayer(gameState);
  if (currentPlayer.name !== 'Computer') return gameState;
  
  let newState = { ...gameState };
  
  // Check if AI should declare Niko Kadi (when having 1 card)
  if (currentPlayer.hand.length === 1 && !currentPlayer.nikoKadiCalled) {
    newState = declareNikoKadi(newState);
  }
  
  // CRITICAL: If there's a pending question, AI must answer it or draw
  if (newState.pendingQuestion) {
    // Look for answer cards or another question card
    const answerCards = currentPlayer.hand.filter(card => {
      const category = getCardCategory(card.rank);
      return (category === 'answer' || category === 'question') && 
             canPlayerPlay(newState, [card.id]);
    });
    
    if (answerCards.length > 0) {
      // Play an answer or question card
      const selectedCard = answerCards[0];
      return playCards(newState, { cardIds: [selectedCard.id] });
    } else {
      // No answer available, must draw - this will clear the question and continue normally
      return drawCard(newState, newState.currentPlayerIndex);
    }
  }
  
  // Find playable cards
  const playableCards = currentPlayer.hand.filter(card => 
    canPlayerPlay(newState, [card.id])
  );
  
  if (playableCards.length === 0) {
    // No playable cards, must draw
    if (newState.drawStack > 0) {
      return handlePenaltyDraw(newState);
    } else {
      return drawCard(newState, newState.currentPlayerIndex);
    }
  }
  
  // AI strategy based on difficulty
  let selectedCard: Card;
  
  switch (difficulty) {
    case 'easy':
      // Easy: Play first available card
      selectedCard = playableCards[0];
      break;
      
    case 'medium':
      // Medium: Prefer special cards, avoid giving opponent advantages
      selectedCard = selectMediumAICard(playableCards, newState);
      break;
      
    case 'hard':
      // Hard: Strategic play, consider opponent's hand size and game state
      selectedCard = selectHardAICard(playableCards, newState);
      break;
      
    default:
      selectedCard = playableCards[0];
  }
  
  // Check for multiple cards of same rank
  const sameRankCards = currentPlayer.hand.filter(card => 
    card.rank === selectedCard.rank && canPlayerPlay(newState, [card.id])
  );
  
  const cardsToPlay = difficulty === 'hard' && sameRankCards.length > 1 
    ? sameRankCards.slice(0, Math.min(3, sameRankCards.length)) // Play up to 3 of same rank
    : [selectedCard];
  
  // Handle Ace (wild card) suit selection
  if (selectedCard.rank === 'A') {
    const bestSuit = selectBestSuit(currentPlayer.hand, difficulty);
    return playCards(newState, { 
      cardIds: cardsToPlay.map(c => c.id), 
      declaredSuit: bestSuit 
    });
  }
  
  return playCards(newState, { cardIds: cardsToPlay.map(c => c.id) });
}

function selectMediumAICard(playableCards: Card[], gameState: GameState): Card {
  // Prefer special cards that benefit AI
  const specialCards = playableCards.filter(card => {
    const category = getCardCategory(card.rank);
    return ['penalty', 'jump', 'wild'].includes(category);
  });
  
  if (specialCards.length > 0) {
    return specialCards[0];
  }
  
  // Otherwise play highest value card
  const cardValues = { 'A': 14, 'K': 13, 'Q': 12, 'J': 11, '10': 10, '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2 };
  return playableCards.sort((a, b) => (cardValues[b.rank] || 0) - (cardValues[a.rank] || 0))[0];
}

function selectHardAICard(playableCards: Card[], gameState: GameState): Card {
  const opponent = gameState.players.find(p => p.name !== 'Computer')!;
  const opponentHandSize = opponent.hand.length;
  
  // If opponent has few cards, prioritize defensive play
  if (opponentHandSize <= 2) {
    // Prefer penalty cards to slow opponent down
    const penaltyCards = playableCards.filter(card => 
      getCardCategory(card.rank) === 'penalty'
    );
    if (penaltyCards.length > 0) {
      return penaltyCards[0];
    }
  }
  
  // If AI has many cards, prioritize getting rid of cards quickly
  const currentPlayer = getCurrentPlayer(gameState);
  if (currentPlayer.hand.length > 5) {
    // Look for cards with same rank to play multiple
    const rankCounts = new Map<string, Card[]>();
    playableCards.forEach(card => {
      if (!rankCounts.has(card.rank)) {
        rankCounts.set(card.rank, []);
      }
      rankCounts.get(card.rank)!.push(card);
    });
    
    // Find rank with most cards
    let bestRank = '';
    let maxCount = 0;
    rankCounts.forEach((cards, rank) => {
      if (cards.length > maxCount) {
        maxCount = cards.length;
        bestRank = rank;
      }
    });
    
    if (maxCount > 1) {
      return rankCounts.get(bestRank)![0];
    }
  }
  
  // Default to medium strategy
  return selectMediumAICard(playableCards, gameState);
}

function selectBestSuit(hand: Card[], difficulty: AIDifficulty): string {
  const suitCounts = { hearts: 0, diamonds: 0, clubs: 0, spades: 0 };
  
  hand.forEach(card => {
    suitCounts[card.suit]++;
  });
  
  // For hard difficulty, consider strategic suit selection
  if (difficulty === 'hard') {
    // Prefer suit with most cards, but also consider special cards
    const suits = Object.entries(suitCounts);
    suits.sort((a, b) => b[1] - a[1]);
    return suits[0][0];
  }
  
  // For easy/medium, just pick most common suit
  return Object.entries(suitCounts)
    .sort((a, b) => b[1] - a[1])[0][0];
}