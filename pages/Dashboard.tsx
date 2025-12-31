import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Headphones, Zap, FileText, Newspaper, ChevronRight, Moon, Sun } from 'lucide-react';
import { Logo } from '../components/Logo';
import { useTheme } from '../contexts/ThemeContext';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const menuItems = [
    { 
      title: 'Listening Practice', 
      subtitle: 'Audio Mental Math',
      icon: Headphones, 
      path: '/listening', 
      gradient: 'from-blue-600 to-blue-800',
      shadow: 'shadow-blue-500/25'
    },
    { 
      title: 'Flash Practice', 
      subtitle: 'Visual Speed Math',
      icon: Zap, 
      path: '/flash', 
      gradient: 'from-amber-500 to-amber-700',
      shadow: 'shadow-amber-500/25'
    },
    { 
      title: 'Request Papers', 
      subtitle: 'Materials & Support',
      icon: FileText, 
      path: '/request', 
      gradient: 'from-emerald-500 to-emerald-700',
      shadow: 'shadow-emerald-500/25'
    },
    { 
      title: 'News Board', 
      subtitle: 'Center Updates',
      icon: Newspaper, 
      path: '/news', 
      gradient: 'from-indigo-600 to-indigo-800',
      shadow: 'shadow-indigo-500/25'
    },
  ];

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[85vh] gap-16 py-10">
      
      {/* Theme Toggle - Absolute Positioned */}
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-6 p-3 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-full shadow-sm hover:shadow-md transition-all text-slate-600 dark:text-yellow-300"
        aria-label="Toggle Theme"
      >
        {theme === 'dark' ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
      </button>

      <div className="scale-125 transform transition-transform hover:scale-130 duration-700 mt-10 md:mt-0">
        <Logo />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl px-4 animate-in slide-in-from-bottom-8 duration-700">
        {menuItems.map((item) => (
          <button
            key={item.title}
            onClick={() => navigate(item.path)}
            className={`
              relative overflow-hidden group rounded-3xl p-8 text-left transition-all duration-300
              bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-soft hover:shadow-xl hover:-translate-y-1
            `}
          >
            {/* Background Gradient on Hover */}
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-br ${item.gradient} transition-opacity duration-300`}></div>
            
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-6">
                <div className={`
                  w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg
                  bg-gradient-to-br ${item.gradient} ${item.shadow} group-hover:scale-110 transition-transform duration-300
                `}>
                  <item.icon className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white group-hover:text-tusgu-blue dark:group-hover:text-blue-300 transition-colors">{item.title}</h3>
                  <p className="text-sm font-medium text-slate-400 dark:text-slate-400 mt-1">{item.subtitle}</p>
                </div>
              </div>
              <ChevronRight className="w-6 h-6 text-slate-300 dark:text-slate-600 group-hover:text-tusgu-blue dark:group-hover:text-blue-300 transform group-hover:translate-x-1 transition-all" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
