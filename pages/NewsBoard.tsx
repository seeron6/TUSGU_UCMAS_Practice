import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Facebook, Globe, ArrowRight, Check, ExternalLink } from 'lucide-react';

type OrgID = 'tusgu' | 'ucmas';
type ViewType = 'facebook' | 'website';

const DATA = {
  ucmas: {
    id: 'ucmas',
    name: 'UCMAS Sri Lanka',
    shortName: 'UCMAS',
    facebook: 'https://www.facebook.com/srilankaucmas',
    website: 'https://www.ucmassrilanka.com/',
    description: 'The official website for UCMAS Sri Lanka. Explore our mental math programs and competitions.'
  },
  tusgu: {
    id: 'tusgu',
    name: 'TUSGU Educational Services',
    shortName: 'TUSGU',
    facebook: 'https://www.facebook.com/tusgueducation',
    website: 'https://www.tusgu.org/',
    description: 'Visit our official portal for course details, student resources, and registrations.'
  }
};

export const NewsBoard: React.FC = () => {
  // Default to UCMAS as requested
  const [org, setOrg] = useState<OrgID>('ucmas');
  const [view, setView] = useState<ViewType>('facebook');
  
  // State to track the optimal width for the Facebook plugin
  const [pluginWidth, setPluginWidth] = useState(500);

  const currentOrg = DATA[org];

  const handleVisitWebsite = () => {
    window.open(currentOrg.website, '_blank');
  };

  // Calculate the available width for the iframe to ensure no clipping on mobile
  useEffect(() => {
    const calculateWidth = () => {
      // Layout has px-6 (24px * 2 = 48px) padding. 
      // We subtract a bit more (approx 56px) to be safe and avoid horizontal scrollbars.
      // Max width is clamped at 500px for desktop aesthetics.
      const safeWidth = Math.min(500, window.innerWidth - 56);
      setPluginWidth(Math.floor(safeWidth));
    };

    calculateWidth();
    
    // Add resize listener with simple debounce to prevent rapid iframe reloading
    let timeoutId: any;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(calculateWidth, 300);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <Layout title="News & Updates">
      <div className="flex flex-col items-center max-w-4xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* --- Organization Switcher --- */}
        <div className="w-full mb-8">
           <div className="grid grid-cols-2 p-1.5 bg-slate-200 dark:bg-slate-800 rounded-2xl">
             {/* Render keys in order: UCMAS first, then TUSGU */}
             {(['ucmas', 'tusgu'] as OrgID[]).map((key) => {
               const isActive = org === key;
               return (
                 <button
                  key={key}
                  onClick={() => setOrg(key)}
                  className={`
                    py-4 rounded-xl text-sm md:text-base font-bold transition-all duration-300 flex items-center justify-center gap-2
                    ${isActive 
                      ? 'bg-white dark:bg-slate-700 text-tusgu-blue dark:text-white shadow-sm' 
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}
                  `}
                 >
                   {isActive && <Check className="w-4 h-4" />}
                   {DATA[key].name}
                 </button>
               );
             })}
           </div>
        </div>

        {/* --- View Mode Tabs (Facebook vs Website) --- */}
        <div className="flex items-center gap-4 mb-8 bg-white dark:bg-slate-800 p-2 rounded-full shadow-sm border border-slate-100 dark:border-slate-700">
          <button
            onClick={() => setView('facebook')}
            className={`
              flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-sm transition-all
              ${view === 'facebook' 
                ? 'bg-[#1877F2] text-white shadow-lg shadow-blue-500/20' 
                : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}
            `}
          >
            <Facebook className="w-4 h-4" /> Live Feed
          </button>
          <button
            onClick={() => setView('website')}
            className={`
              flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-sm transition-all
              ${view === 'website' 
                ? 'bg-tusgu-blue text-white shadow-lg shadow-blue-900/20' 
                : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}
            `}
          >
            <Globe className="w-4 h-4" /> Official Website
          </button>
        </div>

        {/* --- Content Area --- */}
        <div className="w-full flex justify-center">
           <div 
             className={`
               bg-white dark:bg-slate-800 rounded-2xl md:rounded-[2.5rem] overflow-hidden shadow-soft border border-slate-100 dark:border-slate-700 min-h-[750px] flex flex-col relative transition-all duration-500 ease-in-out
               ${view === 'facebook' ? 'w-full' : 'w-full'}
             `}
             // Apply dynamic max-width via inline style to match the exact plugin width on desktop, 
             // but ensure full width logic applies for the layout transition.
             style={view === 'facebook' ? { maxWidth: `${pluginWidth}px` } : {}}
           >
              
              {/* 
                  Key on this wrapper div ensures that React treats the content as new when org or view changes.
                  This triggers the 'animate-in' CSS animation for a smooth cross-fade effect.
              */}
              <div 
                key={`${org}-${view}`} 
                className="flex-1 flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both"
              >
                {view === 'facebook' ? (
                  // --- Facebook View ---
                  <div className="flex-1 flex flex-col relative bg-white dark:bg-slate-800">
                    <div className="flex-1 relative overflow-hidden">
                       <iframe
                        key={`${org}-fb-iframe-${pluginWidth}`} // Re-render if width changes substantially
                        src={`https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(currentOrg.facebook)}&tabs=timeline&width=${pluginWidth}&height=1000&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=true`}
                        width="100%"
                        height="100%"
                        style={{ border: 'none', overflow: 'hidden' }}
                        scrolling="yes"
                        frameBorder="0"
                        allowFullScreen={true}
                        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                        title={`Facebook Feed - ${currentOrg.name}`}
                        className="absolute inset-0 w-full h-full" 
                      ></iframe>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900 p-3 text-center text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-800 z-10">
                      <p className="flex items-center justify-center gap-1">
                        Showing updates from {currentOrg.shortName}. 
                        <a href={currentOrg.facebook} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline flex items-center gap-0.5">
                           Open in FB <ExternalLink className="w-2 h-2" />
                        </a>
                      </p>
                    </div>
                  </div>
                ) : (
                  // --- Website View ---
                  <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-16 text-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-800 dark:to-slate-900">
                    <div className="w-24 h-24 bg-white dark:bg-slate-700 rounded-3xl shadow-sm flex items-center justify-center mb-8 animate-in zoom-in-95 duration-700 delay-100 fill-mode-both">
                      <Globe className="w-12 h-12 text-tusgu-blue dark:text-blue-400" />
                    </div>
                    
                    <h3 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white mb-6 animate-in slide-in-from-bottom-4 duration-700 delay-200 fill-mode-both">
                      {currentOrg.name}
                    </h3>
                    
                    <p className="text-slate-600 dark:text-slate-300 max-w-lg mx-auto mb-10 text-lg leading-relaxed animate-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-both">
                      {currentOrg.description}
                    </p>
                    
                    <button 
                      onClick={handleVisitWebsite}
                      className="group flex items-center gap-3 px-10 py-5 bg-tusgu-blue text-white rounded-2xl font-bold text-xl hover:bg-blue-900 hover:scale-105 transition-all shadow-xl shadow-blue-900/20 animate-in zoom-in-95 duration-700 delay-500 fill-mode-both"
                    >
                      Visit Website <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                    </button>
                    
                    <div className="mt-12 p-4 bg-white/50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 animate-in fade-in duration-1000 delay-700 fill-mode-both">
                      <p className="text-xs text-slate-400 font-mono">
                        {currentOrg.website}
                      </p>
                    </div>
                  </div>
                )}
              </div>
           </div>
        </div>
        
      </div>
    </Layout>
  );
};