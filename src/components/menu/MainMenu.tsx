import React, { useState } from 'react';
import { Play, Users, Trophy, Settings, LogOut, User, Search } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { AuthModal } from '../auth/AuthModal';
import { FriendsModal } from './FriendsModal';

interface MainMenuProps {
  onStartSinglePlayer: () => void;
  onStartMultiplayer: () => void;
  onStartChallengeGame?: (opponentId: string, opponentName: string) => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ 
  onStartSinglePlayer, 
  onStartMultiplayer,
  onStartChallengeGame 
}) => {
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showFriendsModal, setShowFriendsModal] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleStartChallenge = (opponentId: string, opponentName: string) => {
    if (onStartChallengeGame) {
      onStartChallengeGame(opponentId, opponentName);
    } else {
      // Fallback to regular multiplayer
      onStartMultiplayer();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-white mb-4 tracking-tight">
            Kadi
          </h1>
          <p className="text-xl text-emerald-200 font-light">
            The Classic Kenyan Card Game
          </p>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Game Modes */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-white mb-6">Play Game</h2>
            
            <button
              onClick={onStartSinglePlayer}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white p-6 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                    <Play size={24} />
                  </div>
                  <div className="text-left">
                    <h3 className="text-xl font-semibold">Play vs Computer</h3>
                    <p className="text-emerald-100 text-sm">Practice against AI</p>
                  </div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  →
                </div>
              </div>
            </button>

            <button
              onClick={user ? onStartMultiplayer : () => setShowAuthModal(true)}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white p-6 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                    <Users size={24} />
                  </div>
                  <div className="text-left">
                    <h3 className="text-xl font-semibold">Play with Friends</h3>
                    <p className="text-blue-100 text-sm">
                      {user ? 'Challenge your friends' : 'Sign in required'}
                    </p>
                  </div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  →
                </div>
              </div>
            </button>

            {user && (
              <button
                onClick={() => setShowFriendsModal(true)}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white p-6 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                      <Search size={24} />
                    </div>
                    <div className="text-left">
                      <h3 className="text-xl font-semibold">Friends & Challenges</h3>
                      <p className="text-purple-100 text-sm">Manage friends and game challenges</p>
                    </div>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    →
                  </div>
                </div>
              </button>
            )}
          </div>

          {/* User Panel */}
          <div className="space-y-4">
            {user ? (
              <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-6 border border-white border-opacity-20">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-3 rounded-full">
                    <User className="text-white" size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">
                      {user.displayName || 'Player'}
                    </h3>
                    <p className="text-emerald-200 text-sm">{user.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-white bg-opacity-10 rounded-lg p-4 text-center">
                    <Trophy className="text-yellow-400 mx-auto mb-2" size={20} />
                    <div className="text-2xl font-bold text-white">0</div>
                    <div className="text-emerald-200 text-sm">Games Won</div>
                  </div>
                  <div className="bg-white bg-opacity-10 rounded-lg p-4 text-center">
                    <Play className="text-blue-400 mx-auto mb-2" size={20} />
                    <div className="text-2xl font-bold text-white">0</div>
                    <div className="text-emerald-200 text-sm">Games Played</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <button className="w-full flex items-center space-x-3 text-white hover:bg-white hover:bg-opacity-10 p-3 rounded-lg transition-colors">
                    <Settings size={20} />
                    <span>Settings</span>
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center space-x-3 text-red-300 hover:bg-red-500 hover:bg-opacity-20 p-3 rounded-lg transition-colors"
                  >
                    <LogOut size={20} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-6 border border-white border-opacity-20 text-center">
                <User className="text-white mx-auto mb-4" size={48} />
                <h3 className="text-xl font-semibold text-white mb-2">Join the Community</h3>
                <p className="text-emerald-200 mb-6">
                  Sign in to play with friends, track your progress, and compete in tournaments.
                </p>
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white py-3 rounded-lg font-semibold transition-all"
                >
                  Sign In / Sign Up
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-emerald-300">
          <p className="text-sm">
            Experience the authentic Kenyan card game with modern multiplayer features
          </p>
        </div>
      </div>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      {user && (
        <FriendsModal 
          isOpen={showFriendsModal} 
          onClose={() => setShowFriendsModal(false)}
          onStartChallenge={handleStartChallenge}
        />
      )}
    </div>
  );
};