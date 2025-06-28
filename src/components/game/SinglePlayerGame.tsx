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
import { ArrowLeft, Settings, Zap, Target } from 'lucide-react';

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
        if (prev.length < 6) { // Allow up to 6 cards for stacking
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
              KADI vs AI
            </h1>
            <div className="flex items-center justify-center space-x-2 text-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-gray-400">
                Difficulty: <span className="text-cyan-400 font-semibold capitalize">{gameState.aiDifficulty}</span>
              </span>
            </div>
          </div>
          
          <button
            onClick={() => setShowDifficultyModal(true)}
            className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors group"
          >
            <Settings size={20} className="group-hover:rotate-90 transition-transform" />
            <span className="font-medium">Settings</span>
          </button>
        </div>
      </div>

      {/* Main Game Container - Scrollable with proper spacing */}
      <div className="pt-20 pb-24 px-4 min-h-screen">
        <div className="max-w-7xl mx-auto space-y-4">
          
          {/* Computer Player - Compact Urban Style */}
          <div className="bg-gradient-to-r from-red-900/30 to-orange-900/30 backdrop-blur-sm rounded-2xl border border-red-500/20 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${isComputerTurn ? 'bg-red-400 animate-pulse' : 'bg-gray-500'}`}></div>
                <h3 className="font-bold text-lg">
                  🤖 COMPUTER
                  {isComputerTurn && (
                    <span className="ml-3 text-xs bg-red-500 px-3 py-1 rounded-full animate-pulse">
                      PROCESSING...
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
            
            {/* Computer Cards - Urban Grid */}
            <div className="grid grid-cols-8 sm:grid-cols-12 md:grid-cols-16 gap-1">
              {gameState.players[1].hand.map((_, index) => (
                <div
                  key={index}
                  className="aspect-[2/3] bg-gradient-to-br from-red-800 to-red-900 rounded-lg border border-red-600/50 flex items-center justify-center shadow-lg"
                >
                  <div className="text-red-300 text-xs font-bold">K</div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Game Board - Urban Center Piece */}
          <GameBoard
            gameState={gameState}
            onDrawCard={handleDrawCard}
          />
          
          {/* Player Hand - Urban Style */}
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

      {/* Fixed Bottom Controls - Urban Command Center */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-black bg-opacity-90 backdrop-blur-xl border-t border-gray-700">
        <div className="max-w-7xl mx-auto p-4">
          {/* Niko Kadi Button - Prominent */}
          <div className="flex justify-center mb-4">
            <button
              onClick={handleDeclareNikoKadi}
              disabled={!(!isComputerTurn)}
              className={`
                px-8 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400
                text-black font-bold text-lg rounded-xl transition-all duration-200 transform hover:scale-105
                shadow-2xl border-2 border-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed
                ${!isComputerTurn ? 'animate-pulse shadow-yellow-500/50' : ''}
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
              disabled={!canPlaySelected || selectedCards.length === 0 || isComputerTurn}
              className={`
                p-4 rounded-xl font-bold transition-all duration-200 transform hover:scale-105
                ${canPlaySelected && selectedCards.length > 0 && !isComputerTurn
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
            {gameState.drawStack > 0 && !isComputerTurn && (
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
            
            {isComputerTurn && (
              <div className="bg-blue-500/20 border border-blue-500/50 px-3 py-1 rounded-full text-blue-300">
                🤖 AI TURN
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
      
      {/* Difficulty Modal - Urban Style */}
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