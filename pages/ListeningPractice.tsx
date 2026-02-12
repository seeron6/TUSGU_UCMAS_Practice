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
  rateMod: number; 
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

  const safeHaptic = async (style: ImpactStyle) => {
      try { await Haptics.impact({ style }); } catch(e) {}
  };
  const safeNotify = async (type: NotificationType) => {
      try { await Haptics.notification({ type }); } catch(e) {}
  };

  // --- VOICE INITIALIZATION ---
  useEffect(() => {
    let isMounted = true;
    
    const initVoices = async () => {
      await new Promise(r => setTimeout(r, 600)); // Delay for plugin
      try {
        const result = await TextToSpeech.getSupportedVoices();
        if (!isMounted) return;

        const allVoices = result.voices;
        const usedIndices = new Set<number>();

        // Logic to find a distinct voice based on locale, gender, and specific names
        const findVoice = (locales: string[], gender: 'male' | 'female', preferred: string[]) => {
            // 1. Match by preferred high-quality names (iOS/Android specific)
            let match = allVoices.find(v => 
                locales.some(l => v.lang.toLowerCase().includes(l.toLowerCase())) &&
                preferred.some(p => v.name.toLowerCase().includes(p.toLowerCase())) &&
                !usedIndices.has(allVoices.indexOf(v))
            );

            // 2. Match by any voice in that locale with that gender keyword
            if (!match) {
                match = allVoices.find(v => 
                    locales.some(l => v.lang.toLowerCase().includes(l.toLowerCase())) &&
                    v.name.toLowerCase().includes(gender) &&
                    !usedIndices.has(allVoices.indexOf(v))
                );
            }

            // 3. Just grab any remaining voice in that locale
            if (!match) {
                match = allVoices.find(v => 
                    locales.some(l => v.lang.toLowerCase().includes(l.toLowerCase())) &&
                    !usedIndices.has(allVoices.indexOf(v))
                );
            }

            if (match) {
                const idx = allVoices.indexOf(match);
                usedIndices.add(idx);
                return { idx, lang: match.lang };
            }
            return null;
        };

        // Slots for your 8 required voices
        const slots: { label: string, loc: string[], gen: 'male' | 'female', pref: string[] }[] = [
            { label: 'Instructor Samantha', loc: ['en-US', 'en-GB'], gen: 'female', pref: ['Samantha', 'Karen'] },
            { label: 'Instructor Victoria', loc: ['en-US', 'en-GB'], gen: 'female', pref: ['Victoria', 'Moira', 'Tessa'] },
            { label: 'Instructor Daniel',   loc: ['en-US', 'en-GB'], gen: 'male',   pref: ['Daniel', 'Alex'] },
            { label: 'Instructor Arthur',   loc: ['en-US', 'en-GB'], gen: 'male',   pref: ['Arthur', 'Fred', 'Aaron'] },
            { label: 'Instructor Sangeeta',  loc: ['en-IN'],          gen: 'female', pref: ['Lekha', 'Sangeeta'] },
            { label: 'Instructor Isha',  loc: ['en-IN'],          gen: 'female', pref: ['Veena', 'Isha'] },
            { label: 'Instructor Rishi',    loc: ['en-IN'],          gen: 'male',   pref: ['Rishi', 'Neel'] },
            { label: 'Instructor Ravi',    loc: ['en-IN'],          gen: 'male',   pref: ['Ravi', 'Aditya'] },
        ];

        const finalOptions: VoiceOption[] = slots.map(slot => {
            const result = findVoice(slot.loc, slot.gen, slot.pref);
            return {
                name: slot.label,
                voiceIndex: result ? result.idx : -1,
                pitch: 1.0,
                rateMod: 1.0,
                lang: result ? result.lang : (slot.loc[0])
            };
        });

        setVoiceOptions(finalOptions);
      } catch (e) {
        console.error("TTS Error", e);
      }
    };

    initVoices();
    return () => { isMounted = false; };
  }, []);

  const playPreview = async () => {
    const selected = voiceOptions[config.voiceIndex];
    if (!selected) return;
    try {
      await TextToSpeech.speak({
        text: `Hello, I am ${selected.name}. Ready for your session?`,
        lang: selected.lang,
        voice: selected.voiceIndex >= 0 ? selected.voiceIndex : undefined,
        rate: 1.0,
        pitch: 1.0,
        volume: 1.0,
      });
    } catch(e) {}
  };

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

    const uiSpeed = newConfig.listeningSpeed || 1.0;
    let gapMs = 1200;
    let effectiveRate = uiSpeed;

    if (uiSpeed >= 2.0) { gapMs = 0; effectiveRate = 2.4; } 
    else if (uiSpeed >= 1.8) { gapMs = 0; } 
    else if (uiSpeed >= 1.6) { gapMs = 300; } 
    else if (uiSpeed >= 1.4) { gapMs = 600; } 
    else if (uiSpeed >= 1.2) { gapMs = 900; }
    
    if (newConfig.digits > 2 && uiSpeed < 1.8) gapMs += 300;
    
    await new Promise(resolve => setTimeout(resolve, 800));

    const selectedOption = voiceOptions[newConfig.voiceIndex];
    const voiceIdx = selectedOption?.voiceIndex;
    const selectedLang = selectedOption?.lang || 'en-US';

    const speak = async (text: string, speedOverride?: number) => {
      if (stopRef.current) return;
      const finalRate = (speedOverride || effectiveRate);

      try {
        await TextToSpeech.speak({
          text,
          lang: selectedLang,
          rate: finalRate,
          pitch: 1.0, 
          voice: voiceIdx >= 0 ? voiceIdx : undefined,
          volume: 1.0,
          category: 'ambient',
        });
      } catch (e) {}
    };

    for (let i = 0; i < sequence.length; i++) {
      if (stopRef.current) break;
      const item = sequence[i];
      
      if (i > 0) {
        const prevItem = sequence[i - 1];
        let opSpeed = effectiveRate; 
        if (uiSpeed >= 1.8) opSpeed = Math.max(2.2, effectiveRate * 1.25);
        
        if (item.operation === '-') await speak("Minus", opSpeed);
        else if (item.operation === '+' && prevItem.operation === '-') await speak("Plus", opSpeed);
      }
      
      if (stopRef.current) break;
      await speak(item.value.toString());
      if (gapMs > 0 && !stopRef.current) await new Promise(r => setTimeout(r, gapMs));
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
    setScore(s => isCorrect ? s + 1 : s);
    setTotalQuestions(t => t + 1);

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
    <div className="glass-panel p-5 md:p-12 rounded-[2rem] md:rounded-[3rem] shadow-soft w-full max-w-5xl mx-auto animate-in zoom-in-95 duration-300 relative flex flex-col gap-3 md:gap-8 justify-center">
      {totalQuestions > 0 && (
        <div className="absolute -top-4 md:-top-6 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 shadow-lg border border-slate-100 dark:border-slate-600 rounded-full px-6 py-2 md:px-8 md:py-3 flex items-center gap-2 md:gap-3 z-10">
          <Trophy className="w-4 h-4 md:w-6 md:h-6 text-yellow-500" />
          <span className="font-bold text-slate-700 dark:text-slate-200 text-sm md:text-xl">Score: {score} / {totalQuestions}</span>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4 md:gap-8">
        <div className="space-y-1 md:space-y-4">
          <label className="text-xs md:text-base font-bold text-gray-500 uppercase tracking-wide ml-1">Digits</label>
          <input type="tel" value={digitsInput} onChange={(e) => setDigitsInput(e.target.value.replace(/\D/g,''))} className="w-full p-3 md:p-6 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl md:rounded-3xl text-2xl md:text-3xl font-bold text-center text-tusgu-blue dark:text-blue-300 outline-none" />
        </div>
        <div className="space-y-1 md:space-y-4">
          <label className="text-xs md:text-base font-bold text-gray-500 uppercase tracking-wide ml-1">Rows</label>
          <input type="tel" value={termsInput} onChange={(e) => setTermsInput(e.target.value.replace(/\D/g,''))} className="w-full p-3 md:p-6 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl md:rounded-3xl text-2xl md:text-3xl font-bold text-center text-tusgu-blue dark:text-blue-300 outline-none" />
        </div>
      </div>
      <div onClick={() => setConfig({ ...config, onlyPositive: !config.onlyPositive })} className="flex items-center justify-between p-3 md:p-6 bg-gray-50 dark:bg-slate-800 border border-gray-200 rounded-2xl md:rounded-3xl cursor-pointer shadow-sm">
         <div className="flex items-center gap-3 md:gap-5">
           <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center ${config.onlyPositive ? 'bg-tusgu-blue text-white' : 'bg-gray-200 text-gray-400'}`}>{config.onlyPositive && <Check className="w-5 h-5 md:w-6 md:h-6" />}</div>
           <span className="font-bold text-slate-700 dark:text-slate-200 text-sm md:text-xl">Addition Only</span>
         </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
        <div className="space-y-1 md:space-y-4">
           <label className="text-xs md:text-base font-bold text-gray-500 uppercase tracking-wide ml-1">Speed</label>
           <select className="w-full p-3 md:p-6 bg-gray-50 dark:bg-slate-800 border border-gray-200 rounded-2xl md:rounded-3xl font-bold text-sm md:text-xl outline-none" value={config.listeningSpeed} onChange={(e) => setConfig({...config, listeningSpeed: parseFloat(e.target.value)})}>
             {[1.0, 1.2, 1.4, 1.6, 1.8, 2.0].map(v => <option key={v} value={v}>Level {((v-0.8)/0.2).toFixed(0)}</option>)}
           </select>
        </div>
        <div className="space-y-1 md:space-y-4">
          <label className="text-xs md:text-base font-bold text-gray-500 uppercase tracking-wide ml-1">Instructor</label>
          <div className="flex gap-2">
            <select className="flex-1 p-3 md:p-6 bg-gray-50 dark:bg-slate-800 border border-gray-200 rounded-2xl md:rounded-3xl font-bold text-sm md:text-xl outline-none" value={config.voiceIndex} onChange={(e) => setConfig({...config, voiceIndex: parseInt(e.target.value)})}>
              {voiceOptions.map((v, i) => <option key={i} value={i}>{v.name}</option>)}
            </select>
            <button onClick={playPreview} className="p-3 md:p-6 bg-slate-100 dark:bg-slate-700 rounded-2xl md:rounded-3xl text-tusgu-blue"><Volume2 /></button>
          </div>
        </div>
      </div>

      <button onClick={startGame} className="w-full bg-tusgu-blue text-white py-4 md:py-6 rounded-2xl md:rounded-3xl font-bold text-lg md:text-2xl flex items-center justify-center gap-2 md:gap-3 shadow-lg active:scale-[0.98] transition-all"><Play className="w-6 h-6 md:w-8 md:h-8" /> Start Session</button>
    </div>
  );

  const renderInput = () => (
    <div className="glass-panel rounded-[2rem] md:rounded-[3rem] shadow-soft w-full max-w-4xl mx-auto flex flex-col justify-center overflow-hidden">
      <div className="p-8 md:p-12 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-center">
        <h3 className="text-sm md:text-lg font-bold text-slate-400 uppercase tracking-widest mb-2 md:mb-4">Result</h3>
        <div className="text-7xl md:text-9xl font-black text-slate-800 dark:text-white h-20 md:h-32">{userAnswer || <span className="text-slate-200 dark:text-slate-700">?</span>}</div>
      </div>
      <div className="p-4 md:p-6 w-full max-w-xl mx-auto">
        <NumberPad value={userAnswer} onChange={setUserAnswer} onSubmit={checkAnswer} />
      </div>
    </div>
  );

  const renderFeedback = () => {
    const isCorrect = parseInt(userAnswer) === expectedAnswer;
    return (
      <div className="glass-panel p-6 md:p-12 rounded-[2rem] md:rounded-[3rem] shadow-soft w-full max-w-4xl mx-auto text-center animate-in zoom-in-95 duration-300 relative flex flex-col justify-center">
        <div className={`w-24 h-24 md:w-32 md:h-32 mx-auto rounded-full flex items-center justify-center mb-6 md:mb-8 ${isCorrect ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
           {isCorrect ? <span className="text-5xl md:text-6xl">✓</span> : <span className="text-5xl md:text-6xl">✗</span>}
        </div>
        <h2 className={`text-4xl md:text-5xl font-black mb-2 md:mb-4 ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>{isCorrect ? 'Correct!' : 'Incorrect'}</h2>
        <div className="my-6 md:my-10 p-6 md:p-8 bg-slate-50 dark:bg-slate-800 rounded-[2rem]">
           <p className="text-slate-500 text-xs md:text-base font-bold uppercase tracking-widest mb-2 md:mb-3">Answer</p>
           <p className="text-5xl md:text-6xl font-black text-slate-800 dark:text-white">{expectedAnswer}</p>
        </div>
        <div className="grid grid-cols-2 gap-4 md:gap-6">
          <button onClick={() => setGameState(GameState.CONFIG)} className="flex items-center justify-center gap-2 md:gap-3 py-4 md:py-6 rounded-2xl md:rounded-3xl bg-slate-100 dark:bg-slate-800 font-bold text-lg md:text-xl text-slate-600 dark:text-slate-300"><Settings className="w-5 h-5 md:w-7 md:h-7" /> Setup</button>
          <button onClick={startGame} className="flex items-center justify-center gap-2 md:gap-3 py-4 md:py-6 rounded-2xl md:rounded-3xl bg-tusgu-blue text-white font-bold text-lg md:text-xl"><RefreshCw className="w-5 h-5 md:w-7 md:h-7" /> Next</button>
        </div>
      </div>
    );
  };

  return (
    <Layout title="Listening" center={true}>
      {gameState === GameState.CONFIG && renderConfig()}
      {gameState === GameState.PLAYING && (
        <div className="flex flex-col items-center justify-center h-full animate-in fade-in duration-500">
           <div className={`relative w-64 h-64 md:w-80 md:h-80 rounded-full flex items-center justify-center ${isPlaying ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-gray-50'}`}>
             {isPlaying && <div className="absolute inset-0 rounded-full border-4 border-blue-100 animate-ping opacity-20"></div>}
             <Volume2 className="w-32 h-32 md:w-40 md:h-40 text-tusgu-blue" />
           </div>
           <button onClick={stopGame} className="mt-12 md:mt-20 flex items-center gap-3 md:gap-4 px-8 md:px-12 py-4 md:py-5 bg-red-50 text-red-600 rounded-full font-bold text-xl md:text-2xl"><Square className="w-6 h-6 md:w-8 md:h-8" /> Stop</button>
        </div>
      )}
      {gameState === GameState.INPUT && renderInput()}
      {gameState === GameState.FEEDBACK && renderFeedback()}
    </Layout>
  );
};