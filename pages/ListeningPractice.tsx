import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Layout } from '../components/Layout';
import { GameState, MathConfig, MathSequenceItem } from '../types';
import { generateSequence } from '../services/mathUtils';
import { saveGameResult } from '../services/statsService';
import { NumberPad } from '../components/NumberPad';
import { Volume2, Play, RefreshCw, Settings, Square, Trophy, Check } from 'lucide-react';
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { KeepAwake } from '@capacitor-community/keep-awake';

interface VoiceOption {
  name: string;
  voiceIndex: number;
  pitch: number;
  lang: string;
}

export const ListeningPractice: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.CONFIG);
  const [config, setConfig] = useState<MathConfig>({ 
    digits: 1, 
    terms: 5, 
    voiceIndex: 0,
    listeningSpeed: 1.0,
    onlyPositive: false
  });

  const [digitsInput, setDigitsInput] = useState<string>('1');
  const [termsInput, setTermsInput] = useState<string>('5');
  const [voiceOptions, setVoiceOptions] = useState<VoiceOption[]>([]);
  const [currentSequence, setCurrentSequence] = useState<MathSequenceItem[]>([]);
  const [expectedAnswer, setExpectedAnswer] = useState<number>(0);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const stopRef = useRef(false);
  const [score, setScore] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);

  // Safe Haptics
  const safeHaptic = async (style: ImpactStyle) => {
      try { await Haptics.impact({ style }); } catch(e) {}
  };
  const safeNotify = async (type: NotificationType) => {
      try { await Haptics.notification({ type }); } catch(e) {}
  };

  // Load Voices
  useEffect(() => {
    let isMounted = true;
    
    const initVoices = async () => {
      // Allow native plugin to initialize
      await new Promise(r => setTimeout(r, 500));
      
      try {
        const result = await TextToSpeech.getSupportedVoices();
        if (!isMounted) return;

        const allVoices = result.voices;
        
        // Filter for English voices
        const englishVoices = allVoices.map((v, i) => ({ ...v, originalIndex: i }))
                                       .filter(v => v.lang && v.lang.toLowerCase().includes('en'));

        // --- STRICT MAPPING STRATEGY ---
        const finalSlots: VoiceOption[] = [];
        const preferredOrder = ['Samantha', 'Daniel', 'Karen', 'Rishi', 'Tessa', 'Google', 'Siri', 'Ava', 'Evan'];
        const usedIndices = new Set<number>();

        // We want exactly 8 options labeled Instructor 1 - Instructor 8
        for (let i = 1; i <= 8; i++) {
           let foundIndex = -1;
           let pitch = 1.0;
           let lang = 'en-US';

           // 1. Try to find a preferred voice
           const prefName = preferredOrder[i - 1];
           if (prefName) {
             const v = englishVoices.find(ev => ev.name.includes(prefName) && !usedIndices.has(ev.originalIndex));
             if (v) {
               foundIndex = v.originalIndex;
               lang = v.lang;
               usedIndices.add(v.originalIndex);
             }
           }

           // 2. If no preferred voice, pick next available
           if (foundIndex === -1) {
             const v = englishVoices.find(ev => !usedIndices.has(ev.originalIndex));
             if (v) {
               foundIndex = v.originalIndex;
               lang = v.lang;
               usedIndices.add(v.originalIndex);
             }
           }

           // 3. Fallback: reuse first available with pitch shift
           if (foundIndex === -1) {
             if (englishVoices.length > 0) {
                foundIndex = englishVoices[0].originalIndex;
                lang = englishVoices[0].lang;
                pitch = 0.8 + (i * 0.05); 
             }
           }

           // STRICT NAME GENERATION
           finalSlots.push({
             name: `Instructor ${i}`, 
             voiceIndex: foundIndex,
             pitch: pitch,
             lang: lang
           });
        }

        setVoiceOptions(finalSlots);

      } catch (e) {
        // Fallback if plugin fails completely
        const fallbackSlots = Array.from({length: 8}, (_, i) => ({
           name: `Instructor ${i + 1}`,
           voiceIndex: -1, 
           pitch: 1.0,
           lang: 'en-US'
        }));
        setVoiceOptions(fallbackSlots);
      }
    };

    initVoices();

    return () => { isMounted = false; };
  }, []);

  const startGame = useCallback(async () => {
    await safeHaptic(ImpactStyle.Heavy);
    try { await KeepAwake.keepAwake(); } catch(e) {}

    const d = parseInt(digitsInput);
    const t = parseInt(termsInput);

    if (isNaN(d) || d < 1 || isNaN(t) || t < 2) return;

    const newConfig = { ...config, digits: d, terms: t };
    setConfig(newConfig);

    stopRef.current = false;
    const { sequence, expectedAnswer } = generateSequence(newConfig.digits, newConfig.terms, newConfig.onlyPositive);
    setCurrentSequence(sequence);
    setExpectedAnswer(expectedAnswer);
    setGameState(GameState.PLAYING);
    setIsPlaying(true);
    setUserAnswer('');

    // Warm up TTS
    try { await TextToSpeech.speak({ text: ' ', rate: 2.0, volume: 0.1 }); } catch(e) {}

    const speedLevel = newConfig.listeningSpeed || 1.0;
    let gapMs = 1200;
    if (speedLevel >= 2.0) gapMs = 300;
    else if (speedLevel >= 1.8) gapMs = 450;
    else if (speedLevel >= 1.6) gapMs = 600;
    else if (speedLevel >= 1.4) gapMs = 800;
    else if (speedLevel >= 1.2) gapMs = 1000;
    
    if (newConfig.digits > 2) gapMs += 300;
    
    await new Promise(resolve => setTimeout(resolve, 500));

    const selectedOption = voiceOptions[newConfig.voiceIndex || 0];
    const voiceIdx = selectedOption ? selectedOption.voiceIndex : -1;
    const basePitch = selectedOption ? selectedOption.pitch : 1.0;
    const selectedLang = selectedOption ? selectedOption.lang : 'en-US';

    const speak = async (text: string, speedOverride?: number) => {
      if (stopRef.current) return;
      try {
        await TextToSpeech.speak({
          text: text,
          lang: selectedLang,
          rate: speedOverride || (newConfig.listeningSpeed || 1.0),
          pitch: basePitch, 
          voice: voiceIdx >= 0 ? voiceIdx : undefined,
          volume: 1.0,
          category: 'ambient',
        });
      } catch (e) {
        // Fallback delay if TTS fails
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    };

    for (let i = 0; i < sequence.length; i++) {
      if (stopRef.current) break;
      const item = sequence[i];
      
      if (i > 0) {
        const prevItem = sequence[i - 1];
        if (item.operation === '-') await speak("Minus", 1.4);
        else if (item.operation === '+' && prevItem.operation === '-') await speak("Plus", 1.4);
        await new Promise(resolve => setTimeout(resolve, 50)); 
      }
      
      if (stopRef.current) break;
      await speak(item.value.toString());
      if (stopRef.current) break;
      await new Promise(resolve => setTimeout(resolve, gapMs));
    }

    if (!stopRef.current) {
      setIsPlaying(false);
      setGameState(GameState.INPUT);
      try { await KeepAwake.allowSleep(); } catch(e) {}
    }
  }, [config, digitsInput, termsInput, voiceOptions]); 

  const stopGame = async () => {
    stopRef.current = true;
    try { await KeepAwake.allowSleep(); } catch(e) {}
    try { await TextToSpeech.stop(); } catch (e) {}
    setIsPlaying(false);
    setGameState(GameState.CONFIG);
  };

  const checkAnswer = async () => {
    const isCorrect = parseInt(userAnswer) === expectedAnswer;
    const newScore = isCorrect ? score + 1 : score;
    const newTotal = totalQuestions + 1;
    
    setScore(newScore);
    setTotalQuestions(newTotal);

    if (isCorrect) await safeNotify(NotificationType.Success);
    else await safeNotify(NotificationType.Error);

    saveGameResult({
      type: 'listening',
      score: isCorrect ? 1 : 0,
      total: 1,
      config: `${config.digits}D ${config.terms}T (Level ${(((config.listeningSpeed || 1.0)-0.8)/0.2).toFixed(0)})`
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
      <div onClick={() => setConfig({ ...config, onlyPositive: !config.onlyPositive })} className="flex items-center justify-between p-6 bg-gray-50 dark:bg-slate-800 border border-gray-200 rounded-3xl cursor-pointer">
         <div className="flex items-center gap-5">
           <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${config.onlyPositive ? 'bg-tusgu-blue text-white' : 'bg-gray-200 text-gray-400'}`}>{config.onlyPositive && <Check className="w-6 h-6" />}</div>
           <span className="font-bold text-slate-700 dark:text-slate-200 text-xl">Addition Only</span>
         </div>
      </div>
      <div className="space-y-4">
         <label className="text-base font-bold text-gray-500 uppercase tracking-wide ml-1">Speed</label>
         <select className="w-full p-6 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-3xl font-bold text-xl outline-none" value={config.listeningSpeed} onChange={(e) => setConfig({...config, listeningSpeed: parseFloat(e.target.value)})}>
           {[1.0, 1.2, 1.4, 1.6, 1.8, 2.0].map(v => <option key={v} value={v}>Level {((v-0.8)/0.2).toFixed(0)}</option>)}
         </select>
      </div>
      <div className="space-y-4">
        <label className="text-base font-bold text-gray-500 uppercase tracking-wide ml-1">Instructor</label>
        <select className="w-full p-6 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-3xl font-bold text-xl outline-none" value={config.voiceIndex} onChange={(e) => setConfig({...config, voiceIndex: parseInt(e.target.value)})}>
          {voiceOptions.map((v, i) => (
            <option key={i} value={i}>
              {v.name}
            </option>
          ))}
        </select>
      </div>
      <button onClick={startGame} className="w-full bg-tusgu-blue text-white py-6 rounded-3xl font-bold text-2xl flex items-center justify-center gap-3 shadow-lg shadow-blue-900/20 active:scale-[0.98] transition-all"><Play className="w-8 h-8" /> Start Session</button>
    </div>
  );

  const renderInput = () => (
    <div className="glass-panel rounded-[3rem] shadow-soft w-full max-w-4xl mx-auto flex flex-col justify-center overflow-hidden">
      <div className="p-12 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-center">
        <h3 className="text-lg font-bold text-slate-400 uppercase tracking-widest mb-4">Result</h3>
        <div className="text-8xl md:text-9xl font-black text-slate-800 dark:text-white h-24 md:h-32">{userAnswer || <span className="text-slate-200 dark:text-slate-700">?</span>}</div>
      </div>
      <div className="p-6 w-full max-w-xl mx-auto">
        <NumberPad value={userAnswer} onChange={setUserAnswer} onSubmit={checkAnswer} />
      </div>
    </div>
  );

  const renderFeedback = () => {
    const isCorrect = parseInt(userAnswer) === expectedAnswer;
    return (
      <div className="glass-panel p-12 rounded-[3rem] shadow-soft w-full max-w-4xl mx-auto text-center animate-in zoom-in-95 duration-300 relative flex flex-col justify-center">
        <div className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center mb-8 ${isCorrect ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
           {isCorrect ? <span className="text-6xl">✓</span> : <span className="text-6xl">✗</span>}
        </div>
        <h2 className={`text-5xl font-black mb-4 ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>{isCorrect ? 'Correct!' : 'Incorrect'}</h2>
        <div className="my-10 p-8 bg-slate-50 dark:bg-slate-800 rounded-[2rem]">
           <p className="text-slate-500 text-base font-bold uppercase tracking-widest mb-3">Answer</p>
           <p className="text-6xl font-black text-slate-800 dark:text-white">{expectedAnswer}</p>
           {!isCorrect && <p className="text-red-400 mt-4 text-xl">You wrote {userAnswer}</p>}
        </div>
        <div className="grid grid-cols-2 gap-6">
          <button onClick={() => setGameState(GameState.CONFIG)} className="flex items-center justify-center gap-3 py-6 rounded-3xl bg-slate-100 dark:bg-slate-800 font-bold text-xl text-slate-600 dark:text-slate-300"><Settings className="w-7 h-7" /> Setup</button>
          <button onClick={startGame} className="flex items-center justify-center gap-3 py-6 rounded-3xl bg-tusgu-blue text-white font-bold text-xl"><RefreshCw className="w-7 h-7" /> Next</button>
        </div>
      </div>
    );
  };

  return (
    <Layout title="Listening" center={true}>
      {gameState === GameState.CONFIG && renderConfig()}
      {gameState === GameState.PLAYING && (
        <div className="flex flex-col items-center justify-center h-full animate-in fade-in duration-500">
           <div className={`relative w-80 h-80 rounded-full flex items-center justify-center ${isPlaying ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-gray-50'}`}>
             {isPlaying && <div className="absolute inset-0 rounded-full border-4 border-blue-100 animate-ping opacity-20"></div>}
             <Volume2 className="w-40 h-40 text-tusgu-blue" />
           </div>
           <button onClick={stopGame} className="mt-20 flex items-center gap-4 px-12 py-5 bg-red-50 text-red-600 rounded-full font-bold text-2xl"><Square className="w-8 h-8" /> Stop</button>
        </div>
      )}
      {gameState === GameState.INPUT && renderInput()}
      {gameState === GameState.FEEDBACK && renderFeedback()}
    </Layout>
  );
};