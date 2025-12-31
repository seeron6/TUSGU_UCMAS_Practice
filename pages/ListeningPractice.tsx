import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Layout } from '../components/Layout';
import { GameState, MathConfig, MathSequenceItem } from '../types';
import { generateSequence } from '../services/mathUtils';
import { Volume2, Play, RefreshCw, Settings, Square, Trophy, Check } from 'lucide-react';

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
  
  // Custom mapped voices to ensure consistency (3 Female, 2 Male target)
  const [voiceOptions, setVoiceOptions] = useState<{name: string, voice: SpeechSynthesisVoice | null}[]>([]);
  
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
    const loadAndMapVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      if (allVoices.length === 0) return;

      const enVoices = allVoices.filter(v => v.lang.startsWith('en'));
      // Fallback to all voices if no English voices
      const pool = enVoices.length > 0 ? enVoices : allVoices;

      // Helper to find specific voices by keyword preference
      const pickVoice = (keywords: string[], genderHint: 'female' | 'male', exclude: SpeechSynthesisVoice[] = []): SpeechSynthesisVoice => {
         // 1. Try exact name match from keywords
         let match = pool.find(v => !exclude.includes(v) && keywords.some(k => v.name.toLowerCase().includes(k.toLowerCase())));
         
         // 2. Try gender hints in name (common in some systems)
         if (!match) {
             match = pool.find(v => !exclude.includes(v) && v.name.toLowerCase().includes(genderHint));
         }

         // 3. Fallback to any unused
         if (!match) {
             match = pool.find(v => !exclude.includes(v));
         }

         // 4. Absolute fallback
         return match || pool[0];
      };

      // Define 5 Standard Slots
      
      // Slot 1: Female (Standard US/General)
      const v1 = pickVoice(['Google US English', 'Samantha', 'Zira', 'Ava', 'Susan'], 'female', []);
      
      // Slot 2: Female (UK/Alternative)
      const v2 = pickVoice(['Google UK English Female', 'Martha', 'Tessa', 'Victoria', 'Agnes'], 'female', [v1]);
      
      // Slot 3: Female (Aus/Other)
      const v3 = pickVoice(['Google Español', 'Moira', 'Karen', 'Veena', 'Fiona'], 'female', [v1, v2]);

      // Slot 4: Male (Standard UK/General)
      const v4 = pickVoice(['Google UK English Male', 'Daniel', 'David', 'Arthur'], 'male', [v1, v2, v3]);
      
      // Slot 5: Male (US/Alternative)
      const v5 = pickVoice(['Google US English', 'Fred', 'Alex', 'Rishi', 'Mark'], 'male', [v1, v2, v3, v4]);

      setVoiceOptions([
          { name: "Instructor 1 (Female)", voice: v1 },
          { name: "Instructor 2 (Female)", voice: v2 },
          { name: "Instructor 3 (Female)", voice: v3 },
          { name: "Instructor 4 (Male)", voice: v4 },
          { name: "Instructor 5 (Male)", voice: v5 },
      ]);
    };
    
    loadAndMapVoices();
    window.speechSynthesis.onvoiceschanged = loadAndMapVoices;
    
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const startGame = useCallback(async () => {
    // Validate inputs
    const d = parseInt(digitsInput);
    const t = parseInt(termsInput);

    // If inputs are empty or invalid, do not start
    if (isNaN(d) || d < 1 || isNaN(t) || t < 2) {
      return;
    }

    // Update main config to match inputs
    const newConfig = { ...config, digits: d, terms: t };
    setConfig(newConfig);

    stopRef.current = false;
    const { sequence, expectedAnswer } = generateSequence(newConfig.digits, newConfig.terms, newConfig.onlyPositive);
    setCurrentSequence(sequence);
    setExpectedAnswer(expectedAnswer);
    setGameState(GameState.PLAYING);
    setIsPlaying(true);
    setUserAnswer('');

    // Calculate delay based on speed (faster speed = shorter delay)
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
            // Only speak "Plus" if we are switching from a negative operation to a positive one
            await speakText("Plus", newConfig);
        } else {
             // Just a pause for consecutive additions
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

  const stopGame = () => {
    stopRef.current = true;
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setGameState(GameState.CONFIG);
  };

  const speakText = (text: string, currentConfig: MathConfig): Promise<void> => {
    return new Promise((resolve) => {
      if (stopRef.current) {
        resolve();
        return;
      }
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Select voice from our mapped options
      const selectedOption = voiceOptions[currentConfig.voiceIndex || 0];
      if (selectedOption && selectedOption.voice) {
        utterance.voice = selectedOption.voice;
      }
      
      // Apply configured speed (0.5 to 2.0)
      utterance.rate = currentConfig.listeningSpeed || 1.0;
      
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve(); 
      window.speechSynthesis.speak(utterance);
    });
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
    const speeds = [1.0, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 2.0];

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
                  value={config.listeningSpeed}
                  onChange={(e) => setConfig({...config, listeningSpeed: parseFloat(e.target.value)})}
                >
                  {speeds.map((s) => (
                    <option key={s} value={s}>{s.toFixed(1)}x</option>
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
               * Voices may vary slightly across different devices (Mobile vs PC).
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