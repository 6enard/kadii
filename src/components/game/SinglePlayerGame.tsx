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
        if (prev.length < 2) {
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
            <p className="text-emerald-200">
              Difficulty: <span className="capitalize font-semibold">{gameState.aiDifficulty}</span>
            </p>
          </div>
          <button
            onClick={() => setShowDifficultyModal(true)}
            className="flex items-center space-x-2 text-white hover:text-emerald-200 transition-colors"
          >
            <Settings size={20} />
            <span>Difficulty</span>
          </button>
        </div>
        
        {/* Computer Player */}
        <div className="mb-6">
          <div className="p-4 rounded-lg border-2 border-gray-600 bg-gray-800 bg-opacity-50">
            <div className="flex items-center justify-between mb-3">
              <h3 className={`font-bold text-lg ${isComputerTurn ? 'text-blue-400' : 'text-gray-300'}`}>
                Computer ({gameState.aiDifficulty})
                {isComputerTurn && <span className="ml-2 text-sm bg-blue-600 px-2 py-1 rounded">Thinking...</span>}
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
            isMyTurn={!isComputerTurn}
          />
        </div>
        
        {/* Game Status */}
        <GameStatus gameState={gameState} onNewGame={handleNewGame} />
        
        {/* Suit Selector Modal */}
        {gameState.gamePhase === 'selectingSuit' && (
          <SuitSelector onSelectSuit={handleSelectSuit} />
        )}
        
        {/* Difficulty Modal */}
        {showDifficultyModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
              <h3 className="text-2xl font-bold mb-6 text-center">Select Difficulty</h3>
              
              <div className="space-y-4">
                <button
                  onClick={() => handleDifficultyChange('easy')}
                  className={`w-full p-4 rounded-lg border-2 transition-all ${
                    gameState.aiDifficulty === 'easy' 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-300 hover:border-green-300'
                  }`}
                >
                  <div className="text-left">
                    <h4 className="font-bold text-green-600">Easy</h4>
                    <p className="text-sm text-gray-600">Computer plays randomly, good for beginners</p>
                  </div>
                </button>
                
                <button
                  onClick={() => handleDifficultyChange('medium')}
                  className={`w-full p-4 rounded-lg border-2 transition-all ${
                    gameState.aiDifficulty === 'medium' 
                      ? 'border-yellow-500 bg-yellow-50' 
                      : 'border-gray-300 hover:border-yellow-300'
                  }`}
                >
                  <div className="text-left">
                    <h4 className="font-bold text-yellow-600">Medium</h4>
                    <p className="text-sm text-gray-600">Computer uses basic strategy, balanced gameplay</p>
                  </div>
                </button>
                
                <button
                  onClick={() => handleDifficultyChange('hard')}
                  className={`w-full p-4 rounded-lg border-2 transition-all ${
                    gameState.aiDifficulty === 'hard' 
                      ? 'border-red-500 bg-red-50' 
                      : 'border-gray-300 hover:border-red-300'
                  }`}
                >
                  <div className="text-left">
                    <h4 className="font-bold text-red-600">Hard</h4>
                    <p className="text-sm text-gray-600">Computer plays strategically, challenging for experts</p>
                  </div>
                </button>
              </div>
              
              <button
                onClick={() => setShowDifficultyModal(false)}
                className="w-full mt-6 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
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