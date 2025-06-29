import React, { useState, useEffect } from 'react';
import { X, Search, UserPlus, Users, MessageCircle, RefreshCw, Wifi, WifiOff, UserMinus, Check, Clock, Gamepad2, Trash2 } from 'lucide-react';
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
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { UserData, FriendRequest, GameChallenge } from '../../types';

interface FriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartChallenge?: (opponentId: string, opponentName: string) => void;
}

export const FriendsModal: React.FC<FriendsModalProps> = ({ isOpen, onClose, onStartChallenge }) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [allUsers, setAllUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [friends, setFriends] = useState<UserData[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [challenges, setChallenges] = useState<GameChallenge[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'browse' | 'friends' | 'requests' | 'challenges'>('friends');
  const [error, setError] = useState('');
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      loadAllUsers();
      loadFriends();
      loadFriendRequests();
      loadChallenges();
    }
  }, [isOpen, user]);

  useEffect(() => {
    // Filter users based on search query
    if (searchQuery.trim()) {
      const filtered = allUsers.filter(userData => 
        userData.username.toLowerCase().includes(searchQuery.toLowerCase().trim()) &&
        userData.id !== user?.uid // Exclude current user
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(allUsers.filter(userData => userData.id !== user?.uid));
    }
  }, [searchQuery, allUsers, user]);

  const handleFirebaseError = (error: any, operation: string) => {
    console.error(`Error ${operation}:`, error);
    
    if (error.code === 'unavailable' || error.message?.includes('offline') || error.message?.includes('network')) {
      setIsOffline(true);
      setError(`Unable to connect to the server. Please check your internet connection and try again.`);
    } else if (error.code === 'permission-denied') {
      setError(`Access denied. Please make sure you're logged in and try again.`);
    } else if (error.code === 'not-found') {
      setError(`Data not found. The requested information may have been removed.`);
    } else {
      setError(`Error ${operation}. Please try again later.`);
    }
  };

  const loadAllUsers = async () => {
    if (!user) return;

    setLoading(true);
    setError('');
    setIsOffline(false);
    
    try {
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
      setIsOffline(false);
    } catch (error: any) {
      handleFirebaseError(error, 'loading users');
    } finally {
      setLoading(false);
    }
  };

  const loadFriends = async () => {
    if (!user) return;

    try {
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
      setIsOffline(false);
    } catch (error: any) {
      handleFirebaseError(error, 'loading friends');
    }
  };

  const loadFriendRequests = async () => {
    if (!user) return;

    try {
      await enableNetwork(db);
      
      // Load incoming friend requests
      const incomingQuery = query(
        collection(db, 'friendRequests'),
        where('toUserId', '==', user.uid),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );
      
      const incomingSnapshot = await getDocs(incomingQuery);
      const incoming: FriendRequest[] = [];
      incomingSnapshot.forEach((doc) => {
        incoming.push({ id: doc.id, ...doc.data() } as FriendRequest);
      });
      
      // Load sent friend requests
      const sentQuery = query(
        collection(db, 'friendRequests'),
        where('fromUserId', '==', user.uid),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );
      
      const sentSnapshot = await getDocs(sentQuery);
      const sent: FriendRequest[] = [];
      sentSnapshot.forEach((doc) => {
        sent.push({ id: doc.id, ...doc.data() } as FriendRequest);
      });
      
      setFriendRequests(incoming);
      setSentRequests(sent);
      setIsOffline(false);
    } catch (error: any) {
      handleFirebaseError(error, 'loading friend requests');
    }
  };

  const loadChallenges = async () => {
    if (!user) return;

    try {
      await enableNetwork(db);
      
      // Load incoming challenges
      const incomingQuery = query(
        collection(db, 'challenges'),
        where('toUserId', '==', user.uid),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );
      
      const incomingSnapshot = await getDocs(incomingQuery);
      const incoming: GameChallenge[] = [];
      incomingSnapshot.forEach((doc) => {
        const data = doc.data();
        incoming.push({ 
          id: doc.id, 
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          expiresAt: data.expiresAt?.toDate() || new Date()
        } as GameChallenge);
      });
      
      setChallenges(incoming);
      setIsOffline(false);
    } catch (error: any) {
      handleFirebaseError(error, 'loading challenges');
    }
  };

  const sendFriendRequest = async (toUserId: string, toUsername: string) => {
    if (!user) return;

    try {
      setError('');
      await enableNetwork(db);
      
      // Check if request already exists
      const existingQuery = query(
        collection(db, 'friendRequests'),
        where('fromUserId', '==', user.uid),
        where('toUserId', '==', toUserId),
        where('status', '==', 'pending')
      );
      
      const existingSnapshot = await getDocs(existingQuery);
      if (!existingSnapshot.empty) {
        setError('Friend request already sent to this user.');
        return;
      }
      
      // Create friend request
      await addDoc(collection(db, 'friendRequests'), {
        fromUserId: user.uid,
        fromUsername: user.displayName || 'Unknown',
        toUserId,
        toUsername,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      await loadFriendRequests();
      setIsOffline(false);
    } catch (error: any) {
      handleFirebaseError(error, 'sending friend request');
    }
  };

  const respondToFriendRequest = async (requestId: string, response: 'accepted' | 'rejected', request: FriendRequest) => {
    if (!user) return;

    try {
      setError('');
      await enableNetwork(db);
      
      // Update request status
      await updateDoc(doc(db, 'friendRequests', requestId), {
        status: response,
        updatedAt: serverTimestamp()
      });
      
      if (response === 'accepted') {
        // Add each other as friends
        await updateDoc(doc(db, 'users', user.uid), {
          friends: arrayUnion(request.fromUserId)
        });
        
        await updateDoc(doc(db, 'users', request.fromUserId), {
          friends: arrayUnion(user.uid)
        });
      }
      
      await loadFriendRequests();
      await loadFriends();
      setIsOffline(false);
    } catch (error: any) {
      handleFirebaseError(error, 'responding to friend request');
    }
  };

  const removeFriend = async (friendId: string) => {
    if (!user) return;

    try {
      setError('');
      await enableNetwork(db);
      
      // Remove from both users' friend lists
      await updateDoc(doc(db, 'users', user.uid), {
        friends: arrayRemove(friendId)
      });
      
      await updateDoc(doc(db, 'users', friendId), {
        friends: arrayRemove(user.uid)
      });
      
      await loadFriends();
      setIsOffline(false);
    } catch (error: any) {
      handleFirebaseError(error, 'removing friend');
    }
  };

  const sendChallenge = async (toUserId: string, toUsername: string) => {
    if (!user) return;

    try {
      setError('');
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
        setError('Challenge already sent to this user.');
        return;
      }
      
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 5); // 5 minute expiry
      
      // Create challenge
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
      
      await loadChallenges();
      setIsOffline(false);
      
      // Show success message
      setError('');
      // You could add a success state here if needed
    } catch (error: any) {
      handleFirebaseError(error, 'sending challenge');
    }
  };

  const respondToChallenge = async (challengeId: string, response: 'accepted' | 'rejected', challenge: GameChallenge) => {
    if (!user) return;

    try {
      setError('');
      await enableNetwork(db);
      
      // Update challenge status
      await updateDoc(doc(db, 'challenges', challengeId), {
        status: response,
        updatedAt: serverTimestamp()
      });
      
      if (response === 'accepted' && onStartChallenge) {
        // Start the multiplayer game
        onStartChallenge(challenge.fromUserId, challenge.fromUsername);
        onClose();
      }
      
      await loadChallenges();
      setIsOffline(false);
    } catch (error: any) {
      handleFirebaseError(error, 'responding to challenge');
    }
  };

  const isFriend = (userId: string) => {
    return friends.some(friend => friend.id === userId);
  };

  const hasPendingRequest = (userId: string) => {
    return sentRequests.some(request => request.toUserId === userId);
  };

  const handleRefresh = async () => {
    setError('');
    setIsOffline(false);
    
    try {
      await enableNetwork(db);
      await loadAllUsers();
      await loadFriends();
      await loadFriendRequests();
      await loadChallenges();
    } catch (error: any) {
      handleFirebaseError(error, 'refreshing data');
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
              <h2 className="text-2xl font-bold mb-2">Friends & Challenges</h2>
              <p className="text-purple-100">Connect and play with other Kadi players</p>
              {isOffline && (
                <div className="flex items-center space-x-2 mt-2 text-yellow-200">
                  <WifiOff size={16} />
                  <span className="text-sm">Connection issues detected</span>
                </div>
              )}
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
          {error && (
            <div className={`border rounded-lg px-4 py-3 text-sm mb-4 ${
              isOffline 
                ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                : 'bg-red-50 border-red-200 text-red-600'
            }`}>
              <div className="flex items-center space-x-2">
                {isOffline ? <WifiOff size={16} /> : null}
                <span>{error}</span>
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
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => sendChallenge(friend.id, friend.username)}
                      disabled={isOffline}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Gamepad2 size={16} />
                      <span>Challenge</span>
                    </button>
                    <button
                      onClick={() => removeFriend(friend.id)}
                      disabled={isOffline}
                      className="flex items-center space-x-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <UserMinus size={16} />
                    </button>
                  </div>
                </div>
              ))}
              {friends.length === 0 && !isOffline && (
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
                            disabled={isOffline}
                            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                          >
                            <Check size={16} />
                            <span>Accept</span>
                          </button>
                          <button
                            onClick={() => respondToFriendRequest(request.id, 'rejected', request)}
                            disabled={isOffline}
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
                      <p className="text-sm text-gray-600">challenged you to a game</p>
                      <p className="text-xs text-gray-500">
                        Expires: {challenge.expiresAt?.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => respondToChallenge(challenge.id, 'accepted', challenge)}
                      disabled={isOffline}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 animate-pulse"
                    >
                      <Check size={16} />
                      <span>Accept & Play</span>
                    </button>
                    <button
                      onClick={() => respondToChallenge(challenge.id, 'rejected', challenge)}
                      disabled={isOffline}
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
                  <p className="text-sm mt-2">Challenge your friends to start playing!</p>
                </div>
              )}
            </div>
          )}

          {/* Browse Users Tab */}
          {activeTab === 'browse' && (
            <div className="space-y-4">
              {/* Search Bar */}
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

              {/* Loading State */}
              {loading && (
                <div className="text-center py-8">
                  <RefreshCw className="animate-spin mx-auto mb-4 text-purple-500" size={32} />
                  <p className="text-gray-600">Loading users...</p>
                </div>
              )}

              {/* Users List */}
              {!loading && (
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {filteredUsers.map((userData) => (
                    <div key={userData.id} className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-full">
                          <Users className="text-white" size={16} />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800">{userData.username}</h4>
                          <p className="text-sm text-gray-600">
                            {userData.gamesWon || 0}/{userData.gamesPlayed || 0} games won
                          </p>
                        </div>
                      </div>
                      {!isFriend(userData.id) && !hasPendingRequest(userData.id) && (
                        <button
                          onClick={() => sendFriendRequest(userData.id, userData.username)}
                          disabled={isOffline}
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
                        <div className="flex items-center space-x-2 text-green-600 font-medium">
                          <MessageCircle size={16} />
                          <span>Friends</span>
                        </div>
                      )}
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