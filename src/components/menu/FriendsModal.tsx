import React, { useState, useEffect } from 'react';
import { X, Search, UserPlus, Users, MessageCircle } from 'lucide-react';
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
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
  const [searchResults, setSearchResults] = useState<UserData[]>([]);
  const [friends, setFriends] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'friends'>('search');
  const [searchError, setSearchError] = useState('');

  useEffect(() => {
    if (isOpen && user) {
      loadFriends();
    }
  }, [isOpen, user]);

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
        setFriends(friendsData);
      }
    } catch (error) {
      console.error('Error loading friends:', error);
    }
  };

  const searchUsers = async () => {
    if (!searchQuery.trim() || !user) return;

    setLoading(true);
    setSearchError('');
    
    try {
      const usersRef = collection(db, 'users');
      
      // Get all users and filter client-side for better search results
      const allUsersSnapshot = await getDocs(usersRef);
      const results: UserData[] = [];
      
      allUsersSnapshot.forEach((doc) => {
        if (doc.id === user.uid) return; // Skip current user
        
        const userData = doc.data() as UserData;
        if (!userData.username) return; // Skip users without username
        
        // Case-insensitive search
        const username = userData.username.toLowerCase();
        const query = searchQuery.toLowerCase().trim();
        
        // Exact match or partial match
        if (username === query || username.includes(query)) {
          results.push({
            id: doc.id,
            ...userData
          });
        }
      });
      
      // Sort results: exact matches first, then partial matches
      results.sort((a, b) => {
        const aUsername = a.username.toLowerCase();
        const bUsername = b.username.toLowerCase();
        const query = searchQuery.toLowerCase().trim();
        
        const aExact = aUsername === query ? 1 : 0;
        const bExact = bUsername === query ? 1 : 0;
        
        if (aExact !== bExact) {
          return bExact - aExact; // Exact matches first
        }
        
        // Then by username alphabetically
        return aUsername.localeCompare(bUsername);
      });
      
      setSearchResults(results);
      
      if (results.length === 0) {
        setSearchError(`No users found with username containing "${searchQuery}"`);
      }
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchError('Error searching for users. Please try again.');
    } finally {
      setLoading(false);
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
      
      // Remove from search results
      setSearchResults(prev => prev.filter(u => u.id !== friendId));
      
      // Show success message
      setSearchError('');
    } catch (error) {
      console.error('Error adding friend:', error);
      setSearchError('Error adding friend. Please try again.');
    }
  };

  const isFriend = (userId: string) => {
    return friends.some(friend => friend.id === userId);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchUsers();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
          <h2 className="text-2xl font-bold mb-2">Friends & Community</h2>
          <p className="text-purple-100">Connect with other Kadi players</p>
        </div>

        <div className="p-6">
          {/* Tabs */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-6">
            <button
              onClick={() => setActiveTab('search')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                activeTab === 'search'
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Search size={16} className="inline mr-2" />
              Find Friends
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
              My Friends ({friends.length})
            </button>
          </div>

          {activeTab === 'search' && (
            <div className="space-y-4">
              <div className="flex space-x-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search by username (e.g., john123, mary_k, etc.)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={searchUsers}
                  disabled={loading || !searchQuery.trim()}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Searching...' : 'Search'}
                </button>
              </div>

              {/* Search Tips */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <h4 className="font-semibold text-blue-800 mb-1">Search Tips:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Enter the exact username or part of it</li>
                  <li>• Search is case-insensitive</li>
                  <li>• Try different variations if you can't find someone</li>
                </ul>
              </div>

              {/* Error Message */}
              {searchError && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {searchError}
                </div>
              )}

              <div className="max-h-64 overflow-y-auto space-y-2">
                {searchResults.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-full">
                        <Users className="text-white" size={16} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">{user.username}</h4>
                        <p className="text-sm text-gray-600">
                          {user.gamesWon || 0}/{user.gamesPlayed || 0} games won
                        </p>
                      </div>
                    </div>
                    {!isFriend(user.id) && (
                      <button
                        onClick={() => addFriend(user.id)}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <UserPlus size={16} />
                        <span>Add Friend</span>
                      </button>
                    )}
                    {isFriend(user.id) && (
                      <span className="text-green-600 font-medium">✓ Friends</span>
                    )}
                  </div>
                ))}
                {searchResults.length === 0 && searchQuery && !loading && !searchError && (
                  <div className="text-center py-8 text-gray-500">
                    <Users size={48} className="mx-auto mb-4 text-gray-300" />
                    <p>No users found with username "{searchQuery}"</p>
                    <p className="text-sm mt-2">Try searching with different keywords</p>
                  </div>
                )}
                {!searchQuery && (
                  <div className="text-center py-8 text-gray-500">
                    <Search size={48} className="mx-auto mb-4 text-gray-300" />
                    <p>Enter a username to search for friends</p>
                    <p className="text-sm mt-2">You can search for exact usernames or partial matches</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'friends' && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {friends.map((friend) => (
                <div key={friend.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
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
                  <p>No friends yet. Search for users to add them!</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};