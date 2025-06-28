import React, { useState, useCallback } from 'react';
import { GameState, Suit } from '../../types';
import { 
  initializeGame, 
  canPlayerPlay, 
  playCards, 
  drawCard, 
  declareNikoKadi,
  selectSuit,
  handlePenaltyDraw,
  getCurrentPlayer
} from '../../utils/gameLogic';
import { PlayerHand } from '../PlayerHand';
import { GameBoard } from '../GameBoard';
import { GameControls } from '../GameControls';
import { SuitSelector } from '../SuitSelector';
import { GameStatus } from '../GameStatus';
import { ArrowLeft } from 'lucide-react';

interface SinglePlayerGameProps {
  onBackToMenu: () => void;
}

export const SinglePlayerGame: React.FC<SinglePlayerGameProps> = ({ onBackToMenu }) => {
  const [gameState, setGameState] = useState<GameState>(() => {
    const game = initializeGame();
    game.players[1].name = 'Computer';
    return game;
  });
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  
  const currentPlayer = getCurrentPlayer(gameState);
  
  const handleCardClick = useCallback((cardId: string) => {
    if (gameState.gamePhase !== 'playing') return;
    
    setSelectedCards(prev => {
      if (prev.includes(cardId)) {
        return prev.filter(id => id !== cardId);
      } else {
        if (prev.length < 2) {
          return [...prev, cardId];
        } else {
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
      const newGameState = handlePenaltyDraw(gameState);
      setGameState(newGameState);
    } else {
      const newGameState = drawCard(gameState, gameState.currentPlayerIndex);
      setGameState(newGameState);
      
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
    const game = initializeGame();
    game.players[1].name = 'Computer';
    setGameState(game);
    setSelectedCards([]);
  }, []);
  
  const handleDrawPenalty = useCallback(() => {
    const newGameState = handlePenaltyDraw(gameState);
    setGameState(newGameState);
  }, [gameState]);
  
  const canPlaySelected = canPlayerPlay(gameState, selectedCards);
  
  const playableCards = currentPlayer.hand
    .filter(card => canPlayerPlay(gameState, [card.id]))
    .map(card => card.id);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBackToMenu}
            className="flex items-center space-x-2 text-white hover:text-emerald-200 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back to Menu</span>
          </button>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white">Kadi vs Computer</h1>
            <p className="text-emerald-200">Practice Mode</p>
          </div>
          <div className="w-24"></div>
        </div>
        
        {/* Player 2 (Computer) */}
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
        
        {/* Game Actions */}
        <div className="text-center">
          <button
            onClick={handleNewGame}
            className="px-6 py-3 bg-white bg-opacity-20 text-white font-bold rounded-lg
                       hover:bg-opacity-30 transition-all duration-200 transform hover:scale-105"
          >
            New Game
          </button>
        </div>
      </div>
    </div>
  );
};