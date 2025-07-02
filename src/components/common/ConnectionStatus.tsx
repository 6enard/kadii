import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface ConnectionStatusProps {
  isConnected: boolean;
  isReconnecting?: boolean;
  lastError?: string;
  onRetry?: () => void;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  isConnected,
  isReconnecting = false,
  lastError,
  onRetry
}) => {
  const [showDetails, setShowDetails] = useState(false);

  if (isConnected && !lastError) {
    return (
      <div className="flex items-center space-x-2 text-green-400 text-sm">
        <CheckCircle size={16} />
        <span>Connected</span>
      </div>
    );
  }

  if (isReconnecting) {
    return (
      <div className="flex items-center space-x-2 text-yellow-400 text-sm">
        <Clock size={16} className="animate-pulse" />
        <span>Reconnecting...</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center space-x-2 text-red-400 hover:text-red-300 transition-colors text-sm"
        >
          <WifiOff size={16} />
          <span>Connection Issues</span>
          <AlertTriangle size={12} />
        </button>
      </div>

      {showDetails && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-sm">
          <p className="text-red-200 mb-2">
            {lastError || 'Unable to connect to the server'}
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs transition-colors"
            >
              Retry Connection
            </button>
          )}
        </div>
      )}
    </div>
  );
};