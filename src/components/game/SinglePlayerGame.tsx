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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, #10b981 0%, transparent 50%), 
                           radial-gradient(circle at 75% 75%, #3b82f6 0%, transparent 50%)`
        }}></div>
      </div>

      {/* Top Navigation Bar */}
      <div className="relative z-10 bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBackToMenu}
                className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors group"
              >
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                <span className="font-medium">Back to Menu</span>
              </button>
              
              <div className="h-6 w-px bg-white/20"></div>
              
              <div className="text-white">
                <h1 className="text-lg font-bold">Kadi vs Computer</h1>
                <p className="text-xs text-white/60">
                  Difficulty: <span className="capitalize text-emerald-400 font-medium">{gameState.aiDifficulty}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all"
              >
                {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
              </button>
              
              <button
                onClick={() => setShowDifficultyModal(true)}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all"
              >
                <Settings size={18} />
                <span className="text-sm font-medium">Settings</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Computer Player Area */}
          <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 backdrop-blur-sm rounded-2xl border border-white/10 p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">🤖</span>
                </div>
                <div>
                  <h3 className="text-white font-semibold">Computer</h3>
                  <p className="text-white/60 text-sm">
                    {isComputerTurn ? 'Thinking...' : 'Waiting'}
                  </p>
                </div>
                {isComputerTurn && (
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                    <span className="text-red-400 text-sm font-medium">Active</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-white font-bold text-lg">{gameState.players[1].hand.length}</div>
                  <div className="text-white/60 text-xs">cards</div>
                </div>
                {gameState.players[1].nikoKadiCalled && (
                  <div className="bg-yellow-500 px-3 py-1 rounded-full">
                    <span className="text-black font-bold text-sm">Niko Kadi!</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Computer's Cards */}
            <div className="flex flex-wrap gap-2 justify-center">
              {gameState.players[1].hand.map((_, index) => (
                <div
                  key={index}
                  className="w-12 h-16 bg-gradient-to-br from-slate-700 to-slate-800 rounded-lg border border-white/20 flex items-center justify-center relative overflow-hidden group hover:scale-105 transition-transform"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="text-white/40 text-xs font-bold">KADI</div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Game Board - Center Table */}
          <div className="relative">
            <GameBoard
              gameState={gameState}
              onDrawCard={handleDrawCard}
            />
          </div>
          
          {/* Game Controls */}
          <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 backdrop-blur-sm rounded-2xl border border-white/10 p-4">
            <GameControls
              gameState={gameState}
              selectedCards={selectedCards}
              onPlayCards={handlePlayCards}
              onDeclareNikoKadi={handleDeclareNikoKadi}
              onDrawPenalty={handleDrawPenalty}
              canPlaySelected={canPlaySelected}
            />
          </div>
          
          {/* Player Hand */}
          <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 backdrop-blur-sm rounded-2xl border border-white/10 p-4">
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
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/30 backdrop-blur-md border-t border-white/10 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-center">
          <button
            onClick={handleNewGame}
            className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
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