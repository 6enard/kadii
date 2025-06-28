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
import { ArrowLeft, Users, Zap, Target } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 text-white overflow-hidden">
      {/* Urban Header - Fixed */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-black bg-opacity-80 backdrop-blur-xl border-b border-gray-700">
        <div className="flex items-center justify-between px-6 py-4">
          <button
            onClick={onBackToMenu}
            className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back</span>
          </button>
          
          <div className="text-center">
            <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              MULTIPLAYER KADI
            </h1>
            <div className="flex items-center justify-center space-x-2 text-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-gray-400">Playing with friend</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 text-gray-300">
            <Users size={20} />
            <span className="font-medium">2P</span>
          </div>
        </div>
      </div>

      {/* Main Game Container */}
      <div className="pt-20 pb-24 px-4 min-h-screen">
        <div className="max-w-7xl mx-auto space-y-4">
          
          {/* Opponent (Player 2) - Urban Style */}
          <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 backdrop-blur-sm rounded-2xl border border-purple-500/20 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${gameState.currentPlayerIndex === 1 ? 'bg-purple-400 animate-pulse' : 'bg-gray-500'}`}></div>
                <h3 className="font-bold text-lg">
                  👤 {gameState.players[1].name}
                  {gameState.currentPlayerIndex === 1 && (
                    <span className="ml-3 text-xs bg-purple-500 px-3 py-1 rounded-full animate-pulse">
                      THEIR TURN
                    </span>
                  )}
                </h3>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="bg-gray-800 px-3 py-1 rounded-full text-sm font-mono">
                  {gameState.players[1].hand.length} CARDS
                </div>
                {gameState.players[1].nikoKadiCalled && (
                  <div className="bg-gradient-to-r from-yellow-400 to-orange-500 px-3 py-1 rounded-full text-black font-bold text-sm animate-bounce">
                    ⚡ NIKO KADI!
                  </div>
                )}
              </div>
            </div>
            
            {/* Hidden cards */}
            <div className="grid grid-cols-8 sm:grid-cols-12 md:grid-cols-16 gap-1">
              {gameState.players[1].hand.map((_, index) => (
                <div
                  key={index}
                  className="aspect-[2/3] bg-gradient-to-br from-purple-800 to-purple-900 rounded-lg border border-purple-600/50 flex items-center justify-center shadow-lg"
                >
                  <div className="text-purple-300 text-xs font-bold">K</div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Game Board */}
          <GameBoard
            gameState={gameState}
            onDrawCard={handleDrawCard}
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
        </div>
      </div>

      {/* Fixed Bottom Controls */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-black bg-opacity-90 backdrop-blur-xl border-t border-gray-700">
        <div className="max-w-7xl mx-auto p-4">
          {/* Niko Kadi Button */}
          <div className="flex justify-center mb-4">
            <button
              onClick={handleDeclareNikoKadi}
              disabled={!isMyTurn}
              className={`
                px-8 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400
                text-black font-bold text-lg rounded-xl transition-all duration-200 transform hover:scale-105
                shadow-2xl border-2 border-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed
                ${isMyTurn ? 'animate-pulse shadow-yellow-500/50' : ''}
                ${currentPlayer.hand.length === 1 && !currentPlayer.nikoKadiCalled ? 'animate-bounce' : ''}
              `}
            >
              <Target className="inline mr-2" size={20} />
              DECLARE NIKO KADI
            </button>
          </div>

          {/* Main Controls Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Play Cards */}
            <button
              onClick={handlePlayCards}
              disabled={!canPlaySelected || selectedCards.length === 0 || !isMyTurn}
              className={`
                p-4 rounded-xl font-bold transition-all duration-200 transform hover:scale-105
                ${canPlaySelected && selectedCards.length > 0 && isMyTurn
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white shadow-lg shadow-green-500/30' 
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              <div className="flex items-center justify-center space-x-2">
                <Zap size={20} />
                <span>
                  {selectedCards.length > 0 
                    ? `PLAY ${selectedCards.length} CARD${selectedCards.length > 1 ? 'S' : ''}`
                    : 'SELECT CARDS'
                  }
                </span>
              </div>
            </button>
            
            {/* Draw Penalty */}
            {gameState.drawStack > 0 && isMyTurn && (
              <button
                onClick={handleDrawPenalty}
                className="p-4 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-400 hover:to-pink-400 
                           text-white font-bold rounded-xl transition-all duration-200 transform hover:scale-105
                           shadow-lg shadow-red-500/30"
              >
                <div className="flex items-center justify-center space-x-2">
                  <Zap size={20} />
                  <span>DRAW {gameState.drawStack} PENALTY</span>
                </div>
              </button>
            )}
            
            {/* New Game */}
            <button
              onClick={handleNewGame}
              className="p-4 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400
                         text-white font-bold rounded-xl transition-all duration-200 transform hover:scale-105
                         shadow-lg shadow-purple-500/30"
            >
              <div className="flex items-center justify-center space-x-2">
                <span>NEW GAME</span>
              </div>
            </button>
          </div>

          {/* Status Bar */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-4 text-sm">
            {selectedCards.length > 0 && (
              <div className="bg-cyan-500/20 border border-cyan-500/50 px-3 py-1 rounded-full text-cyan-300">
                {selectedCards.length} SELECTED
              </div>
            )}
            
            {gameState.pendingQuestion && (
              <div className="bg-red-500/20 border border-red-500/50 px-3 py-1 rounded-full text-red-300 animate-pulse">
                🚨 ANSWER REQUIRED
              </div>
            )}
            
            {!isMyTurn && (
              <div className="bg-purple-500/20 border border-purple-500/50 px-3 py-1 rounded-full text-purple-300">
                👤 OPPONENT'S TURN
              </div>
            )}
            
            {gameState.drawStack > 0 && (
              <div className="bg-orange-500/20 border border-orange-500/50 px-3 py-1 rounded-full text-orange-300">
                ⚡ PENALTY: {gameState.drawStack}
              </div>
            )}
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