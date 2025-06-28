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
      }, 1000); // 1 second delay for better UX
      
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
      // Handle penalty draw - turn ends automatically
      const newGameState = handlePenaltyDraw(gameState);
      setGameState(newGameState);
    } else {
      // Regular draw - turn ends automatically
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
            <h1 className="text-xl font-bold text-white">Kadi vs Computer</h1>
            <p className="text-emerald-200 text-xs">
              Difficulty: <span className="capitalize font-semibold">{gameState.aiDifficulty}</span>
            </p>
          </div>
          <button
            onClick={() => setShowDifficultyModal(true)}
            className="flex items-center space-x-2 text-white hover:text-emerald-200 transition-colors text-sm"
          >
            <Settings size={18} />
            <span>Settings</span>
          </button>
        </div>
      </div>

      {/* Main Game Container - Contained and Scrollable */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 max-w-7xl mx-auto w-full p-4 flex flex-col space-y-3 min-h-0">
          
          {/* Computer Player - Ultra Compact */}
          <div className="flex-shrink-0 bg-gray-800 bg-opacity-50 rounded-lg p-2 border border-gray-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <h3 className={`font-bold text-sm ${isComputerTurn ? 'text-blue-400' : 'text-gray-300'}`}>
                  🤖 Computer
                  {isComputerTurn && <span className="ml-2 text-xs bg-blue-600 px-2 py-1 rounded animate-pulse">Thinking...</span>}
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
              isMyTurn={!isComputerTurn}
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