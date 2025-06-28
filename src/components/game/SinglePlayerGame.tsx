import React, { useState, useCallback, useEffect } from 'react';
import { GameState, Suit, AIDifficulty } from '../../types';
import { 
  initializeGame, 
  canPlayerPlay, 
  playCards, 
  drawCard, 
  declareNikoKadi,
  selectSuit,
  handlePenaltyDraw,
  getCurrentPlayer,
  makeAIMove
} from '../../utils/gameLogic';
import { PlayerHand } from '../PlayerHand';
import { GameBoard } from '../GameBoard';
import { GameControls } from '../GameControls';
import { SuitSelector } from '../SuitSelector';
import { GameStatus } from '../GameStatus';
import { ArrowLeft, Settings } from 'lucide-react';

interface SinglePlayerGameProps {
  onBackToMenu: () => void;
}

export const SinglePlayerGame: React.FC<SinglePlayerGameProps> = ({ onBackToMenu }) => {
  const [gameState, setGameState] = useState<GameState>(() => {
    const game = initializeGame();
    game.players[1].name = 'Computer';
    game.aiDifficulty = 'medium';
    return game;
  });
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [showDifficultyModal, setShowDifficultyModal] = useState(false);
  
  const currentPlayer = getCurrentPlayer(gameState);
  const isComputerTurn = gameState.currentPlayerIndex === 1;
  
  // Handle computer moves
  useEffect(() => {
    if (isComputerTurn && gameState.gamePhase === 'playing') {
      const timer = setTimeout(() => {
        const newState = makeAIMove(gameState, gameState.aiDifficulty || 'medium');
        setGameState(newState);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isComputerTurn, gameState]);
  
  const handleCardClick = useCallback((cardId: string) => {
    if (gameState.gamePhase !== 'playing' || isComputerTurn) return;
    
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
  }, [gameState.gamePhase, isComputerTurn]);
  
  const handlePlayCards = useCallback(() => {
    if (selectedCards.length === 0 || isComputerTurn) return;
    
    const newGameState = playCards(gameState, { cardIds: selectedCards });
    setGameState(newGameState);
    setSelectedCards([]);
  }, [gameState, selectedCards, isComputerTurn]);
  
  const handleDrawCard = useCallback(() => {
    if (isComputerTurn) return;
    
    if (gameState.drawStack > 0) {
      const newGameState = handlePenaltyDraw(gameState);
      setGameState(newGameState);
    } else {
      const newGameState = drawCard(gameState, gameState.currentPlayerIndex);
      setGameState(newGameState);
    }
  }, [gameState, isComputerTurn]);
  
  const handleDeclareNikoKadi = useCallback(() => {
    if (isComputerTurn) return;
    const newGameState = declareNikoKadi(gameState);
    setGameState(newGameState);
  }, [gameState, isComputerTurn]);
  
  const handleSelectSuit = useCallback((suit: Suit) => {
    const newGameState = selectSuit(gameState, suit);
    setGameState(newGameState);
  }, [gameState]);
  
  const handleNewGame = useCallback(() => {
    const game = initializeGame();
    game.players[1].name = 'Computer';
    game.aiDifficulty = gameState.aiDifficulty || 'medium';
    setGameState(game);
    setSelectedCards([]);
  }, [gameState.aiDifficulty]);
  
  const handleDrawPenalty = useCallback(() => {
    if (isComputerTurn) return;
    const newGameState = handlePenaltyDraw(gameState);
    setGameState(newGameState);
  }, [gameState, isComputerTurn]);
  
  const handleDifficultyChange = useCallback((difficulty: AIDifficulty) => {
    setGameState(prev => ({ ...prev, aiDifficulty: difficulty }));
    setShowDifficultyModal(false);
  }, []);
  
  const canPlaySelected = canPlayerPlay(gameState, selectedCards);
  
  const playableCards = !isComputerTurn ? currentPlayer.hand
    .filter(card => canPlayerPlay(gameState, [card.id]))
    .map(card => card.id) : [];
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 flex flex-col">
      {/* Fixed Header */}
      <div className="flex-shrink-0 p-4 bg-black bg-opacity-20 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            onClick={onBackToMenu}
            className="flex items-center space-x-2 text-white hover:text-emerald-200 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">Kadi vs Computer</h1>
            <p className="text-emerald-200 text-sm">
              Difficulty: <span className="capitalize font-semibold">{gameState.aiDifficulty}</span>
            </p>
          </div>
          <button
            onClick={() => setShowDifficultyModal(true)}
            className="flex items-center space-x-2 text-white hover:text-emerald-200 transition-colors"
          >
            <Settings size={20} />
            <span>Settings</span>
          </button>
        </div>
      </div>

      {/* Main Game Area - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-4 space-y-4">
          {/* Computer Player - Compact */}
          <div className="bg-gray-800 bg-opacity-50 rounded-xl p-3 border border-gray-600">
            <div className="flex items-center justify-between mb-2">
              <h3 className={`font-bold ${isComputerTurn ? 'text-blue-400' : 'text-gray-300'}`}>
                🤖 Computer
                {isComputerTurn && <span className="ml-2 text-xs bg-blue-600 px-2 py-1 rounded animate-pulse">Thinking...</span>}
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
            
            {/* Hidden cards - Compact */}
            <div className="flex flex-wrap gap-1">
              {gameState.players[1].hand.map((_, index) => (
                <div
                  key={index}
                  className="w-12 h-16 bg-blue-900 rounded-lg border border-blue-700 flex items-center justify-center"
                >
                  <div className="text-white text-xs font-bold">K</div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Game Board - Compact */}
          <GameBoard
            gameState={gameState}
            onDrawCard={handleDrawCard}
          />
          
          {/* Game Controls - Always visible */}
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
            isMyTurn={!isComputerTurn}
          />
          
          {/* Game Status - Compact */}
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
      
      {/* Difficulty Modal */}
      {showDifficultyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 text-white rounded-t-xl">
              <h3 className="text-xl font-bold">Select Difficulty</h3>
            </div>
            
            <div className="p-6 space-y-3">
              <button
                onClick={() => handleDifficultyChange('easy')}
                className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                  gameState.aiDifficulty === 'easy' 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-300 hover:border-green-300'
                }`}
              >
                <h4 className="font-bold text-green-600">🟢 Easy</h4>
                <p className="text-sm text-gray-600">Computer plays randomly</p>
              </button>
              
              <button
                onClick={() => handleDifficultyChange('medium')}
                className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                  gameState.aiDifficulty === 'medium' 
                    ? 'border-yellow-500 bg-yellow-50' 
                    : 'border-gray-300 hover:border-yellow-300'
                }`}
              >
                <h4 className="font-bold text-yellow-600">🟡 Medium</h4>
                <p className="text-sm text-gray-600">Computer uses basic strategy</p>
              </button>
              
              <button
                onClick={() => handleDifficultyChange('hard')}
                className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                  gameState.aiDifficulty === 'hard' 
                    ? 'border-red-500 bg-red-50' 
                    : 'border-gray-300 hover:border-red-300'
                }`}
              >
                <h4 className="font-bold text-red-600">🔴 Hard</h4>
                <p className="text-sm text-gray-600">Computer plays strategically</p>
              </button>
            </div>
            
            <div className="p-4 border-t">
              <button
                onClick={() => setShowDifficultyModal(false)}
                className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};