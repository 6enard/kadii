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
    <div className="min-h-screen bg-gradient-to-br from-green-800 via-green-900 to-emerald-900 relative overflow-hidden">
      {/* Casino Table Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 1px, transparent 1px),
                           radial-gradient(circle at 75% 75%, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      {/* Header Bar */}
      <div className="relative z-10 bg-black bg-opacity-30 backdrop-blur-sm border-b border-green-600">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={onBackToMenu}
            className="flex items-center space-x-2 text-white hover:text-green-300 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back to Menu</span>
          </button>
          
          <div className="text-center">
            <h1 className="text-xl font-bold text-white">Kadi Table</h1>
            <p className="text-green-300 text-sm">
              vs Computer • <span className="capitalize">{gameState.aiDifficulty}</span>
            </p>
          </div>
          
          <button
            onClick={() => setShowDifficultyModal(true)}
            className="flex items-center space-x-2 text-white hover:text-green-300 transition-colors"
          >
            <Settings size={20} />
            <span>Settings</span>
          </button>
        </div>
      </div>

      {/* Main Game Table */}
      <div className="relative z-10 h-[calc(100vh-80px)] flex flex-col">
        {/* Computer's Area (Top) */}
        <div className="flex-shrink-0 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-black bg-opacity-20 rounded-xl p-4 border border-green-600 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">🤖</span>
                  </div>
                  <div>
                    <h3 className={`font-bold ${isComputerTurn ? 'text-yellow-400' : 'text-white'}`}>
                      Computer
                    </h3>
                    {isComputerTurn && (
                      <div className="text-xs text-yellow-300 animate-pulse">Thinking...</div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="bg-green-700 px-3 py-1 rounded-full text-white text-sm font-medium">
                    {gameState.players[1].hand.length} cards
                  </div>
                  {gameState.players[1].nikoKadiCalled && (
                    <div className="bg-yellow-500 px-3 py-1 rounded-full text-black text-sm font-bold animate-bounce">
                      Niko Kadi!
                    </div>
                  )}
                </div>
              </div>
              
              {/* Computer's Hidden Cards */}
              <div className="flex justify-center">
                <div className="flex space-x-1">
                  {gameState.players[1].hand.map((_, index) => (
                    <div
                      key={index}
                      className="w-12 h-16 bg-blue-900 rounded-lg border border-blue-700 flex items-center justify-center shadow-lg"
                    >
                      <div className="text-white text-xs font-bold">K</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Center Table Area */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-4xl w-full">
            {/* Game Board - Casino Style */}
            <div className="bg-green-700 rounded-3xl p-8 border-4 border-yellow-600 shadow-2xl relative">
              {/* Table Felt Pattern */}
              <div className="absolute inset-4 rounded-2xl border-2 border-yellow-500 opacity-30"></div>
              
              <GameBoard
                gameState={gameState}
                onDrawCard={handleDrawCard}
              />
            </div>
            
            {/* Game Controls - Positioned like betting area */}
            <div className="mt-6">
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
        </div>

        {/* Player's Area (Bottom) */}
        <div className="flex-shrink-0 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-black bg-opacity-20 rounded-xl p-4 border border-green-600 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">👤</span>
                  </div>
                  <div>
                    <h3 className={`font-bold ${!isComputerTurn ? 'text-yellow-400' : 'text-white'}`}>
                      You
                    </h3>
                    {!isComputerTurn && (
                      <div className="text-xs text-yellow-300">Your turn</div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="bg-green-700 px-3 py-1 rounded-full text-white text-sm font-medium">
                    {gameState.players[0].hand.length} cards
                  </div>
                  {gameState.players[0].nikoKadiCalled && (
                    <div className="bg-yellow-500 px-3 py-1 rounded-full text-black text-sm font-bold animate-bounce">
                      Niko Kadi!
                    </div>
                  )}
                </div>
              </div>
              
              {/* Player's Cards */}
              <div className="flex justify-center">
                <div className="flex flex-wrap gap-2 justify-center max-w-full">
                  {gameState.players[0].hand.map((card) => (
                    <div
                      key={card.id}
                      onClick={() => !isComputerTurn && handleCardClick(card.id)}
                      className={`
                        w-16 h-24 rounded-xl border-2 flex flex-col justify-between p-2 relative
                        cursor-pointer transition-all duration-300 shadow-lg
                        ${selectedCards.includes(card.id) 
                          ? 'ring-4 ring-yellow-400 transform -translate-y-3 scale-110 shadow-2xl bg-white' 
                          : 'bg-white hover:transform hover:-translate-y-1 hover:shadow-xl'
                        }
                        ${!isComputerTurn && playableCards.includes(card.id) 
                          ? 'border-green-400 hover:border-green-500' 
                          : 'border-gray-300 opacity-75'
                        }
                        ${isComputerTurn ? 'cursor-not-allowed' : ''}
                      `}
                    >
                      {/* Card Content */}
                      <div className="text-center">
                        <div className={`font-bold text-sm ${
                          card.suit === 'hearts' || card.suit === 'diamonds' ? 'text-red-500' : 'text-black'
                        }`}>
                          {card.rank}
                        </div>
                        <div className={`text-lg ${
                          card.suit === 'hearts' || card.suit === 'diamonds' ? 'text-red-500' : 'text-black'
                        }`}>
                          {card.suit === 'hearts' ? '♥' : 
                           card.suit === 'diamonds' ? '♦' : 
                           card.suit === 'clubs' ? '♣' : '♠'}
                        </div>
                      </div>
                      
                      <div className={`text-center rotate-180 text-xs ${
                        card.suit === 'hearts' || card.suit === 'diamonds' ? 'text-red-500' : 'text-black'
                      }`}>
                        <div className="font-bold">{card.rank}</div>
                        <div>
                          {card.suit === 'hearts' ? '♥' : 
                           card.suit === 'diamonds' ? '♦' : 
                           card.suit === 'clubs' ? '♣' : '♠'}
                        </div>
                      </div>
                      
                      {/* Selection indicator */}
                      {selectedCards.includes(card.id) && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                          <span className="text-black text-xs font-bold">
                            {selectedCards.indexOf(card.id) + 1}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Game Status */}
      <GameStatus gameState={gameState} onNewGame={handleNewGame} />
        
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