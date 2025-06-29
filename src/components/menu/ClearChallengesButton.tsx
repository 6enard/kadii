import React, { useState } from 'react';
import { Trash2, RefreshCw, AlertTriangle } from 'lucide-react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';

interface ClearChallengesButtonProps {
  onClearComplete?: () => void;
}

export const ClearChallengesButton: React.FC<ClearChallengesButtonProps> = ({ onClearComplete }) => {
  const { user } = useAuth();
  const [isClearing, setIsClearing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [clearCount, setClearCount] = useState(0);

  const clearAllChallenges = async () => {
    if (!user) return;

    setIsClearing(true);
    setClearCount(0);

    try {
      // Get all challenges
      const challengesRef = collection(db, 'challenges');
      const snapshot = await getDocs(challengesRef);
      
      const deletePromises: Promise<void>[] = [];
      
      snapshot.forEach((challengeDoc) => {
        deletePromises.push(deleteDoc(doc(db, 'challenges', challengeDoc.id)));
      });

      // Delete all challenges
      await Promise.all(deletePromises);
      
      setClearCount(snapshot.size);
      
      // Call completion callback
      if (onClearComplete) {
        onClearComplete();
      }

      console.log(`Cleared ${snapshot.size} challenges successfully`);
      
    } catch (error) {
      console.error('Error clearing challenges:', error);
    } finally {
      setIsClearing(false);
      setShowConfirm(false);
    }
  };

  if (showConfirm) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-md w-full p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-red-100 p-2 rounded-full">
              <AlertTriangle className="text-red-600" size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">Clear All Challenges</h3>
              <p className="text-sm text-gray-600">This action cannot be undone</p>
            </div>
          </div>
          
          <p className="text-gray-700 mb-6">
            This will permanently delete ALL challenges in the system, including:
          </p>
          
          <ul className="text-sm text-gray-600 mb-6 space-y-1">
            <li>• Pending challenges</li>
            <li>• Accepted challenges</li>
            <li>• Rejected challenges</li>
            <li>• Expired challenges</li>
          </ul>
          
          <div className="flex space-x-3">
            <button
              onClick={() => setShowConfirm(false)}
              className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={clearAllChallenges}
              disabled={isClearing}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {isClearing ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Clearing...</span>
                </>
              ) : (
                <>
                  <Trash2 size={16} />
                  <span>Clear All</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <button
        onClick={() => setShowConfirm(true)}
        disabled={isClearing}
        className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
      >
        <Trash2 size={16} />
        <span>Clear All Challenges</span>
      </button>
      
      {clearCount > 0 && (
        <div className="mt-2 text-sm text-green-600">
          ✅ Successfully cleared {clearCount} challenges
        </div>
      )}
    </div>
  );
};