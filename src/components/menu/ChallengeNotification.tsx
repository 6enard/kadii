import React, { useState, useEffect, useMemo } from 'react';
import { X, Gamepad2, Clock } from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  updateDoc,
  deleteDoc 
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { GameChallenge } from '../../types';

interface ChallengeNotificationProps {
  onStartChallenge: (opponentId: string, opponentName: string) => void;
}

export const ChallengeNotification: React.FC<ChallengeNotificationProps> = ({ onStartChallenge }) => {
  const { user } = useAuth();
  const [acceptedChallenges, setAcceptedChallenges] = useState<GameChallenge[]>([]);
  const [showNotification, setShowNotification] = useState(false);

  // Memoize the query to prevent recreating it on every render
  const challengesQuery = useMemo(() => {
    if (!user) return null;
    
    return query(
      collection(db, 'challenges'),
      where('fromUserId', '==', user.uid),
      where('status', '==', 'accepted')
    );
  }, [user?.uid]);

  useEffect(() => {
    if (!challengesQuery) return;

    const unsubscribe = onSnapshot(challengesQuery, (snapshot) => {
      const accepted: GameChallenge[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        accepted.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          expiresAt: data.expiresAt?.toDate() || new Date()
        } as GameChallenge);
      });

      if (accepted.length > 0) {
        setAcceptedChallenges(accepted);
        setShowNotification(true);
      } else {
        setAcceptedChallenges([]);
        setShowNotification(false);
      }
    });

    return () => unsubscribe();
  }, [challengesQuery]);

  const handleStartGame = async (challenge: GameChallenge) => {
    try {
      // Mark challenge as started/completed
      await updateDoc(doc(db, 'challenges', challenge.id), {
        status: 'completed'
      });

      // Start the game
      onStartChallenge(challenge.toUserId, challenge.toUsername);
      
      // Remove from notifications
      setAcceptedChallenges(prev => prev.filter(c => c.id !== challenge.id));
      
      if (acceptedChallenges.length <= 1) {
        setShowNotification(false);
      }
    } catch (error) {
      console.error('Error starting challenge game:', error);
    }
  };

  const handleDismiss = async (challenge: GameChallenge) => {
    try {
      // Delete the challenge
      await deleteDoc(doc(db, 'challenges', challenge.id));
      
      // Remove from notifications
      setAcceptedChallenges(prev => prev.filter(c => c.id !== challenge.id));
      
      if (acceptedChallenges.length <= 1) {
        setShowNotification(false);
      }
    } catch (error) {
      console.error('Error dismissing challenge:', error);
    }
  };

  const handleDismissAll = () => {
    setShowNotification(false);
    // Optionally clean up all accepted challenges
    acceptedChallenges.forEach(challenge => {
      deleteDoc(doc(db, 'challenges', challenge.id)).catch(console.error);
    });
    setAcceptedChallenges([]);
  };

  if (!showNotification || acceptedChallenges.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className="bg-white rounded-xl shadow-2xl border-2 border-green-500 overflow-hidden animate-bounce">
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-4 text-white relative">
          <button
            onClick={handleDismissAll}
            className="absolute top-2 right-2 p-1 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
          >
            <X size={16} />
          </button>
          <div className="flex items-center space-x-2">
            <Gamepad2 size={20} className="animate-pulse" />
            <h3 className="font-bold">Challenge Accepted!</h3>
          </div>
          <p className="text-green-100 text-sm mt-1">
            {acceptedChallenges.length === 1 
              ? 'Your challenge was accepted' 
              : `${acceptedChallenges.length} challenges accepted`}
          </p>
        </div>

        <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
          {acceptedChallenges.map((challenge) => (
            <div key={challenge.id} className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="font-semibold text-gray-800">{challenge.toUsername}</h4>
                  <p className="text-sm text-gray-600">accepted your challenge</p>
                </div>
                <div className="flex items-center text-xs text-gray-500">
                  <Clock size={12} className="mr-1" />
                  <span>Just now</span>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => handleStartGame(challenge)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-1"
                >
                  <Gamepad2 size={14} />
                  <span>Start Game</span>
                </button>
                <button
                  onClick={() => handleDismiss(challenge)}
                  className="px-3 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg text-sm transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {acceptedChallenges.length > 1 && (
          <div className="bg-gray-100 p-3 border-t">
            <button
              onClick={handleDismissAll}
              className="w-full text-center text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Dismiss All
            </button>
          </div>
        )}
      </div>
    </div>
  );
};