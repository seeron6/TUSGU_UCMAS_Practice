import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Layout } from '../components/Layout';
import { GameState, MathConfig, MathSequenceItem } from '../types';
import { generateSequence } from '../services/mathUtils';
import { Volume2, Play, RefreshCw, Settings, Square } from 'lucide-react';

export const ListeningPractice: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.CONFIG);
  // Default config with listening speed
  const [config, setConfig] = useState<MathConfig>({ 
    digits: 1, 
    terms: 5, 
    voiceIndex: 0,
    listeningSpeed: 1.0 
  });
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [currentSequence, setCurrentSequence] = useState<MathSequenceItem[]>([]);
  const [expectedAnswer, setExpectedAnswer] = useState<number>(0);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const stopRef = useRef(false);

  // Load voices
  useEffect(() => {
    const loadVoices = () => {
      const available = window.speechSynthesis.getVoices();
      setVoices(available);
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const startGame = useCallback(async () => {
    stopRef.current = false;
    const { sequence, expectedAnswer } = generateSequence(config.digits, config.terms);
    setCurrentSequence(sequence);
    setExpectedAnswer(expectedAnswer);
    setGameState(GameState.PLAYING);
    setIsPlaying(true);
    setUserAnswer('');

    // Calculate delay based on speed (faster speed = shorter delay)
    // Base delay is 1000ms. If speed is 2.0, delay is 500ms.
    const gapDelay = 600 / (config.listeningSpeed || 1);
    const opGap = 1000 / (config.listeningSpeed || 1);

    for (let i = 0; i < sequence.length; i++) {
      if (stopRef.current) break;
      
      const item = sequence[i];
      
      if (i > 0) {
        if (item.operation === '-') {
            await speakText("Minus");
        } else {
             await new Promise(resolve => setTimeout(resolve, opGap)); 
        }
      }

      if (stopRef.current) break;

      await speakText(item.value.toString());
      
      if (stopRef.current) break;

      await new Promise(resolve => setTimeout(resolve, gapDelay));
    }

    if (!stopRef.current) {
      setIsPlaying(false);
      setGameState(GameState.INPUT);
    }
  }, [config, voices]);

  const stopGame = () => {
    stopRef.current = true;
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setGameState(GameState.CONFIG);
  };

  const speakText = (text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (stopRef.current) {
        resolve();
        return;
      }
      const utterance = new SpeechSynthesisUtterance(text);
      if (voices[config.voiceIndex || 0]) {
        utterance.voice = voices[config.voiceIndex || 0];
      }
      // Apply configured speed (0.5 to 2.0)
      utterance.rate = config.listeningSpeed || 1.0;
      
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve(); 
      window.speechSynthesis.speak(utterance);
    });
  };

  const checkAnswer = () => {
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

  const renderConfig = () => (
    <div className="glass-panel p-10 rounded-3xl shadow-soft max-w-lg mx-auto w-full animate-in zoom-in-95 duration-300 dark:border-slate-700">
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
              value={config.digits}
              onChange={(e) => setConfig({...config, digits: Math.max(1, parseInt(e.target.value) || 0)})}
              className="w-full p-4 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-2xl font-bold text-center text-tusgu-blue dark:text-blue-300 focus:ring-2 focus:ring-tusgu-blue focus:border-transparent outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Terms</label>
            <input
              type="number"
              min="2"
              value={config.terms}
              onChange={(e) => setConfig({...config, terms: Math.max(2, parseInt(e.target.value) || 0)})}
              className="w-full p-4 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-2xl font-bold text-center text-tusgu-blue dark:text-blue-300 focus:ring-2 focus:ring-tusgu-blue focus:border-transparent outline-none transition-all"
            />
          </div>
        </div>

        <div className="space-y-2">
           <label className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Speed</label>
           <div className="flex items-center gap-4 bg-gray-50 dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700">
             <span className="text-xs font-bold text-gray-400">Slow</span>
             <input 
               type="range" 
               min="0.5" 
               max="2.0" 
               step="0.1"
               value={config.listeningSpeed} 
               onChange={(e) => setConfig({...config, listeningSpeed: parseFloat(e.target.value)})}
               className="flex-grow h-2 bg-gray-300 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-tusgu-blue"
             />
             <span className="text-xs font-bold text-gray-400">Fast</span>
             <div className="text-lg font-bold text-tusgu-blue dark:text-blue-300 w-12 text-right">
               {config.listeningSpeed?.toFixed(1)}x
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
              {voices.map((v, i) => (
                <option key={i} value={i}>{v.name}</option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
            </div>
          </div>
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
      <div className="glass-panel p-10 rounded-3xl shadow-soft max-w-lg mx-auto w-full text-center animate-in zoom-in-95 duration-300 dark:border-slate-700">
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
