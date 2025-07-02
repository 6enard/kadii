import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Search, UserPlus, Users, MessageCircle, RefreshCw, UserMinus, Check, Clock, Gamepad2, Trophy, Star, Crown, Zap } from 'lucide-react';
import { 
  collection, 
  query, 
  getDocs, 
  doc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove,
  getDoc, 
  enableNetwork,
  addDoc,
  where,
  onSnapshot,
  deleteDoc,
  serverTimestamp,
  runTransaction
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { UserData, FriendRequest, GameChallenge, OnlineGameSession } from '../../types';
import { initializeGame } from '../../utils/gameLogic';
import { ErrorHandler, AppError } from '../../utils/errorHandling';
import { ConnectionStatus } from '../common/ConnectionStatus';

interface FriendsAndGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartOnlineGame?: (gameSessionId: string, opponentId: string, opponentName: string) => void;
}

export const FriendsAndGameModal: React.FC<FriendsAndGameModalProps> = ({ 
  isOpen, 
  onClose, 
  onStartOnlineGame 
}) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [allUsers, setAllUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [friends, setFriends] = useState<UserData[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [challenges, setChallenges] = useState<GameChallenge[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'friends' | 'browse' | 'requests' | 'challenges'>('friends');
  const [error, setError] = useState<AppError | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('connected');
  const [challengingUsers, setChallenging] = useState<Set<string>>(new Set());

  // Use refs to track active listeners and prevent multiple subscriptions
  const challengesUnsubscribeRef = useRef<(() => void) | null>(null);
  const friendRequestsUnsubscribeRef = useRef<(() => void) | null>(null);
  const sentRequestsUnsubscribeRef = useRef<(() => void) | null>(null);
  const mountedRef = useRef(true);

  // Memoize queries to prevent duplicate listeners
  const challengesQuery = useMemo(() => {
    if (!user?.uid) return null;
    return query(
      collection(db, 'challenges'),
      where('toUserId', '==', user.uid),
      where('status', '==', 'pending')
    );
  }, [user?.uid]);

  const incomingRequestsQuery = useMemo(() => {
    if (!user?.uid) return null;
    return query(
      collection(db, 'friendRequests'),
      where('toUserId', '==', user.uid),
      where('status', '==', 'pending')
    );
  }, [user?.uid]);

  const sentRequestsQuery = useMemo(() => {
    if (!user?.uid) return null;
    return query(
      collection(db, 'friendRequests'),
      where('fromUserId', '==', user.uid),
      where('status', '==', 'pending')
    );
  }, [user?.uid]);

  useEffect(() => {
    mountedRef.current = true;
    
    if (isOpen && user) {
      loadAllUsers();
      loadFriends();
      setupRealtimeListeners();
    } else {
      cleanupListeners();
    }

    return () => {
      cleanupListeners();
    };
  }, [isOpen, user]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      cleanupListeners();
    };
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = allUsers.filter(userData => 
        userData.username.toLowerCase().includes(searchQuery.toLowerCase().trim()) &&
        userData.id !== user?.uid
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(allUsers.filter(userData => userData.id !== user?.uid));
    }
  }, [searchQuery, allUsers, user]);

  const cleanupListeners = () => {
    if (challengesUnsubscribeRef.current) {
      challengesUnsubscribeRef.current();
      challengesUnsubscribeRef.current = null;
    }
    if (friendRequestsUnsubscribeRef.current) {
      friendRequestsUnsubscribeRef.current();
      friendRequestsUnsubscribeRef.current = null;
    }
    if (sentRequestsUnsubscribeRef.current) {
      sentRequestsUnsubscribeRef.current();
      sentRequestsUnsubscribeRef.current = null;
    }
  };

  const setupRealtimeListeners = () => {
    if (!user?.uid || !challengesQuery || !incomingRequestsQuery || !sentRequestsQuery || !mountedRef.current) return;

    try {
      setConnectionStatus('connected');
      setError(null);

      // Set up challenges listener
      challengesUnsubscribeRef.current = onSnapshot(challengesQuery, (snapshot) => {
        if (!mountedRef.current) return;
        
        const incoming: GameChallenge[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          incoming.push({ 
            id: doc.id, 
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            expiresAt: data.expiresAt?.toDate() || new Date()
          } as GameChallenge);
        });
        setChallenges(incoming);
        setConnectionStatus('connected');
      }, (error) => {
        if (!mountedRef.current) return;
        console.error('Error in challenges listener:', error);
        const appError = ErrorHandler.handleFirebaseError(error, 'loading challenges');
        setError(appError);
        setConnectionStatus('disconnected');
        if (challengesUnsubscribeRef.current) {
          challengesUnsubscribeRef.current();
          challengesUnsubscribeRef.current = null;
        }
      });

      // Set up friend requests listener
      friendRequestsUnsubscribeRef.current = onSnapshot(incomingRequestsQuery, (snapshot) => {
        if (!mountedRef.current) return;
        
        const incoming: FriendRequest[] = [];
        snapshot.forEach((doc) => {
          incoming.push({ id: doc.id, ...doc.data() } as FriendRequest);
        });
        setFriendRequests(incoming);
        setConnectionStatus('connected');
      }, (error) => {
        if (!mountedRef.current) return;
        console.error('Error in friend requests listener:', error);
        const appError = ErrorHandler.handleFirebaseError(error, 'loading friend requests');
        setError(appError);
        setConnectionStatus('disconnected');
        if (friendRequestsUnsubscribeRef.current) {
          friendRequestsUnsubscribeRef.current();
          friendRequestsUnsubscribeRef.current = null;
        }
      });

      // Set up sent requests listener
      sentRequestsUnsubscribeRef.current = onSnapshot(sentRequestsQuery, (snapshot) => {
        if (!mountedRef.current) return;
        
        const sent: FriendRequest[] = [];
        snapshot.forEach((doc) => {
          sent.push({ id: doc.id, ...doc.data() } as FriendRequest);
        });
        sent.sort((a, b) => {
          const aTime = a.createdAt?.toDate?.() || new Date(0);
          const bTime = b.createdAt?.toDate?.() || new Date(0);
          return bTime.getTime() - aTime.getTime();
        });
        setSentRequests(sent);
        setConnectionStatus('connected');
      }, (error) => {
        if (!mountedRef.current) return;
        console.error('Error in sent requests listener:', error);
        const appError = ErrorHandler.handleFirebaseError(error, 'loading sent requests');
        setError(appError);
        setConnectionStatus('disconnected');
        if (sentRequestsUnsubscribeRef.current) {
          sentRequestsUnsubscribeRef.current();
          sentRequestsUnsubscribeRef.current = null;
        }
      });

    } catch (error: any) {
      if (!mountedRef.current) return;
      console.error('Error setting up listeners:', error);
      const appError = ErrorHandler.handleFirebaseError(error, 'setting up real-time listeners');
      setError(appError);
      setConnectionStatus('disconnected');
      cleanupListeners();
    }
  };

  const loadAllUsers = async () => {
    if (!user || !mountedRef.current) return;

    setLoading(true);
    setError(null);
    
    try {
      await ErrorHandler.withRetry(async () => {
        await enableNetwork(db);
        
        const usersRef = collection(db, 'users');
        const allUsersSnapshot = await getDocs(usersRef);
        const users: UserData[] = [];
        
        allUsersSnapshot.forEach((doc) => {
          const userData = doc.data() as UserData;
          if (userData.username) {
            users.push({
              id: doc.id,
              ...userData
            });
          }
        });
        
        users.sort((a, b) => a.username.toLowerCase().localeCompare(b.username.toLowerCase()));
        
        if (mountedRef.current) {
          setAllUsers(users);
          setFilteredUsers(users.filter(userData => userData.id !== user.uid));
          setConnectionStatus('connected');
        }
      }, 'loading users');
    } catch (error: any) {
      if (!mountedRef.current) return;
      const appError = ErrorHandler.handleFirebaseError(error, 'loading users');
      setError(appError);
      setConnectionStatus('disconnected');
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  const loadFriends = async () => {
    if (!user || !mountedRef.current) return;

    try {
      await ErrorHandler.withRetry(async () => {
        await enableNetwork(db);
        
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data();
        
        if (userData?.friends?.length > 0) {
          const friendsData: UserData[] = [];
          for (const friendId of userData.friends) {
            const friendDoc = await getDoc(doc(db, 'users', friendId));
            if (friendDoc.exists()) {
              friendsData.push({
                id: friendDoc.id,
                ...friendDoc.data()
              } as UserData);
            }
          }
          friendsData.sort((a, b) => a.username.toLowerCase().localeCompare(b.username.toLowerCase()));
          if (mountedRef.current) {
            setFriends(friendsData);
          }
        } else {
          if (mountedRef.current) {
            setFriends([]);
          }
        }
        if (mountedRef.current) {
          setConnectionStatus('connected');
        }
      }, 'loading friends');
    } catch (error: any) {
      if (!mountedRef.current) return;
      const appError = ErrorHandler.handleFirebaseError(error, 'loading friends');
      setError(appError);
      setConnectionStatus('disconnected');
    }
  };

  const sendFriendRequest = async (toUserId: string, toUsername: string) => {
    if (!user || !mountedRef.current) return;

    try {
      setError(null);
      
      await ErrorHandler.withRetry(async () => {
        await enableNetwork(db);
        
        const existingQuery = query(
          collection(db, 'friendRequests'),
          where('fromUserId', '==', user.uid),
          where('toUserId', '==', toUserId),
          where('status', '==', 'pending')
        );
        
        const existingSnapshot = await getDocs(existingQuery);
        if (!existingSnapshot.empty) {
          throw new Error('Friend request already sent to this user.');
        }
        
        await addDoc(collection(db, 'friendRequests'), {
          fromUserId: user.uid,
          fromUsername: user.displayName || 'Unknown',
          toUserId,
          toUsername,
          status: 'pending',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }, 'sending friend request');
      
      if (mountedRef.current) {
        setConnectionStatus('connected');
      }
    } catch (error: any) {
      if (!mountedRef.current) return;
      if (error.message?.includes('already sent')) {
        setError({
          code: 'duplicate-request',
          message: error.message,
          userMessage: error.message,
          retryable: false,
          severity: 'low'
        });
      } else {
        const appError = ErrorHandler.handleFirebaseError(error, 'sending friend request');
        setError(appError);
        setConnectionStatus('disconnected');
      }
    }
  };

  const respondToFriendRequest = async (requestId: string, response: 'accepted' | 'rejected', request: FriendRequest) => {
    if (!user || !mountedRef.current) return;

    try {
      setError(null);
      
      await ErrorHandler.withRetry(async () => {
        await runTransaction(db, async (transaction) => {
          const requestRef = doc(db, 'friendRequests', requestId);
          
          transaction.update(requestRef, {
            status: response,
            updatedAt: serverTimestamp()
          });
          
          if (response === 'accepted') {
            const userRef = doc(db, 'users', user.uid);
            const friendRef = doc(db, 'users', request.fromUserId);
            
            transaction.update(userRef, {
              friends: arrayUnion(request.fromUserId)
            });
            
            transaction.update(friendRef, {
              friends: arrayUnion(user.uid)
            });
          }
        });
        
        if (response === 'accepted') {
          await loadFriends();
        }
      }, `${response === 'accepted' ? 'accepting' : 'rejecting'} friend request`);
      
      if (mountedRef.current) {
        setConnectionStatus('connected');
      }
    } catch (error: any) {
      if (!mountedRef.current) return;
      const appError = ErrorHandler.handleFirebaseError(error, 'responding to friend request');
      setError(appError);
      setConnectionStatus('disconnected');
    }
  };

  const removeFriend = async (friendId: string) => {
    if (!user || !mountedRef.current) return;

    try {
      setError(null);
      
      await ErrorHandler.withRetry(async () => {
        await runTransaction(db, async (transaction) => {
          const userRef = doc(db, 'users', user.uid);
          const friendRef = doc(db, 'users', friendId);
          
          transaction.update(userRef, {
            friends: arrayRemove(friendId)
          });
          
          transaction.update(friendRef, {
            friends: arrayRemove(user.uid)
          });
        });
        
        await loadFriends();
      }, 'removing friend');
      
      if (mountedRef.current) {
        setConnectionStatus('connected');
      }
    } catch (error: any) {
      if (!mountedRef.current) return;
      const appError = ErrorHandler.handleFirebaseError(error, 'removing friend');
      setError(appError);
      setConnectionStatus('disconnected');
    }
  };

  const sendChallenge = async (toUserId: string, toUsername: string) => {
    if (!user || challengingUsers.has(toUserId) || !mountedRef.current) return;

    setChallenging(prev => new Set(prev).add(toUserId));

    try {
      setError(null);
      
      await ErrorHandler.withRetry(async () => {
        await enableNetwork(db);
        
        const existingQuery = query(
          collection(db, 'challenges'),
          where('fromUserId', '==', user.uid),
          where('toUserId', '==', toUserId),
          where('status', '==', 'pending')
        );
        
        const existingSnapshot = await getDocs(existingQuery);
        if (!existingSnapshot.empty) {
          throw new Error('Challenge already sent to this user.');
        }
        
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 5);
        
        await addDoc(collection(db, 'challenges'), {
          fromUserId: user.uid,
          fromUsername: user.displayName || 'Unknown',
          toUserId,
          toUsername,
          status: 'pending',
          gameType: 'multiplayer',
          createdAt: serverTimestamp(),
          expiresAt: expiresAt
        });
      }, 'sending challenge');
      
      if (mountedRef.current) {
        setConnectionStatus('connected');
      }
      
    } catch (error: any) {
      if (!mountedRef.current) return;
      if (error.message?.includes('already sent')) {
        setError({
          code: 'duplicate-challenge',
          message: error.message,
          userMessage: error.message,
          retryable: false,
          severity: 'low'
        });
      } else {
        const appError = ErrorHandler.handleFirebaseError(error, 'sending challenge');
        setError(appError);
        setConnectionStatus('disconnected');
      }
    } finally {
      if (mountedRef.current) {
        setChallenging(prev => {
          const newSet = new Set(prev);
          newSet.delete(toUserId);
          return newSet;
        });
      }
    }
  };

  const respondToChallenge = async (challengeId: string, response: 'accepted' | 'rejected', challenge: GameChallenge) => {
    if (!user || !mountedRef.current) return;

    try {
      setError(null);
      
      await ErrorHandler.withRetry(async () => {
        await runTransaction(db, async (transaction) => {
          const challengeRef = doc(db, 'challenges', challengeId);
          
          transaction.update(challengeRef, {
            status: response,
            updatedAt: serverTimestamp()
          });
          
          if (response === 'accepted' && onStartOnlineGame) {
            const gameState = initializeGame();
            gameState.isOnlineGame = true;
            gameState.hostId = challenge.fromUserId;
            
            gameState.players[0] = {
              id: challenge.fromUserId,
              name: challenge.fromUsername,
              hand: gameState.players[0].hand,
              nikoKadiCalled: false,
              isOnline: true
            };
            
            gameState.players[1] = {
              id: user.uid,
              name: user.displayName || 'Player',
              hand: gameState.players[1].hand,
              nikoKadiCalled: false,
              isOnline: true
            };

            const gameSession: Partial<OnlineGameSession> = {
              hostId: challenge.fromUserId,
              hostName: challenge.fromUsername,
              guestId: user.uid,
              guestName: user.displayName || 'Player',
              gameState: gameState,
              status: 'active',
              createdAt: new Date(),
              lastMoveAt: new Date()
            };

            const gameSessionRef = doc(collection(db, 'gameSessions'));
            transaction.set(gameSessionRef, gameSession);
            
            (window as any).pendingGameSessionId = gameSessionRef.id;
          }
        });
        
        if (response === 'accepted' && onStartOnlineGame) {
          const gameSessionId = (window as any).pendingGameSessionId;
          if (gameSessionId) {
            onStartOnlineGame(gameSessionId, challenge.fromUserId, challenge.fromUsername);
            onClose();
          }
        }
      }, `${response === 'accepted' ? 'accepting' : 'rejecting'} challenge`);
      
      if (mountedRef.current) {
        setConnectionStatus('connected');
      }
    } catch (error: any) {
      if (!mountedRef.current) return;
      const appError = ErrorHandler.handleFirebaseError(error, 'responding to challenge');
      setError(appError);
      setConnectionStatus('disconnected');
    }
  };

  const isFriend = (userId: string) => {
    return friends.some(friend => friend.id === userId);
  };

  const hasPendingRequest = (userId: string) => {
    return sentRequests.some(request => request.toUserId === userId);
  };

  const handleRefresh = async () => {
    setError(null);
    setConnectionStatus('connected');
    
    try {
      await ErrorHandler.withRetry(async () => {
        await enableNetwork(db);
        await loadAllUsers();
        await loadFriends();
      }, 'refreshing data');
    } catch (error: any) {
      if (!mountedRef.current) return;
      const appError = ErrorHandler.handleFirebaseError(error, 'refreshing data');
      setError(appError);
      setConnectionStatus('disconnected');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden border border-purple-500/30">
        <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-600 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2 flex items-center space-x-2">
                <Users size={24} />
                <span>Friends & Online Games</span>
              </h2>
              <p className="text-purple-100">Connect and challenge your friends to epic Kadi battles</p>
              <div className="mt-2">
                <ConnectionStatus 
                  isConnected={connectionStatus === 'connected'}
                  isReconnecting={connectionStatus === 'reconnecting'}
                  lastError={error?.userMessage}
                  onRetry={handleRefresh}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Tabs */}
          <div className="flex space-x-1 bg-slate-800 rounded-lg p-1 mb-6">
            <button
              onClick={() => setActiveTab('friends')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors flex items-center justify-center space-x-2 ${
                activeTab === 'friends'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <Users size={16} />
              <span>Friends ({friends.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('browse')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors flex items-center justify-center space-x-2 ${
                activeTab === 'browse'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <Search size={16} />
              <span>Find Players ({filteredUsers.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors flex items-center justify-center space-x-2 ${
                activeTab === 'requests'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <Clock size={16} />
              <span>Requests ({friendRequests.length + sentRequests.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('challenges')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors flex items-center justify-center space-x-2 ${
                activeTab === 'challenges'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <Gamepad2 size={16} />
              <span>Challenges ({challenges.length})</span>
            </button>
          </div>

          {/* Error Message */}
          {error && error.severity !== 'low' && (
            <div className="border rounded-lg px-4 py-3 text-sm mb-4 bg-red-500/20 border-red-500/50">
              <div className="flex items-center justify-between">
                <span className="text-red-200">{error.userMessage}</span>
                {error.retryable && (
                  <button
                    onClick={handleRefresh}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs transition-colors"
                  >
                    Retry
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Friends Tab */}
          {activeTab === 'friends' && (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {friends.map((friend) => (
                <div key={friend.id} className="flex items-center justify-between p-4 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg transition-colors border border-slate-700/50">
                  <div className="flex items-center space-x-3">
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-2 rounded-full">
                      <Crown className="text-white" size={16} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">{friend.username}</h4>
                      <div className="flex items-center space-x-3 text-sm">
                        <div className="flex items-center space-x-1 text-yellow-400">
                          <Trophy size={12} />
                          <span>{friend.gamesWon || 0} wins</span>
                        </div>
                        <div className="flex items-center space-x-1 text-blue-400">
                          <Gamepad2 size={12} />
                          <span>{friend.gamesPlayed || 0} games</span>
                        </div>
                      </div>
                      {friend.isOnline && (
                        <div className="flex items-center space-x-1 text-green-400 mt-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-xs">Online</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => sendChallenge(friend.id, friend.username)}
                      disabled={connectionStatus !== 'connected' || challengingUsers.has(friend.id)}
                      className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Gamepad2 size={16} />
                      <span>{challengingUsers.has(friend.id) ? 'Sending...' : 'Challenge'}</span>
                    </button>
                    <button
                      onClick={() => removeFriend(friend.id)}
                      disabled={connectionStatus !== 'connected'}
                      className="flex items-center space-x-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <UserMinus size={16} />
                    </button>
                  </div>
                </div>
              ))}
              {friends.length === 0 && connectionStatus === 'connected' && (
                <div className="text-center py-12 text-gray-400">
                  <Users size={48} className="mx-auto mb-4 text-gray-600" />
                  <p className="text-lg mb-2">No friends yet</p>
                  <p className="text-sm">Find players and send friend requests to start playing together!</p>
                </div>
              )}
            </div>
          )}

          {/* Browse Users Tab */}
          {activeTab === 'browse' && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search players by username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400"
                />
              </div>

              {loading && (
                <div className="text-center py-8">
                  <RefreshCw className="animate-spin mx-auto mb-4 text-purple-500" size={32} />
                  <p className="text-gray-400">Loading players...</p>
                </div>
              )}

              {!loading && (
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {filteredUsers.map((userData) => (
                    <div key={userData.id} className="flex items-center justify-between p-4 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg transition-colors border border-slate-700/50">
                      <div className="flex items-center space-x-3">
                        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-full">
                          <Star className="text-white" size={16} />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="font-semibold text-white">{userData.username}</h4>
                            {userData.isOnline && (
                              <div className="flex items-center space-x-1">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-xs text-green-400">Online</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-3 text-sm">
                            <div className="flex items-center space-x-1 text-yellow-400">
                              <Trophy size={12} />
                              <span>{userData.gamesWon || 0} wins</span>
                            </div>
                            <div className="flex items-center space-x-1 text-blue-400">
                              <Gamepad2 size={12} />
                              <span>{userData.gamesPlayed || 0} games</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {!isFriend(userData.id) && !hasPendingRequest(userData.id) && (
                          <button
                            onClick={() => sendFriendRequest(userData.id, userData.username)}
                            disabled={connectionStatus !== 'connected'}
                            className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <UserPlus size={16} />
                            <span>Add Friend</span>
                          </button>
                        )}
                        {hasPendingRequest(userData.id) && (
                          <div className="flex items-center space-x-2 text-gray-400 font-medium">
                            <Clock size={16} />
                            <span>Request Sent</span>
                          </div>
                        )}
                        {isFriend(userData.id) && (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => sendChallenge(userData.id, userData.username)}
                              disabled={connectionStatus !== 'connected' || challengingUsers.has(userData.id)}
                              className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                            >
                              <Gamepad2 size={14} />
                              <span className="text-sm">{challengingUsers.has(userData.id) ? 'Sending...' : 'Challenge'}</span>
                            </button>
                            <div className="flex items-center space-x-2 text-green-400 font-medium">
                              <MessageCircle size={16} />
                              <span>Friends</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {filteredUsers.length === 0 && searchQuery && (
                    <div className="text-center py-8 text-gray-400">
                      <Search size={48} className="mx-auto mb-4 text-gray-600" />
                      <p>No players found matching "{searchQuery}"</p>
                      <p className="text-sm mt-2">Try a different search term</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Friend Requests Tab */}
          {activeTab === 'requests' && (
            <div className="space-y-4">
              {friendRequests.length > 0 && (
                <div>
                  <h4 className="font-semibold text-white mb-3">Incoming Requests</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {friendRequests.map((request) => (
                      <div key={request.id} className="flex items-center justify-between p-4 bg-blue-500/20 rounded-lg border border-blue-500/30">
                        <div className="flex items-center space-x-3">
                          <div className="bg-blue-500 p-2 rounded-full">
                            <UserPlus className="text-white" size={16} />
                          </div>
                          <div>
                            <h4 className="font-semibold text-white">{request.fromUsername}</h4>
                            <p className="text-sm text-blue-200">wants to be your friend</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => respondToFriendRequest(request.id, 'accepted', request)}
                            disabled={connectionStatus !== 'connected'}
                            className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                          >
                            <Check size={16} />
                            <span>Accept</span>
                          </button>
                          <button
                            onClick={() => respondToFriendRequest(request.id, 'rejected', request)}
                            disabled={connectionStatus !== 'connected'}
                            className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                          >
                            <X size={16} />
                            <span>Decline</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {sentRequests.length > 0 && (
                <div>
                  <h4 className="font-semibold text-white mb-3">Sent Requests</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {sentRequests.map((request) => (
                      <div key={request.id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                        <div className="flex items-center space-x-3">
                          <div className="bg-gray-500 p-2 rounded-full">
                            <Clock className="text-white" size={16} />
                          </div>
                          <div>
                            <h4 className="font-semibold text-white">{request.toUsername}</h4>
                            <p className="text-sm text-gray-400">Friend request pending</p>
                          </div>
                        </div>
                        <span className="text-sm text-gray-500">Waiting for response...</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {friendRequests.length === 0 && sentRequests.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <Clock size={48} className="mx-auto mb-4 text-gray-600" />
                  <p className="text-lg mb-2">No pending friend requests</p>
                  <p className="text-sm">Send requests to other players to connect!</p>
                </div>
              )}
            </div>
          )}

          {/* Challenges Tab */}
          {activeTab === 'challenges' && (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {challenges.map((challenge) => (
                <div key={challenge.id} className="flex items-center justify-between p-4 bg-orange-500/20 rounded-lg border border-orange-500/30">
                  <div className="flex items-center space-x-3">
                    <div className="bg-orange-500 p-2 rounded-full animate-pulse">
                      <Gamepad2 className="text-white" size={16} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">{challenge.fromUsername}</h4>
                      <p className="text-sm text-orange-200">challenged you to an online game</p>
                      <p className="text-xs text-orange-300">
                        Expires: {challenge.expiresAt?.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => respondToChallenge(challenge.id, 'accepted', challenge)}
                      disabled={connectionStatus !== 'connected'}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 animate-pulse"
                    >
                      <Check size={16} />
                      <span>Accept & Play</span>
                    </button>
                    <button
                      onClick={() => respondToChallenge(challenge.id, 'rejected', challenge)}
                      disabled={connectionStatus !== 'connected'}
                      className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      <X size={16} />
                      <span>Decline</span>
                    </button>
                  </div>
                </div>
              ))}
              {challenges.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <Gamepad2 size={48} className="mx-auto mb-4 text-gray-600" />
                  <p className="text-lg mb-2">No pending challenges</p>
                  <p className="text-sm">Challenge your friends to start playing online!</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};