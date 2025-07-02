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
import { ConnectionStatus } from '../common/ConnectionStatus';
import { GameErrorFallback } from '../common/ErrorBoundary';
import { ErrorHandler, AppError } from '../../utils/errorHandling';
import { ArrowLeft, Volume2, VolumeX, Users, Sparkles, AlertTriangle, RefreshCw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  doc, 
  onSnapshot, 
  updateDoc, 
  addDoc, 
  collection, 
  serverTimestamp,
  enableNetwork,
  runTransaction
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
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'reconnecting'>('connecting');
  const [opponentOnline, setOpponentOnline] = useState(true);
  const [gameSession, setGameSession] = useState<OnlineGameSession | null>(null);
  const [error, setError] = useState<AppError | null>(null);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [gameError, setGameError] = useState<Error | null>(null);
  
  // Use refs to track listeners and prevent multiple subscriptions
  const gameUnsubscribeRef = useRef<(() => void) | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastHeartbeatRef = useRef<Date>(new Date());
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    
    if (!user || !gameSessionId) {
      setError({
        code: 'invalid-session',
        message: 'Invalid game session',
        userMessage: 'Invalid game session. Please try starting a new game.',
        retryable: false,
        severity: 'high'
      });
      return;
    }

    setupGameListeners();

    return () => {
      mountedRef.current = false;
      cleanupListeners();
    };
  }, [user, gameSessionId]);

  useEffect(() => {
    if (gameState && user && mountedRef.current) {
      // Find which player index corresponds to the current user
      const myPlayerIndex = gameState.players.findIndex(p => p.id === user.uid);
      if (myPlayerIndex !== -1) {
        setIsMyTurn(gameState.currentPlayerIndex === myPlayerIndex);
      }
    }
  }, [gameState, user]);

  const cleanupListeners = () => {
    if (gameUnsubscribeRef.current) {
      gameUnsubscribeRef.current();
      gameUnsubscribeRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  };

  const setupGameListeners = async () => {
    if (!mountedRef.current) return;
    
    try {
      setConnectionStatus('connecting');
      setError(null);
      
      await ErrorHandler.withRetry(async () => {
        await enableNetwork(db);
      }, 'enable-network');

      const gameSessionRef = doc(db, 'gameSessions', gameSessionId);
      
      gameUnsubscribeRef.current = onSnapshot(gameSessionRef, (doc) => {
        if (!mountedRef.current) return;
        
        try {
          if (doc.exists()) {
            const session = { id: doc.id, ...doc.data() } as OnlineGameSession;
            setGameSession(session);
            
            if (session.gameState) {
              setGameState(session.gameState);
            }
            
            setConnectionStatus('connected');
            setError(null);
            lastHeartbeatRef.current = new Date();
            
            // Check opponent online status
            const now = new Date();
            const lastMove = session.lastMoveAt?.toDate?.() || session.lastMoveAt;
            if (lastMove && now.getTime() - lastMove.getTime() > 120000) { // 2 minutes
              setOpponentOnline(false);
            } else {
              setOpponentOnline(true);
            }
          } else {
            throw new Error('Game session not found');
          }
        } catch (err) {
          console.error('Error processing game session update:', err);
          if (mountedRef.current) {
            setGameError(err as Error);
          }
        }
      }, (error) => {
        if (!mountedRef.current) return;
        
        console.error('Error listening to game session:', error);
        const appError = ErrorHandler.handleFirebaseError(error, 'listening to game session');
        setError(appError);
        setConnectionStatus('disconnected');
        
        if (appError.retryable) {
          scheduleReconnect();
        }
      });

    } catch (error: any) {
      if (!mountedRef.current) return;
      
      console.error('Error setting up game listeners:', error);
      const appError = ErrorHandler.handleFirebaseError(error, 'setting up game listeners');
      setError(appError);
      setConnectionStatus('disconnected');
      
      if (appError.retryable) {
        scheduleReconnect();
      }
    }
  };

  const scheduleReconnect = () => {
    if (reconnectTimeoutRef.current || !mountedRef.current) return;
    
    setConnectionStatus('reconnecting');
    reconnectTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current) {
        reconnectTimeoutRef.current = null;
        setupGameListeners();
      }
    }, 5000);
  };

  const makeMove = async (moveType: string, data: any = {}) => {
    if (!user || !gameState || !gameSession || !mountedRef.current) {
      setError({
        code: 'invalid-state',
        message: 'Invalid game state',
        userMessage: 'Game is not ready. Please wait or refresh.',
        retryable: true,
        severity: 'medium'
      });
      return;
    }

    if (!isMyTurn) {
      setError({
        code: 'not-your-turn',
        message: 'Not your turn',
        userMessage: 'Please wait for your turn.',
        retryable: false,
        severity: 'low'
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await ErrorHandler.withRetry(async () => {
        // Use a transaction to ensure atomic updates
        await runTransaction(db, async (transaction) => {
          const gameSessionRef = doc(db, 'gameSessions', gameSessionId);
          const gameSessionDoc = await transaction.get(gameSessionRef);
          
          if (!gameSessionDoc.exists()) {
            throw new Error('Game session not found');
          }
          
          const currentSession = gameSessionDoc.data() as OnlineGameSession;
          let newGameState = { ...currentSession.gameState };
          
          // Apply the move locally
          try {
            switch (moveType) {
              case 'playCards':
                newGameState = playCards(newGameState, { 
                  cardIds: data.cardIds, 
                  declaredSuit: data.declaredSuit 
                });
                break;
              case 'drawCard':
                newGameState = drawCard(newGameState, newGameState.currentPlayerIndex);
                break;
              case 'declareNikoKadi':
                newGameState = declareNikoKadi(newGameState);
                break;
              case 'selectSuit':
                newGameState = selectSuit(newGameState, data.selectedSuit);
                break;
              case 'drawPenalty':
                newGameState = handlePenaltyDraw(newGameState);
                break;
              default:
                throw new Error(`Unknown move type: ${moveType}`);
            }
          } catch (gameLogicError) {
            throw new Error(`Invalid move: ${(gameLogicError as Error).message}`);
          }

          // Update the game session
          transaction.update(gameSessionRef, {
            gameState: newGameState,
            lastMoveAt: serverTimestamp(),
            status: newGameState.gamePhase === 'gameOver' ? 'completed' : 'active',
            winner: newGameState.winner || null
          });

          // Create the move record
          const move: Partial<GameMove> = {
            gameId: gameSessionId,
            playerId: user.uid,
            playerName: user.displayName || 'Player',
            moveType: moveType as any,
            timestamp: new Date(),
            gameStateAfter: newGameState,
            ...data
          };

          // Add the move to the moves collection
          const moveRef = doc(collection(db, 'gameMoves'));
          transaction.set(moveRef, move);
        });
      }, `making ${moveType} move`);

      setSelectedCards([]);
      
    } catch (error: any) {
      if (!mountedRef.current) return;
      
      console.error('Error making move:', error);
      if (error instanceof Error && error.message.includes('Invalid move')) {
        setError({
          code: 'invalid-move',
          message: error.message,
          userMessage: error.message,
          retryable: false,
          severity: 'low'
        });
      } else {
        const appError = ErrorHandler.handleFirebaseError(error, 'making move');
        setError(appError);
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  const handleCardClick = useCallback((cardId: string) => {
    if (!isMyTurn || gameState?.gamePhase !== 'playing' || isLoading) return;
    
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
  }, [isMyTurn, gameState?.gamePhase, isLoading]);

  const handlePlayCards = useCallback(() => {
    if (selectedCards.length === 0 || !isMyTurn || isLoading) return;
    makeMove('playCards', { cardIds: selectedCards });
  }, [selectedCards, isMyTurn, isLoading]);

  const handleDrawCard = useCallback(() => {
    if (!isMyTurn || isLoading) return;
    
    if (gameState?.drawStack && gameState.drawStack > 0) {
      makeMove('drawPenalty');
    } else {
      makeMove('drawCard');
    }
  }, [isMyTurn, gameState?.drawStack, isLoading]);

  const handleDeclareNikoKadi = useCallback(() => {
    if (!isMyTurn || isLoading) return;
    makeMove('declareNikoKadi');
  }, [isMyTurn, isLoading]);

  const handleSelectSuit = useCallback((suit: Suit) => {
    if (isLoading) return;
    makeMove('selectSuit', { selectedSuit: suit });
  }, [isLoading]);

  const handleNewGame = useCallback(async () => {
    if (!user || !gameSession || isLoading) return;
    
    if (gameSession.hostId !== user.uid) {
      setError({
        code: 'not-host',
        message: 'Only host can start new game',
        userMessage: 'Only the host can start a new game.',
        retryable: false,
        severity: 'low'
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await ErrorHandler.withRetry(async () => {
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
      }, 'starting new game');

      setSelectedCards([]);
      
    } catch (error: any) {
      if (!mountedRef.current) return;
      
      console.error('Error starting new game:', error);
      const appError = ErrorHandler.handleFirebaseError(error, 'starting new game');
      setError(appError);
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [user, gameSession, gameSessionId, isLoading]);

  const handleDrawPenalty = useCallback(() => {
    if (!isMyTurn || isLoading) return;
    makeMove('drawPenalty');
  }, [isMyTurn, isLoading]);

  const handleLeaveGame = useCallback(async () => {
    try {
      if (gameSession && user) {
        await ErrorHandler.withRetry(async () => {
          await updateDoc(doc(db, 'gameSessions', gameSessionId), {
            status: 'abandoned',
            lastMoveAt: serverTimestamp()
          });
        }, 'leaving game');
      }
    } catch (error) {
      console.error('Error leaving game:', error);
      // Don't show error for leaving game, just go back
    }
    onBackToMenu();
  }, [gameSession, user, gameSessionId, onBackToMenu]);

  const handleRetryConnection = useCallback(() => {
    setError(null);
    setConnectionStatus('connecting');
    setupGameListeners();
  }, []);

  const handleGameErrorRetry = useCallback(() => {
    setGameError(null);
    setError(null);
    handleRetryConnection();
  }, [handleRetryConnection]);

  // Show game error boundary if there's a critical game error
  if (gameError) {
    return (
      <GameErrorFallback 
        error={gameError} 
        retry={handleGameErrorRetry}
        onGoHome={onBackToMenu}
      />
    );
  }

  if (!gameState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {connectionStatus === 'connecting' ? 'Connecting to game...' : 
             connectionStatus === 'reconnecting' ? 'Reconnecting...' : 'Loading game...'}
          </h2>
          <p className="text-purple-300 mb-4">Please wait while we set up your online match</p>
          
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle size={16} className="text-red-400" />
                <span className="text-red-200 font-medium">Connection Error</span>
              </div>
              <p className="text-red-200 text-sm mb-3">{error.userMessage}</p>
              {error.retryable && (
                <button
                  onClick={handleRetryConnection}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors mx-auto"
                >
                  <RefreshCw size={16} />
                  <span>Retry</span>
                </button>
              )}
            </div>
          )}
          
          <button
            onClick={onBackToMenu}
            className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

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
              <div className="flex items-center justify-center space-x-4 text-xs sm:text-sm">
                <span className="text-purple-300 font-medium">vs {opponentName}</span>
                <ConnectionStatus 
                  isConnected={connectionStatus === 'connected'}
                  isReconnecting={connectionStatus === 'reconnecting'}
                  lastError={error?.userMessage}
                  onRetry={handleRetryConnection}
                />
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
                  disabled={isLoading}
                  className="px-2 py-2 sm:px-4 sm:py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-bold rounded-lg sm:rounded-xl transition-all text-xs sm:text-sm shadow-lg border border-purple-400/50 touch-manipulation disabled:opacity-50"
                >
                  {isLoading ? 'Starting...' : 'New Game'}
                </button>
              )}
            </div>
          </div>

          {/* Status Messages */}
          <div className="mb-4 sm:mb-6 space-y-2">
            {error && error.severity !== 'low' && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertTriangle size={16} className="text-red-400" />
                  <span className="text-red-200 text-sm">{error.userMessage}</span>
                </div>
                {error.retryable && (
                  <button
                    onClick={handleRetryConnection}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs transition-colors"
                  >
                    Retry
                  </button>
                )}
              </div>
            )}
            
            {!opponentOnline && connectionStatus === 'connected' && (
              <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-3 flex items-center space-x-2">
                <AlertTriangle size={16} className="text-yellow-400" />
                <span className="text-yellow-200 text-sm">
                  {opponentName} appears to be offline. The game will continue when they reconnect.
                </span>
              </div>
            )}
            
            {!isMyTurn && !error && connectionStatus === 'connected' && (
              <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-3 flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span className="text-blue-200 text-sm font-medium">
                  Waiting for {opponentName}'s move...
                </span>
              </div>
            )}

            {isLoading && (
              <div className="bg-purple-500/20 border border-purple-500/50 rounded-lg p-3 flex items-center justify-center space-x-2">
                <RefreshCw size={16} className="text-purple-400 animate-spin" />
                <span className="text-purple-200 text-sm font-medium">Processing move...</span>
              </div>
            )}
          </div>
          
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
                  canPlaySelected={canPlaySelected && isMyTurn && !isLoading}
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
                    isMyTurn={isMyTurn && !isLoading}
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
      {gameState.gamePhase === 'selectingSuit' && isMyTurn && !isLoading && (
        <SuitSelector onSelectSuit={handleSelectSuit} />
      )}
    </div>
  );
};