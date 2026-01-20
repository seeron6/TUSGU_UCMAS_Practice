import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { getStats, clearStats, getStreak, GameResult } from '../services/statsService';
import { BarChart2, Trash2, Zap, Headphones, Flame } from 'lucide-react';

export const Stats: React.FC = () => {
  const [history, setHistory] = useState<GameResult[]>([]);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    setHistory(getStats());
    setStreak(getStreak());
  }, []);

  const handleClear = () => {
    if(window.confirm('Clear all history?')) {
        clearStats();
        setHistory([]);
        setStreak(0);
    }
  };

  const calculateAccuracy = (type: 'listening' | 'flash') => {
     const games = history.filter(h => h.type === type);
     if (games.length === 0) return 0;
     const correct = games.filter(g => g.score > 0).length;
     return Math.round((correct / games.length) * 100);
  };

  return (
    <Layout title="Your Progress">
       <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6">
          
          {/* Streak Banner */}
          <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-3xl p-6 text-white shadow-lg shadow-orange-500/20 flex items-center justify-between">
             <div>
               <div className="text-orange-100 text-xs font-bold uppercase tracking-widest mb-1">Current Streak</div>
               <div className="text-4xl font-black flex items-baseline gap-2">
                 {streak} <span className="text-lg font-bold opacity-80">Days</span>
               </div>
             </div>
             <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
               <Flame className="w-8 h-8 text-white" />
             </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-blue-600 rounded-2xl p-4 text-white shadow-lg shadow-blue-600/20">
                <div className="flex items-center gap-2 mb-2 opacity-80">
                   <Headphones className="w-4 h-4" /> <span className="text-xs font-bold uppercase">Listening</span>
                </div>
                <div className="text-3xl font-black">{calculateAccuracy('listening')}%</div>
                <div className="text-xs opacity-60 mt-1">Accuracy</div>
             </div>
             <div className="bg-indigo-600 rounded-2xl p-4 text-white shadow-lg shadow-indigo-600/20">
                <div className="flex items-center gap-2 mb-2 opacity-80">
                   <Zap className="w-4 h-4" /> <span className="text-xs font-bold uppercase">Flash</span>
                </div>
                <div className="text-3xl font-black">{calculateAccuracy('flash')}%</div>
                <div className="text-xs opacity-60 mt-1">Accuracy</div>
             </div>
          </div>

          <div className="flex justify-between items-end">
             <h3 className="text-lg font-bold text-slate-800 dark:text-white">Recent Activity</h3>
             {history.length > 0 && (
                <button onClick={handleClear} className="text-red-400 text-xs font-bold flex items-center gap-1 hover:text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-lg transition-colors">
                    <Trash2 className="w-3 h-3" /> Clear History
                </button>
             )}
          </div>

          <div className="space-y-3 pb-8">
             {history.length === 0 ? (
                 <div className="text-center py-12 text-slate-400 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                    <BarChart2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No practice sessions yet.</p>
                 </div>
             ) : (
                 history.map(item => (
                     <div key={item.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-3">
                           <div className={`w-10 h-10 rounded-full flex items-center justify-center ${item.type === 'listening' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'}`}>
                              {item.type === 'listening' ? <Headphones className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                           </div>
                           <div>
                              <div className="text-xs text-slate-400 font-bold mb-0.5">{new Date(item.date).toLocaleDateString()}</div>
                              <div className="font-bold text-slate-700 dark:text-slate-200 text-sm">{item.config}</div>
                           </div>
                        </div>
                        <div className={`font-black text-lg ${item.score > 0 ? 'text-green-500' : 'text-red-400'}`}>
                           {item.score > 0 ? 'PASS' : 'FAIL'}
                        </div>
                     </div>
                 ))
             )}
          </div>
       </div>
    </Layout>
  );
};