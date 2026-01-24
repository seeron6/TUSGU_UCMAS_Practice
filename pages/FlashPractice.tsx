import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Layout } from '../components/Layout';
import { GameState, MathConfig } from '../types';
import { generateSequence } from '../services/mathUtils';
import { saveGameResult } from '../services/statsService';
import { NumberPad } from '../components/NumberPad';
import { Play, RefreshCw, Settings, Square, Check, Trophy } from 'lucide-react';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { KeepAwake } from '@capacitor-community/keep-awake';

export const FlashPractice: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.CONFIG);
  const [config, setConfig] = useState<MathConfig>({ 
    digits: 1, 
    terms: 5, 
    speed: 1000, 
    fontSize: 'medium',
    onlyPositive: false 
  });
  
  const [digitsInput, setDigitsInput] = useState<string>('1');
  const [termsInput, setTermsInput] = useState<string>('5');
  const [currentNumber, setCurrentNumber] = useState<string | null>(null);
  const [expectedAnswer, setExpectedAnswer] = useState<number>(0);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [score, setScore] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const stopRef = useRef(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      stopRef.current = true;
      KeepAwake.allowSleep();
    };
  }, []);

  const getFontSize = () => {
    switch(config.fontSize) {
      case 'small': return 'text-8xl';
      case 'large': return 'text-[15rem] md:text-[20rem]';
      default: return 'text-[10rem] md:text-[15rem]';
    }
  };

  const startGame = useCallback(async () => {
    await Haptics.impact({ style: ImpactStyle.Heavy });
    await KeepAwake.keepAwake();

    const d = parseInt(digitsInput);
    const t = parseInt(termsInput);
    if (isNaN(d) || d < 1 || isNaN(t) || t < 2) return;

    const newConfig = { ...config, digits: d, terms: t };
    setConfig(newConfig);

    stopRef.current = false;
    const { sequence, expectedAnswer: answer } = generateSequence(newConfig.digits, newConfig.terms, newConfig.onlyPositive);
    setExpectedAnswer(answer);
    
    setGameState(GameState.PLAYING);
    setUserAnswer('');
    setCurrentNumber(null); 

    // Initial delay before first number
    await new Promise(r => setTimeout(r, 800));

    for (let i = 0; i < sequence.length; i++) {
      if (stopRef.current || !isMountedRef.current) break;
      const item = sequence[i];
      setCurrentNumber(item.operation === '-' ? `-${item.value}` : `${item.value}`);
      
      // Display duration
      await new Promise(r => setTimeout(r, newConfig.speed || 1000));
      
      if (stopRef.current || !isMountedRef.current) break;
      
      // Clear screen (gap between numbers)
      setCurrentNumber(null);
      await new Promise(r => setTimeout(r, 150));
    }

    if (!stopRef.current && isMountedRef.current) {
      setGameState(GameState.INPUT);
      await KeepAwake.allowSleep();
    }
  }, [config, digitsInput, termsInput]);

  const stopGame = async () => {
    stopRef.current = true;
    await Haptics.impact({ style: ImpactStyle.Medium });
    await KeepAwake.allowSleep();
    setCurrentNumber(null);
    setGameState(GameState.CONFIG);
  };

  const checkAnswer = async () => {
    const isCorrect = parseInt(userAnswer) === expectedAnswer;
    setScore(s => isCorrect ? s + 1 : s);
    setTotalQuestions(t => t + 1);

    if (isCorrect) await Haptics.notification({ type: NotificationType.Success });
    else await Haptics.notification({ type: NotificationType.Error });

    saveGameResult({
      type: 'flash',
      score: isCorrect ? 1 : 0,
      total: 1,
      config: `${config.digits}D ${config.terms}T (${config.speed}ms)`
    });

    setGameState(GameState.FEEDBACK);
  };

  const renderConfig = () => (
    <div className="glass-panel p-8 md:p-12 rounded-[3rem] shadow-soft w-full max-w-5xl mx-auto animate-in zoom-in-95 duration-300 relative flex flex-col gap-10">
       {totalQuestions > 0 && (
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 shadow-lg border border-slate-100 dark:border-slate-600 rounded-full px-8 py-3 flex items-center gap-3 z-10">
            <Trophy className="w-6 h-6 text-yellow-500" />
            <span className="font-bold text-slate-700 dark:text-slate-200 text-xl">Score: {score} / {totalQuestions}</span>
          </div>
       )}
       <div className="grid grid-cols-2 gap-8">
          <div className="space-y-4">
            <label className="text-base font-bold text-gray-500 uppercase tracking-wide ml-1">Digits</label>
            <input 
              type="tel" 
              inputMode="numeric"
              pattern="[0-9]*"
              value={digitsInput} 
              onChange={(e) => setDigitsInput(e.target.value.replace(/\D/g,''))} 
              className="w-full p-6 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-3xl text-3xl font-bold text-center text-tusgu-blue dark:text-blue-300 outline-none" 
            />
          </div>
          <div className="space-y-4">
            <label className="text-base font-bold text-gray-500 uppercase tracking-wide ml-1">Rows</label>
            <input 
              type="tel" 
              inputMode="numeric"
              pattern="[0-9]*"
              value={termsInput} 
              onChange={(e) => setTermsInput(e.target.value.replace(/\D/g,''))} 
              className="w-full p-6 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-3xl text-3xl font-bold text-center text-tusgu-blue dark:text-blue-300 outline-none" 
            />
          </div>
       </div>
       <div onClick={() => setConfig({ ...config, onlyPositive: !config.onlyPositive })} className="flex items-center justify-between p-6 bg-gray-50 dark:bg-slate-800 border border-gray-200 rounded-3xl active:bg-slate-100 dark:active:bg-slate-700 transition-colors cursor-pointer select-none">
           <div className="flex items-center gap-5">
             <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${config.onlyPositive ? 'bg-tusgu-blue text-white border-transparent' : 'bg-gray-100 border-gray-300 text-transparent'}`}>{config.onlyPositive && <Check className="w-6 h-6" />}</div>
             <span className="font-bold text-slate-700 dark:text-slate-200 text-xl">Addition Only</span>
           </div>
       </div>
       <div className="space-y-4">
          <label className="text-base font-bold text-gray-500 uppercase tracking-wide ml-1">Speed</label>
          <select className="w-full p-6 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-3xl font-bold text-xl outline-none" value={config.speed} onChange={(e) => setConfig({...config, speed: parseInt(e.target.value)})}>
             {[2000, 1500, 1000, 700, 500, 250].map((s, i) => <option key={s} value={s}>Level {i+1} ({s}ms)</option>)}
          </select>
       </div>
       <button onClick={startGame} className="w-full bg-tusgu-blue text-white py-6 rounded-3xl font-bold text-2xl flex items-center justify-center gap-3 active:scale-[0.98] transition-transform shadow-lg shadow-blue-900/20"><Play className="w-8 h-8" /> Start Flash</button>
    </div>
  );

  return (
    <Layout title="Flash" center={true}>
      {gameState === GameState.CONFIG && renderConfig()}
      
      {gameState === GameState.PLAYING && (
        <div className="flex flex-col flex-grow w-full max-w-7xl mx-auto gap-10 justify-center py-6 h-full">
            {/* 
                Flash Card Container 
                - flex-grow ensures it takes up most of the screen
                - Fixed white/dark background (Does not flicker)
                - Centered content
            */}
            <div className="flex-grow w-full bg-white dark:bg-slate-800 rounded-[3rem] shadow-2xl border border-slate-100 dark:border-slate-700 flex items-center justify-center overflow-hidden relative min-h-[50vh]">
                 {/* The number is strictly centered and absolutely positioned to avoid layout shift */}
                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    {currentNumber && (
                        <span className={`${getFontSize()} font-black text-slate-800 dark:text-white leading-none select-none`}>
                            {currentNumber}
                        </span>
                    )}
                 </div>
            </div>

            {/* Stop Button */}
            <button 
                onClick={stopGame} 
                className="w-full py-8 bg-red-500 text-white rounded-[2rem] font-bold text-3xl shadow-lg shadow-red-500/30 active:scale-95 transition-transform flex items-center justify-center gap-4 flex-shrink-0"
            >
                <Square className="w-10 h-10 fill-current" /> Stop Session
            </button>
        </div>
      )}

      {gameState === GameState.INPUT && (
        <div className="glass-panel rounded-[3rem] shadow-soft w-full max-w-4xl mx-auto flex flex-col justify-center overflow-hidden animate-in zoom-in-95 duration-300">
          <div className="p-12 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-center">
            <h3 className="text-lg font-bold text-slate-400 uppercase tracking-widest mb-4">Result</h3>
            <div className="text-8xl md:text-9xl font-black text-slate-800 dark:text-white h-24 md:h-32">{userAnswer || <span className="text-slate-200 dark:text-slate-700">?</span>}</div>
          </div>
          <div className="p-6 w-full max-w-xl mx-auto">
            <NumberPad value={userAnswer} onChange={setUserAnswer} onSubmit={checkAnswer} />
          </div>
        </div>
      )}

      {gameState === GameState.FEEDBACK && (
          <div className="glass-panel p-12 rounded-[3rem] shadow-soft w-full max-w-4xl mx-auto text-center animate-in zoom-in-95 duration-300 relative flex flex-col justify-center">
            <div className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center mb-8 ${parseInt(userAnswer) === expectedAnswer ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
            {parseInt(userAnswer) === expectedAnswer ? <span className="text-6xl">✓</span> : <span className="text-6xl">✗</span>}
            </div>
            <h2 className={`text-5xl font-black mb-4 ${parseInt(userAnswer) === expectedAnswer ? 'text-green-600' : 'text-red-600'}`}>{parseInt(userAnswer) === expectedAnswer ? 'Correct!' : 'Incorrect'}</h2>
            <div className="my-10 p-8 bg-slate-50 dark:bg-slate-800 rounded-[2rem]">
            <p className="text-slate-500 text-base font-bold uppercase tracking-widest mb-3">Answer</p>
            <p className="text-6xl font-black text-slate-800 dark:text-white">{expectedAnswer}</p>
            {parseInt(userAnswer) !== expectedAnswer && <p className="text-red-400 mt-4 text-xl">You wrote {userAnswer}</p>}
            </div>
            <div className="grid grid-cols-2 gap-6">
            <button onClick={() => setGameState(GameState.CONFIG)} className="flex items-center justify-center gap-3 py-6 rounded-3xl bg-slate-100 dark:bg-slate-800 font-bold text-xl text-slate-600 dark:text-slate-300"><Settings className="w-7 h-7" /> Setup</button>
            <button onClick={startGame} className="flex items-center justify-center gap-3 py-6 rounded-3xl bg-tusgu-blue text-white font-bold text-xl"><RefreshCw className="w-7 h-7" /> Next</button>
            </div>
        </div>
      )}
    </Layout>
  );
};