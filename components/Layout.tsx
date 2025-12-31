import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, ArrowLeft, Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  showHome?: boolean;
  showBack?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, title, showHome = true, showBack = true }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const isDashboard = location.pathname === '/';

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-800 dark:text-slate-100 transition-colors duration-300">
      {/* Header */}
      <header className="bg-tusgu-blue/95 dark:bg-slate-900/95 backdrop-blur-md text-white shadow-glow sticky top-0 z-50 border-b border-white/10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
             {!isDashboard && showBack && (
              <button 
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-white/10 rounded-full transition-all active:scale-95"
                aria-label="Go Back"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
            )}
            {title && <h1 className="text-xl font-bold tracking-wider uppercase opacity-90">{title}</h1>}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 hover:bg-white/10 rounded-full transition-all active:scale-95"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-6 h-6 text-yellow-300" /> : <Moon className="w-6 h-6" />}
            </button>

             {!isDashboard && showHome && (
              <button 
                onClick={() => navigate('/')}
                className="p-2 hover:bg-white/10 rounded-full transition-all active:scale-95"
                aria-label="Go Home"
              >
                <Home className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-5xl mx-auto w-full px-6 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="bg-slate-100 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 py-6 text-center text-xs font-medium uppercase tracking-widest border-t border-slate-200 dark:border-slate-800 transition-colors duration-300">
        <p>© {new Date().getFullYear()} TUSGU Educational Services</p>
      </footer>
    </div>
  );
};
