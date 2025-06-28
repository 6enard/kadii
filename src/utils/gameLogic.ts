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
  
  // CRITICAL: If there's a pending question, only the person who played it can answer
  if (gameState.pendingQuestion) {
    // Can play answer cards, question cards, or ACES (wild cards can answer questions!)
    if (cards.length === 1) {
      return canAnswerQuestion(cards[0], topCard, gameState.selectedSuit);
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
  
  // ENHANCED MULTIPLE CARD LOGIC
  if (cards.length > 1) {
    // Special case: Question + Answer combo (exactly 2 cards)
    if (cards.length === 2) {
      const isQuestionAnswerCombo = isValidQuestionAnswerCombo(cards);
      if (isQuestionAnswerCombo && canPlayCard(cards[0], topCard, gameState.selectedSuit)) {
        return true;
      }
    }
    
    // ENHANCED: Allow mixed combinations as long as at least one card can be played
    // and all cards follow valid stacking rules
    
    // Check if at least one card can be played on the current top card
    const hasPlayableCard = cards.some(card => canPlayCard(card, topCard, gameState.selectedSuit));
    if (!hasPlayableCard) {
      return false;
    }
    
    // STACKING RULES:
    // 1. All cards of same rank (e.g., 4♥ 4♠ 4♦)
    // 2. Mixed cards where each subsequent card can be played on the previous one
    
    // Rule 1: All same rank
    const firstRank = cards[0].rank;
    const allSameRank = cards.every(card => card.rank === firstRank);
    if (allSameRank) {
      return true; // Valid if at least one can be played (already checked above)
    }
    
    // Rule 2: Sequential validity - each card must be playable on the previous one
    // Sort cards to find the best playing order
    const sortedCards = [...cards];
    
    // Try to find a valid sequence
    for (let i = 0; i < sortedCards.length; i++) {
      const permutation = [...sortedCards];
      // Move current card to front
      [permutation[0], permutation[i]] = [permutation[i], permutation[0]];
      
      // Check if this permutation works
      if (canPlayCard(permutation[0], topCard, gameState.selectedSuit)) {
        let isValidSequence = true;
        let currentCard = permutation[0];
        
        for (let j = 1; j < permutation.length; j++) {
          const nextCard = permutation[j];
          // Check if next card can be played on current card
          if (!canPlayCard(nextCard, currentCard, null)) {
            // Special case: if both are same rank, allow it
            if (nextCard.rank !== currentCard.rank) {
              isValidSequence = false;
              break;
            }
          }
          currentCard = nextCard;
        }
        
        if (isValidSequence) {
          return true;
        }
      }
    }
    
    // Additional rule: Allow cards that share rank with any card in the sequence
    // e.g., Q♥ Q♠ 8♠ is valid if Q♥ can be played and 8♠ matches Q♠
    const rankGroups = new Map<string, Card[]>();
    cards.forEach(card => {
      if (!rankGroups.has(card.rank)) {
        rankGroups.set(card.rank, []);
      }
      rankGroups.get(card.rank)!.push(card);
    });
    
    // If we have multiple rank groups, check if they can form a valid chain
    if (rankGroups.size > 1) {
      const ranks = Array.from(rankGroups.keys());
      
      // Check if we can create a valid sequence using the rank groups
      for (const startRank of ranks) {
        const startCards = rankGroups.get(startRank)!;
        const playableStartCards = startCards.filter(card => 
          canPlayCard(card, topCard, gameState.selectedSuit)
        );
        
        if (playableStartCards.length > 0) {
          // We have a valid starting point, now check if other ranks can connect
          let canConnectAll = true;
          const usedRanks = new Set([startRank]);
          let currentTestCard = playableStartCards[0];
          
          for (const rank of ranks) {
            if (usedRanks.has(rank)) continue;
            
            const rankCards = rankGroups.get(rank)!;
            const canConnect = rankCards.some(card => 
              canPlayCard(card, currentTestCard, null) || 
              card.rank === currentTestCard.rank ||
              card.suit === currentTestCard.suit
            );
            
            if (canConnect) {
              usedRanks.add(rank);
              currentTestCard = rankCards[0];
            } else {
              canConnectAll = false;
              break;
            }
          }
          
          if (canConnectAll && usedRanks.size === ranks.length) {
            return true;
          }
        }
      }
    }
    
    return false;
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
  
  // ENHANCED: Sort played cards for optimal play order
  const sortedPlayedCards = sortPlayedCards(playedCards, getTopCard(newState), newState.selectedSuit);
  
  // Add cards to discard pile in the sorted order
  newState.discardPile.push(...sortedPlayedCards);
  
  // Handle special card effects based on the last played card
  const lastPlayedCard = sortedPlayedCards[sortedPlayedCards.length - 1];
  const category = getCardCategory(lastPlayedCard.rank);
  
  let skipNextTurn = false;
  
  // Calculate total effects for multiple cards
  let totalPenalty = 0;
  let hasWild = false;
  let hasJump = false;
  let hasKickback = false;
  let hasQuestion = false;
  
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
        hasKickback = true;
        break;
      case 'question':
        hasQuestion = true;
        break;
    }
  });
  
  // Apply effects based on what was played
  if (totalPenalty > 0) {
    newState.drawStack += totalPenalty;
    newState.turnHistory.push(`${currentPlayer.name} played ${sortedPlayedCards.length} penalty card(s) (+${totalPenalty} cards)`);
  }
  
  if (hasWild) {
    if (options.declaredSuit) {
      newState.selectedSuit = options.declaredSuit;
      newState.turnHistory.push(`${currentPlayer.name} played Ace(s) and chose ${options.declaredSuit}`);
    } else {
      newState.gamePhase = 'selectingSuit';
      return newState;
    }
    // Wild cancels any pending penalty AND answers questions!
    if (newState.drawStack > 0) {
      newState.turnHistory.push(`${currentPlayer.name} countered penalty with Ace(s)`);
      newState.drawStack = 0;
    }
    if (newState.pendingQuestion) {
      newState.pendingQuestion = false;
      newState.turnHistory.push(`${currentPlayer.name} answered question with Ace(s) (wild card)`);
    }
  }
  
  if (hasQuestion && !hasWild) {
    if (sortedPlayedCards.length === 1 || !sortedPlayedCards.some(card => getCardCategory(card.rank) === 'answer')) {
      // Question card played without answer - same player must answer immediately
      newState.pendingQuestion = true;
      newState.turnHistory.push(`${currentPlayer.name} played question card(s) - must answer immediately`);
      // Don't change turn - same player continues
      return newState;
    } else {
      // Question + Answer combo or question answered by other cards
      newState.pendingQuestion = false;
      newState.turnHistory.push(`${currentPlayer.name} played question + answer combo`);
    }
  }
  
  if (hasJump) {
    // In 2-player mode, current player plays again (skip opponent's turn)
    skipNextTurn = true;
    newState.turnHistory.push(`${currentPlayer.name} played Jack(s) - plays again!`);
  }
  
  if (hasKickback) {
    newState.turnHistory.push(`${currentPlayer.name} played King(s)`);
  }
  
  // Handle answer cards
  if (newState.pendingQuestion && !hasWild && !hasQuestion) {
    const hasAnswerCard = sortedPlayedCards.some(card => {
      const cardCategory = getCardCategory(card.rank);
      return cardCategory === 'answer' || cardCategory === 'question';
    });
    
    if (hasAnswerCard) {
      newState.pendingQuestion = false;
      newState.turnHistory.push(`${currentPlayer.name} answered the question`);
    }
  }
  
  // Reset selected suit if not wild card
  if (!hasWild) {
    newState.selectedSuit = null;
  }
  
  // Log the play
  if (sortedPlayedCards.length > 1 && !newState.turnHistory[newState.turnHistory.length - 1].includes('penalty') && !newState.turnHistory[newState.turnHistory.length - 1].includes('Ace')) {
    const cardNames = sortedPlayedCards.map(card => `${card.rank}${card.suit}`).join(', ');
    newState.turnHistory.push(`${currentPlayer.name} played multiple cards: ${cardNames}`);
  }
  
  // Check for win condition
  if (currentPlayer.hand.length === 0) {
    if (currentPlayer.nikoKadiCalled && canWinWithCards(sortedPlayedCards)) {
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

// Helper function to sort played cards for optimal play order
function sortPlayedCards(cards: Card[], topCard: Card, selectedSuit: string | null): Card[] {
  if (cards.length <= 1) return cards;
  
  // Find the best starting card (one that can be played on top card)
  const playableFirst = cards.filter(card => canPlayCard(card, topCard, selectedSuit as any));
  
  if (playableFirst.length === 0) return cards;
  
  // Start with a playable card
  const result = [playableFirst[0]];
  const remaining = cards.filter(card => card.id !== playableFirst[0].id);
  
  // Add remaining cards in order of playability
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
    // Look for answer cards, question cards, or ACES (wild cards can answer!)
    const answerCards = currentPlayer.hand.filter(card => 
      canAnswerQuestion(card, getTopCard(newState), newState.selectedSuit)
    );
    
    if (answerCards.length > 0) {
      // Prefer Aces (wild cards) if available
      const aceCards = answerCards.filter(card => card.rank === 'A');
      const selectedCard = aceCards.length > 0 ? aceCards[0] : answerCards[0];
      
      // Handle Ace suit selection
      if (selectedCard.rank === 'A') {
        const bestSuit = selectBestSuit(currentPlayer.hand, difficulty);
        return playCards(newState, { 
          cardIds: [selectedCard.id], 
          declaredSuit: bestSuit 
        });
      }
      
      return playCards(newState, { cardIds: [selectedCard.id] });
    } else {
      // No answer available, must draw - this will clear the question and continue normally
      return drawCard(newState, newState.currentPlayerIndex);
    }
  }
  
  // ENHANCED AI: Look for multiple card opportunities
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
      // Easy: Play first available combination
      selectedCombination = playableCardCombinations[0];
      break;
      
    case 'medium':
      // Medium: Prefer combinations that get rid of more cards
      selectedCombination = selectMediumAICombination(playableCardCombinations, currentPlayer.hand, newState);
      break;
      
    case 'hard':
      // Hard: Strategic play, consider opponent's hand size and game state
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
  
  // Handle Ace (wild card) suit selection
  if (hasAce) {
    const bestSuit = selectBestSuit(currentPlayer.hand, difficulty);
    return playCards(newState, { 
      cardIds: selectedCombination, 
      declaredSuit: bestSuit 
    });
  }
  
  return playCards(newState, { cardIds: selectedCombination });
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
  
  // Mixed combinations (limited to avoid performance issues)
  if (hand.length <= 8) { // Only try mixed combinations for smaller hands
    for (let i = 0; i < hand.length - 1; i++) {
      for (let j = i + 1; j < hand.length; j++) {
        const cardIds = [hand[i].id, hand[j].id];
        if (canPlayerPlay(gameState, cardIds)) {
          combinations.push(cardIds);
        }
        
        // Try 3-card combinations
        for (let k = j + 1; k < hand.length && k < i + 4; k++) {
          const threeCardIds = [hand[i].id, hand[j].id, hand[k].id];
          if (canPlayerPlay(gameState, threeCardIds)) {
            combinations.push(threeCardIds);
          }
        }
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