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
import { ArrowLeft, Users } from 'lucide-react';

interface MultiplayerGameProps {
  onBackToMenu: () => void;
}

export const MultiplayerGame: React.FC<MultiplayerGameProps> = ({ onBackToMenu }) => {
  const [gameState, setGameState] = useState<GameState>(() => initializeGame());
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  
  const currentPlayer = getCurrentPlayer(gameState);
  const isMyTurn = gameState.currentPlayerIndex === 0;
  
  const handleCardClick = useCallback((cardId: string) => {
    if (gameState.gamePhase !== 'playing' || !isMyTurn) return;
    
    setSelectedCards(prev => {
      if (prev.includes(cardId)) {
        return prev.filter(id => id !== cardId);
      } else {
        if (prev.length < 6) {
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
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-emerald-800 to-green-900 text-white overflow-hidden relative">
      {/* Felt Table Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-800/50 to-emerald-900/50" 
           style={{
             backgroundImage: `radial-gradient(circle at 25% 25%, rgba(34, 197, 94, 0.1) 0%, transparent 50%),
                              radial-gradient(circle at 75% 75%, rgba(16, 185, 129, 0.1) 0%, transparent 50%)`
           }}>
      </div>

      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-black/60 backdrop-blur-xl border-b border-green-700/50">
        <div className="flex items-center justify-between px-6 py-4">
          <button
            onClick={onBackToMenu}
            className="flex items-center space-x-2 text-green-300 hover:text-white transition-colors group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to Menu</span>
          </button>
          
          <div className="text-center">
            <h1 className="text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              MULTIPLAYER KADI
            </h1>
            <div className="flex items-center justify-center space-x-2 text-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-300">Playing with friend</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 text-green-300">
            <Users size={20} />
            <span className="font-medium">2P</span>
          </div>
        </div>
      </div>

      {/* Opponent Hand - Top */}
      <div className="fixed top-20 left-0 right-0 z-10 px-6">
        <PlayerHand
          player={gameState.players[1]}
          isCurrentPlayer={gameState.currentPlayerIndex === 1}
          selectedCards={[]}
          playableCards={[]}
          onCardClick={() => {}}
          isMyTurn={false}
        />
      </div>

      {/* Game Board - Center */}
      <GameBoard
        gameState={gameState}
        onDrawCard={handleDrawCard}
      />

      {/* Game Controls - Fixed position */}
      <div className="fixed top-1/2 left-6 transform -translate-y-1/2 z-30">
        <GameControls
          gameState={gameState}
          selectedCards={selectedCards}
          onPlayCards={handlePlayCards}
          onDeclareNikoKadi={handleDeclareNikoKadi}
          onDrawPenalty={handleDrawPenalty}
          canPlaySelected={canPlaySelected}
        />
      </div>

      {/* New Game Button - Fixed position */}
      <div className="fixed top-1/2 right-6 transform -translate-y-1/2 z-30">
        <button
          onClick={handleNewGame}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500
                     text-white font-bold rounded-xl transition-all duration-200 transform hover:scale-105
                     shadow-lg shadow-purple-500/30 border border-purple-400/50"
        >
          NEW GAME
        </button>
      </div>

      {/* Player Hand - Bottom (Fixed) */}
      <PlayerHand
        player={gameState.players[0]}
        isCurrentPlayer={gameState.currentPlayerIndex === 0}
        selectedCards={gameState.currentPlayerIndex === 0 ? selectedCards : []}
        playableCards={playableCards}
        onCardClick={handleCardClick}
        isMyTurn={isMyTurn}
      />
        
      {/* Suit Selector Modal */}
      {gameState.gamePhase === 'selectingSuit' && (
        <SuitSelector onSelectSuit={handleSelectSuit} />
      )}
      
      {/* Game Status Modal */}
      <GameStatus gameState={gameState} onNewGame={handleNewGame} />
    </div>
  );
};