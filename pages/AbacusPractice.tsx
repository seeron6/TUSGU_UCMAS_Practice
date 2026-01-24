import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { ChevronRight, BookOpen, Clock, Play, RotateCcw, Check, Trophy, X, Hash } from 'lucide-react';
import { NumberPad } from '../components/NumberPad';
import { Haptics, NotificationType } from '@capacitor/haptics';
import { KeepAwake } from '@capacitor-community/keep-awake';

// --- Types & Constants ---

type ViewMode = 'menu' | 'formulas' | 'routine_menu' | 'cumulative' | 'timed_setup' | 'timed_play';
type FormulaCategory = 'small' | 'big' | 'mixed';

const FORMULAS = {
  small: {
    title: 'Small Friends',
    subtitle: 'Target is 5',
    style: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300',
    items: [
      { id: 's1', name: '+1', formula: '+5 -4', type: 'add' },
      { id: 's2', name: '+2', formula: '+5 -3', type: 'add' },
      { id: 's3', name: '+3', formula: '+5 -2', type: 'add' },
      { id: 's4', name: '+4', formula: '+5 -1', type: 'add' },
      { id: 's5', name: '-1', formula: '-5 +4', type: 'sub' },
      { id: 's6', name: '-2', formula: '-5 +3', type: 'sub' },
      { id: 's7', name: '-3', formula: '-5 +2', type: 'sub' },
      { id: 's8', name: '-4', formula: '-5 +1', type: 'sub' },
    ]
  },
  big: {
    title: 'Big Friends',
    subtitle: 'Target is 10',
    style: 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300',
    items: [
      { id: 'b1', name: '+1', formula: '-9 +10', type: 'add' },
      { id: 'b2', name: '+2', formula: '-8 +10', type: 'add' },
      { id: 'b3', name: '+3', formula: '-7 +10', type: 'add' },
      { id: 'b4', name: '+4', formula: '-6 +10', type: 'add' },
      { id: 'b5', name: '+5', formula: '-5 +10', type: 'add' },
      { id: 'b6', name: '+6', formula: '-4 +10', type: 'add' },
      { id: 'b7', name: '+7', formula: '-3 +10', type: 'add' },
      { id: 'b8', name: '+8', formula: '-2 +10', type: 'add' },
      { id: 'b9', name: '+9', formula: '-1 +10', type: 'add' },
      { id: 'b10', name: '-1', formula: '-10 +9', type: 'sub' },
      { id: 'b11', name: '-2', formula: '-10 +8', type: 'sub' },
      { id: 'b12', name: '-3', formula: '-10 +7', type: 'sub' },
    ]
  },
  mixed: {
    title: 'Combination',
    subtitle: 'Big + Small',
    style: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-300',
    items: [
      { id: 'm1', name: '+6', formula: '+1 -5 +10', type: 'add' },
      { id: 'm2', name: '+7', formula: '+2 -5 +10', type: 'add' },
      { id: 'm3', name: '+8', formula: '+3 -5 +10', type: 'add' },
      { id: 'm4', name: '+9', formula: '+4 -5 +10', type: 'add' },
      { id: 'm5', name: '-6', formula: '-10 +5 -1', type: 'sub' },
      { id: 'm6', name: '-7', formula: '-10 +5 -2', type: 'sub' },
      { id: 'm7', name: '-8', formula: '-10 +5 -3', type: 'sub' },
      { id: 'm8', name: '-9', formula: '-10 +5 -4', type: 'sub' },
    ]
  }
};

// --- Sub-Components ---

