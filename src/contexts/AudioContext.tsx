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
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const musicGainNodeRef = useRef<GainNode | null>(null);
  const musicOscillatorsRef = useRef<OscillatorNode[]>([]);
  const soundCacheRef = useRef<Map<SoundType, HTMLAudioElement>>(new Map());
  const musicIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Classical music note frequencies (in Hz)
  const notes = {
    C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
    C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00, B5: 987.77,
    C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, B3: 246.94
  };

  // Classical chord progressions
  const chordProgressions = [
    // I-V-vi-IV (very popular in classical)
    [
      [notes.C4, notes.E4, notes.G4], // C major
      [notes.G3, notes.B3, notes.D4], // G major
      [notes.A3, notes.C4, notes.E4], // A minor
      [notes.F3, notes.A3, notes.C4]  // F major
    ],
    // ii-V-I (jazz/classical)
    [
      [notes.D3, notes.F3, notes.A3], // D minor
      [notes.G3, notes.B3, notes.D4], // G major
      [notes.C4, notes.E4, notes.G4], // C major
      [notes.C4, notes.E4, notes.G4]  // C major
    ]
  ];

  // Beautiful classical melodies
  const melodies = [
    // Pachelbel's Canon inspired
    [notes.D5, notes.A4, notes.B4, notes.F4, notes.G4, notes.D4, notes.G4, notes.A4],
    // Bach inspired
    [notes.C5, notes.B4, notes.A4, notes.G4, notes.F4, notes.E4, notes.D4, notes.C4],
    // Mozart inspired
    [notes.E5, notes.D5, notes.C5, notes.D5, notes.E5, notes.E5, notes.E5, notes.D5]
  ];

  // Initialize audio system
  useEffect(() => {
    initializeAudioContext();
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
      stopBackgroundMusic();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      soundCacheRef.current.clear();
    };
  }, []);

  const initializeAudioContext = () => {
    try {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create master gain node for music
      musicGainNodeRef.current = audioContextRef.current.createGain();
      musicGainNodeRef.current.connect(audioContextRef.current.destination);
      musicGainNodeRef.current.gain.setValueAtTime(musicVolume, audioContextRef.current.currentTime);
      
    } catch (error) {
      console.log('Web Audio API not supported');
    }
  };

  const createClassicalMusic = () => {
    if (!audioContextRef.current || !musicGainNodeRef.current) return;

    const audioContext = audioContextRef.current;
    const masterGain = musicGainNodeRef.current;

    // Clear existing oscillators
    stopBackgroundMusic();

    let currentChordIndex = 0;
    let currentMelodyIndex = 0;
    let currentMelodyNote = 0;
    const currentProgression = chordProgressions[0];
    const currentMelody = melodies[Math.floor(Math.random() * melodies.length)];

    const playChord = (chord: number[], duration: number = 4) => {
      const chordOscillators: OscillatorNode[] = [];
      
      chord.forEach((frequency, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        
        // Soft attack and release for classical feel
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.5);
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime + duration - 0.5);
        gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + duration);
        
        oscillator.connect(gainNode);
        gainNode.connect(masterGain);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
        
        chordOscillators.push(oscillator);
      });
      
      musicOscillatorsRef.current.push(...chordOscillators);
    };

    const playMelodyNote = (frequency: number, duration: number = 1) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.type = 'triangle'; // Warmer sound for melody
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      
      // Gentle envelope for melody
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.15, audioContext.currentTime + duration - 0.1);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + duration);
      
      oscillator.connect(gainNode);
      gainNode.connect(masterGain);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
      
      musicOscillatorsRef.current.push(oscillator);
    };

    const scheduleMusic = () => {
      if (!isMusicEnabled) return;
      
      // Play chord progression
      const currentChord = currentProgression[currentChordIndex];
      playChord(currentChord, 4);
      
      // Play melody notes over the chord
      for (let i = 0; i < 4; i++) {
        setTimeout(() => {
          if (isMusicEnabled && currentMelodyNote < currentMelody.length) {
            playMelodyNote(currentMelody[currentMelodyNote], 0.8);
            currentMelodyNote = (currentMelodyNote + 1) % currentMelody.length;
          }
        }, i * 1000);
      }
      
      currentChordIndex = (currentChordIndex + 1) % currentProgression.length;
      
      // Schedule next chord
      musicIntervalRef.current = setTimeout(scheduleMusic, 4000);
    };

    // Start the music
    scheduleMusic();
  };

  const stopBackgroundMusic = () => {
    if (musicIntervalRef.current) {
      clearTimeout(musicIntervalRef.current);
      musicIntervalRef.current = null;
    }
    
    musicOscillatorsRef.current.forEach(oscillator => {
      try {
        oscillator.stop();
      } catch (e) {
        // Oscillator might already be stopped
      }
    });
    musicOscillatorsRef.current = [];
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
    if (musicGainNodeRef.current && audioContextRef.current) {
      musicGainNodeRef.current.gain.setValueAtTime(musicVolume, audioContextRef.current.currentTime);
    }
  }, [musicVolume]);

  useEffect(() => {
    localStorage.setItem('soundVolume', soundVolume.toString());
    soundCacheRef.current.forEach(audio => {
      audio.volume = soundVolume;
    });
  }, [soundVolume]);

  // Handle music enable/disable
  useEffect(() => {
    if (isMusicEnabled && audioContextRef.current) {
      // Resume audio context if suspended
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume().then(() => {
          createClassicalMusic();
        });
      } else {
        createClassicalMusic();
      }
    } else {
      stopBackgroundMusic();
    }
  }, [isMusicEnabled]);

  const toggleMusic = () => {
    setIsMusicEnabled(!isMusicEnabled);
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