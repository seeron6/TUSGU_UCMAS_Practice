import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Headphones, Zap, Newspaper, ChevronRight, Moon, Sun } from 'lucide-react';
import { Logo } from '../components/Logo';
import { useTheme } from '../contexts/ThemeContext';
// INFO: Please ensure 'assets/ucmas.png' exists in your project assets folder.
import ucmasLogo from '../assets/ucmas.png';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const menuItems = [
    { 
      title: 'Listening Practice', 
      subtitle: 'Audio Mental Math',
      icon: Headphones, 
      path: '/listening', 
      // Primary Navy Blue
      gradient: 'from-tusgu-blue to-blue-900',
      iconBg: 'bg-blue-50 text-tusgu-blue dark:bg-blue-900 dark:text-blue-200'
    },
    { 
      title: 'Flash Practice', 
      subtitle: 'Visual Speed Math',
      icon: Zap, 
      path: '/flash', 
      // Lighter Blue Accent
      gradient: 'from-blue-600 to-blue-800',
      iconBg: 'bg-blue-50 text-blue-600 dark:bg-slate-800 dark:text-blue-400'
    },
    { 
      title: 'News Board', 
      subtitle: 'Facebook Updates & Events',
      icon: Newspaper, 
      path: '/news', 
      // Deep Indigo/Blue
      gradient: 'from-indigo-900 to-tusgu-blue',
      iconBg: 'bg-indigo-50 text-tusgu-blue dark:bg-indigo-900/50 dark:text-indigo-300'
    },
  ];

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[85vh] gap-4 py-10">
      
      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-6 p-3 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-full shadow-sm hover:shadow-md transition-all text-slate-600 dark:text-yellow-300 z-10"
        aria-label="Toggle Theme"
      >
        {theme === 'dark' ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
      </button>

      {/* Dual Logo Header */}
      <div className="flex flex-row items-center justify-center gap-6 md:gap-16 w-full max-w-5xl px-4 mt-10 md:mt-0 animate-in zoom-in-95 duration-700">
        
        {/* UCMAS Logo (Left) - Links to Website */}
        <a 
          href="https://www.ucmassrilanka.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex justify-end transform transition-transform hover:scale-105 active:scale-95 duration-300 group"
          title="Visit UCMAS Sri Lanka"
        >
          <img 
            src={ucmasLogo} 
            alt="UCMAS Sri Lanka" 
            className="h-48 md:h-80 object-contain drop-shadow-sm group-hover:drop-shadow-md transition-all" 
          />
        </a>

        {/* Divider */}
        <div className="h-16 w-[2px] bg-slate-200 dark:bg-slate-700 rounded-full opacity-60"></div>

        {/* TUSGU Logo (Right) - Existing Admin Functionality */}
        <div className="flex-1 flex justify-start transform transition-transform hover:scale-105 duration-300">
          <Logo />
        </div>

      </div>
      
      {/* Menu Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl px-4 animate-in slide-in-from-bottom-8 duration-700">
        {menuItems.map((item) => {
          const isNews = item.title === 'News Board';
          return (
            <button
              key={item.title}
              onClick={() => navigate(item.path)}
              className={`
                relative overflow-hidden group rounded-3xl p-8 transition-all duration-300
                bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-soft hover:shadow-xl hover:-translate-y-1
                ${isNews ? 'md:col-span-2' : ''} 
              `}
            >
              {/* Hover Gradient Overlay */}
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 bg-gradient-to-br ${item.gradient} transition-opacity duration-300`}></div>
              
              <div className={`flex relative z-10 w-full ${isNews ? 'flex-col items-center justify-center text-center' : 'flex-row items-center justify-between text-left'}`}>
                <div className={`flex ${isNews ? 'flex-col items-center gap-6' : 'items-center gap-6'}`}>
                  <div className={`
                    w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm
                    ${item.iconBg} group-hover:scale-110 transition-transform duration-300
                  `}>
                    <item.icon className="w-8 h-8" />
                  </div>
                  <div className={isNews ? 'flex flex-col items-center' : ''}>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white group-hover:text-tusgu-blue dark:group-hover:text-blue-300 transition-colors">{item.title}</h3>
                    <p className="text-sm font-medium text-slate-400 dark:text-slate-400 mt-1">{item.subtitle}</p>
                  </div>
                </div>
                {!isNews && <ChevronRight className="w-6 h-6 text-slate-300 dark:text-slate-600 group-hover:text-tusgu-blue dark:group-hover:text-blue-300 transform group-hover:translate-x-1 transition-all" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};