const FormulasView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<FormulaCategory>('small');
  const currentData = FORMULAS[activeTab];

  return (
    <div className="flex flex-col h-full overflow-hidden pt-2 max-w-7xl mx-auto w-full">
      {/* Tab Header */}
      <div className="flex-shrink-0 bg-white dark:bg-slate-900 z-10 pb-4">
         <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl flex max-w-4xl mx-auto w-full">
          {(['small', 'big', 'mixed'] as FormulaCategory[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`flex-1 py-3 rounded-xl text-sm md:text-base font-bold capitalize transition-all ${
                activeTab === cat 
                ? 'bg-white dark:bg-slate-700 text-tusgu-blue dark:text-white shadow-sm' 
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'
              }`}
            >
              {cat}
            </button>
          ))}
         </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto scrollable-container pb-4">
        <div className="text-center px-4 mb-6">
           <h3 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">{currentData.title}</h3>
           <span className={`inline-block px-4 py-1.5 mt-2 rounded-full text-xs md:text-sm font-bold uppercase ${currentData.style}`}>
             {currentData.subtitle}
           </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-1">
           {currentData.items.map((item) => (
             <div key={item.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl ${item.type === 'add' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                  {item.name}
                </div>
                <div className="bg-slate-50 dark:bg-slate-900 px-5 py-3 rounded-xl font-mono text-xl font-bold text-slate-700 dark:text-slate-200">
                  {item.formula}
                </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
};

const CumulativeGame: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const [checkpoint, setCheckpoint] = useState(1); // 1 = 1-10, 2 = 11-20...
  const [userInput, setUserInput] = useState('');
  const [status, setStatus] = useState<'playing' | 'feedback' | 'finished'>('playing');
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  // Calculate correct sum for 1..n
  const getSumTo = (n: number) => (n * (n + 1)) / 2;

  const handleSubmit = async () => {
    const currentMax = checkpoint * 10;
    const expected = getSumTo(currentMax);
    
    if (parseInt(userInput) === expected) {
      await Haptics.notification({ type: NotificationType.Success });
      setFeedback('correct');
      setStatus('feedback');
    } else {
      await Haptics.notification({ type: NotificationType.Error });
      setFeedback('wrong');
      setStatus('feedback');
    }
  };

  const handleNext = () => {
    if (checkpoint === 10) {
      setStatus('finished');
    } else {
      setCheckpoint(p => p + 1);
      setUserInput('');
      setFeedback(null);
      setStatus('playing');
    }
  };

  if (status === 'finished') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6 animate-in zoom-in-95">
         <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mb-6">
            <Trophy className="w-12 h-12 text-yellow-600" />
         </div>
         <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Completed!</h2>
         <p className="text-slate-500 mb-8">You successfully summed 1 to 100.</p>
         <button onClick={onExit} className="w-full max-w-sm py-4 bg-tusgu-blue text-white rounded-2xl font-bold">Finish Practice</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-w-6xl mx-auto relative overflow-hidden pt-4 w-full">
       {/* Top Section: Progress & Info */}
       <div className="flex-shrink-0 pt-2 pb-4 px-1">
          <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full mb-4 overflow-hidden">
             <div className="h-full bg-tusgu-blue transition-all duration-500" style={{ width: `${checkpoint * 10}%` }}></div>
          </div>
          
          <div className="text-center">
            <div className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-1">Target Range</div>
            <div className="text-3xl font-bold text-slate-800 dark:text-white">
               {((checkpoint - 1) * 10) + 1} <span className="text-slate-300 text-xl mx-2">➔</span> {checkpoint * 10}
            </div>
          </div>
       </div>

       {/* Middle Section: Display - Grows to fill space */}
       <div className="flex-1 flex flex-col items-center justify-center min-h-0">
          {status === 'playing' ? (
             <div className="w-full max-w-sm md:max-w-xl bg-slate-50 dark:bg-slate-800 p-8 md:p-12 rounded-[2.5rem] text-center border border-slate-200 dark:border-slate-700 shadow-inner">
               <div className="text-sm md:text-base text-slate-400 uppercase font-bold mb-2">Your Total</div>
               <div className="text-6xl md:text-7xl font-mono font-bold text-slate-800 dark:text-white truncate h-20 md:h-24 flex items-center justify-center">
                 {userInput || <span className="opacity-20">0</span>}
               </div>
             </div>
          ) : (
             <div className="w-full max-w-md flex flex-col items-center animate-in zoom-in-95">
                <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 ${feedback === 'correct' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                   {feedback === 'correct' ? <Check className="w-12 h-12" /> : <X className="w-12 h-12" />}
                </div>
                <div className="text-2xl md:text-3xl font-bold text-slate-700 dark:text-slate-300">
                  {feedback === 'correct' ? 'Correct!' : 'Incorrect'}
                </div>
                {feedback === 'wrong' && (
                  <div className="mt-2 text-lg text-slate-500">Correct sum: {getSumTo(checkpoint * 10)}</div>
                )}
             </div>
          )}
       </div>

       {/* Bottom Section: Controls */}
       <div className="flex-shrink-0 pb-1 w-full max-w-xl mx-auto">
         {status === 'playing' ? (
             <NumberPad value={userInput} onChange={setUserInput} onSubmit={handleSubmit} />
         ) : (
            <div className="p-4 space-y-4">
              {feedback === 'correct' ? (
                <button onClick={handleNext} className="w-full py-5 bg-tusgu-blue text-white rounded-2xl font-bold text-xl shadow-lg shadow-blue-900/20 active:scale-95 transition-all flex items-center justify-center gap-2">
                   Next Level <ChevronRight className="w-6 h-6" />
                </button>
              ) : (
                <button onClick={() => { setFeedback(null); setStatus('playing'); setUserInput(''); }} className="w-full py-5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-white rounded-2xl font-bold text-xl active:scale-95 transition-all flex items-center justify-center gap-2">
                   Try Again <RotateCcw className="w-6 h-6" />
                </button>
              )}
            </div>
         )}
       </div>
    </div>
  );
};

const TimedGame: React.FC<{ mode: 'setup' | 'play', onStart: (op: '+'|'-', digits: number) => void, setupData: any, onExit: () => void }> = ({ mode, onStart, setupData, onExit }) => {
  const [numDigits, setNumDigits] = useState<number>(1);
  const [operation, setOperation] = useState<'+'|'-'>('+');
  
  // Play State
  const [timeLeft, setTimeLeft] = useState(60);
  const [startNumber, setStartNumber] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [status, setStatus] = useState<'running' | 'input' | 'result'>('running');
  
  // Setup View
  if (mode === 'setup') {
    return (
      <div className="flex flex-col h-full max-w-4xl mx-auto animate-in fade-in pt-6 w-full">
         <div className="bg-white dark:bg-slate-800 p-8 md:p-14 rounded-[3rem] shadow-soft border border-slate-100 dark:border-slate-700">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-10 text-slate-800 dark:text-white">Timed Drill Setup</h2>
            
            <div className="mb-10">
              <label className="block text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Operation</label>
              <div className="flex gap-4">
                <button onClick={() => setOperation('+')} className={`flex-1 py-6 rounded-2xl font-bold text-3xl border-2 transition-all ${operation === '+' ? 'border-tusgu-blue bg-blue-50 text-tusgu-blue' : 'border-slate-100 dark:border-slate-700 text-slate-400'}`}>+</button>
                <button onClick={() => setOperation('-')} className={`flex-1 py-6 rounded-2xl font-bold text-3xl border-2 transition-all ${operation === '-' ? 'border-tusgu-blue bg-blue-50 text-tusgu-blue' : 'border-slate-100 dark:border-slate-700 text-slate-400'}`}>-</button>
              </div>
            </div>

            <div className="mb-12">
              <label className="block text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Number of Digits</label>
              <div className="grid grid-cols-5 gap-4">
                {[1, 2, 3, 4, 5].map(d => (
                  <button 
                    key={d}
                    onClick={() => setNumDigits(d)}
                    className={`aspect-square rounded-2xl font-bold text-2xl border-2 transition-all flex items-center justify-center ${numDigits === d ? 'border-tusgu-blue bg-tusgu-blue text-white shadow-md' : 'border-slate-100 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={() => onStart(operation, numDigits)}
              className="w-full py-6 bg-tusgu-blue text-white rounded-2xl font-bold text-xl flex items-center justify-center gap-3 shadow-lg shadow-blue-900/20 active:scale-95 transition-all"
            >
              <Play className="w-7 h-7" /> Start Timer
            </button>
         </div>
      </div>
    );
  }

  // Play Logic
  useEffect(() => {
    // Generate Random number based on digits
    const digits = setupData.digits;
    const min = Math.pow(10, digits - 1);
    const max = Math.pow(10, digits) - 1;
    const randomIncrement = Math.floor(Math.random() * (max - min + 1)) + min;
    
    // Generate start number
    let start = 0;
    if (setupData.op === '+') {
      start = Math.floor(Math.random() * 50) + 1; 
    } else {
      // Must allow at least 150 subtractions
      const minStart = (randomIncrement * 160) + Math.floor(Math.random() * 100);
      start = minStart;
    }
    
    // Store the generated increment in setupData for reference in result check
    // Note: Mutating prop for local logic simplicity in this effect context, 
    // ideally we'd use state but this works since setupData is an object ref.
    setupData.generatedNumber = randomIncrement;
    
    setStartNumber(start);

    // Timer
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setStatus('input');
          Haptics.notification({ type: NotificationType.Warning });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    KeepAwake.keepAwake();

    return () => {
      clearInterval(timer);
      KeepAwake.allowSleep();
    }
  }, []);

  const checkResult = () => {
    const endVal = parseInt(userInput);
    const op = setupData.op;
    const num = setupData.generatedNumber; // The random number we generated
    
    const diff = Math.abs(endVal - startNumber);
    const isDirectionCorrect = op === '+' ? endVal > startNumber : endVal < startNumber;
    const isDivisible = diff % num === 0;

    if (isDirectionCorrect && isDivisible) {
      setStatus('result');
      Haptics.notification({ type: NotificationType.Success });
    } else {
      alert("That number doesn't fit the sequence! Try again.");
    }
  };

  if (status === 'running') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-4">
        <div className="text-9xl md:text-[10rem] font-black text-slate-200 dark:text-slate-800 mb-8 tabular-nums">{timeLeft}</div>
        
        <div className="bg-white dark:bg-slate-800 p-8 md:p-12 rounded-[3rem] shadow-soft border border-slate-100 dark:border-slate-700 w-full max-w-2xl">
           <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Instruction</div>
           <p className="text-4xl text-slate-600 dark:text-slate-300">
             Start at <span className="font-bold text-slate-800 dark:text-white">{startNumber}</span>
           </p>
           <div className="my-8 h-px bg-slate-100 dark:bg-slate-700 w-full"></div>
           <p className="text-3xl md:text-4xl text-slate-600 dark:text-slate-300 flex items-center justify-center gap-3 flex-wrap">
              {setupData.op === '+' ? 'Add' : 'Subtract'} 
              <span className="text-6xl font-black text-tusgu-blue">{setupData.generatedNumber}</span>
              repeatedly
           </p>
        </div>
      </div>
    );
  }

  if (status === 'input') {
    return (
      <div className="flex flex-col h-full max-w-2xl mx-auto relative overflow-hidden w-full">
        <div className="flex-1 flex flex-col items-center justify-center min-h-0">
           <div className="text-red-500 font-bold text-3xl mb-6 animate-pulse">Time's Up!</div>
           <h3 className="text-slate-500 text-xl">Enter your final number</h3>
           <div className="text-7xl md:text-8xl font-mono font-bold mt-8 text-slate-800 dark:text-white min-h-[6rem]">
             {userInput}
           </div>
        </div>
        <div className="flex-shrink-0 pb-1 w-full max-w-lg mx-auto">
           <NumberPad value={userInput} onChange={setUserInput} onSubmit={checkResult} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-6 animate-in zoom-in-95">
       <div className="w-28 h-28 bg-green-100 rounded-full flex items-center justify-center mb-8">
          <Check className="w-14 h-14 text-green-600" />
       </div>
       <h2 className="text-4xl font-bold text-slate-800 dark:text-white mb-3">Great Job!</h2>
       <p className="text-slate-600 mb-10 text-xl">
         You performed approximately <br/>
         <span className="text-6xl font-bold text-tusgu-blue block mt-6">
           {Math.abs(parseInt(userInput) - startNumber) / setupData.generatedNumber}
         </span>
         <span className="text-base text-slate-400 mt-2 block font-bold uppercase tracking-wider">Calculations per minute</span>
       </p>
       <button onClick={onExit} className="w-full max-w-md py-5 bg-slate-800 text-white rounded-2xl font-bold text-xl">Back to Menu</button>
    </div>
  );
};

// --- Main Component ---

export const AbacusPractice: React.FC = () => {
  const [view, setView] = useState<ViewMode>('menu');
  const [timedSetup, setTimedSetup] = useState<{op: '+'|'-', digits: number}>({op: '+', digits: 1});

  const handleBack = () => {
    if (view === 'menu') return; 
    if (view === 'timed_play' || view === 'timed_setup' || view === 'cumulative') {
      setView('routine_menu');
    } else {
      setView('menu');
    }
  };

  const getSubTitle = () => {
      switch(view) {
          case 'formulas': return 'Formulas';
          case 'routine_menu': return 'Routines';
          case 'cumulative': return 'Cumulative 1-100';
          case 'timed_setup': return 'Timed Drill'; // Shortened for header
          case 'timed_play': return 'Timed Drill';
          default: return undefined; // Let Layout use default Title or empty
      }
  };

  const getTitle = () => {
    if (view === 'menu') return 'Abacus';
    return getSubTitle();
  }

  return (
    <Layout 
      title={getTitle()} 
      showBack={view === 'menu'} 
      onBack={view !== 'menu' ? handleBack : undefined}
      center={false} // Force top alignment
    >
      
      {/* Main Menu */}
      {view === 'menu' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 p-4 pt-10 h-full content-start md:content-center max-w-7xl mx-auto w-full">
           <button 
             onClick={() => setView('formulas')}
             className="bg-white dark:bg-slate-800 p-10 md:p-14 rounded-[3rem] shadow-soft border border-slate-100 dark:border-slate-700 flex flex-col items-center gap-8 group active:scale-95 transition-all"
           >
             <div className="w-24 h-24 md:w-36 md:h-36 bg-emerald-50 text-emerald-600 rounded-[2rem] flex items-center justify-center shadow-inner">
               <BookOpen className="w-12 h-12 md:w-20 md:h-20" />
             </div>
             <div className="text-center">
               <h3 className="text-2xl md:text-4xl font-bold text-slate-800 dark:text-white">Formulas</h3>
               <p className="text-slate-500 text-base md:text-xl mt-2">Reference sheet for Friends</p>
             </div>
           </button>

           <button 
             onClick={() => setView('routine_menu')}
             className="bg-white dark:bg-slate-800 p-10 md:p-14 rounded-[3rem] shadow-soft border border-slate-100 dark:border-slate-700 flex flex-col items-center gap-8 group active:scale-95 transition-all"
           >
             <div className="w-24 h-24 md:w-36 md:h-36 bg-blue-50 text-tusgu-blue rounded-[2rem] flex items-center justify-center shadow-inner">
               <Clock className="w-12 h-12 md:w-20 md:h-20" />
             </div>
             <div className="text-center">
               <h3 className="text-2xl md:text-4xl font-bold text-slate-800 dark:text-white">Practice Routine</h3>
               <p className="text-slate-500 text-base md:text-xl mt-2">Drills & Exercises</p>
             </div>
           </button>
        </div>
      )}

      {/* Formulas */}
      {view === 'formulas' && <FormulasView />}

      {/* Routine Menu */}
      {view === 'routine_menu' && (
        <div className="flex flex-col gap-6 p-4 pt-10 h-full max-w-7xl mx-auto w-full animate-in slide-in-from-right-8">
           <h2 className="text-center text-xl md:text-3xl font-bold text-slate-800 dark:text-white mb-8">Select Routine</h2>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
             <button 
               onClick={() => setView('cumulative')}
               className="bg-indigo-50 dark:bg-indigo-900/20 p-8 md:p-12 rounded-[2.5rem] text-left flex flex-col md:flex-row items-center justify-between group active:scale-95 transition-all gap-6"
             >
               <div className="flex flex-col items-center md:items-start text-center md:text-left">
                 <div className="flex items-center gap-4 mb-2">
                    <Hash className="w-8 h-8 md:w-10 md:h-10 text-indigo-500" />
                    <h3 className="text-xl md:text-3xl font-bold text-indigo-900 dark:text-indigo-200">Cumulative 1-100</h3>
                 </div>
                 <p className="text-indigo-600/70 text-base md:text-lg pl-0 md:pl-14">Add 1 to 100 with checkpoints</p>
               </div>
               <ChevronRight className="text-indigo-400 hidden md:block w-8 h-8 md:w-10 md:h-10" />
             </button>

             <button 
               onClick={() => setView('timed_setup')}
               className="bg-orange-50 dark:bg-orange-900/20 p-8 md:p-12 rounded-[2.5rem] text-left flex flex-col md:flex-row items-center justify-between group active:scale-95 transition-all gap-6"
             >
               <div className="flex flex-col items-center md:items-start text-center md:text-left">
                  <div className="flex items-center gap-4 mb-2">
                    <Clock className="w-8 h-8 md:w-10 md:h-10 text-orange-500" />
                    <h3 className="text-xl md:text-3xl font-bold text-orange-900 dark:text-orange-200">Timed Drills</h3>
                 </div>
                 <p className="text-orange-600/70 text-base md:text-lg pl-0 md:pl-14">60s Rapid Addition/Subtraction</p>
               </div>
               <ChevronRight className="text-orange-400 hidden md:block w-8 h-8 md:w-10 md:h-10" />
             </button>
           </div>
        </div>
      )}

      {/* Games */}
      {view === 'cumulative' && <CumulativeGame onExit={() => setView('routine_menu')} />}
      
      {view === 'timed_setup' && (
        <TimedGame 
          mode="setup" 
          setupData={{}} 
          onStart={(op, digits) => { setTimedSetup({op, digits}); setView('timed_play'); }} 
          onExit={() => {}} 
        />
      )}

      {view === 'timed_play' && (
        <TimedGame 
          mode="play" 
          setupData={timedSetup} 
          onStart={() => {}} 
          onExit={() => setView('routine_menu')} 
        />
      )}

    </Layout>
  );
};