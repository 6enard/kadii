import React, { useState } from 'react';
import { Volume2, VolumeX, Music, Settings, Sliders } from 'lucide-react';
import { useAudio } from '../../contexts/AudioContext';

export const AudioControls: React.FC = () => {
  const { 
    isMusicEnabled, 
    isSoundEnabled, 
    toggleMusic, 
    toggleSound, 
    musicVolume, 
    soundVolume, 
    setMusicVolume, 
    setSoundVolume,
    playSound
  } = useAudio();
  
  const [showSettings, setShowSettings] = useState(false);

  const handleSoundToggle = () => {
    toggleSound();
    if (!isSoundEnabled) {
      playSound('buttonClick');
    }
  };

  const handleMusicToggle = () => {
    toggleMusic();
    if (!isMusicEnabled) {
      playSound('buttonClick');
    }
  };

  return (
    <div className="relative">
      {/* Main Controls */}
      <div className="flex items-center space-x-2">
        <button
          onClick={handleMusicToggle}
          className={`p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all shadow-lg touch-manipulation ${
            isMusicEnabled 
              ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white' 
              : 'bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-gray-300'
          }`}
          title={isMusicEnabled ? 'Disable Music' : 'Enable Music'}
        >
          <Music size={14} className="sm:w-4 sm:h-4" />
        </button>
        
        <button
          onClick={handleSoundToggle}
          className={`p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all shadow-lg touch-manipulation ${
            isSoundEnabled 
              ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white' 
              : 'bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-gray-300'
          }`}
          title={isSoundEnabled ? 'Disable Sounds' : 'Enable Sounds'}
        >
          {isSoundEnabled ? <Volume2 size={14} className="sm:w-4 sm:h-4" /> : <VolumeX size={14} className="sm:w-4 sm:h-4" />}
        </button>
        
        <button
          onClick={() => {
            setShowSettings(!showSettings);
            playSound('buttonClick');
          }}
          className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-white transition-all shadow-lg touch-manipulation"
          title="Audio Settings"
        >
          <Sliders size={14} className="sm:w-4 sm:h-4" />
        </button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute top-full right-0 mt-2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl border border-purple-500/30 shadow-2xl p-4 min-w-[250px] z-50">
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-3">
              <Settings size={16} className="text-purple-400" />
              <h3 className="text-white font-semibold">Audio Settings</h3>
            </div>
            
            {/* Music Volume */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm text-purple-300 flex items-center space-x-2">
                  <Music size={14} />
                  <span>Music Volume</span>
                </label>
                <span className="text-xs text-white bg-purple-600/30 px-2 py-1 rounded">
                  {Math.round(musicVolume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={musicVolume}
                onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
                disabled={!isMusicEnabled}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
            
            {/* Sound Volume */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm text-blue-300 flex items-center space-x-2">
                  <Volume2 size={14} />
                  <span>Sound Volume</span>
                </label>
                <span className="text-xs text-white bg-blue-600/30 px-2 py-1 rounded">
                  {Math.round(soundVolume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={soundVolume}
                onChange={(e) => setSoundVolume(parseFloat(e.target.value))}
                disabled={!isSoundEnabled}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
            
            {/* Test Sounds */}
            <div className="pt-2 border-t border-slate-700">
              <p className="text-xs text-gray-400 mb-2">Test Sounds:</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => playSound('cardPlay')}
                  disabled={!isSoundEnabled}
                  className="px-2 py-1 text-xs bg-green-600/30 hover:bg-green-600/50 text-green-300 rounded transition-colors disabled:opacity-50"
                >
                  Card Play
                </button>
                <button
                  onClick={() => playSound('nikoKadi')}
                  disabled={!isSoundEnabled}
                  className="px-2 py-1 text-xs bg-yellow-600/30 hover:bg-yellow-600/50 text-yellow-300 rounded transition-colors disabled:opacity-50"
                >
                  Niko Kadi
                </button>
                <button
                  onClick={() => playSound('gameWin')}
                  disabled={!isSoundEnabled}
                  className="px-2 py-1 text-xs bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 rounded transition-colors disabled:opacity-50"
                >
                  Win
                </button>
                <button
                  onClick={() => playSound('notification')}
                  disabled={!isSoundEnabled}
                  className="px-2 py-1 text-xs bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 rounded transition-colors disabled:opacity-50"
                >
                  Notification
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};