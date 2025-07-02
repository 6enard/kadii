import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorFallbackProps {
  error: Error;
  retry: () => void;
  onGoHome?: () => void;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, retry, onGoHome }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center">
        <div className="bg-red-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <AlertTriangle className="text-red-600" size={32} />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Oops! Something went wrong</h2>
        <p className="text-gray-600 mb-6">
          We encountered an unexpected error. Don't worry, this happens sometimes.
        </p>
        
        <div className="bg-gray-50 rounded-lg p-3 mb-6 text-left">
          <p className="text-sm text-gray-700 font-mono break-words">
            {error.message}
          </p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={retry}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw size={16} />
            <span>Try Again</span>
          </button>
          
          {onGoHome && (
            <button
              onClick={onGoHome}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Home size={16} />
              <span>Go Home</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export const GameErrorFallback: React.FC<ErrorFallbackProps> = ({ error, retry, onGoHome }) => {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center">
        <div className="bg-red-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <AlertTriangle className="text-red-600" size={32} />
        </div>
        
        <h2 className="text-xl font-bold text-gray-800 mb-2">Game Error</h2>
        <p className="text-gray-600 mb-4">
          The game encountered an error and needs to be restarted.
        </p>
        
        <div className="flex space-x-3">
          <button
            onClick={retry}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw size={16} />
            <span>Restart Game</span>
          </button>
          
          {onGoHome && (
            <button
              onClick={onGoHome}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Home size={16} />
              <span>Main Menu</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};