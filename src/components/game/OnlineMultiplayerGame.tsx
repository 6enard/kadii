import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GameState, Suit, OnlineGameSession, GameMove } from '../../types';
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
import { ArrowLeft, Volume2, VolumeX, Users, Sparkles, Wifi, WifiOff, Clock, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  doc, 
  onSnapshot, 
  updateDoc, 
  addDoc, 
  collection, 
  serverTimestamp,
  getDoc 
} from 'firebase/firestore';
import { db } from '../../firebase/config';

interface OnlineMultiplayerGameProps {
  onBackToMenu: () => void;
  gameSessionId: string;
  opponentId: string;
  opponentName: string;
}

export const OnlineMultiplayerGame: React.FC<OnlineMultiplayerGameProps> = ({ 
  onBackToMenu, 
  gameSessionId, 
  opponentId, 
  opponentName 
}) => {
  const { user } = useAuth();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [opponentOnline, setOpponentOnline] = useState(true);
  const [gameSession, setGameSession] = useState<OnlineGameSession | null>(null);
  const [error, setError] = useState<string>('');
  const [isMyTurn, setIsMyTurn] = useState(false);
  
  // Use refs to track listeners and prevent multiple subscriptions
  const gameUnsubscribeRef = useRef<(() => void) | null>(null);
  const movesUnsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!user || !gameSessionId) {
      setError('Invalid game session');
      return;
    }

    setupGameListeners();

    return () => {
      cleanupListeners();
    };
  }, [user, gameSessionId]);

  useEffect(() => {
    if (gameState && user) {
      const currentPlayer = getCurrentPlayer(gameState);
      setIsMyTurn(currentPlayer.id === user.uid);
    }
  }, [gameState, user]);

  const cleanupListeners = () => {
    if (gameUnsubscribeRef.current) {
      gameUnsubscribeRef.current();
      gameUnsubscribeRef.current = null;
    }
    if (movesUnsubscribeRef.current) {
      movesUnsubscribeRef.current();
      movesUnsubscribeRef.current = null;
    }
  };

  const setupGameListeners = async () => {
    try {
      setConnectionStatus('connecting');
      
      // Listen to game session changes
      const gameSessionRef = doc(db, 'gameSessions', gameSessionId);
      
      gameUnsubscribeRef.current = onSnapshot(gameSessionRef, (doc) => {
        if (doc.exists()) {
          const session = { id: doc.id, ...doc.data() } as OnlineGameSession;
          setGameSession(session);
          
          if (session.gameState) {
            setGameState(session.gameState);
          }
          
          setConnectionStatus('connected');
          setError('');
          
          // Check if opponent is still online (simplified check)
          const now = new Date();
          const lastMove = session.lastMoveAt?.toDate?.() || session.lastMoveAt;
          if (lastMove && now.getTime() - lastMove.getTime() > 60000) { // 1 minute
            setOpponentOnline(false);
          } else {
            setOpponentOnline(true);
          }
        } else {
          setError('Game session not found');
          setConnectionStatus('disconnected');
        }
      }, (error) => {
        console.error('Error listening to game session:', error);
        setError('Connection lost. Trying to reconnect...');
        setConnectionStatus('disconnected');
      });

    } catch (error: any) {
      console.error('Error setting up game listeners:', error);
      setError('Failed to connect to game');
      setConnectionStatus('disconnected');
    }
  };

  const makeMove = async (moveType: string, data: any = {}) => {
    if (!user || !gameState || !gameSession) return;

    try {
      // Create the move record
      const move: Partial<GameMove> = {
        gameId: gameSessionId,
        playerId: user.uid,
        playerName: user.displayName || 'Player',
        moveType: moveType as any,
        timestamp: new Date(),
        ...data
      };

      // Apply the move locally first for immediate feedback
      let newGameState = { ...gameState };
      
      switch (moveType) {
        case 'playCards':
          newGameState = playCards(gameState, { cardIds: data.cardIds, declaredSuit: data.declaredSuit });
          break;
        case 'drawCard':
          newGameState = drawCard(gameState, gameState.currentPlayerIndex);
          break;
        case 'declareNikoKadi':
          newGameState = declareNikoKadi(gameState);
          break;
        case 'selectSuit':
          newGameState = selectSuit(gameState, data.selectedSuit);
          break;
        case 'drawPenalty':
          newGameState = handlePenaltyDraw(gameState);
          break;
      }

      move.gameStateAfter = newGameState;

      // Update the game session in Firestore
      await updateDoc(doc(db, 'gameSessions', gameSessionId), {
        gameState: newGameState,
        lastMoveAt: serverTimestamp(),
        status: newGameState.gamePhase === 'gameOver' ? 'completed' : 'active',
        winner: newGameState.winner || null
      });

      // Add the move to the moves collection for history
      await addDoc(collection(db, 'gameMoves'), move);

      setSelectedCards([]);
      
    } catch (error: any) {
      console.error('Error making move:', error);
      setError('Failed to make move. Please try again.');
    }
  };

  const handleCardClick = useCallback((cardId: string) => {
    if (!isMyTurn || gameState?.gamePhase !== 'playing') return;
    
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
  }, [isMyTurn, gameState?.gamePhase]);

  const handlePlayCards = useCallback(() => {
    if (selectedCards.length === 0 || !isMyTurn) return;
    makeMove('playCards', { cardIds: selectedCards });
  }, [selectedCards, isMyTurn]);

  const handleDrawCard = useCallback(() => {
    if (!isMyTurn) return;
    
    if (gameState?.drawStack && gameState.drawStack > 0) {
      makeMove('drawPenalty');
    } else {
      makeMove('drawCard');
    }
  }, [isMyTurn, gameState?.drawStack]);

  const handleDeclareNikoKadi = useCallback(() => {
    if (!isMyTurn) return;
    makeMove('declareNikoKadi');
  }, [isMyTurn]);

  const handleSelectSuit = useCallback((suit: Suit) => {
    makeMove('selectSuit', { selectedSuit: suit });
  }, []);

  const handleNewGame = useCallback(async () => {
    if (!user || !gameSession) return;
    
    try {
      // Only the host can start a new game
      if (gameSession.hostId !== user.uid) {
        setError('Only the host can start a new game');
        return;
      }

      const newGameState = initializeGame();
      newGameState.isOnlineGame = true;
      newGameState.gameId = gameSessionId;
      newGameState.hostId = gameSession.hostId;
      
      // Set up players with correct IDs
      newGameState.players[0] = {
        id: gameSession.hostId,
        name: gameSession.hostName,
        hand: newGameState.players[0].hand,
        nikoKadiCalled: false,
        isOnline: true
      };
      
      newGameState.players[1] = {
        id: gameSession.guestId,
        name: gameSession.guestName,
        hand: newGameState.players[1].hand,
        nikoKadiCalled: false,
        isOnline: true
      };

      await updateDoc(doc(db, 'gameSessions', gameSessionId), {
        gameState: newGameState,
        status: 'active',
        lastMoveAt: serverTimestamp(),
        winner: null
      });

      setSelectedCards([]);
      
    } catch (error: any) {
      console.error('Error starting new game:', error);
      setError('Failed to start new game');
    }
  }, [user, gameSession, gameSessionId]);

  const handleDrawPenalty = useCallback(() => {
    if (!isMyTurn) return;
    makeMove('drawPenalty');
  }, [isMyTurn]);

  const handleLeaveGame = useCallback(async () => {
    try {
      if (gameSession && user) {
        await updateDoc(doc(db, 'gameSessions', gameSessionId), {
          status: 'abandoned',
          lastMoveAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error leaving game:', error);
    }
    onBackToMenu();
  }, [gameSession, user, gameSessionId, onBackToMenu]);

  if (!gameState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {connectionStatus === 'connecting' ? 'Connecting to game...' : 'Loading game...'}
          </h2>
          <p className="text-purple-300">Please wait while we set up your online match</p>
          {error && (
            <div className="mt-4 bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-200">
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  const currentPlayer = getCurrentPlayer(gameState);
  const myPlayer = gameState.players.find(p => p.id === user?.uid);
  const opponent = gameState.players.find(p => p.id !== user?.uid);
  
  const canPlaySelected = canPlayerPlay(gameState, selectedCards);
  
  const playableCards = isMyTurn ? (myPlayer?.hand
    .filter(card => canPlayerPlay(gameState, [card.id]))
    .map(card => card.id) || []) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-48 h-48 sm:w-96 sm:h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 sm:w-96 sm:h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] sm:w-[800px] sm:h-[800px] bg-gradient-to-r from-purple-500/5 to-blue-500/5 rounded-full blur-3xl animate-spin" style={{ animationDuration: '25s' }}></div>
      </div>
      
      <div className="relative z-10 p-2 sm:p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Casino-style Header */}
          <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 bg-black/40 backdrop-blur-md rounded-xl sm:rounded-2xl border border-purple-500/30 p-3 sm:p-4 shadow-2xl">
            <button
              onClick={handleLeaveGame}
              className="flex items-center space-x-2 text-purple-400 hover:text-purple-300 transition-colors font-medium self-start"
            >
              <ArrowLeft size={16} className="sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-base">Leave Game</span>
            </button>
            
            <div className="text-center">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-blue-500 to-purple-600 flex items-center justify-center space-x-1 sm:space-x-2">
                <Users size={16} className="text-purple-400 sm:w-6 sm:h-6" />
                <span>ONLINE KADI</span>
                <Sparkles size={16} className="text-blue-400 sm:w-6 sm:h-6" />
              </h1>
              <div className="flex items-center justify-center space-x-2 text-xs sm:text-sm">
                <span className="text-purple-300 font-medium">vs {opponentName}</span>
                <div className="flex items-center space-x-1">
                  {connectionStatus === 'connected' ? (
                    <Wifi size={12} className="text-green-400 sm:w-4 sm:h-4" />
                  ) : (
                    <WifiOff size={12} className="text-red-400 sm:w-4 sm:h-4" />
                  )}
                  <span className={connectionStatus === 'connected' ? 'text-green-400' : 'text-red-400'}>
                    {connectionStatus}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 self-end sm:self-auto">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-white transition-all shadow-lg touch-manipulation"
              >
                {soundEnabled ? <Volume2 size={14} className="sm:w-4 sm:h-4" /> : <VolumeX size={14} className="sm:w-4 sm:h-4" />}
              </button>
              
              {gameSession?.hostId === user?.uid && (
                <button
                  onClick={handleNewGame}
                  className="px-2 py-2 sm:px-4 sm:py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-bold rounded-lg sm:rounded-xl transition-all text-xs sm:text-sm shadow-lg border border-purple-400/50 touch-manipulation"
                >
                  New Game
                </button>
              )}
            </div>
          </div>

          {/* Connection Status & Turn Indicator */}
          {(error || !opponentOnline || !isMyTurn) && (
            <div className="mb-4 sm:mb-6">
              {error && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-3 flex items-center space-x-2">
                  <AlertTriangle size={16} className="text-red-400" />
                  <span className="text-red-200 text-sm">{error}</span>
                </div>
              )}
              
              {!opponentOnline && (
                <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-3 mb-3 flex items-center space-x-2">
                  <Clock size={16} className="text-yellow-400" />
                  <span className="text-yellow-200 text-sm">Opponent appears to be offline</span>
                </div>
              )}
              
              {!isMyTurn && !error && (
                <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-3 flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <span className="text-blue-200 text-sm font-medium">Waiting for {opponentName}'s move...</span>
                </div>
              )}
            </div>
          )}
          
          {/* Responsive Casino Game Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
            {/* Opponent Hand - Top on mobile, Left on desktop */}
            <div className="lg:col-span-1 order-1 lg:order-1">
              <div className="bg-gradient-to-br from-slate-800/80 via-slate-900/80 to-slate-800/80 backdrop-blur-md rounded-xl sm:rounded-2xl border border-purple-500/30 shadow-2xl">
                {opponent && (
                  <PlayerHand
                    player={opponent}
                    isCurrentPlayer={gameState.currentPlayerIndex === gameState.players.findIndex(p => p.id === opponent.id)}
                    selectedCards={[]}
                    playableCards={[]}
                    onCardClick={() => {}}
                    isMyTurn={false}
                    hideCards={true}
                  />
                )}
              </div>
            </div>
            
            {/* Game Board and Controls - Center */}
            <div className="lg:col-span-1 order-2 lg:order-2 space-y-3 sm:space-y-4">
              <div className="bg-gradient-to-br from-emerald-800/80 via-emerald-900/80 to-emerald-800/80 backdrop-blur-md rounded-xl sm:rounded-2xl border border-emerald-500/30 shadow-2xl">
                <GameBoard
                  gameState={gameState}
                  onDrawCard={handleDrawCard}
                />
              </div>
              
              <div className="bg-gradient-to-br from-slate-800/80 via-slate-900/80 to-slate-800/80 backdrop-blur-md rounded-xl sm:rounded-2xl border border-blue-500/30 shadow-2xl">
                <GameControls
                  gameState={gameState}
                  selectedCards={selectedCards}
                  onPlayCards={handlePlayCards}
                  onDeclareNikoKadi={handleDeclareNikoKadi}
                  onDrawPenalty={handleDrawPenalty}
                  canPlaySelected={canPlaySelected && isMyTurn}
                />
              </div>
            </div>
            
            {/* My Hand - Bottom on mobile, Right on desktop */}
            <div className="lg:col-span-1 order-3 lg:order-3">
              <div className="bg-gradient-to-br from-slate-800/80 via-slate-900/80 to-slate-800/80 backdrop-blur-md rounded-xl sm:rounded-2xl border border-blue-500/30 shadow-2xl">
                {myPlayer && (
                  <PlayerHand
                    player={myPlayer}
                    isCurrentPlayer={gameState.currentPlayerIndex === gameState.players.findIndex(p => p.id === myPlayer.id)}
                    selectedCards={selectedCards}
                    playableCards={playableCards}
                    onCardClick={handleCardClick}
                    isMyTurn={isMyTurn}
                    hideCards={false}
                  />
                )}
              </div>
            </div>
          </div>
          
          {/* Game Status */}
          <div className="mt-4 sm:mt-6">
            <GameStatus gameState={gameState} onNewGame={handleNewGame} />
          </div>
        </div>
      </div>
        
      {/* Suit Selector Modal */}
      {gameState.gamePhase === 'selectingSuit' && isMyTurn && (
        <SuitSelector onSelectSuit={handleSelectSuit} />
      )}
    </div>
  );
};