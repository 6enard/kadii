import { GameState, Player, Card, PlayCardOptions } from '../types';
import { 
  createDeck, 
  getCardCategory, 
  getPenaltyValue, 
  canPlayCard, 
  isValidStartingCard,
  canWinWithCards,
  isValidQuestionAnswerCombo,
  shuffleDeck,
  canAnswerQuestion
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
  
  // If there's a pending question, ANY card that matches suit/rank can answer it
  if (gameState.pendingQuestion) {
    // All cards must be able to answer the question
    return cards.every(card => canAnswerQuestion(card, topCard, gameState.selectedSuit));
  }
  
  // Single card play
  if (cards.length === 1) {
    return canPlayCard(cards[0], topCard, gameState.selectedSuit);
  }
  
  // Multiple card logic
  if (cards.length > 1) {
    // Rule 1: All cards must be same rank (stacking same rank cards)
    const firstRank = cards[0].rank;
    const allSameRank = cards.every(card => card.rank === firstRank);
    
    if (allSameRank) {
      // At least one card must be playable on the current top card
      return cards.some(card => canPlayCard(card, topCard, gameState.selectedSuit));
    }
    
    // Rule 2: Sequential play - each card must be playable on the previous one
    // This allows stacking questions or mixed cards as long as they form a valid sequence
    for (let i = 0; i < cards.length; i++) {
      const currentCard = cards[i];
      const previousCard = i === 0 ? topCard : cards[i - 1];
      const currentSelectedSuit = i === 0 ? gameState.selectedSuit : null;
      
      if (!canPlayCard(currentCard, previousCard, currentSelectedSuit)) {
        return false;
      }
    }
    
    return true;
  }
  
  return false;
}

