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
import { ArrowLeft, Volume2, VolumeX } from 'lucide-react';

interface MultiplayerGameProps {
  onBackToMenu: () => void;
}

export const MultiplayerGame: React.FC<MultiplayerGameProps> = ({ onBackToMenu }) => {
  const [gameState, setGameState] = useState<GameState>(() => {
    const game = initializeGame();
    game.players[1].name = 'Player 2';
    return game;
  });
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  const currentPlayer = getCurrentPlayer(gameState);
  const isMyTurn = gameState.currentPlayerIndex === 0; // Player 1 is always the current user
  
  const handleCardClick = useCallback((cardId: string) => {
    if (gameState.gamePhase !== 'playing') return;
    
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
  }, [gameState.gamePhase]);
  
  const handlePlayCards = useCallback(() => {
    if (selectedCards.length === 0) return;
    
    const newGameState = playCards(gameState, { cardIds: selectedCards });
    setGameState(newGameState);
    setSelectedCards([]);
  }, [gameState, selectedCards]);
  
  const handleDrawCard = useCallback(() => {
    if (gameState.drawStack > 0) {
      // Handle penalty draw - turn ends automatically
      const newGameState = handlePenaltyDraw(gameState);
      setGameState(newGameState);
    } else {
      // Regular draw - turn ends automatically
      const newGameState = drawCard(gameState, gameState.currentPlayerIndex);
      setGameState(newGameState);
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
    game.players[1].name = 'Player 2';
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
    <div className="min-h-screen bg-gradient-to-br from-green-400 to-green-600 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Compact Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onBackToMenu}
            className="flex items-center space-x-2 text-white hover:text-green-100 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back to Menu</span>
          </button>
          
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">Local Multiplayer</h1>
            <p className="text-green-100 text-sm">Pass and play with a friend</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-all"
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
            
            <button
              onClick={handleNewGame}
              className="px-3 py-2 bg-white text-green-600 font-semibold rounded-lg hover:bg-gray-100 transition-all text-sm"
            >
              New Game
            </button>
          </div>
        </div>
        
        {/* Compact Game Layout - Chess.com style */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-8rem)]">
          {/* Left Column - Player 2 Hand */}
          <div className="lg:col-span-1 flex flex-col">
            <PlayerHand
              player={gameState.players[1]}
              isCurrentPlayer={gameState.currentPlayerIndex === 1}
              selectedCards={gameState.currentPlayerIndex === 1 ? selectedCards : []}
              playableCards={gameState.currentPlayerIndex === 1 ? playableCards : []}
              onCardClick={handleCardClick}
              isMyTurn={gameState.currentPlayerIndex === 1}
              hideCards={false}
            />
          </div>
          
          {/* Center Column - Game Board and Controls */}
          <div className="lg:col-span-1 flex flex-col space-y-4">
            <GameBoard
              gameState={gameState}
              onDrawCard={handleDrawCard}
            />
            
            <GameControls
              gameState={gameState}
              selectedCards={selectedCards}
              onPlayCards={handlePlayCards}
              onDeclareNikoKadi={handleDeclareNikoKadi}
              onDrawPenalty={handleDrawPenalty}
              canPlaySelected={canPlaySelected}
            />
          </div>
          
          {/* Right Column - Player 1 Hand */}
          <div className="lg:col-span-1 flex flex-col">
            <PlayerHand
              player={gameState.players[0]}
              isCurrentPlayer={gameState.currentPlayerIndex === 0}
              selectedCards={gameState.currentPlayerIndex === 0 ? selectedCards : []}
              playableCards={playableCards}
              onCardClick={handleCardClick}
              isMyTurn={isMyTurn}
              hideCards={false}
            />
          </div>
        </div>
        
        {/* Game Status */}
        <GameStatus gameState={gameState} onNewGame={handleNewGame} />
      </div>
        
      {/* Suit Selector Modal */}
      {gameState.gamePhase === 'selectingSuit' && (
        <SuitSelector onSelectSuit={handleSelectSuit} />
      )}
    </div>
  );
};