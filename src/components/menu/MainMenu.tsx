import React, { useState } from 'react';
import { Play, Trophy, Settings, LogOut, User, Users } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { useAudio } from '../../contexts/AudioContext';
import { AuthModal } from '../auth/AuthModal';
import { FriendsAndGameModal } from './FriendsAndGameModal';
import { ChallengeNotification } from './ChallengeNotification';
import { AudioControls } from './AudioControls';

interface MainMenuProps {
  onStartSinglePlayer: () => void;
  onStartOnlineGame?: (gameSessionId: string, opponentId: string, opponentName: string) => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ 
  onStartSinglePlayer, 
  onStartOnlineGame 
}) => {
  const { user } = useAuth();
  const { playSound } = useAudio();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showFriendsModal, setShowFriendsModal] = useState(false);

  const handleSignOut = async () => {
    try {
      playSound('buttonClick');
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      playSound('error');
    }
  };

  const handleStartChallenge = (gameSessionId: string, opponentId: string, opponentName: string) => {
    playSound('success');
    if (onStartOnlineGame) {
      onStartOnlineGame(gameSessionId, opponentId, opponentName);
    }
  };

  const handleStartSinglePlayer = () => {
    playSound('buttonClick');
    onStartSinglePlayer();
  };

  const handleOpenFriendsModal = () => {
    playSound('buttonClick');
    setShowFriendsModal(true);
  };

  const handleOpenAuthModal = () => {
    playSound('buttonClick');
    setShowAuthModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4 tracking-tight">
            Kadi
          </h1>
          <p className="text-lg sm:text-xl text-emerald-200 font-light">
            The Classic Kenyan Card Game
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Game Modes */}
          <div className="space-y-3 sm:space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold text-white mb-4 sm:mb-6">Play Game</h2>
            
            <button
              onClick={handleStartSinglePlayer}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white p-4 sm:p-6 rounded-xl shadow-lg transition-all duration-300 transform active:scale-95 sm:hover:scale-105 group touch-manipulation"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="bg-white bg-opacity-20 p-2 sm:p-3 rounded-lg">
                    <Play size={20} className="sm:w-6 sm:h-6" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg sm:text-xl font-semibold">Play vs Computer</h3>
                    <p className="text-emerald-100 text-sm">Practice against AI opponents</p>
                  </div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity text-xl sm:text-2xl">
                  →
                </div>
              </div>
            </button>

            {/* Online Multiplayer with Friends - Only show when signed in */}
            {user ? (
              <button
                onClick={handleOpenFriendsModal}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white p-4 sm:p-6 rounded-xl shadow-lg transition-all duration-300 transform active:scale-95 sm:hover:scale-105 group touch-manipulation"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="bg-white bg-opacity-20 p-2 sm:p-3 rounded-lg">
                      <Users size={20} className="sm:w-6 sm:h-6" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-lg sm:text-xl font-semibold">Play with Friends</h3>
                      <p className="text-purple-100 text-sm">Challenge friends to online games</p>
                    </div>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity text-xl sm:text-2xl">
                    →
                  </div>
                </div>
              </button>
            ) : (
              <button
                onClick={handleOpenAuthModal}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white p-4 sm:p-6 rounded-xl shadow-lg transition-all duration-300 transform active:scale-95 sm:hover:scale-105 group touch-manipulation"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="bg-white bg-opacity-20 p-2 sm:p-3 rounded-lg">
                      <Users size={20} className="sm:w-6 sm:h-6" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-lg sm:text-xl font-semibold">Play with Friends</h3>
                      <p className="text-blue-100 text-sm">Sign in to play online with friends</p>
                    </div>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity text-xl sm:text-2xl">
                    →
                  </div>
                </div>
              </button>
            )}
          </div>

          {/* User Panel */}
          <div className="space-y-3 sm:space-y-4">
            {user ? (
              <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-4 sm:p-6 border border-white border-opacity-20">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-2 sm:p-3 rounded-full">
                      <User className="text-white" size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg sm:text-xl font-semibold text-white truncate">
                        {user.displayName || 'Player'}
                      </h3>
                      <p className="text-emerald-200 text-sm truncate">{user.email}</p>
                    </div>
                  </div>
                  <AudioControls />
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className="bg-white bg-opacity-10 rounded-lg p-3 sm:p-4 text-center">
                    <Trophy className="text-yellow-400 mx-auto mb-2" size={16} />
                    <div className="text-xl sm:text-2xl font-bold text-white">0</div>
                    <div className="text-emerald-200 text-xs sm:text-sm">Games Won</div>
                  </div>
                  <div className="bg-white bg-opacity-10 rounded-lg p-3 sm:p-4 text-center">
                    <Play className="text-blue-400 mx-auto mb-2" size={16} />
                    <div className="text-xl sm:text-2xl font-bold text-white">0</div>
                    <div className="text-emerald-200 text-xs sm:text-sm">Games Played</div>
                  </div>
                </div>

                <div className="space-y-2 sm:space-y-3">
                  <button 
                    onClick={() => playSound('buttonClick')}
                    className="w-full flex items-center space-x-3 text-white hover:bg-white hover:bg-opacity-10 p-2 sm:p-3 rounded-lg transition-colors touch-manipulation"
                  >
                    <Settings size={16} className="sm:w-5 sm:h-5" />
                    <span className="text-sm sm:text-base">Settings</span>
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center space-x-3 text-red-300 hover:bg-red-500 hover:bg-opacity-20 p-2 sm:p-3 rounded-lg transition-colors touch-manipulation"
                  >
                    <LogOut size={16} className="sm:w-5 sm:h-5" />
                    <span className="text-sm sm:text-base">Sign Out</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-4 sm:p-6 border border-white border-opacity-20 text-center">
                <div className="flex items-center justify-between mb-4">
                  <User className="text-white" size={40} />
                  <AudioControls />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Join the Community</h3>
                <p className="text-emerald-200 mb-4 sm:mb-6 text-sm sm:text-base">
                  Sign in to save your progress and play online with friends.
                </p>
                <button
                  onClick={handleOpenAuthModal}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white py-2 sm:py-3 rounded-lg font-semibold transition-all text-sm sm:text-base touch-manipulation"
                >
                  Sign In / Sign Up
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 sm:mt-12 text-emerald-300">
          <p className="text-sm">
            Experience the authentic Kenyan card game with modern online features
          </p>
        </div>
      </div>

      {/* Modals */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      
      {user && (
        <>
          <FriendsAndGameModal 
            isOpen={showFriendsModal} 
            onClose={() => setShowFriendsModal(false)}
            onStartOnlineGame={onStartOnlineGame}
          />
          <ChallengeNotification onStartChallenge={handleStartChallenge} />
        </>
      )}
    </div>
  );
};