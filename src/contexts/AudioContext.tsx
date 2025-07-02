import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

interface AudioContextType {
  isMusicEnabled: boolean;
  isSoundEnabled: boolean;
  toggleMusic: () => void;
  toggleSound: () => void;
  playSound: (soundType: SoundType) => void;
  setMusicVolume: (volume: number) => void;
  setSoundVolume: (volume: number) => void;
  musicVolume: number;
  soundVolume: number;
}

export type SoundType = 
  | 'cardPlay' 
  | 'cardDraw' 
  | 'cardShuffle'
  | 'nikoKadi'
  | 'gameWin'
  | 'gameLose'
  | 'buttonClick'
  | 'notification'
  | 'penalty'
  | 'special'
  | 'turnChange'
  | 'error'
  | 'success';

const AudioContext = createContext<AudioContextType>({
  isMusicEnabled: true,
  isSoundEnabled: true,
  toggleMusic: () => {},
  toggleSound: () => {},
  playSound: () => {},
  setMusicVolume: () => {},
  setSoundVolume: () => {},
  musicVolume: 0.3,
  soundVolume: 0.7
});

export const useAudio = () => useContext(AudioContext);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMusicEnabled, setIsMusicEnabled] = useState(true);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [musicVolume, setMusicVolume] = useState(0.3);
  const [soundVolume, setSoundVolume] = useState(0.7);
  
  const backgroundMusicRef = useRef<HTMLAudioElement | null>(null);
  const soundCacheRef = useRef<Map<SoundType, HTMLAudioElement>>(new Map());

  // Initialize audio system
  useEffect(() => {
    // Create background music
    backgroundMusicRef.current = new Audio();
    backgroundMusicRef.current.loop = true;
    backgroundMusicRef.current.volume = musicVolume;
    
    // Use a royalty-free ambient music URL or create a simple tone
    // For now, we'll create a simple ambient tone using Web Audio API
    createBackgroundMusic();
    
    // Preload sound effects
    preloadSounds();
    
    // Load settings from localStorage
    const savedMusicEnabled = localStorage.getItem('musicEnabled');
    const savedSoundEnabled = localStorage.getItem('soundEnabled');
    const savedMusicVolume = localStorage.getItem('musicVolume');
    const savedSoundVolume = localStorage.getItem('soundVolume');
    
    if (savedMusicEnabled !== null) setIsMusicEnabled(JSON.parse(savedMusicEnabled));
    if (savedSoundEnabled !== null) setIsSoundEnabled(JSON.parse(savedSoundEnabled));
    if (savedMusicVolume !== null) setMusicVolume(parseFloat(savedMusicVolume));
    if (savedSoundVolume !== null) setSoundVolume(parseFloat(savedSoundVolume));
    
    return () => {
      if (backgroundMusicRef.current) {
        backgroundMusicRef.current.pause();
        backgroundMusicRef.current = null;
      }
      soundCacheRef.current.clear();
    };
  }, []);

  // Create ambient background music using Web Audio API
  const createBackgroundMusic = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create a simple ambient soundscape
      const createTone = (frequency: number, type: OscillatorType = 'sine') => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.02, audioContext.currentTime + 2);
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        return { oscillator, gainNode };
      };

      // Create multiple tones for ambient effect
      const tones = [
        createTone(220), // A3
        createTone(330), // E4
        createTone(440), // A4
        createTone(660), // E5
      ];

      // Start the ambient tones with slight delays
      tones.forEach((tone, index) => {
        tone.oscillator.start(audioContext.currentTime + index * 0.5);
      });

      // Create a simple rhythm pattern
      const createRhythm = () => {
        const now = audioContext.currentTime;
        tones.forEach((tone, index) => {
          // Fade in and out pattern
          tone.gainNode.gain.setValueAtTime(0.01, now);
          tone.gainNode.gain.linearRampToValueAtTime(0.03, now + 1);
          tone.gainNode.gain.linearRampToValueAtTime(0.01, now + 3);
          tone.gainNode.gain.linearRampToValueAtTime(0.02, now + 5);
          tone.gainNode.gain.linearRampToValueAtTime(0.01, now + 8);
        });
        
        // Schedule next pattern
        setTimeout(createRhythm, 8000);
      };

      if (isMusicEnabled) {
        createRhythm();
      }
    } catch (error) {
      console.log('Web Audio API not supported, using fallback');
      // Fallback to a simple audio file or silence
    }
  };

  // Preload sound effects using data URLs for simple tones
  const preloadSounds = () => {
    const sounds: Record<SoundType, string> = {
      cardPlay: createSoundDataURL([440, 880], 0.1, 'sine'),
      cardDraw: createSoundDataURL([330, 660], 0.15, 'triangle'),
      cardShuffle: createSoundDataURL([200, 400, 600], 0.3, 'sawtooth'),
      nikoKadi: createSoundDataURL([523, 659, 784, 1047], 0.5, 'sine'),
      gameWin: createSoundDataURL([523, 659, 784, 1047, 1319], 1, 'sine'),
      gameLose: createSoundDataURL([220, 185, 165], 0.8, 'triangle'),
      buttonClick: createSoundDataURL([800], 0.05, 'square'),
      notification: createSoundDataURL([800, 1000], 0.2, 'sine'),
      penalty: createSoundDataURL([150, 120], 0.4, 'sawtooth'),
      special: createSoundDataURL([660, 880, 1100], 0.3, 'sine'),
      turnChange: createSoundDataURL([400, 500], 0.1, 'triangle'),
      error: createSoundDataURL([200, 150], 0.3, 'square'),
      success: createSoundDataURL([600, 800], 0.2, 'sine')
    };

    Object.entries(sounds).forEach(([soundType, dataURL]) => {
      const audio = new Audio(dataURL);
      audio.volume = soundVolume;
      soundCacheRef.current.set(soundType as SoundType, audio);
    });
  };

  // Create simple sound data URLs using Web Audio API
  const createSoundDataURL = (frequencies: number[], duration: number, type: OscillatorType): string => {
    try {
      const sampleRate = 44100;
      const samples = Math.floor(sampleRate * duration);
      const buffer = new ArrayBuffer(44 + samples * 2);
      const view = new DataView(buffer);
      
      // WAV header
      const writeString = (offset: number, string: string) => {
        for (let i = 0; i < string.length; i++) {
          view.setUint8(offset + i, string.charCodeAt(i));
        }
      };
      
      writeString(0, 'RIFF');
      view.setUint32(4, 36 + samples * 2, true);
      writeString(8, 'WAVE');
      writeString(12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true);
      view.setUint16(22, 1, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * 2, true);
      view.setUint16(32, 2, true);
      view.setUint16(34, 16, true);
      writeString(36, 'data');
      view.setUint32(40, samples * 2, true);
      
      // Generate audio data
      for (let i = 0; i < samples; i++) {
        let sample = 0;
        frequencies.forEach((freq, index) => {
          const t = i / sampleRate;
          const envelope = Math.exp(-t * 3); // Decay envelope
          const wave = Math.sin(2 * Math.PI * freq * t) * envelope;
          sample += wave / frequencies.length;
        });
        
        const intSample = Math.max(-32767, Math.min(32767, Math.floor(sample * 32767 * 0.3)));
        view.setInt16(44 + i * 2, intSample, true);
      }
      
      const blob = new Blob([buffer], { type: 'audio/wav' });
      return URL.createObjectURL(blob);
    } catch (error) {
      console.log('Could not create sound data URL');
      return '';
    }
  };

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('musicEnabled', JSON.stringify(isMusicEnabled));
  }, [isMusicEnabled]);

  useEffect(() => {
    localStorage.setItem('soundEnabled', JSON.stringify(isSoundEnabled));
  }, [isSoundEnabled]);

  useEffect(() => {
    localStorage.setItem('musicVolume', musicVolume.toString());
    if (backgroundMusicRef.current) {
      backgroundMusicRef.current.volume = musicVolume;
    }
  }, [musicVolume]);

  useEffect(() => {
    localStorage.setItem('soundVolume', soundVolume.toString());
    soundCacheRef.current.forEach(audio => {
      audio.volume = soundVolume;
    });
  }, [soundVolume]);

  const toggleMusic = () => {
    setIsMusicEnabled(!isMusicEnabled);
    if (!isMusicEnabled && backgroundMusicRef.current) {
      backgroundMusicRef.current.play().catch(() => {
        // Handle autoplay restrictions
        console.log('Music autoplay blocked by browser');
      });
    } else if (backgroundMusicRef.current) {
      backgroundMusicRef.current.pause();
    }
  };

  const toggleSound = () => {
    setIsSoundEnabled(!isSoundEnabled);
  };

  const playSound = (soundType: SoundType) => {
    if (!isSoundEnabled) return;
    
    const audio = soundCacheRef.current.get(soundType);
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(() => {
        // Handle play restrictions
        console.log(`Could not play ${soundType} sound`);
      });
    }
  };

  return (
    <AudioContext.Provider value={{
      isMusicEnabled,
      isSoundEnabled,
      toggleMusic,
      toggleSound,
      playSound,
      setMusicVolume,
      setSoundVolume,
      musicVolume,
      soundVolume
    }}>
      {children}
    </AudioContext.Provider>
  );
};