export function playCards(gameState: GameState, options: PlayCardOptions): GameState {
  const newState = { ...gameState };
  const currentPlayer = getCurrentPlayer(newState);
  
  // Add null check for options.cardIds
  const cardIds = options.cardIds ?? [];
  
  // Remove cards from player's hand
  const playedCards = cardIds.map(id => 
    currentPlayer.hand.find(c => c.id === id)!
  ).filter(Boolean);
  
  currentPlayer.hand = currentPlayer.hand.filter(card => 
    !cardIds.includes(card.id)
  );
  
  // Sort played cards for optimal play order
  const sortedPlayedCards = sortPlayedCards(playedCards, getTopCard(newState), newState.selectedSuit);
  
  // Add cards to discard pile in the sorted order
  newState.discardPile.push(...sortedPlayedCards);
  
  // Handle special card effects based on all played cards
  let skipNextTurn = false;
  
  // Calculate total effects for multiple cards
  let totalPenalty = 0;
  let hasWild = false;
  let hasJump = false;
  let kickbackCount = 0;
  let questionCount = 0;
  let answerCount = 0;
  
  sortedPlayedCards.forEach(card => {
    const cardCategory = getCardCategory(card.rank);
    switch (cardCategory) {
      case 'penalty':
        totalPenalty += getPenaltyValue(card.rank);
        break;
      case 'wild':
        hasWild = true;
        break;
      case 'jump':
        hasJump = true;
        break;
      case 'kickback':
        kickbackCount++;
        break;
      case 'question':
        questionCount++;
        break;
      case 'answer':
        answerCount++;
        break;
    }
  });
  
  // Handle pending question first
  if (newState.pendingQuestion) {
    // Any cards played while question is pending count as answers
    newState.pendingQuestion = false;
    newState.turnHistory.push(`${currentPlayer.name} answered the question with ${sortedPlayedCards.length} card(s)`);
  }
  
  // Apply penalty effects
  if (totalPenalty > 0) {
    newState.drawStack += totalPenalty;
    newState.turnHistory.push(`${currentPlayer.name} played ${sortedPlayedCards.length} penalty card(s) (+${totalPenalty} cards)`);
  }
  
  // Handle Ace (wild card) effects
  if (hasWild) {
    if (gameState.drawStack > 0) {
      // Ace is countering penalty - don't change suit, just counter
      newState.drawStack = 0;
      newState.turnHistory.push(`${currentPlayer.name} countered penalty with Ace(s)`);
    } else if (gameState.pendingQuestion) {
      // This case is already handled above
    } else {
      // Regular Ace play - ask for suit selection
      if (options.declaredSuit) {
        newState.selectedSuit = options.declaredSuit;
        newState.turnHistory.push(`${currentPlayer.name} played Ace(s) and chose ${options.declaredSuit}`);
      } else {
        newState.gamePhase = 'selectingSuit';
        return newState;
      }
    }
  }
  
  // Handle question effects - questions create pending questions that must be answered
  if (questionCount > 0 && !newState.pendingQuestion) {
    // Check if there are enough answer cards in the same play to answer all questions
    const totalAnswerCards = answerCount + (hasWild ? 1 : 0); // Aces can answer questions
    
    if (totalAnswerCards < questionCount) {
      // Not enough answers for all questions - create pending question
      newState.pendingQuestion = true;
      newState.turnHistory.push(`${currentPlayer.name} played ${questionCount} question card(s) - must answer remaining questions!`);
      return newState; // Don't change turn
    } else {
      // All questions answered in same play
      newState.turnHistory.push(`${currentPlayer.name} played ${questionCount} question card(s) with ${totalAnswerCards} answer(s)`);
    }
  }
  
  // Handle jump effects
  if (hasJump) {
    // In 2-player mode, current player plays again (skip opponent's turn)
    skipNextTurn = true;
    newState.turnHistory.push(`${currentPlayer.name} played Jack(s) - plays again!`);
  }
  
  // Handle kickback effects
  if (kickbackCount > 0) {
    newState.turnHistory.push(`${currentPlayer.name} played ${kickbackCount} King(s) - kickback effect!`);
    
    if (kickbackCount % 2 === 0) {
      skipNextTurn = true;
      newState.turnHistory.push(`${kickbackCount} kickbacks - turn returns to ${currentPlayer.name}!`);
    } else {
      newState.turnHistory.push(`${kickbackCount} kickbacks - turn goes to next player!`);
    }
  }
  
  // Reset selected suit if not wild card (unless countering)
  if (!hasWild || (hasWild && (gameState.drawStack > 0 || gameState.pendingQuestion))) {
    // Don't reset suit when Ace is used for countering
    if (!(hasWild && (gameState.drawStack > 0 || gameState.pendingQuestion))) {
      newState.selectedSuit = null;
    }
  }
  
  // Log the play if not already logged
  if (sortedPlayedCards.length > 1 && !newState.turnHistory[newState.turnHistory.length - 1].includes('penalty') && !newState.turnHistory[newState.turnHistory.length - 1].includes('Ace') && !newState.turnHistory[newState.turnHistory.length - 1].includes('question')) {
    const cardNames = sortedPlayedCards.map(card => `${card.rank}${card.suit}`).join(', ');
    newState.turnHistory.push(`${currentPlayer.name} played multiple cards: ${cardNames}`);
  }
  
  // Win condition logic
  if (currentPlayer.hand.length === 0) {
    if (currentPlayer.nikoKadiCalled && canWinWithCards(sortedPlayedCards)) {
      newState.winner = currentPlayer.name;
      newState.gamePhase = 'gameOver';
      newState.turnHistory.push(`${currentPlayer.name} wins the game!`);
      return newState;
    } else if (!currentPlayer.nikoKadiCalled) {
      newState.turnHistory.push(`${currentPlayer.name} finished cards but forgot to declare Niko Kadi - no win!`);
    } else {
      // Invalid win with special cards
      drawCard(newState, newState.currentPlayerIndex);
      newState.turnHistory.push(`${currentPlayer.name} tried to win with invalid cards and drew a card`);
    }
  }
  
  // Reset Niko Kadi status if player doesn't finish on this turn
  if (currentPlayer.hand.length > 1 && currentPlayer.nikoKadiCalled) {
    currentPlayer.nikoKadiCalled = false;
    newState.turnHistory.push(`${currentPlayer.name}'s Niko Kadi status reset - didn't finish`);
  }
  
  // Move to next player (unless it's a jump or pending question or even kickbacks)
  if (!skipNextTurn && !newState.pendingQuestion) {
    nextTurn(newState);
  }
  
  return newState;
}

