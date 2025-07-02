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
import { ArrowLeft, Settings, Volume2, VolumeX } from 'lucide-react';

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
  const [soundEnabled, setSoundEnabled] = useState(true);
  
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
    <div className="min-h-screen bg-gradient-to-br from-green-400 to-green-600 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onBackToMenu}
              className="flex items-center space-x-2 text-white hover:text-green-100 transition-colors"
            >
              <ArrowLeft size={20} />
              <span>Back to Menu</span>
            </button>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-all"
              >
                {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
              </button>
              
              <button
                onClick={() => setShowDifficultyModal(true)}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-all"
              >
                <Settings size={20} />
                <span>Difficulty: {gameState.aiDifficulty}</span>
              </button>
            </div>
          </div>
          
          <h1 className="text-4xl font-bold text-white mb-2">Kadi vs Computer</h1>
          <p className="text-green-100">Kenyan Card Game</p>
        </div>
        
        {/* Player 2 (Computer) */}
        <div className="mb-6">
          <PlayerHand
            player={gameState.players[1]}
            isCurrentPlayer={gameState.currentPlayerIndex === 1}
            selectedCards={gameState.currentPlayerIndex === 1 ? selectedCards : []}
            playableCards={gameState.currentPlayerIndex === 1 ? playableCards : []}
            onCardClick={handleCardClick}
            isMyTurn={gameState.currentPlayerIndex === 1}
          />
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
        
        {/* New Game Button */}
        <div className="text-center">
          <button
            onClick={handleNewGame}
            className="px-6 py-3 bg-white text-green-600 font-bold rounded-lg
                       hover:bg-gray-100 transition-all duration-200 transform hover:scale-105"
          >
            New Game
          </button>
        </div>
      </div>
      
      {/* Difficulty Modal */}
      {showDifficultyModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-white/20 max-w-md w-full overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 p-6 text-white">
              <h3 className="text-xl font-bold">Game Settings</h3>
              <p className="text-emerald-100 text-sm mt-1">Choose AI difficulty level</p>
            </div>
            
            <div className="p-6 space-y-4">
              <button
                onClick={() => handleDifficultyChange('easy')}
                className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                  gameState.aiDifficulty === 'easy' 
                    ? 'border-green-500 bg-green-500/10 text-white' 
                    : 'border-white/20 hover:border-green-400 text-white/80 hover:text-white'
                }`}
              >
                <h4 className="font-bold text-green-400">🟢 Easy</h4>
                <p className="text-sm text-white/60 mt-1">Computer plays randomly</p>
              </button>
              
              <button
                onClick={() => handleDifficultyChange('medium')}
                className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                  gameState.aiDifficulty === 'medium' 
                    ? 'border-yellow-500 bg-yellow-500/10 text-white' 
                    : 'border-white/20 hover:border-yellow-400 text-white/80 hover:text-white'
                }`}
              >
                <h4 className="font-bold text-yellow-400">🟡 Medium</h4>
                <p className="text-sm text-white/60 mt-1">Computer uses basic strategy</p>
              </button>
              
              <button
                onClick={() => handleDifficultyChange('hard')}
                className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                  gameState.aiDifficulty === 'hard' 
                    ? 'border-red-500 bg-red-500/10 text-white' 
                    : 'border-white/20 hover:border-red-400 text-white/80 hover:text-white'
                }`}
              >
                <h4 className="font-bold text-red-400">🔴 Hard</h4>
                <p className="text-sm text-white/60 mt-1">Computer plays strategically</p>
              </button>
            </div>
            
            <div className="p-4 border-t border-white/10">
              <button
                onClick={() => setShowDifficultyModal(false)}
                className="w-full px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};