import React, { useState, useCallback } from 'react';
import { GameState, Suit } from '../types';
import { 
  initializeGame, 
  canPlayerPlay, 
  playCards, 
  drawCard, 
  declareNikoKadi,
  selectSuit,
  handlePenaltyDraw,
  getCurrentPlayer
} from '../utils/gameLogic';
import { PlayerHand } from './PlayerHand';
import { GameBoard } from './GameBoard';
import { GameControls } from './GameControls';
import { SuitSelector } from './SuitSelector';
import { GameStatus } from './GameStatus';

export const Game: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(() => initializeGame());
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  
  const currentPlayer = getCurrentPlayer(gameState);
  
  const handleCardClick = useCallback((cardId: string) => {
    if (gameState.gamePhase !== 'playing') return;
    
    setSelectedCards(prev => {
      if (prev.includes(cardId)) {
        return prev.filter(id => id !== cardId);
      } else {
        // For question cards, allow selecting up to 2 cards
        if (prev.length < 2) {
          return [...prev, cardId];
        } else {
          // Replace selection if already at limit
          return [cardId];
        }
      }
    });
  }, [gameState.gamePhase]);
  
  const handlePlayCards = useCallback(() => {
    if (selectedCards.length === 0) return;
    
    const newGameState = playCards(gameState, { cardIds: selectedCards });
    setGameState(newGameState);
    setSelectedCards([]);
  }, [gameState, selectedCards]);
  
  const handleDrawCard = useCallback(() => {
    if (gameState.drawStack > 0) {
      // Handle penalty draw
      const newGameState = handlePenaltyDraw(gameState);
      setGameState(newGameState);
    } else {
      // Regular draw
      const newGameState = drawCard(gameState, gameState.currentPlayerIndex);
      setGameState(newGameState);
      
      // Move to next player after drawing
      const nextState = { ...newGameState };
      nextState.currentPlayerIndex = (nextState.currentPlayerIndex + 1) % nextState.players.length;
      setGameState(nextState);
    }
  }, [gameState]);
  
  const handleDeclareNikoKadi = useCallback(() => {
    const newGameState = declareNikoKadi(gameState);
    setGameState(newGameState);
  }, [gameState]);
  
  const handleSelectSuit = useCallback((suit: Suit) => {
    const newGameState = selectSuit(gameState, suit);
    setGameState(newGameState);
  }, [gameState]);
  
  const handleNewGame = useCallback(() => {
    setGameState(initializeGame());
    setSelectedCards([]);
  }, []);
  
  const handleDrawPenalty = useCallback(() => {
    const newGameState = handlePenaltyDraw(gameState);
    setGameState(newGameState);
  }, [gameState]);
  
  const canPlaySelected = canPlayerPlay(gameState, selectedCards);
  
  // Get playable cards for current player
  const playableCards = currentPlayer.hand
    .filter(card => canPlayerPlay(gameState, [card.id]))
    .map(card => card.id);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 to-green-600 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-white mb-2">Kadi Card Game</h1>
          <p className="text-green-100">Kenyan 2-Player Variant</p>
        </div>
        
        {/* Player 2 (Opponent) */}
        <div className="mb-6">
          <PlayerHand
            player={gameState.players[1]}
            isCurrentPlayer={gameState.currentPlayerIndex === 1}
            selectedCards={gameState.currentPlayerIndex === 1 ? selectedCards : []}
            playableCards={gameState.currentPlayerIndex === 1 ? playableCards : []}
            onCardClick={handleCardClick}
            isMyTurn={gameState.currentPlayerIndex === 1}
          />
        </div>
        
        {/* Game Board */}
        <div className="mb-6">
          <GameBoard
            gameState={gameState}
            onDrawCard={handleDrawCard}
          />
        </div>
        
        {/* Game Controls */}
        <div className="mb-6">
          <GameControls
            gameState={gameState}
            selectedCards={selectedCards}
            onPlayCards={handlePlayCards}
            onDeclareNikoKadi={handleDeclareNikoKadi}
            onDrawPenalty={handleDrawPenalty}
            canPlaySelected={canPlaySelected}
          />
        </div>
        
        {/* Player 1 (Current User) */}
        <div className="mb-6">
          <PlayerHand
            player={gameState.players[0]}
            isCurrentPlayer={gameState.currentPlayerIndex === 0}
            selectedCards={gameState.currentPlayerIndex === 0 ? selectedCards : []}
            playableCards={gameState.currentPlayerIndex === 0 ? playableCards : []}
            onCardClick={handleCardClick}
            isMyTurn={gameState.currentPlayerIndex === 0}
          />
        </div>
        
        {/* Game Status */}
        <GameStatus gameState={gameState} onNewGame={handleNewGame} />
        
        {/* Suit Selector Modal */}
        {gameState.gamePhase === 'selectingSuit' && (
          <SuitSelector onSelectSuit={handleSelectSuit} />
        )}
        
        {/* New Game Button */}
        <div className="text-center">
          <button
            onClick={handleNewGame}
            className="px-6 py-3 bg-white text-green-600 font-bold rounded-lg
                       hover:bg-gray-100 transition-all duration-200 transform hover:scale-105"
          >
            New Game
          </button>
        </div>
      </div>
    </div>
  );
};