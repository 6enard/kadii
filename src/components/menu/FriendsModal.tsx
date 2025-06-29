import React, { useState, useEffect } from 'react';
import { X, Search, UserPlus, Users, MessageCircle, RefreshCw } from 'lucide-react';
import { collection, query, getDocs, doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';

interface FriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UserData {
  id: string;
  username: string;
  email: string;
  gamesPlayed: number;
  gamesWon: number;
}

export const FriendsModal: React.FC<FriendsModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [allUsers, setAllUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [friends, setFriends] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'browse' | 'friends'>('browse');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && user) {
      loadAllUsers();
      loadFriends();
    }
  }, [isOpen, user]);

  useEffect(() => {
    // Filter users based on search query
    if (searchQuery.trim()) {
      const filtered = allUsers.filter(userData => 
        userData.username.toLowerCase().includes(searchQuery.toLowerCase().trim())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(allUsers);
    }
  }, [searchQuery, allUsers]);

  const loadAllUsers = async () => {
    if (!user) return;

    setLoading(true);
    setError('');
    
    try {
      const usersRef = collection(db, 'users');
      const allUsersSnapshot = await getDocs(usersRef);
      const users: UserData[] = [];
      
      allUsersSnapshot.forEach((doc) => {
        if (doc.id === user.uid) return; // Skip current user
        
        const userData = doc.data() as UserData;
        if (userData.username) { // Only include users with usernames
          users.push({
            id: doc.id,
            ...userData
          });
        }
      });
      
      // Sort users alphabetically by username
      users.sort((a, b) => a.username.toLowerCase().localeCompare(b.username.toLowerCase()));
      
      setAllUsers(users);
      setFilteredUsers(users);
    } catch (error) {
      console.error('Error loading users:', error);
      setError('Error loading users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadFriends = async () => {
    if (!user) return;

    try {
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
        // Sort friends alphabetically
        friendsData.sort((a, b) => a.username.toLowerCase().localeCompare(b.username.toLowerCase()));
        setFriends(friendsData);
      }
    } catch (error) {
      console.error('Error loading friends:', error);
    }
  };

  const addFriend = async (friendId: string) => {
    if (!user) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      const friendRef = doc(db, 'users', friendId);
      
      // Add friend to current user's friends list
      await updateDoc(userRef, {
        friends: arrayUnion(friendId)
      });
      
      // Add current user to friend's friends list
      await updateDoc(friendRef, {
        friends: arrayUnion(user.uid)
      });
      
      // Refresh friends list
      await loadFriends();
      
      setError('');
    } catch (error) {
      console.error('Error adding friend:', error);
      setError('Error adding friend. Please try again.');
    }
  };

  const isFriend = (userId: string) => {
    return friends.some(friend => friend.id === userId);
  };

  const handleRefresh = () => {
    loadAllUsers();
    loadFriends();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden">
        <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Friends & Community</h2>
              <p className="text-purple-100">Connect with other Kadi players</p>
            </div>
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

        <div className="p-6">
          {/* Tabs */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-6">
            <button
              onClick={() => setActiveTab('browse')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                activeTab === 'browse'
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Users size={16} className="inline mr-2" />
              Browse All Users ({filteredUsers.length})
            </button>
            <button
              onClick={() => setActiveTab('friends')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                activeTab === 'friends'
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <MessageCircle size={16} className="inline mr-2" />
              My Friends ({friends.length})
            </button>
          </div>

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

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">🌟 All Kadi Players</h4>
                <p className="text-sm text-blue-700">
                  Browse all registered players and add them as friends. You can search by username or scroll through the complete list.
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Loading State */}
              {loading && (
                <div className="text-center py-8">
                  <RefreshCw className="animate-spin mx-auto mb-4 text-purple-500" size={32} />
                  <p className="text-gray-600">Loading all users...</p>
                </div>
              )}

              {/* Users List */}
              {!loading && (
                <div className="max-h-96 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-2">
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
                      {!isFriend(userData.id) && (
                        <button
                          onClick={() => addFriend(userData.id)}
                          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <UserPlus size={16} />
                          <span>Add Friend</span>
                        </button>
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
                  
                  {filteredUsers.length === 0 && !searchQuery && !loading && (
                    <div className="text-center py-8 text-gray-500">
                      <Users size={48} className="mx-auto mb-4 text-gray-300" />
                      <p>No users found</p>
                      <p className="text-sm mt-2">Be the first to invite your friends!</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'friends' && (
            <div className="space-y-2 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-2">
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
                  <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <MessageCircle size={16} />
                    <span>Challenge</span>
                  </button>
                </div>
              ))}
              {friends.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Users size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>No friends yet</p>
                  <p className="text-sm mt-2">Browse all users to add friends!</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};