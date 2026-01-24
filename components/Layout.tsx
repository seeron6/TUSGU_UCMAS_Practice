import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, ArrowLeft, Moon, Sun, BarChart2, Newspaper } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  noPadding?: boolean;
  center?: boolean;
  showHome?: boolean; // Deprecated but kept for compatibility
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  title, 
  showBack = true, 
  onBack,
  noPadding = false, 
  center = false 
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const isDashboard = location.pathname === '/';

  // Handle Native Status Bar
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      const setStatus = async () => {
        try {
          // Inner pages always have a dark header (Blue or Slate-900).
          // Therefore, always use White Icons -> Style.Dark (Light Text Style)
          await StatusBar.setStyle({ style: Style.Dark });
          
          if (theme === 'dark') {
            await StatusBar.setBackgroundColor({ color: '#0f172a' }); 
          } else {
            await StatusBar.setBackgroundColor({ color: '#000080' }); 
          }
        } catch (e) {
          console.warn('StatusBar not available');
        }
      };
      setStatus();
    }
  }, [theme]);

  const handleNav = async (path: string) => {
    if (location.pathname === path) return;
    await Haptics.impact({ style: ImpactStyle.Light });
    navigate(path);
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col font-sans text-slate-800 dark:text-slate-100 transition-colors duration-300 bg-slate-50 dark:bg-slate-900 overflow-hidden">
      {/* Header */}
      <header className="bg-tusgu-blue/95 dark:bg-slate-900/95 backdrop-blur-md text-white shadow-md flex-shrink-0 z-50 border-b border-white/10 pt-safe-top">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center shrink-0 w-10">
             {!isDashboard && (showBack || onBack) && (
              <button 
                onClick={handleBack}
                className="p-2 hover:bg-white/10 rounded-full transition-all active:scale-95"
                aria-label="Go Back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
          </div>
          
          {title && (
            <h1 className="text-lg md:text-xl font-bold tracking-wider uppercase opacity-90 truncate flex-1 text-center min-w-0">
              {title}
            </h1>
          )}
          
          <div className="flex justify-end shrink-0 w-10">
            <button
              onClick={toggleTheme}
              className="p-2 hover:bg-white/10 rounded-full transition-all active:scale-95"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-300" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow w-full max-w-7xl mx-auto relative overflow-hidden">
        <div className="absolute inset-0 w-full h-full scrollable-container">
            {/* 
               Layout Logic:
               - noPadding=true implies we want the child to control dimensions, so we use h-full.
               - Otherwise we use min-h-full to allow scrolling content to expand.
               - Added pb-28 to ensure content isn't hidden behind the fixed bottom nav on any device.
            */}
            <div className={`${noPadding ? 'h-full' : 'min-h-full'} flex flex-col ${center ? 'justify-center' : 'justify-start'} ${noPadding ? 'p-0' : 'px-4 pt-6 pb-28'}`}>
                {children}
            </div>
        </div>
      </main>

      {/* Bottom Navigation (Visible on All Devices now to support iPad Pro landscape) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 pb-safe-bottom z-50 shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
        <div className="flex justify-around items-center p-2 max-w-2xl mx-auto">
          <NavButton 
            active={location.pathname === '/'} 
            icon={Home} 
            label="Home" 
            onClick={() => handleNav('/')} 
          />
          <NavButton 
            active={location.pathname === '/stats'} 
            icon={BarChart2} 
            label="Stats" 
            onClick={() => handleNav('/stats')} 
          />
          <NavButton 
            active={location.pathname === '/news'} 
            icon={Newspaper} 
            label="News" 
            onClick={() => handleNav('/news')} 
          />
        </div>
      </div>
      
      {/* Desktop Footer - Keeping simple copyright at bottom of layout if needed, but might be covered by nav. 
          Since nav is fixed, this footer inside the flex-col might be pushed up or hidden. 
          Given the bottom nav is now ubiquitous, we can hide this to avoid clutter or double footer.
      */}
      <footer className="hidden bg-slate-100 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 py-4 text-center text-xs font-medium uppercase tracking-widest border-t border-slate-200 dark:border-slate-800 transition-colors duration-300">
        <p>© {new Date().getFullYear()} TUSGU Educational Services</p>
      </footer>
    </div>
  );
};

const NavButton: React.FC<{ active: boolean; icon: any; label: string; onClick: () => void }> = ({ active, icon: Icon, label, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all w-20 md:w-24 ${active ? 'text-tusgu-blue dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'}`}
  >
    <Icon className={`w-6 h-6 md:w-7 md:h-7 ${active ? 'fill-current' : ''}`} />
    <span className="text-[10px] md:text-xs font-bold">{label}</span>
  </button>
);