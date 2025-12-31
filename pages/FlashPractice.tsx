import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Layout } from '../components/Layout';
import { GameState, MathConfig } from '../types';
import { generateSequence } from '../services/mathUtils';
import { Play, RefreshCw, Settings, Square } from 'lucide-react';

export const FlashPractice: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.CONFIG);
  const [config, setConfig] = useState<MathConfig>({ digits: 1, terms: 5, speed: 1000, fontSize: 'medium' });
  const [currentNumber, setCurrentNumber] = useState<string | null>(null);
  const [expectedAnswer, setExpectedAnswer] = useState<number>(0);
  const [userAnswer, setUserAnswer] = useState<string>('');
  
  // Refs for control
  const stopRef = useRef(false);
  const isMountedRef = useRef(true);

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
    stopRef.current = false;
    
    // Generate sequence
    const { sequence, expectedAnswer: answer } = generateSequence(config.digits, config.terms);
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
      await sleep(config.speed || 1000);
      
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
  }, [config]);

  const stopGame = () => {
    stopRef.current = true;
    setCurrentNumber(null);
    setGameState(GameState.CONFIG);
  };

  const checkAnswer = () => {
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
    <div className="glass-panel p-10 rounded-3xl shadow-soft max-w-lg mx-auto w-full animate-in zoom-in-95 duration-300">
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
              value={config.digits}
              onChange={(e) => setConfig({...config, digits: Math.max(1, parseInt(e.target.value) || 0)})}
              className="w-full p-4 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-2xl font-bold text-center text-tusgu-blue dark:text-blue-300 focus:ring-2 focus:ring-tusgu-blue outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Terms</label>
            <input
              type="number"
              min="2"
              value={config.terms}
              onChange={(e) => setConfig({...config, terms: Math.max(2, parseInt(e.target.value) || 0)})}
              className="w-full p-4 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-2xl font-bold text-center text-tusgu-blue dark:text-blue-300 focus:ring-2 focus:ring-tusgu-blue outline-none transition-all"
            />
          </div>
        </div>

        <div className="space-y-2">
           <label className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Speed (ms)</label>
           <div className="flex items-center gap-4 bg-gray-50 dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700">
             <input 
               type="range" 
               min="100" 
               max="2000" 
               step="50"
               value={config.speed} 
               onChange={(e) => setConfig({...config, speed: parseInt(e.target.value)})}
               className="flex-grow h-2 bg-gray-300 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-tusgu-blue"
             />
             <div className="text-lg font-bold text-tusgu-blue dark:text-blue-300 w-20 text-right">{config.speed} ms</div>
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
          className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white py-5 rounded-2xl font-bold text-lg hover:shadow-lg hover:shadow-amber-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
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
        className="w-full text-center text-6xl font-black text-slate-800 dark:text-white tracking-tight border-b-4 border-amber-500 focus:border-amber-400 bg-transparent focus:outline-none py-6 mb-10 placeholder-gray-200 dark:placeholder-slate-700 transition-colors"
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
            className="flex items-center justify-center gap-2 py-4 px-6 rounded-xl bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-300 hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
          >
            <Settings className="w-5 h-5" /> Settings
          </button>
          <button 
            onClick={nextQuestion}
            className="flex items-center justify-center gap-2 py-4 px-6 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600 shadow-lg shadow-amber-500/20 transition-all active:scale-[0.98]"
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