// Helper function to sort played cards for optimal play order
function sortPlayedCards(cards: Card[], topCard: Card, selectedSuit: string | null): Card[] {
  if (cards.length <= 1) return cards;
  
  // If all cards are the same rank, return as-is (stacking same rank)
  const firstRank = cards[0].rank;
  if (cards.every(card => card.rank === firstRank)) {
    return cards;
  }
  
  // For mixed cards, try to create a valid sequence
  const result: Card[] = [];
  const remaining = [...cards];
  
  // Find the best starting card (one that can be played on top card)
  const playableFirst = remaining.filter(card => canPlayCard(card, topCard, selectedSuit as any));
  
  if (playableFirst.length === 0) return cards; // Return original order if no valid start
  
  // Start with a playable card
  result.push(playableFirst[0]);
  remaining.splice(remaining.indexOf(playableFirst[0]), 1);
  
  // Build sequence where each card can be played on the previous
  while (remaining.length > 0) {
    const currentTop = result[result.length - 1];
    
    // Find next card that can be played on current top
    const nextPlayable = remaining.find(card => 
      canPlayCard(card, currentTop, null) || 
      card.rank === currentTop.rank ||
      card.suit === currentTop.suit
    );
    
    if (nextPlayable) {
      result.push(nextPlayable);
      remaining.splice(remaining.indexOf(nextPlayable), 1);
    } else {
      // Add remaining cards in original order
      result.push(...remaining);
      break;
    }
  }
  
  return result;
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
  
  // Reset Niko Kadi status when drawing cards
  if (player.nikoKadiCalled) {
    player.nikoKadiCalled = false;
    newState.turnHistory.push(`${player.name}'s Niko Kadi status reset - drew a card`);
  }
  
  // When a player draws a card, the question is cleared and game continues normally
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
    
    // Reset Niko Kadi status when drawing penalty cards
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
  
  // Allow declaring Niko Kadi at any time
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
  
  // Handle cardless players who forgot to declare Niko Kadi
  const currentPlayer = getCurrentPlayer(gameState);
  
  // If player is cardless and didn't declare Niko Kadi, they get a card on their turn
  if (currentPlayer.hand.length === 0 && !currentPlayer.nikoKadiCalled) {
    // Give them a card since they forgot to declare
    if (gameState.drawPile.length === 0) {
      // Reshuffle discard pile except top card
      const topCard = gameState.discardPile.pop()!;
      gameState.drawPile = shuffleDeck(gameState.discardPile);
      gameState.discardPile = [topCard];
    }
    
    if (gameState.drawPile.length > 0) {
      const drawnCard = gameState.drawPile.pop()!;
      currentPlayer.hand.push(drawnCard);
      gameState.turnHistory.push(`${currentPlayer.name} gets a card for not declaring Niko Kadi when finishing`);
    }
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
  
  // If there's a pending question, AI can answer with ANY playable card
  if (newState.pendingQuestion) {
    // Look for any cards that can answer the question
    const answerCards = currentPlayer.hand.filter(card => 
      canAnswerQuestion(card, getTopCard(newState), newState.selectedSuit)
    );
    
    if (answerCards.length > 0) {
      // Try to play multiple answer cards if they have the same rank
      const sameRankAnswers = findSameRankCards(answerCards);
      
      if (sameRankAnswers.length > 1) {
        // Play multiple same-rank answer cards
        return playCards(newState, { cardIds: sameRankAnswers.map(c => c.id) });
      } else {
        // Play single answer card
        return playCards(newState, { cardIds: [answerCards[0].id] });
      }
    } else {
      // No answer available, must draw
      return drawCard(newState, newState.currentPlayerIndex);
    }
  }
  
  // Look for playable card combinations
  const playableCardCombinations = findPlayableCardCombinations(currentPlayer.hand, newState);
  
  if (playableCardCombinations.length === 0) {
    // No playable cards, must draw
    if (newState.drawStack > 0) {
      return handlePenaltyDraw(newState);
    } else {
      return drawCard(newState, newState.currentPlayerIndex);
    }
  }
  
  // AI strategy based on difficulty
  let selectedCombination: string[];
  
  switch (difficulty) {
    case 'easy':
      selectedCombination = playableCardCombinations[0];
      break;
    case 'medium':
      selectedCombination = selectMediumAICombination(playableCardCombinations, currentPlayer.hand, newState);
      break;
    case 'hard':
      selectedCombination = selectHardAICombination(playableCardCombinations, currentPlayer.hand, newState);
      break;
    default:
      selectedCombination = playableCardCombinations[0];
  }
  
  // Check if any selected card is an Ace (wild card)
  const selectedCards = selectedCombination.map(id => 
    currentPlayer.hand.find(card => card.id === id)!
  );
  
  const hasAce = selectedCards.some(card => card.rank === 'A');
  
  // Handle Ace (wild card) suit selection - only for regular play, not countering
  if (hasAce && newState.drawStack === 0 && !newState.pendingQuestion) {
    const bestSuit = selectBestSuit(currentPlayer.hand, difficulty);
    return playCards(newState, { 
      cardIds: selectedCombination, 
      declaredSuit: bestSuit 
    });
  }
  
  return playCards(newState, { cardIds: selectedCombination });
}

// Helper function to find cards of the same rank
function findSameRankCards(cards: Card[]): Card[] {
  if (cards.length <= 1) return cards;
  
  const rankGroups = new Map<string, Card[]>();
  cards.forEach(card => {
    if (!rankGroups.has(card.rank)) {
      rankGroups.set(card.rank, []);
    }
    rankGroups.get(card.rank)!.push(card);
  });
  
  // Return the largest group of same-rank cards
  let largestGroup: Card[] = [];
  rankGroups.forEach(group => {
    if (group.length > largestGroup.length) {
      largestGroup = group;
    }
  });
  
  return largestGroup;
}

// Helper function to find all playable card combinations
function findPlayableCardCombinations(hand: Card[], gameState: GameState): string[][] {
  const combinations: string[][] = [];
  
  // Single cards
  for (const card of hand) {
    if (canPlayerPlay(gameState, [card.id])) {
      combinations.push([card.id]);
    }
  }
  
  // Same rank combinations
  const rankGroups = new Map<string, Card[]>();
  hand.forEach(card => {
    if (!rankGroups.has(card.rank)) {
      rankGroups.set(card.rank, []);
    }
    rankGroups.get(card.rank)!.push(card);
  });
  
  rankGroups.forEach((cards, rank) => {
    if (cards.length > 1) {
      // Try all combinations of same rank cards
      for (let i = 2; i <= cards.length; i++) {
        const cardIds = cards.slice(0, i).map(c => c.id);
        if (canPlayerPlay(gameState, cardIds)) {
          combinations.push(cardIds);
        }
      }
    }
  });
  
  // Sequential combinations (for questions and mixed plays)
  if (gameState.pendingQuestion || !gameState.drawStack) {
    const sequentialCombos = findSequentialCombinations(hand, gameState);
    combinations.push(...sequentialCombos);
  }
  
  return combinations;
}

// Helper function to find sequential card combinations
function findSequentialCombinations(hand: Card[], gameState: GameState): string[][] {
  const combinations: string[][] = [];
  const topCard = getTopCard(gameState);
  
  // Try combinations of 2-4 cards that can be played sequentially
  for (let length = 2; length <= Math.min(4, hand.length); length++) {
    for (let i = 0; i <= hand.length - length; i++) {
      const cardIds = hand.slice(i, i + length).map(c => c.id);
      if (canPlayerPlay(gameState, cardIds)) {
        combinations.push(cardIds);
      }
    }
  }
  
  return combinations;
}

function selectMediumAICombination(combinations: string[][], hand: Card[], gameState: GameState): string[] {
  // Prefer combinations that get rid of more cards
  combinations.sort((a, b) => b.length - a.length);
  
  // Among combinations of same length, prefer special cards
  const topLength = combinations[0].length;
  const topCombinations = combinations.filter(combo => combo.length === topLength);
  
  for (const combo of topCombinations) {
    const cards = combo.map(id => hand.find(card => card.id === id)!);
    const hasSpecialCard = cards.some(card => {
      const category = getCardCategory(card.rank);
      return ['penalty', 'jump', 'wild'].includes(category);
    });
    
    if (hasSpecialCard) {
      return combo;
    }
  }
  
  return combinations[0];
}

function selectHardAICombination(combinations: string[][], hand: Card[], gameState: GameState): string[] {
  const opponent = gameState.players.find(p => p.name !== 'Computer')!;
  const opponentHandSize = opponent.hand.length;
  
  // If opponent has few cards, prioritize defensive combinations
  if (opponentHandSize <= 2) {
    const penaltyCombinations = combinations.filter(combo => {
      const cards = combo.map(id => hand.find(card => card.id === id)!);
      return cards.some(card => getCardCategory(card.rank) === 'penalty');
    });
    
    if (penaltyCombinations.length > 0) {
      // Prefer larger penalty combinations
      penaltyCombinations.sort((a, b) => b.length - a.length);
      return penaltyCombinations[0];
    }
  }
  
  // Prefer combinations that get rid of more cards
  combinations.sort((a, b) => b.length - a.length);
  return combinations[0];
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