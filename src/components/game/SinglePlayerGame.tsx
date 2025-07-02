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
import { ArrowLeft, Settings, Volume2, VolumeX, Sparkles } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-emerald-500/5 to-yellow-500/5 rounded-full blur-3xl animate-spin" style={{ animationDuration: '20s' }}></div>
      </div>
      
      <div className="relative z-10 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Casino-style Header */}
          <div className="flex flex-col sm:flex-row items-center justify-between mb-6 bg-black/40 backdrop-blur-md rounded-2xl border border-yellow-500/30 p-4 shadow-2xl">
            <button
              onClick={onBackToMenu}
              className="flex items-center space-x-2 text-yellow-400 hover:text-yellow-300 transition-colors font-medium mb-4 sm:mb-0"
            >
              <ArrowLeft size={20} />
              <span>Back to Lobby</span>
            </button>
            
            <div className="text-center mb-4 sm:mb-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 flex items-center justify-center space-x-2">
                <Sparkles size={24} className="text-yellow-400" />
                <span>KADI CASINO</span>
                <Sparkles size={24} className="text-yellow-400" />
              </h1>
              <p className="text-emerald-300 text-sm font-medium">vs Computer • Premium Gaming</p>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-3 rounded-xl bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-white transition-all shadow-lg"
              >
                {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>
              
              <button
                onClick={() => setShowDifficultyModal(true)}
                className="flex items-center space-x-2 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white transition-all text-sm font-medium shadow-lg"
              >
                <Settings size={16} />
                <span className="hidden sm:inline">{gameState.aiDifficulty}</span>
              </button>
              
              <button
                onClick={handleNewGame}
                className="px-4 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-bold rounded-xl transition-all text-sm shadow-lg border border-yellow-400/50"
              >
                New Game
              </button>
            </div>
          </div>
          
          {/* Responsive Casino Game Layout */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6">
            {/* Computer Hand - Top on mobile, Left on desktop */}
            <div className="xl:col-span-1 order-1 xl:order-1">
              <div className="bg-gradient-to-br from-slate-800/80 via-slate-900/80 to-slate-800/80 backdrop-blur-md rounded-2xl border border-red-500/30 shadow-2xl">
                <PlayerHand
                  player={gameState.players[1]}
                  isCurrentPlayer={gameState.currentPlayerIndex === 1}
                  selectedCards={[]}
                  playableCards={[]}
                  onCardClick={() => {}}
                  isMyTurn={false}
                  hideCards={true}
                />
              </div>
            </div>
            
            {/* Game Board and Controls - Center */}
            <div className="xl:col-span-1 order-2 xl:order-2 space-y-4">
              <div className="bg-gradient-to-br from-emerald-800/80 via-emerald-900/80 to-emerald-800/80 backdrop-blur-md rounded-2xl border border-emerald-500/30 shadow-2xl">
                <GameBoard
                  gameState={gameState}
                  onDrawCard={handleDrawCard}
                />
              </div>
              
              <div className="bg-gradient-to-br from-slate-800/80 via-slate-900/80 to-slate-800/80 backdrop-blur-md rounded-2xl border border-yellow-500/30 shadow-2xl">
                <GameControls
                  gameState={gameState}
                  selectedCards={selectedCards}
                  onPlayCards={handlePlayCards}
                  onDeclareNikoKadi={handleDeclareNikoKadi}
                  onDrawPenalty={handleDrawPenalty}
                  canPlaySelected={canPlaySelected}
                />
              </div>
            </div>
            
            {/* Player Hand - Bottom on mobile, Right on desktop */}
            <div className="xl:col-span-1 order-3 xl:order-3">
              <div className="bg-gradient-to-br from-slate-800/80 via-slate-900/80 to-slate-800/80 backdrop-blur-md rounded-2xl border border-blue-500/30 shadow-2xl">
                <PlayerHand
                  player={gameState.players[0]}
                  isCurrentPlayer={gameState.currentPlayerIndex === 0}
                  selectedCards={gameState.currentPlayerIndex === 0 ? selectedCards : []}
                  playableCards={playableCards}
                  onCardClick={handleCardClick}
                  isMyTurn={!isComputerTurn}
                  hideCards={false}
                />
              </div>
            </div>
          </div>
          
          {/* Game Status */}
          <div className="mt-6">
            <GameStatus gameState={gameState} onNewGame={handleNewGame} />
          </div>
        </div>
      </div>
      
      {/* Suit Selector Modal */}
      {gameState.gamePhase === 'selectingSuit' && (
        <SuitSelector onSelectSuit={handleSelectSuit} />
      )}
      
      {/* Casino-style Difficulty Modal */}
      {showDifficultyModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl border-2 border-purple-500/50 max-w-md w-full overflow-hidden shadow-2xl">
            <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-600 p-6 text-white relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 animate-pulse"></div>
              <div className="relative z-10">
                <h3 className="text-2xl font-bold flex items-center space-x-2">
                  <Settings size={24} />
                  <span>Game Settings</span>
                </h3>
                <p className="text-purple-100 text-sm mt-1">Choose your challenge level</p>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <button
                onClick={() => handleDifficultyChange('easy')}
                className={`w-full p-4 rounded-xl border-2 transition-all text-left transform hover:scale-105 ${
                  gameState.aiDifficulty === 'easy' 
                    ? 'border-green-500 bg-green-500/20 text-white shadow-lg shadow-green-500/25' 
                    : 'border-white/20 hover:border-green-400 text-white/80 hover:text-white bg-black/20'
                }`}
              >
                <h4 className="font-bold text-green-400 text-lg">🟢 Beginner</h4>
                <p className="text-sm text-white/60 mt-1">Relaxed gameplay • Perfect for learning</p>
              </button>
              
              <button
                onClick={() => handleDifficultyChange('medium')}
                className={`w-full p-4 rounded-xl border-2 transition-all text-left transform hover:scale-105 ${
                  gameState.aiDifficulty === 'medium' 
                    ? 'border-yellow-500 bg-yellow-500/20 text-white shadow-lg shadow-yellow-500/25' 
                    : 'border-white/20 hover:border-yellow-400 text-white/80 hover:text-white bg-black/20'
                }`}
              >
                <h4 className="font-bold text-yellow-400 text-lg">🟡 Professional</h4>
                <p className="text-sm text-white/60 mt-1">Balanced challenge • Strategic gameplay</p>
              </button>
              
              <button
                onClick={() => handleDifficultyChange('hard')}
                className={`w-full p-4 rounded-xl border-2 transition-all text-left transform hover:scale-105 ${
                  gameState.aiDifficulty === 'hard' 
                    ? 'border-red-500 bg-red-500/20 text-white shadow-lg shadow-red-500/25' 
                    : 'border-white/20 hover:border-red-400 text-white/80 hover:text-white bg-black/20'
                }`}
              >
                <h4 className="font-bold text-red-400 text-lg">🔴 Master</h4>
                <p className="text-sm text-white/60 mt-1">Ultimate challenge • Expert AI</p>
              </button>
            </div>
            
            <div className="p-4 border-t border-white/10 bg-black/40">
              <button
                onClick={() => setShowDifficultyModal(false)}
                className="w-full px-4 py-3 bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-white rounded-xl transition-all font-medium"
              >
                Apply Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};