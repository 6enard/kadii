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
      // Handle penalty draw - turn ends automatically
      const newGameState = handlePenaltyDraw(gameState);
      setGameState(newGameState);
    } else {
      // Regular draw - turn ends automatically
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
    <div className="h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 flex flex-col overflow-hidden">
      {/* Fixed Header - Compact */}
      <div className="flex-shrink-0 p-3 bg-black bg-opacity-20 backdrop-blur-sm border-b border-white border-opacity-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={onBackToMenu}
            className="flex items-center space-x-2 text-white hover:text-emerald-200 transition-colors text-sm"
          >
            <ArrowLeft size={18} />
            <span>Back</span>
          </button>
          <div className="text-center">
            <h1 className="text-xl font-bold text-white">Multiplayer Kadi</h1>
            <p className="text-emerald-200 text-xs">Playing with a friend</p>
          </div>
          <div className="w-16"></div>
        </div>
      </div>

      {/* Main Game Container - Contained and Scrollable */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 max-w-7xl mx-auto w-full p-4 flex flex-col space-y-3 min-h-0">
          
          {/* Opponent (Player 2) - Ultra Compact */}
          <div className="flex-shrink-0 bg-gray-800 bg-opacity-50 rounded-lg p-2 border border-gray-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <h3 className={`font-bold text-sm ${gameState.currentPlayerIndex === 1 ? 'text-blue-400' : 'text-gray-300'}`}>
                  👤 {gameState.players[1].name}
                  {gameState.currentPlayerIndex === 1 && <span className="ml-2 text-xs bg-blue-600 px-2 py-1 rounded">Their Turn</span>}
                </h3>
                {gameState.players[1].nikoKadiCalled && (
                  <span className="bg-yellow-500 px-2 py-1 rounded text-xs font-bold text-black">
                    Niko Kadi!
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="bg-gray-600 px-2 py-1 rounded text-white text-xs">
                  {gameState.players[1].hand.length} cards
                </span>
                {/* Mini card representation */}
                <div className="flex -space-x-1">
                  {gameState.players[1].hand.slice(0, Math.min(8, gameState.players[1].hand.length)).map((_, index) => (
                    <div
                      key={index}
                      className="w-6 h-8 bg-blue-900 rounded border border-blue-700 flex items-center justify-center"
                    >
                      <div className="text-white text-xs font-bold">K</div>
                    </div>
                  ))}
                  {gameState.players[1].hand.length > 8 && (
                    <div className="text-white text-xs ml-1">+{gameState.players[1].hand.length - 8}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Game Board - Compact */}
          <div className="flex-shrink-0">
            <GameBoard
              gameState={gameState}
              onDrawCard={handleDrawCard}
            />
          </div>
          
          {/* Game Controls - Compact */}
          <div className="flex-shrink-0">
            <GameControls
              gameState={gameState}
              selectedCards={selectedCards}
              onPlayCards={handlePlayCards}
              onDeclareNikoKadi={handleDeclareNikoKadi}
              onDrawPenalty={handleDrawPenalty}
              canPlaySelected={canPlaySelected}
            />
          </div>
          
          {/* Player Hand - Flexible Height */}
          <div className="flex-1 min-h-0 flex flex-col">
            <PlayerHand
              player={gameState.players[0]}
              isCurrentPlayer={gameState.currentPlayerIndex === 0}
              selectedCards={gameState.currentPlayerIndex === 0 ? selectedCards : []}
              playableCards={playableCards}
              onCardClick={handleCardClick}
              isMyTurn={isMyTurn}
            />
          </div>
          
        </div>
      </div>

      {/* Fixed Footer - Compact */}
      <div className="flex-shrink-0 p-2 bg-black bg-opacity-20 backdrop-blur-sm border-t border-white border-opacity-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={handleNewGame}
            className="px-4 py-2 bg-white bg-opacity-20 text-white font-bold rounded-lg
                       hover:bg-opacity-30 transition-all duration-200 transform hover:scale-105 text-sm"
          >
            New Game
          </button>
          
          {/* Quick Game Status */}
          <div className="text-center text-white text-xs">
            <div>Turn: {gameState.players[gameState.currentPlayerIndex].name}</div>
            {gameState.drawStack > 0 && (
              <div className="text-red-300">Penalty: +{gameState.drawStack}</div>
            )}
          </div>
          
          <div className="text-white text-xs">
            Selected: {selectedCards.length}/6
          </div>
        </div>
      </div>
        
      {/* Suit Selector Modal */}
      {gameState.gamePhase === 'selectingSuit' && (
        <SuitSelector onSelectSuit={handleSelectSuit} />
      )}
      
      {/* Game Status Modal */}
      <GameStatus gameState={gameState} onNewGame={handleNewGame} />
    </div>
  );
};