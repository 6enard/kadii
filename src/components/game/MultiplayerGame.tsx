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

interface MultiplayerGameProps {
  onBackToMenu: () => void;
}

export const MultiplayerGame: React.FC<MultiplayerGameProps> = ({ onBackToMenu }) => {
  const [gameState, setGameState] = useState<GameState>(() => initializeGame());
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  
  const currentPlayer = getCurrentPlayer(gameState);
  const isMyTurn = gameState.currentPlayerIndex === 0; // Player 1 is always the current user
  
  const handleCardClick = useCallback((cardId: string) => {
    if (gameState.gamePhase !== 'playing' || !isMyTurn) return;
    
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
  }, [gameState.gamePhase, isMyTurn]);
  
  const handlePlayCards = useCallback(() => {
    if (selectedCards.length === 0 || !isMyTurn) return;
    
    const newGameState = playCards(gameState, { cardIds: selectedCards });
    setGameState(newGameState);
    setSelectedCards([]);
  }, [gameState, selectedCards, isMyTurn]);
  
  const handleDrawCard = useCallback(() => {
    if (!isMyTurn) return;
    
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
  }, [gameState, isMyTurn]);
  
  const handleDeclareNikoKadi = useCallback(() => {
    if (!isMyTurn) return;
    const newGameState = declareNikoKadi(gameState);
    setGameState(newGameState);
  }, [gameState, isMyTurn]);
  
  const handleSelectSuit = useCallback((suit: Suit) => {
    const newGameState = selectSuit(gameState, suit);
    setGameState(newGameState);
  }, [gameState]);
  
  const handleNewGame = useCallback(() => {
    setGameState(initializeGame());
    setSelectedCards([]);
  }, []);
  
  const handleDrawPenalty = useCallback(() => {
    if (!isMyTurn) return;
    const newGameState = handlePenaltyDraw(gameState);
    setGameState(newGameState);
  }, [gameState, isMyTurn]);
  
  const canPlaySelected = canPlayerPlay(gameState, selectedCards);
  
  const playableCards = isMyTurn ? currentPlayer.hand
    .filter(card => canPlayerPlay(gameState, [card.id]))
    .map(card => card.id) : [];
  
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
            <h1 className="text-3xl font-bold text-white">Multiplayer Kadi</h1>
            <p className="text-emerald-200">Playing with a friend</p>
          </div>
          <div className="w-24"></div>
        </div>
        
        {/* Opponent (Player 2) - Hidden cards */}
        <div className="mb-6">
          <div className="p-4 rounded-lg border-2 border-gray-600 bg-gray-800 bg-opacity-50">
            <div className="flex items-center justify-between mb-3">
              <h3 className={`font-bold text-lg ${gameState.currentPlayerIndex === 1 ? 'text-blue-400' : 'text-gray-300'}`}>
                {gameState.players[1].name}
                {gameState.currentPlayerIndex === 1 && <span className="ml-2 text-sm bg-blue-600 px-2 py-1 rounded">Their Turn</span>}
              </h3>
              
              <div className="flex items-center space-x-2">
                <span className="bg-gray-600 px-2 py-1 rounded text-sm text-white">
                  {gameState.players[1].hand.length} cards
                </span>
                {gameState.players[1].nikoKadiCalled && (
                  <span className="bg-yellow-500 px-2 py-1 rounded text-sm font-bold text-black">
                    Niko Kadi!
                  </span>
                )}
              </div>
            </div>
            
            {/* Hidden cards */}
            <div className="flex flex-wrap gap-2">
              {gameState.players[1].hand.map((_, index) => (
                <div
                  key={index}
                  className="w-16 h-24 bg-blue-900 rounded-lg border-2 border-blue-700 flex items-center justify-center"
                >
                  <div className="text-white text-xs font-bold">KADI</div>
                </div>
              ))}
            </div>
          </div>
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
            playableCards={playableCards}
            onCardClick={handleCardClick}
            isMyTurn={isMyTurn}
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