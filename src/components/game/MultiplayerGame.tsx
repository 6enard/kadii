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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-red-800 flex flex-col">
      {/* Fixed Header */}
      <div className="flex-shrink-0 p-4 bg-black bg-opacity-20 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            onClick={onBackToMenu}
            className="flex items-center space-x-2 text-white hover:text-red-200 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">Multiplayer Kadi</h1>
            <p className="text-red-200 text-sm">Playing with a friend</p>
          </div>
          <div className="w-16"></div>
        </div>
      </div>

      {/* Main Game Area - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-4 space-y-4">
          {/* Opponent (Player 2) - CRYSTAL CLEAR Coat of Arms */}
          <div className="bg-gray-800 bg-opacity-50 rounded-xl p-3 border border-gray-600">
            <div className="flex items-center justify-between mb-2">
              <h3 className={`font-bold ${gameState.currentPlayerIndex === 1 ? 'text-red-400' : 'text-gray-300'}`}>
                👤 {gameState.players[1].name}
                {gameState.currentPlayerIndex === 1 && <span className="ml-2 text-xs bg-red-600 px-2 py-1 rounded">Their Turn</span>}
              </h3>
              
              <div className="flex items-center space-x-2 text-sm">
                <span className="bg-gray-600 px-2 py-1 rounded text-white">
                  {gameState.players[1].hand.length} cards
                </span>
                {gameState.players[1].nikoKadiCalled && (
                  <span className="bg-yellow-500 px-2 py-1 rounded font-bold text-black">
                    Niko Kadi!
                  </span>
                )}
              </div>
            </div>
            
            {/* CRYSTAL CLEAR Card Backs with HIGH-QUALITY Coat of Arms */}
            <div className="flex flex-wrap gap-1">
              {gameState.players[1].hand.map((_, index) => (
                <div
                  key={index}
                  className="w-12 h-16 bg-gradient-to-br from-red-700 to-red-900 rounded-lg border-2 border-yellow-400 flex flex-col items-center justify-center relative overflow-hidden"
                >
                  {/* CRYSTAL CLEAR HIGH-QUALITY Kenyan Coat of Arms */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <img 
                      src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Coat_of_arms_of_Kenya_%28Official%29.svg/1200px-Coat_of_arms_of_Kenya_%28Official%29.svg.png" 
                      alt="Kenya Coat of Arms"
                      className="w-10 h-10 object-contain opacity-95"
                      style={{
                        filter: 'brightness(1.8) contrast(1.4) saturate(1.6) drop-shadow(0 0 6px rgba(255,255,255,0.4))'
                      }}
                    />
                  </div>
                  
                  {/* Bright golden border frame */}
                  <div className="absolute inset-0.5 border-2 border-yellow-300 opacity-70 rounded-lg"></div>
                  
                  {/* Larger, brighter corner decorations */}
                  <div className="absolute top-0 left-0 w-3 h-3 bg-yellow-300 opacity-80 rounded-br-lg"></div>
                  <div className="absolute top-0 right-0 w-3 h-3 bg-yellow-300 opacity-80 rounded-bl-lg"></div>
                  <div className="absolute bottom-0 left-0 w-3 h-3 bg-yellow-300 opacity-80 rounded-tr-lg"></div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-yellow-300 opacity-80 rounded-tl-lg"></div>
                  
                  {/* "KADI" text at bottom with much better visibility */}
                  <div className="absolute bottom-0 left-0 right-0 text-center bg-black bg-opacity-40 rounded-b-lg">
                    <div className="text-yellow-200 text-xs font-bold drop-shadow-lg">KADI</div>
                  </div>
                  
                  {/* Additional glow effect */}
                  <div className="absolute inset-0 bg-yellow-400 opacity-10 rounded-lg animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Game Board */}
          <GameBoard
            gameState={gameState}
            onDrawCard={handleDrawCard}
          />
          
          {/* Game Controls */}
          <GameControls
            gameState={gameState}
            selectedCards={selectedCards}
            onPlayCards={handlePlayCards}
            onDeclareNikoKadi={handleDeclareNikoKadi}
            onDrawPenalty={handleDrawPenalty}
            canPlaySelected={canPlaySelected}
          />
          
          {/* Player 1 (Current User) */}
          <PlayerHand
            player={gameState.players[0]}
            isCurrentPlayer={gameState.currentPlayerIndex === 0}
            selectedCards={gameState.currentPlayerIndex === 0 ? selectedCards : []}
            playableCards={playableCards}
            onCardClick={handleCardClick}
            isMyTurn={isMyTurn}
          />
          
          {/* Game Status */}
          <GameStatus gameState={gameState} onNewGame={handleNewGame} />
        </div>
      </div>

      {/* Fixed Footer */}
      <div className="flex-shrink-0 p-4 bg-black bg-opacity-20 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto text-center">
          <button
            onClick={handleNewGame}
            className="px-6 py-2 bg-white bg-opacity-20 text-white font-bold rounded-lg
                       hover:bg-opacity-30 transition-all duration-200 transform hover:scale-105"
          >
            New Game
          </button>
        </div>
      </div>
        
      {/* Suit Selector Modal */}
      {gameState.gamePhase === 'selectingSuit' && (
        <SuitSelector onSelectSuit={handleSelectSuit} />
      )}
    </div>
  );
};