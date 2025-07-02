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
import { ArrowLeft, Volume2, VolumeX, Users, Sparkles } from 'lucide-react';

interface MultiplayerGameProps {
  onBackToMenu: () => void;
}

export const MultiplayerGame: React.FC<MultiplayerGameProps> = ({ onBackToMenu }) => {
  const [gameState, setGameState] = useState<GameState>(() => {
    const game = initializeGame();
    game.players[1].name = 'Player 2';
    return game;
  });
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  const currentPlayer = getCurrentPlayer(gameState);
  const isMyTurn = gameState.currentPlayerIndex === 0; // Player 1 is always the current user
  
  const handleCardClick = useCallback((cardId: string) => {
    if (gameState.gamePhase !== 'playing') return;
    
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
  }, [gameState.gamePhase]);
  
  const handlePlayCards = useCallback(() => {
    if (selectedCards.length === 0) return;
    
    const newGameState = playCards(gameState, { cardIds: selectedCards });
    setGameState(newGameState);
    setSelectedCards([]);
  }, [gameState, selectedCards]);
  
  const handleDrawCard = useCallback(() => {
    if (gameState.drawStack > 0) {
      // Handle penalty draw - turn ends automatically
      const newGameState = handlePenaltyDraw(gameState);
      setGameState(newGameState);
    } else {
      // Regular draw - turn ends automatically
      const newGameState = drawCard(gameState, gameState.currentPlayerIndex);
      setGameState(newGameState);
    }
  }, [gameState]);
  
  const handleDeclareNikoKadi = useCallback(() => {
    const newGameState = declareNikoKadi(gameState);
    setGameState(newGameState);
  }, [gameState]);
  
  const handleSelectSuit = useCallback((suit: Suit) => {
    const newGameState = selectSuit(gameState, suit);
    setGameState(newGameState);
  }, [gameState]);
  
  const handleNewGame = useCallback(() => {
    const game = initializeGame();
    game.players[1].name = 'Player 2';
    setGameState(game);
    setSelectedCards([]);
  }, []);
  
  const handleDrawPenalty = useCallback(() => {
    const newGameState = handlePenaltyDraw(gameState);
    setGameState(newGameState);
  }, [gameState]);
  
  const canPlaySelected = canPlayerPlay(gameState, selectedCards);
  
  const playableCards = currentPlayer.hand
    .filter(card => canPlayerPlay(gameState, [card.id]))
    .map(card => card.id);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-purple-500/5 to-blue-500/5 rounded-full blur-3xl animate-spin" style={{ animationDuration: '25s' }}></div>
      </div>
      
      <div className="relative z-10 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Casino-style Header */}
          <div className="flex flex-col sm:flex-row items-center justify-between mb-6 bg-black/40 backdrop-blur-md rounded-2xl border border-purple-500/30 p-4 shadow-2xl">
            <button
              onClick={onBackToMenu}
              className="flex items-center space-x-2 text-purple-400 hover:text-purple-300 transition-colors font-medium mb-4 sm:mb-0"
            >
              <ArrowLeft size={20} />
              <span>Back to Lobby</span>
            </button>
            
            <div className="text-center mb-4 sm:mb-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-blue-500 to-purple-600 flex items-center justify-center space-x-2">
                <Users size={24} className="text-purple-400" />
                <span>MULTIPLAYER CASINO</span>
                <Sparkles size={24} className="text-blue-400" />
              </h1>
              <p className="text-purple-300 text-sm font-medium">Pass & Play • Premium Gaming</p>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-3 rounded-xl bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-white transition-all shadow-lg"
              >
                {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>
              
              <button
                onClick={handleNewGame}
                className="px-4 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-bold rounded-xl transition-all text-sm shadow-lg border border-purple-400/50"
              >
                New Game
              </button>
            </div>
          </div>
          
          {/* Responsive Casino Game Layout */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6">
            {/* Player 2 Hand - Top on mobile, Left on desktop */}
            <div className="xl:col-span-1 order-1 xl:order-1">
              <div className="bg-gradient-to-br from-slate-800/80 via-slate-900/80 to-slate-800/80 backdrop-blur-md rounded-2xl border border-purple-500/30 shadow-2xl">
                <PlayerHand
                  player={gameState.players[1]}
                  isCurrentPlayer={gameState.currentPlayerIndex === 1}
                  selectedCards={gameState.currentPlayerIndex === 1 ? selectedCards : []}
                  playableCards={gameState.currentPlayerIndex === 1 ? playableCards : []}
                  onCardClick={handleCardClick}
                  isMyTurn={gameState.currentPlayerIndex === 1}
                  hideCards={false}
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
              
              <div className="bg-gradient-to-br from-slate-800/80 via-slate-900/80 to-slate-800/80 backdrop-blur-md rounded-2xl border border-blue-500/30 shadow-2xl">
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
            
            {/* Player 1 Hand - Bottom on mobile, Right on desktop */}
            <div className="xl:col-span-1 order-3 xl:order-3">
              <div className="bg-gradient-to-br from-slate-800/80 via-slate-900/80 to-slate-800/80 backdrop-blur-md rounded-2xl border border-blue-500/30 shadow-2xl">
                <PlayerHand
                  player={gameState.players[0]}
                  isCurrentPlayer={gameState.currentPlayerIndex === 0}
                  selectedCards={gameState.currentPlayerIndex === 0 ? selectedCards : []}
                  playableCards={playableCards}
                  onCardClick={handleCardClick}
                  isMyTurn={isMyTurn}
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
    </div>
  );
};