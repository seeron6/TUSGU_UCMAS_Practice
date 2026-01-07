import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Layout } from '../components/Layout';
import { GameState, MathConfig, MathSequenceItem } from '../types';
import { generateSequence } from '../services/mathUtils';
import { Volume2, Play, RefreshCw, Settings, Square, Trophy, Check } from 'lucide-react';
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { Capacitor } from '@capacitor/core';

export const ListeningPractice: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.CONFIG);
  // Default config with listening speed
  const [config, setConfig] = useState<MathConfig>({ 
    digits: 1, 
    terms: 5, 
    voiceIndex: 0,
    listeningSpeed: 1.0,
    onlyPositive: false
  });

  // Local state for inputs to allow empty string while typing
  const [digitsInput, setDigitsInput] = useState<string>('1');
  const [termsInput, setTermsInput] = useState<string>('5');
  
  // Custom mapped voices
  const [voiceOptions, setVoiceOptions] = useState<{name: string, voiceIndex: number}[]>([]);
  
  const [currentSequence, setCurrentSequence] = useState<MathSequenceItem[]>([]);
  const [expectedAnswer, setExpectedAnswer] = useState<number>(0);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const stopRef = useRef(false);

  // Score State
  const [score, setScore] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);

  // Load and Map Voices
  useEffect(() => {
    const loadAndMapVoices = async () => {
      try {
        const result = await TextToSpeech.getSupportedVoices();
        const allVoices = result.voices;
        
        // Helper to find index in the voices array
        const findVoiceIndex = (keywords: string[], genderHint: string, excludeIndices: number[] = []): number => {
          let idx = allVoices.findIndex((v, i) => !excludeIndices.includes(i) && keywords.some(k => v.name.toLowerCase().includes(k.toLowerCase())));
          
          if (idx === -1) {
            // Try to match gender if possible (Note: standard plugin response might not have explicit gender field in all versions, relying on name)
             idx = allVoices.findIndex((v, i) => !excludeIndices.includes(i) && v.name.toLowerCase().includes(genderHint));
          }
          
          if (idx === -1) {
             // Fallback to any English voice
             idx = allVoices.findIndex((v, i) => !excludeIndices.includes(i) && v.lang.startsWith('en'));
          }

          if (idx === -1) return -1;
          return idx;
        };

        const usedIndices: number[] = [];
        const slots: {name: string, voiceIndex: number}[] = [];

        // Define our desired instructor slots
        const definitions = [
          { label: "Instructor 1 (Female)", keywords: ['Samantha', 'Zira', 'Ava', 'Google US English'], gender: 'female' },
          { label: "Instructor 2 (Female)", keywords: ['Martha', 'Serena', 'Google UK English Female'], gender: 'female' },
          { label: "Instructor 3 (Female)", keywords: ['Moira', 'Tessa', 'Fiona'], gender: 'female' },
          { label: "Instructor 4 (Female)", keywords: ['Susan', 'Vicki', 'Karen'], gender: 'female' },
          { label: "Instructor 5 (Female)", keywords: ['Monica', 'Amelie'], gender: 'female' },
          { label: "Instructor 6 (Male)", keywords: ['Daniel', 'Google UK English Male'], gender: 'male' },
          { label: "Instructor 7 (Male)", keywords: ['Alex', 'Fred', 'Google US English'], gender: 'male' },
          { label: "Instructor 8 (Male)", keywords: ['Rishi', 'David'], gender: 'male' },
          { label: "Instructor 9 (Male)", keywords: ['Mark', 'Bruce'], gender: 'male' },
          { label: "Instructor 10 (Male)", keywords: ['James', 'Tom'], gender: 'male' },
        ];

        definitions.forEach(def => {
          const idx = findVoiceIndex(def.keywords, def.gender, usedIndices);
          if (idx !== -1) {
            usedIndices.push(idx);
            slots.push({ name: def.label, voiceIndex: idx });
          } else {
            // Fallback if we run out of unique voices, reuse first available or just placeholder
            if (allVoices.length > 0) {
               slots.push({ name: def.label, voiceIndex: 0 }); 
            }
          }
        });
        
        // If we found nothing (e.g. no permissions or empty list), set empty or default
        if (slots.length === 0 && allVoices.length > 0) {
           slots.push({ name: "Default Voice", voiceIndex: 0 });
        }

        setVoiceOptions(slots);
      } catch (e) {
        console.error("Failed to load TTS voices", e);
      }
    };

    loadAndMapVoices();
    
    // For web compatibility, we might want to listen to changes, but Capacitor plugin doesn't have a direct 'onvoiceschanged' listener exposed easily in the same way.
    // Usually fetching once on mount is sufficient for native.
  }, []);

  const startGame = useCallback(async () => {
    const d = parseInt(digitsInput);
    const t = parseInt(termsInput);

    if (isNaN(d) || d < 1 || isNaN(t) || t < 2) {
      return;
    }

    const newConfig = { ...config, digits: d, terms: t };
    setConfig(newConfig);

    stopRef.current = false;
    const { sequence, expectedAnswer } = generateSequence(newConfig.digits, newConfig.terms, newConfig.onlyPositive);
    setCurrentSequence(sequence);
    setExpectedAnswer(expectedAnswer);
    setGameState(GameState.PLAYING);
    setIsPlaying(true);
    setUserAnswer('');

    const gapDelay = 1000 / (newConfig.listeningSpeed || 1);
    const opGap = 800 / (newConfig.listeningSpeed || 1);

    for (let i = 0; i < sequence.length; i++) {
      if (stopRef.current) break;
      
      const item = sequence[i];
      
      if (i > 0) {
        const prevItem = sequence[i - 1];
        
        if (item.operation === '-') {
            await speakText("Minus", newConfig);
        } else if (item.operation === '+' && prevItem.operation === '-') {
            await speakText("Plus", newConfig);
        } else {
             await new Promise(resolve => setTimeout(resolve, opGap)); 
        }
      }

      if (stopRef.current) break;

      await speakText(item.value.toString(), newConfig);
      
      if (stopRef.current) break;

      await new Promise(resolve => setTimeout(resolve, gapDelay));
    }

    if (!stopRef.current) {
      setIsPlaying(false);
      setGameState(GameState.INPUT);
    }
  }, [config, digitsInput, termsInput, voiceOptions]);

  const stopGame = async () => {
    stopRef.current = true;
    try {
      await TextToSpeech.stop();
    } catch (e) {
      console.warn("Error stopping TTS", e);
    }
    setIsPlaying(false);
    setGameState(GameState.CONFIG);
  };

  const speakText = async (text: string, currentConfig: MathConfig): Promise<void> => {
    if (stopRef.current) return;
    
    const selectedOption = voiceOptions[currentConfig.voiceIndex || 0];
    const voiceIdx = selectedOption ? selectedOption.voiceIndex : 0;
    
    // Adjust rate for platform differences if necessary. 
    // Capacitor TTS: 1.0 is standard.
    const rate = currentConfig.listeningSpeed || 1.0;

    try {
      await TextToSpeech.speak({
        text: text,
        lang: 'en-US', // Default fallback
        rate: rate,
        voice: voiceIdx,
        volume: 1.0,
        category: 'ambient', // 'ambient' allows mixing, but on iOS for educational apps 'playback' is often better implied by the plugin
      });
    } catch (e) {
      console.error("TTS Error:", e);
      // Fallback delay if sound fails so game doesn't rush
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  };

  const checkAnswer = () => {
    const isCorrect = parseInt(userAnswer) === expectedAnswer;
    if (isCorrect) {
      setScore(s => s + 1);
    }
    setTotalQuestions(t => t + 1);
    setGameState(GameState.FEEDBACK);
  };

  const resetGame = () => {
    setGameState(GameState.CONFIG);
    setUserAnswer('');
  };

  const nextQuestion = () => {
     startGame();
  };

  // --- Renders ---

  const renderConfig = () => {
    const speedLevels = [
        { label: "Level 1 (Normal)", value: 1.0 },
        { label: "Level 2", value: 1.2 },
        { label: "Level 3", value: 1.4 },
        { label: "Level 4", value: 1.6 },
        { label: "Level 5", value: 1.8 },
        { label: "Level 6 (Fastest)", value: 2.0 }
    ];

    const currentSpeedValue = config.listeningSpeed || 1.0;

    return (
      <div className="glass-panel p-10 rounded-3xl shadow-soft max-w-lg mx-auto w-full animate-in zoom-in-95 duration-300 dark:border-slate-700 relative">
        {totalQuestions > 0 && (
          <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 shadow-md border border-slate-100 dark:border-slate-600 rounded-full px-6 py-2 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <span className="font-bold text-slate-700 dark:text-slate-200">Score: {score} / {totalQuestions}</span>
          </div>
        )}

        <h2 className="text-2xl font-bold text-tusgu-blue dark:text-blue-300 mb-8 flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-gray-700">
          <Settings className="w-6 h-6" /> 
          <span>Setup Practice</span>
        </h2>
        
        <div className="space-y-8">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Digits</label>
              <input
                type="number"
                min="1"
                value={digitsInput}
                onChange={(e) => setDigitsInput(e.target.value)}
                className="w-full p-4 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-2xl font-bold text-center text-tusgu-blue dark:text-blue-300 focus:ring-2 focus:ring-tusgu-blue focus:border-transparent outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Terms</label>
              <input
                type="number"
                min="2"
                value={termsInput}
                onChange={(e) => setTermsInput(e.target.value)}
                className="w-full p-4 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-2xl font-bold text-center text-tusgu-blue dark:text-blue-300 focus:ring-2 focus:ring-tusgu-blue focus:border-transparent outline-none transition-all"
              />
            </div>
          </div>

          {/* Addition Only Toggle */}
          <div 
            onClick={() => setConfig({ ...config, onlyPositive: !config.onlyPositive })}
            className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl cursor-pointer hover:border-tusgu-blue dark:hover:border-blue-400 transition-colors group"
          >
             <div className="flex items-center gap-3">
               <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${config.onlyPositive ? 'bg-tusgu-blue text-white' : 'bg-gray-200 text-gray-400 dark:bg-slate-700'}`}>
                  {config.onlyPositive && <Check className="w-4 h-4" />}
               </div>
               <span className="font-bold text-slate-700 dark:text-slate-200">Addition Only</span>
             </div>
             <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
               {config.onlyPositive ? 'On' : 'Off'}
             </span>
          </div>

          <div className="space-y-2">
             <label className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Speed</label>
             <div className="relative">
                <select 
                  className="w-full p-4 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl appearance-none text-gray-700 dark:text-gray-200 font-medium focus:ring-2 focus:ring-tusgu-blue outline-none transition-all"
                  value={speedLevels.find(l => Math.abs(l.value - currentSpeedValue) < 0.1)?.value || 1.0}
                  onChange={(e) => setConfig({...config, listeningSpeed: parseFloat(e.target.value)})}
                >
                  {speedLevels.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
                </div>
             </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Voice Instructor</label>
            <div className="relative">
              <select 
                className="w-full p-4 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl appearance-none text-gray-700 dark:text-gray-200 font-medium focus:ring-2 focus:ring-tusgu-blue outline-none transition-all"
                value={config.voiceIndex}
                onChange={(e) => setConfig({...config, voiceIndex: parseInt(e.target.value)})}
              >
                {voiceOptions.map((v, i) => (
                  <option key={i} value={i}>{v.name}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-1 pl-1">
               * Voices may vary slightly across different devices.
            </p>
          </div>

          <button 
            onClick={startGame}
            className="w-full bg-gradient-to-r from-tusgu-blue to-blue-700 hover:from-blue-800 hover:to-blue-900 text-white py-5 rounded-2xl font-bold text-lg hover:shadow-lg hover:shadow-blue-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
          >
            <Play className="w-6 h-6 fill-current" /> Start Session
          </button>
        </div>
      </div>
    );
  };

  const renderPlaying = () => (
    <div className="flex flex-col items-center justify-center min-h-[50vh] animate-in fade-in duration-500">
      <div className={`
        relative w-64 h-64 rounded-full flex items-center justify-center
        ${isPlaying ? 'bg-blue-50 dark:bg-blue-900/20 shadow-glow' : 'bg-gray-50 dark:bg-slate-800'} transition-all duration-500
      `}>
        {isPlaying && (
          <div className="absolute inset-0 rounded-full border-4 border-blue-100 dark:border-blue-800 animate-ping opacity-20"></div>
        )}
        <Volume2 className={`w-32 h-32 ${isPlaying ? 'text-tusgu-blue dark:text-blue-400' : 'text-gray-300 dark:text-slate-600'} transition-colors duration-300`} />
      </div>
      
      <p className="mt-8 text-2xl font-bold text-slate-700 dark:text-slate-200 tracking-wide">
        {isPlaying ? 'Listen Carefully...' : 'Finished'}
      </p>

      <button
        onClick={stopGame}
        className="mt-12 flex items-center gap-2 px-8 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full font-bold hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
      >
        <Square className="w-5 h-5 fill-current" /> Stop Question
      </button>
    </div>
  );

  const renderInput = () => (
    <div className="glass-panel p-10 rounded-3xl shadow-soft max-w-lg mx-auto w-full text-center animate-in zoom-in-95 duration-300 dark:border-slate-700">
      <h3 className="text-xl font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-8">What is the result?</h3>
      <input
        type="number"
        autoFocus
        value={userAnswer}
        onChange={(e) => setUserAnswer(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && checkAnswer()}
        className="w-full text-center text-6xl font-black text-slate-800 dark:text-white tracking-tight border-b-4 border-tusgu-blue dark:border-blue-500 focus:border-blue-400 bg-transparent focus:outline-none py-6 mb-10 placeholder-gray-200 dark:placeholder-slate-700 transition-colors"
        placeholder="0"
      />
      <button 
        onClick={checkAnswer}
        className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition-all active:scale-[0.98]"
      >
        Submit Answer
      </button>
    </div>
  );

  const renderFeedback = () => {
    const isCorrect = parseInt(userAnswer) === expectedAnswer;
    return (
      <div className="glass-panel p-10 rounded-3xl shadow-soft max-w-lg mx-auto w-full text-center animate-in zoom-in-95 duration-300 dark:border-slate-700 relative">
        <div className="absolute top-6 right-6 flex items-center gap-2 text-slate-400 dark:text-slate-500 font-bold text-sm bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <span>{score} / {totalQuestions}</span>
        </div>

        <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6 ${isCorrect ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
           {isCorrect ? <span className="text-5xl">✓</span> : <span className="text-5xl">✗</span>}
        </div>
        <h2 className={`text-4xl font-black mb-2 ${isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {isCorrect ? 'Correct!' : 'Incorrect'}
        </h2>
        <div className="my-8 p-6 bg-slate-50 dark:bg-slate-800 rounded-xl">
           <p className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-widest mb-2">The answer is</p>
           <p className="text-5xl font-black text-slate-800 dark:text-white">{expectedAnswer}</p>
           {!isCorrect && <p className="text-red-400 mt-2 font-medium">You wrote {userAnswer}</p>}
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={resetGame}
            className="flex items-center justify-center gap-2 py-4 px-6 rounded-xl bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
          >
            <Settings className="w-5 h-5" /> Settings
          </button>
          <button 
            onClick={nextQuestion}
            className="flex items-center justify-center gap-2 py-4 px-6 rounded-xl bg-tusgu-blue text-white font-bold hover:bg-blue-900 shadow-lg shadow-blue-900/20 transition-all active:scale-[0.98]"
          >
            <RefreshCw className="w-5 h-5" /> Next
          </button>
        </div>
      </div>
    );
  };

  return (
    <Layout title="Listening Practice">
      {gameState === GameState.CONFIG && renderConfig()}
      {gameState === GameState.PLAYING && renderPlaying()}
      {gameState === GameState.INPUT && renderInput()}
      {gameState === GameState.FEEDBACK && renderFeedback()}
    </Layout>
  );
};