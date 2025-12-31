import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Layout } from '../components/Layout';
import { GameState, MathConfig } from '../types';
import { generateSequence } from '../services/mathUtils';
import { Play, RefreshCw, Settings, Square, Check, Trophy } from 'lucide-react';

export const FlashPractice: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.CONFIG);
  const [config, setConfig] = useState<MathConfig>({ 
    digits: 1, 
    terms: 5, 
    speed: 1000, 
    fontSize: 'medium',
    onlyPositive: false 
  });
  
  // Local state for inputs to allow empty string while typing
  const [digitsInput, setDigitsInput] = useState<string>('1');
  const [termsInput, setTermsInput] = useState<string>('5');

  const [currentNumber, setCurrentNumber] = useState<string | null>(null);
  const [expectedAnswer, setExpectedAnswer] = useState<number>(0);
  const [userAnswer, setUserAnswer] = useState<string>('');
  
  // Score State
  const [score, setScore] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  
  // Refs for control
  const stopRef = useRef(false);
  const isMountedRef = useRef(true);

  // Speed Options (ms) - Minimum 250ms
  const speedOptions = [
    250, 300, 350, 400, 450, 500, 600, 700, 800, 900, 1000, 
    1200, 1500, 2000, 2500, 3000
  ];

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      stopRef.current = true; // Stop any running loop on unmount
    };
  }, []);

  const getFontSize = () => {
    switch(config.fontSize) {
      case 'small': return 'text-6xl';
      case 'large': return 'text-[10rem]';
      default: return 'text-9xl';
    }
  };

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
    
    // Generate sequence using the new validated values
    const { sequence, expectedAnswer: answer } = generateSequence(newConfig.digits, newConfig.terms, newConfig.onlyPositive);
    setExpectedAnswer(answer);
    
    // Switch UI
    setGameState(GameState.PLAYING);
    setUserAnswer('');
    setCurrentNumber(null); // Ensure blank start

    // Initial countdown/delay
    await sleep(800);

    for (let i = 0; i < sequence.length; i++) {
      if (stopRef.current || !isMountedRef.current) break;

      const item = sequence[i];
      const display = item.operation === '-' ? `-${item.value}` : `${item.value}`;
      
      // Show number
      setCurrentNumber(display);
      
      // Wait for configured speed
      await sleep(newConfig.speed || 1000);
      
      if (stopRef.current || !isMountedRef.current) break;

      // Clear number (blank interval)
      setCurrentNumber(null);
      
      // Short gap between numbers (150ms)
      await sleep(150);
    }

    // Finished loop
    if (!stopRef.current && isMountedRef.current) {
      setGameState(GameState.INPUT);
    }
  }, [config, digitsInput, termsInput]);

  const stopGame = () => {
    stopRef.current = true;
    setCurrentNumber(null);
    setGameState(GameState.CONFIG);
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
  };

  const nextQuestion = () => {
    startGame();
  };

  // --- Renders ---

  const renderConfig = () => (
    <div className="glass-panel p-10 rounded-3xl shadow-soft max-w-lg mx-auto w-full animate-in zoom-in-95 duration-300 relative">
      {totalQuestions > 0 && (
          <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 shadow-md border border-slate-100 dark:border-slate-600 rounded-full px-6 py-2 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <span className="font-bold text-slate-700 dark:text-slate-200">Score: {score} / {totalQuestions}</span>
          </div>
      )}

      <h2 className="text-2xl font-bold text-tusgu-blue dark:text-blue-300 mb-8 flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-slate-700">
        <Settings className="w-6 h-6" /> 
        <span>Setup Flash</span>
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
              className="w-full p-4 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-2xl font-bold text-center text-tusgu-blue dark:text-blue-300 focus:ring-2 focus:ring-tusgu-blue outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Terms</label>
            <input
              type="number"
              min="2"
              value={termsInput}
              onChange={(e) => setTermsInput(e.target.value)}
              className="w-full p-4 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-2xl font-bold text-center text-tusgu-blue dark:text-blue-300 focus:ring-2 focus:ring-tusgu-blue outline-none transition-all"
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
           <label className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Speed (ms)</label>
           <div className="relative">
              <select 
                className="w-full p-4 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl appearance-none text-gray-700 dark:text-gray-200 font-medium focus:ring-2 focus:ring-tusgu-blue outline-none transition-all"
                value={config.speed || 1000}
                onChange={(e) => setConfig({...config, speed: parseInt(e.target.value)})}
              >
                {speedOptions.map((s) => (
                  <option key={s} value={s}>{s} ms</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
              </div>
           </div>
        </div>

        <div className="space-y-2">
           <label className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Font Size</label>
           <div className="flex gap-2 bg-gray-50 dark:bg-slate-800 p-1 rounded-xl">
             {['small', 'medium', 'large'].map((s) => (
               <button
                 key={s}
                 onClick={() => setConfig({...config, fontSize: s as any})}
                 className={`flex-1 py-3 capitalize rounded-lg text-sm font-bold transition-all ${config.fontSize === s ? 'bg-white dark:bg-slate-700 text-tusgu-blue dark:text-blue-300 shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
               >
                 {s}
               </button>
             ))}
           </div>
        </div>

        <button 
          onClick={startGame}
          className="w-full bg-gradient-to-r from-tusgu-blue to-blue-800 text-white py-5 rounded-2xl font-bold text-lg hover:shadow-lg hover:shadow-blue-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
        >
          <Play className="w-6 h-6 fill-current" /> Start Flash
        </button>
      </div>
    </div>
  );

  const renderPlaying = () => (
    <div className="relative flex flex-col items-center justify-center h-[65vh] w-full max-w-4xl mx-auto bg-white rounded-[2.5rem] shadow-soft border border-white/50 overflow-hidden">
       {currentNumber ? (
         <span className={`${getFontSize()} font-black text-slate-800 transition-none`}>
           {currentNumber}
         </span>
       ) : (
         /* Clean blank slate between numbers */
         <div className="w-full h-full"></div>
       )}
       
       <button
        onClick={stopGame}
        className="absolute bottom-8 flex items-center gap-2 px-6 py-2 bg-slate-100 text-slate-500 rounded-full font-bold hover:bg-red-50 hover:text-red-600 transition-colors z-10"
      >
        <Square className="w-4 h-4 fill-current" /> Stop
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
        className="w-full text-center text-6xl font-black text-slate-800 dark:text-white tracking-tight border-b-4 border-tusgu-blue focus:border-blue-400 bg-transparent focus:outline-none py-6 mb-10 placeholder-gray-200 dark:placeholder-slate-700 transition-colors"
        placeholder="0"
      />
      <button 
        onClick={checkAnswer}
        className="w-full bg-tusgu-blue text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-900 shadow-lg shadow-blue-900/20 transition-all active:scale-[0.98]"
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
            className="flex items-center justify-center gap-2 py-4 px-6 rounded-xl bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-300 hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
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
    <Layout title="Flash Practice">
      {gameState === GameState.CONFIG && renderConfig()}
      {gameState === GameState.PLAYING && renderPlaying()}
      {gameState === GameState.INPUT && renderInput()}
      {gameState === GameState.FEEDBACK && renderFeedback()}
    </Layout>
  );
};