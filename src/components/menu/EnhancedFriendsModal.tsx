import React, { useState, useEffect, useRef } from 'react';
import { X, Search, UserPlus, Users, MessageCircle, RefreshCw, Wifi, WifiOff, UserMinus, Check, Clock, Gamepad2, Trash2, AlertTriangle } from 'lucide-react';
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
  disableNetwork,
  addDoc,
  where,
  orderBy,
  onSnapshot,
  deleteDoc,
  serverTimestamp,
  setDoc
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { UserData, FriendRequest, GameChallenge, OnlineGameSession } from '../../types';
import { initializeGame } from '../../utils/gameLogic';
import { ErrorHandler, AppError } from '../../utils/errorHandling';
import { ConnectionStatus } from '../common/ConnectionStatus';

interface EnhancedFriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartOnlineGame?: (gameSessionId: string, opponentId: string, opponentName: string) => void;
}

export const EnhancedFriendsModal: React.FC<EnhancedFriendsModalProps> = ({ 
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
  const [activeTab, setActiveTab] = useState<'browse' | 'friends' | 'requests' | 'challenges' | 'admin'>('admin');
  const [error, setError] = useState<AppError | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('connected');
  const [challengingUsers, setChallenging] = useState<Set<string>>(new Set());
  const [clearingData, setClearingData] = useState(false);

  // Use refs to track active listeners and prevent multiple subscriptions
  const challengesUnsubscribeRef = useRef<(() => void) | null>(null);
  const friendRequestsUnsubscribeRef = useRef<(() => void) | null>(null);
  const sentRequestsUnsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
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
    if (!user?.uid) return;

    cleanupListeners();

    try {
      setConnectionStatus('connected');
      setError(null);

      // Set up challenges listener
      const challengesQuery = query(
        collection(db, 'challenges'),
        where('toUserId', '==', user.uid),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );

      challengesUnsubscribeRef.current = onSnapshot(challengesQuery, (snapshot) => {
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
        console.error('Error in challenges listener:', error);
        const appError = ErrorHandler.handleFirebaseError(error, 'loading challenges');
        setError(appError);
        setConnectionStatus('disconnected');
      });

      // Set up friend requests listener
      const incomingRequestsQuery = query(
        collection(db, 'friendRequests'),
        where('toUserId', '==', user.uid),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );

      friendRequestsUnsubscribeRef.current = onSnapshot(incomingRequestsQuery, (snapshot) => {
        const incoming: FriendRequest[] = [];
        snapshot.forEach((doc) => {
          incoming.push({ id: doc.id, ...doc.data() } as FriendRequest);
        });
        setFriendRequests(incoming);
        setConnectionStatus('connected');
      }, (error) => {
        console.error('Error in friend requests listener:', error);
        const appError = ErrorHandler.handleFirebaseError(error, 'loading friend requests');
        setError(appError);
        setConnectionStatus('disconnected');
      });

      // Set up sent requests listener
      const sentRequestsQuery = query(
        collection(db, 'friendRequests'),
        where('fromUserId', '==', user.uid),
        where('status', '==', 'pending')
      );

      sentRequestsUnsubscribeRef.current = onSnapshot(sentRequestsQuery, (snapshot) => {
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
        console.error('Error in sent requests listener:', error);
        const appError = ErrorHandler.handleFirebaseError(error, 'loading sent requests');
        setError(appError);
        setConnectionStatus('disconnected');
      });

    } catch (error: any) {
      console.error('Error setting up listeners:', error);
      const appError = ErrorHandler.handleFirebaseError(error, 'setting up real-time listeners');
      setError(appError);
      setConnectionStatus('disconnected');
    }
  };

  const loadAllUsers = async () => {
    if (!user) return;

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
        
        setAllUsers(users);
        setFilteredUsers(users.filter(userData => userData.id !== user.uid));
        setConnectionStatus('connected');
      }, 'loading users');
    } catch (error: any) {
      const appError = ErrorHandler.handleFirebaseError(error, 'loading users');
      setError(appError);
      setConnectionStatus('disconnected');
    } finally {
      setLoading(false);
    }
  };

  const loadFriends = async () => {
    if (!user) return;

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
          setFriends(friendsData);
        } else {
          setFriends([]);
        }
        setConnectionStatus('connected');
      }, 'loading friends');
    } catch (error: any) {
      const appError = ErrorHandler.handleFirebaseError(error, 'loading friends');
      setError(appError);
      setConnectionStatus('disconnected');
    }
  };

  const sendFriendRequest = async (toUserId: string, toUsername: string) => {
    if (!user) return;

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
      
      setConnectionStatus('connected');
    } catch (error: any) {
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
    if (!user) return;

    try {
      setError(null);
      
      await ErrorHandler.withRetry(async () => {
        await enableNetwork(db);
        
        await updateDoc(doc(db, 'friendRequests', requestId), {
          status: response,
          updatedAt: serverTimestamp()
        });
        
        if (response === 'accepted') {
          await updateDoc(doc(db, 'users', user.uid), {
            friends: arrayUnion(request.fromUserId)
          });
          
          await updateDoc(doc(db, 'users', request.fromUserId), {
            friends: arrayUnion(user.uid)
          });
          
          await loadFriends();
        }
      }, `${response === 'accepted' ? 'accepting' : 'rejecting'} friend request`);
      
      setConnectionStatus('connected');
    } catch (error: any) {
      const appError = ErrorHandler.handleFirebaseError(error, 'responding to friend request');
      setError(appError);
      setConnectionStatus('disconnected');
    }
  };

  const removeFriend = async (friendId: string) => {
    if (!user) return;

    try {
      setError(null);
      
      await ErrorHandler.withRetry(async () => {
        await enableNetwork(db);
        
        await updateDoc(doc(db, 'users', user.uid), {
          friends: arrayRemove(friendId)
        });
        
        await updateDoc(doc(db, 'users', friendId), {
          friends: arrayRemove(user.uid)
        });
        
        await loadFriends();
      }, 'removing friend');
      
      setConnectionStatus('connected');
    } catch (error: any) {
      const appError = ErrorHandler.handleFirebaseError(error, 'removing friend');
      setError(appError);
      setConnectionStatus('disconnected');
    }
  };

  const sendChallenge = async (toUserId: string, toUsername: string) => {
    if (!user || challengingUsers.has(toUserId)) return;

    setChallenging(prev => new Set(prev).add(toUserId));

    try {
      setError(null);
      
      await ErrorHandler.withRetry(async () => {
        await enableNetwork(db);
        
        // Check if challenge already exists
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
      
      setConnectionStatus('connected');
      
    } catch (error: any) {
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
      setChallenging(prev => {
        const newSet = new Set(prev);
        newSet.delete(toUserId);
        return newSet;
      });
    }
  };

  const respondToChallenge = async (challengeId: string, response: 'accepted' | 'rejected', challenge: GameChallenge) => {
    if (!user) return;

    try {
      setError(null);
      
      await ErrorHandler.withRetry(async () => {
        await enableNetwork(db);
        
        await updateDoc(doc(db, 'challenges', challengeId), {
          status: response,
          updatedAt: serverTimestamp()
        });
        
        if (response === 'accepted' && onStartOnlineGame) {
          // Create a new game session
          const gameState = initializeGame();
          gameState.isOnlineGame = true;
          gameState.hostId = challenge.fromUserId;
          
          // Set up players with correct IDs and names
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

          const gameSessionRef = await addDoc(collection(db, 'gameSessions'), gameSession);
          
          // Start the online game
          onStartOnlineGame(gameSessionRef.id, challenge.fromUserId, challenge.fromUsername);
          onClose();
        }
      }, `${response === 'accepted' ? 'accepting' : 'rejecting'} challenge`);
      
      setConnectionStatus('connected');
    } catch (error: any) {
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
      const appError = ErrorHandler.handleFirebaseError(error, 'refreshing data');
      setError(appError);
      setConnectionStatus('disconnected');
    }
  };

  const clearAllData = async () => {
    if (!user) return;

    setClearingData(true);
    setError(null);

    try {
      await ErrorHandler.withRetry(async () => {
        // Clear all challenges
        const challengesRef = collection(db, 'challenges');
        const challengesSnapshot = await getDocs(challengesRef);
        
        const challengeDeletePromises: Promise<void>[] = [];
        challengesSnapshot.forEach((challengeDoc) => {
          challengeDeletePromises.push(deleteDoc(doc(db, 'challenges', challengeDoc.id)));
        });

        // Clear all friend requests
        const friendRequestsRef = collection(db, 'friendRequests');
        const friendRequestsSnapshot = await getDocs(friendRequestsRef);
        
        const requestDeletePromises: Promise<void>[] = [];
        friendRequestsSnapshot.forEach((requestDoc) => {
          requestDeletePromises.push(deleteDoc(doc(db, 'friendRequests', requestDoc.id)));
        });

        // Clear all game sessions
        const gameSessionsRef = collection(db, 'gameSessions');
        const gameSessionsSnapshot = await getDocs(gameSessionsRef);
        
        const sessionDeletePromises: Promise<void>[] = [];
        gameSessionsSnapshot.forEach((sessionDoc) => {
          sessionDeletePromises.push(deleteDoc(doc(db, 'gameSessions', sessionDoc.id)));
        });

        // Clear all game moves
        const gameMovesRef = collection(db, 'gameMoves');
        const gameMovesSnapshot = await getDocs(gameMovesRef);
        
        const moveDeletePromises: Promise<void>[] = [];
        gameMovesSnapshot.forEach((moveDoc) => {
          moveDeletePromises.push(deleteDoc(doc(db, 'gameMoves', moveDoc.id)));
        });

        // Clear friends from all users
        const usersRef = collection(db, 'users');
        const usersSnapshot = await getDocs(usersRef);
        
        const userUpdatePromises: Promise<void>[] = [];
        usersSnapshot.forEach((userDoc) => {
          userUpdatePromises.push(updateDoc(doc(db, 'users', userDoc.id), {
            friends: []
          }));
        });

        // Execute all deletions and updates
        await Promise.all([
          ...challengeDeletePromises,
          ...requestDeletePromises,
          ...sessionDeletePromises,
          ...moveDeletePromises,
          ...userUpdatePromises
        ]);

        // Reset local state
        setChallenges([]);
        setFriendRequests([]);
        setSentRequests([]);
        setFriends([]);
        
        console.log('Successfully cleared all data');
      }, 'clearing all data');
      
      setConnectionStatus('connected');
      
    } catch (error: any) {
      const appError = ErrorHandler.handleFirebaseError(error, 'clearing all data');
      setError(appError);
      setConnectionStatus('disconnected');
    } finally {
      setClearingData(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Friends & Online Challenges</h2>
              <p className="text-purple-100">Connect and play online with other Kadi players</p>
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
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-6">
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                activeTab === 'admin'
                  ? 'bg-white text-red-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Trash2 size={16} className="inline mr-2" />
              Admin
            </button>
            <button
              onClick={() => setActiveTab('friends')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                activeTab === 'friends'
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Users size={16} className="inline mr-2" />
              Friends ({friends.length})
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                activeTab === 'requests'
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Clock size={16} className="inline mr-2" />
              Requests ({friendRequests.length})
            </button>
            <button
              onClick={() => setActiveTab('challenges')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                activeTab === 'challenges'
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Gamepad2 size={16} className="inline mr-2" />
              Challenges ({challenges.length})
            </button>
            <button
              onClick={() => setActiveTab('browse')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                activeTab === 'browse'
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Search size={16} className="inline mr-2" />
              Browse ({filteredUsers.length})
            </button>
          </div>

          {/* Error Message */}
          {error && error.severity !== 'low' && (
            <div className="border rounded-lg px-4 py-3 text-sm mb-4 bg-red-50 border-red-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertTriangle size={16} className="text-red-600" />
                  <span className="text-red-800">{error.userMessage}</span>
                </div>
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

          {/* Admin Tab */}
          {activeTab === 'admin' && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-semibold text-red-800 mb-2">⚠️ CLEAR ALL DATA</h4>
                <p className="text-sm text-red-700 mb-4">
                  This will permanently delete ALL data from the system:
                </p>
                <ul className="text-sm text-red-700 mb-4 space-y-1 list-disc list-inside">
                  <li>All friend requests (sent and received)</li>
                  <li>All game challenges</li>
                  <li>All friend connections</li>
                  <li>All game sessions</li>
                  <li>All game moves history</li>
                </ul>
                
                <button
                  onClick={clearAllData}
                  disabled={connectionStatus !== 'connected' || clearingData}
                  className="flex items-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 font-bold"
                >
                  <Trash2 size={16} />
                  <span>{clearingData ? 'Clearing All Data...' : 'CLEAR ALL DATA NOW'}</span>
                  {clearingData && <RefreshCw size={16} className="animate-spin" />}
                </button>
                
                {clearingData && (
                  <div className="mt-3 text-sm text-red-600">
                    Please wait while we clear all data from the system...
                  </div>
                )}
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">ℹ️ System Information</h4>
                <div className="text-sm text-blue-700 space-y-1">
                  <p>• Total Users: {allUsers.length}</p>
                  <p>• Your Friends: {friends.length}</p>
                  <p>• Pending Friend Requests: {friendRequests.length}</p>
                  <p>• Pending Challenges: {challenges.length}</p>
                  <p>• Connection Status: {connectionStatus}</p>
                </div>
              </div>
            </div>
          )}

          {/* Friends Tab */}
          {activeTab === 'friends' && (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {friends.map((friend) => (
                <div key={friend.id} className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-2 rounded-full">
                      <Users className="text-white" size={16} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">{friend.username}</h4>
                      <p className="text-sm text-gray-600">
                        {friend.gamesWon || 0}/{friend.gamesPlayed || 0} games won
                      </p>
                      {friend.isOnline && (
                        <div className="flex items-center space-x-1 text-green-600">
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
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Gamepad2 size={16} />
                      <span>{challengingUsers.has(friend.id) ? 'Sending...' : 'Challenge'}</span>
                    </button>
                    <button
                      onClick={() => removeFriend(friend.id)}
                      disabled={connectionStatus !== 'connected'}
                      className="flex items-center space-x-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <UserMinus size={16} />
                    </button>
                  </div>
                </div>
              ))}
              {friends.length === 0 && connectionStatus === 'connected' && (
                <div className="text-center py-8 text-gray-500">
                  <Users size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>No friends yet</p>
                  <p className="text-sm mt-2">Browse users to send friend requests!</p>
                </div>
              )}
            </div>
          )}

          {/* Friend Requests Tab */}
          {activeTab === 'requests' && (
            <div className="space-y-4">
              {friendRequests.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">Incoming Requests</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {friendRequests.map((request) => (
                      <div key={request.id} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="bg-blue-500 p-2 rounded-full">
                            <UserPlus className="text-white" size={16} />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-800">{request.fromUsername}</h4>
                            <p className="text-sm text-gray-600">wants to be your friend</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => respondToFriendRequest(request.id, 'accepted', request)}
                            disabled={connectionStatus !== 'connected'}
                            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                          >
                            <Check size={16} />
                            <span>Accept</span>
                          </button>
                          <button
                            onClick={() => respondToFriendRequest(request.id, 'rejected', request)}
                            disabled={connectionStatus !== 'connected'}
                            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
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
                  <h4 className="font-semibold text-gray-800 mb-3">Sent Requests</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {sentRequests.map((request) => (
                      <div key={request.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="bg-gray-500 p-2 rounded-full">
                            <Clock className="text-white" size={16} />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-800">{request.toUsername}</h4>
                            <p className="text-sm text-gray-600">Friend request pending</p>
                          </div>
                        </div>
                        <span className="text-sm text-gray-500">Waiting for response...</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {friendRequests.length === 0 && sentRequests.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Clock size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>No pending friend requests</p>
                  <p className="text-sm mt-2">Send requests to other players to connect!</p>
                </div>
              )}
            </div>
          )}

          {/* Challenges Tab */}
          {activeTab === 'challenges' && (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {challenges.map((challenge) => (
                <div key={challenge.id} className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border-l-4 border-orange-500">
                  <div className="flex items-center space-x-3">
                    <div className="bg-orange-500 p-2 rounded-full animate-pulse">
                      <Gamepad2 className="text-white" size={16} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">{challenge.fromUsername}</h4>
                      <p className="text-sm text-gray-600">challenged you to an online game</p>
                      <p className="text-xs text-gray-500">
                        Expires: {challenge.expiresAt?.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => respondToChallenge(challenge.id, 'accepted', challenge)}
                      disabled={connectionStatus !== 'connected'}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 animate-pulse"
                    >
                      <Check size={16} />
                      <span>Accept & Play Online</span>
                    </button>
                    <button
                      onClick={() => respondToChallenge(challenge.id, 'rejected', challenge)}
                      disabled={connectionStatus !== 'connected'}
                      className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      <X size={16} />
                      <span>Decline</span>
                    </button>
                  </div>
                </div>
              ))}
              {challenges.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Gamepad2 size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>No pending challenges</p>
                  <p className="text-sm mt-2">Challenge your friends to start playing online!</p>
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
                  placeholder="Search users by username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {loading && (
                <div className="text-center py-8">
                  <RefreshCw className="animate-spin mx-auto mb-4 text-purple-500" size={32} />
                  <p className="text-gray-600">Loading users...</p>
                </div>
              )}

              {!loading && (
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {filteredUsers.map((userData) => (
                    <div key={userData.id} className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-full">
                          <Users className="text-white" size={16} />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="font-semibold text-gray-800">{userData.username}</h4>
                            {userData.isOnline && (
                              <div className="flex items-center space-x-1">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-xs text-green-600">Online</span>
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            {userData.gamesWon || 0}/{userData.gamesPlayed || 0} games won
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {!isFriend(userData.id) && !hasPendingRequest(userData.id) && (
                          <button
                            onClick={() => sendFriendRequest(userData.id, userData.username)}
                            disabled={connectionStatus !== 'connected'}
                            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <UserPlus size={16} />
                            <span>Add Friend</span>
                          </button>
                        )}
                        {hasPendingRequest(userData.id) && (
                          <div className="flex items-center space-x-2 text-gray-600 font-medium">
                            <Clock size={16} />
                            <span>Request Sent</span>
                          </div>
                        )}
                        {isFriend(userData.id) && (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => sendChallenge(userData.id, userData.username)}
                              disabled={connectionStatus !== 'connected' || challengingUsers.has(userData.id)}
                              className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                              <Gamepad2 size={14} />
                              <span className="text-sm">{challengingUsers.has(userData.id) ? 'Sending...' : 'Challenge'}</span>
                            </button>
                            <div className="flex items-center space-x-2 text-green-600 font-medium">
                              <MessageCircle size={16} />
                              <span>Friends</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {filteredUsers.length === 0 && searchQuery && (
                    <div className="text-center py-8 text-gray-500">
                      <Search size={48} className="mx-auto mb-4 text-gray-300" />
                      <p>No users found matching "{searchQuery}"</p>
                      <p className="text-sm mt-2">Try a different search term</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};