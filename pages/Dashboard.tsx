import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Headphones, Zap, Newspaper, ChevronRight, Bell, BellOff, X, CheckCircle, Clock, Sun, Moon, Calculator } from 'lucide-react';
import { Logo } from '../components/Logo';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { scheduleReminders, cancelReminders, checkReminderStatus, Frequency } from '../services/notificationService';
import { useTheme } from '../contexts/ThemeContext';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import ucmasLogo from '../assets/ucmas.png';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [freq, setFreq] = useState<Frequency>('day');
  const [count, setCount] = useState<number>(1);

  useEffect(() => {
    checkReminderStatus().then(setRemindersEnabled);
  }, []);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      const setStatus = async () => {
        try {
          if (theme === 'dark') {
            await StatusBar.setStyle({ style: Style.Dark });
            await StatusBar.setBackgroundColor({ color: '#0f172a' }); 
          } else {
            await StatusBar.setStyle({ style: Style.Light });
            await StatusBar.setBackgroundColor({ color: '#f8fafc' }); 
          }
        } catch (e) {
          console.warn('StatusBar error', e);
        }
      };
      setStatus();
    }
  }, [theme]);

  const handleNavigate = async (path: string) => {
    await Haptics.impact({ style: ImpactStyle.Light });
    navigate(path);
  };

  const handleBellClick = async () => {
    await Haptics.impact({ style: ImpactStyle.Medium });
    if (remindersEnabled) {
        await cancelReminders();
        setRemindersEnabled(false);
    } else {
        setShowNotifModal(true);
    }
  };

  const confirmNotifications = async () => {
      const success = await scheduleReminders(freq, count);
      if (success) {
          setRemindersEnabled(true);
          setShowNotifModal(false);
          await Haptics.notification({ type: NotificationType.Success });
          alert("Notifications have been turned on!");
      } else {
          alert("Permission denied for notifications");
      }
  };

  const menuItems = [
    { 
      title: 'Abacus Practice', 
      subtitle: 'Formulas & Routines',
      icon: Calculator, 
      path: '/abacus', 
      gradient: 'from-emerald-600 to-teal-800',
      iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300'
    },
    { 
      title: 'Listening Practice', 
      subtitle: 'Audio Mental Math',
      icon: Headphones, 
      path: '/listening', 
      gradient: 'from-tusgu-blue to-blue-900',
      iconBg: 'bg-blue-50 text-tusgu-blue dark:bg-blue-900 dark:text-blue-200'
    },
    { 
      title: 'Flash Practice', 
      subtitle: 'Visual Speed Math',
      icon: Zap, 
      path: '/flash', 
      gradient: 'from-blue-600 to-blue-800',
      iconBg: 'bg-blue-50 text-blue-600 dark:bg-slate-800 dark:text-blue-400'
    },
    { 
      title: 'News Board', 
      subtitle: 'Updates & Events',
      icon: Newspaper, 
      path: '/news', 
      gradient: 'from-indigo-900 to-tusgu-blue',
      iconBg: 'bg-indigo-50 text-tusgu-blue dark:bg-indigo-900/50 dark:text-indigo-300'
    },
  ];

  return (
    <div className="fixed inset-0 bg-slate-50 dark:bg-slate-900 transition-colors duration-300 overflow-hidden">
      <button
        onClick={handleBellClick}
        style={{ top: 'calc(env(safe-area-inset-top, 20px) + 1.5rem)' }}
        className={`absolute left-6 p-2.5 rounded-full shadow-sm border transition-all z-20 flex items-center gap-2 px-4 ${remindersEnabled ? 'bg-tusgu-blue text-white border-transparent shadow-blue-900/20' : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'}`}
      >
        {remindersEnabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
        <span className="text-[10px] font-bold uppercase tracking-wider hidden md:block">{remindersEnabled ? 'On' : 'Off'}</span>
      </button>

      <button
        onClick={toggleTheme}
        style={{ top: 'calc(env(safe-area-inset-top, 20px) + 1.5rem)' }}
        className="absolute right-6 p-2.5 rounded-full shadow-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-all z-20 active:scale-95"
      >
        {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5" />}
      </button>

      <div className="w-full h-full overflow-y-auto scrollable-container flex flex-col pt-safe-top pb-safe-bottom">
        <div className="flex-1 flex flex-col px-6 pb-12 min-h-full">
          <div className="flex flex-row items-center justify-center gap-4 md:gap-8 lg:gap-12 w-full max-w-6xl mx-auto flex-shrink-0 animate-in zoom-in-95 duration-700 mt-20 mb-8 landscape:mt-8 landscape:mb-4 lg:mt-24">
            <div className="flex-1 flex justify-end transform transition-transform duration-300">
              <img src={ucmasLogo} alt="UCMAS Sri Lanka" className="h-20 md:h-32 lg:h-40 landscape:h-16 object-contain drop-shadow-sm select-none pointer-events-none" />
            </div>
            <div className="h-10 md:h-24 lg:h-32 landscape:h-12 w-[2px] bg-slate-200 dark:bg-slate-700 rounded-full opacity-60"></div>
            <div className="flex-1 flex justify-start"><Logo size="lg" /></div>
          </div>
          
          {/* Main Grid: Responsive columns and padding */}
          <div className="flex-1 w-full max-w-6xl mx-auto px-1 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 lg:gap-10 animate-in slide-in-from-bottom-8 duration-700 pb-20 md:pb-8 content-start md:content-center">
            {menuItems.map((item) => (
              <button
                key={item.title}
                onClick={() => handleNavigate(item.path)}
                className="relative overflow-hidden group rounded-[2.5rem] p-6 md:p-8 lg:p-10 transition-all duration-300 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-soft hover:shadow-xl hover:-translate-y-1 active:scale-[0.98] flex-shrink-0 w-full text-left"
              >
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 bg-gradient-to-br ${item.gradient} transition-opacity duration-300`}></div>
                <div className="flex relative z-10 w-full flex-row items-center justify-between">
                  <div className="flex items-center gap-5 md:gap-6">
                    <div className={`w-14 h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0 ${item.iconBg}`}>
                      <item.icon className="w-7 h-7 md:w-8 md:h-8 lg:w-10 lg:h-10" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-slate-800 dark:text-white group-hover:text-tusgu-blue dark:group-hover:text-blue-300 transition-colors truncate">{item.title}</h3>
                      <p className="text-xs md:text-sm lg:text-base font-bold text-slate-400 uppercase tracking-wide mt-1 truncate">{item.subtitle}</p>
                    </div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-700/50 p-2 md:p-3 lg:p-4 rounded-full flex-shrink-0">
                    <ChevronRight className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-slate-300 dark:text-slate-500" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {showNotifModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-300 relative">
                <button onClick={() => setShowNotifModal(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X className="w-5 h-5" /></button>
                <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 text-tusgu-blue dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-3"><Clock className="w-6 h-6" /></div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Practice Reminders</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Keep your streak alive!</p>
                </div>
                <div className="space-y-4 mb-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">How Often?</label>
                        <div className="grid grid-cols-3 gap-2">
                            {(['day', 'week', 'month'] as const).map((f) => (
                                <button key={f} onClick={() => setFreq(f)} className={`py-2 rounded-xl text-sm font-bold capitalize transition-all border-2 ${freq === f ? 'border-tusgu-blue bg-blue-50 text-tusgu-blue dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-400' : 'border-slate-100 bg-white text-slate-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300'}`}>{f === 'day' ? 'Daily' : f === 'week' ? 'Weekly' : 'Monthly'}</button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">How Many Times?</label>
                         <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900 rounded-xl p-2 border border-slate-200 dark:border-slate-700">
                             <button onClick={() => setCount(Math.max(1, count - 1))} className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-800 rounded-lg shadow-sm text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 text-xl">-</button>
                             <div className="text-lg font-bold text-slate-800 dark:text-white">{count} <span className="text-sm font-normal text-slate-500">per {freq}</span></div>
                             <button onClick={() => setCount(Math.min(5, count + 1))} className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-800 rounded-lg shadow-sm text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 text-xl">+</button>
                         </div>
                    </div>
                </div>
                <button onClick={confirmNotifications} className="w-full py-3 bg-tusgu-blue text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"><CheckCircle className="w-5 h-5" /> Turn On</button>
            </div>
        </div>
      )}
    </div>
  );
};