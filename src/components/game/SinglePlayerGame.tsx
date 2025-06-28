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
              KADI vs COMPUTER
            </h1>
            <div className="flex items-center justify-center space-x-2 text-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-300">
                Difficulty: <span className="text-green-400 font-semibold capitalize">{gameState.aiDifficulty}</span>
              </span>
            </div>
          </div>
          
          <button
            onClick={() => setShowDifficultyModal(true)}
            className="flex items-center space-x-2 text-green-300 hover:text-white transition-colors group"
          >
            <Settings size={20} className="group-hover:rotate-90 transition-transform" />
            <span className="font-medium">Settings</span>
          </button>
        </div>
      </div>

      {/* Computer Hand - Top */}
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
        isMyTurn={!isComputerTurn}
      />
        
      {/* Suit Selector Modal */}
      {gameState.gamePhase === 'selectingSuit' && (
        <SuitSelector onSelectSuit={handleSelectSuit} />
      )}
      
      {/* Game Status Modal */}
      <GameStatus gameState={gameState} onNewGame={handleNewGame} />
      
      {/* Difficulty Modal */}
      {showDifficultyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl max-w-md w-full border border-gray-600">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white rounded-t-2xl">
              <h3 className="text-2xl font-bold">AI DIFFICULTY</h3>
              <p className="text-blue-100 mt-1">Choose your challenge level</p>
            </div>
            
            <div className="p-6 space-y-4">
              <button
                onClick={() => handleDifficultyChange('easy')}
                className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                  gameState.aiDifficulty === 'easy' 
                    ? 'border-green-500 bg-green-500/10 shadow-lg shadow-green-500/20' 
                    : 'border-gray-600 hover:border-green-400 bg-gray-800/50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <div>
                    <h4 className="font-bold text-green-400 text-lg">EASY</h4>
                    <p className="text-gray-400 text-sm">Random plays, good for learning</p>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => handleDifficultyChange('medium')}
                className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                  gameState.aiDifficulty === 'medium' 
                    ? 'border-yellow-500 bg-yellow-500/10 shadow-lg shadow-yellow-500/20' 
                    : 'border-gray-600 hover:border-yellow-400 bg-gray-800/50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <div>
                    <h4 className="font-bold text-yellow-400 text-lg">MEDIUM</h4>
                    <p className="text-gray-400 text-sm">Basic strategy, balanced gameplay</p>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => handleDifficultyChange('hard')}
                className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                  gameState.aiDifficulty === 'hard' 
                    ? 'border-red-500 bg-red-500/10 shadow-lg shadow-red-500/20' 
                    : 'border-gray-600 hover:border-red-400 bg-gray-800/50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <div>
                    <h4 className="font-bold text-red-400 text-lg">HARD</h4>
                    <p className="text-gray-400 text-sm">Advanced tactics, maximum challenge</p>
                  </div>
                </div>
              </button>
            </div>
            
            <div className="p-4 border-t border-gray-700">
              <button
                onClick={() => setShowDifficultyModal(false)}
                className="w-full px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors font-medium"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};