import React, { useState, useRef, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Facebook, ExternalLink, ArrowRight } from 'lucide-react';
import ucmasLogo from '../assets/ucmas.png';
import { Logo } from '../components/Logo';

type OrgID = 'tusgu' | 'ucmas';

const DATA = {
  ucmas: {
    name: 'UCMAS',
    fullName: 'UCMAS Sri Lanka',
    url: 'https://www.ucmassrilanka.com/',
    fbUrl: 'https://www.facebook.com/srilankaucmas',
    logo: ucmasLogo,
    isImg: true
  },
  tusgu: {
    name: 'TUSGU',
    fullName: 'TUSGU Educational',
    url: 'https://www.tusgu.org/',
    fbUrl: 'https://www.facebook.com/tusgueducation',
    logo: null,
    isImg: false
  }
};

export const NewsBoard: React.FC = () => {
  const [selectedOrg, setSelectedOrg] = useState<OrgID | null>(null);
  
  // Ref for the container where the iframe will live
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const handleSelect = (id: OrgID) => setSelectedOrg(id);
  const handleBack = () => setSelectedOrg(null);

  // Measure container size to fit iframe perfectly
  useEffect(() => {
    if (!selectedOrg) return;

    const measure = () => {
      if (containerRef.current) {
        // Facebook Plugin Width: Min 180, Max 500
        const w = Math.min(Math.max(containerRef.current.clientWidth, 180), 500);
        // Height: Fit available space
        const h = Math.max(containerRef.current.clientHeight, 200);
        
        setDimensions({ width: w, height: h });
      }
    };

    // Initial measurement
    const timer = setTimeout(measure, 150);
    
    window.addEventListener('resize', measure);
    return () => {
      window.removeEventListener('resize', measure);
      clearTimeout(timer);
    };
  }, [selectedOrg]);

  // --- View 1: Selection Screen ---
  if (!selectedOrg) {
    return (
      <Layout title="News Board" center={true}>
        <div className="flex flex-col items-center justify-center h-full p-4 animate-in fade-in max-w-7xl mx-auto w-full">
          <div className="text-center mb-6 md:mb-16">
            <h2 className="text-2xl md:text-5xl font-bold text-slate-800 dark:text-white mb-2 md:mb-4">Latest Updates</h2>
            <p className="text-slate-500 text-sm md:text-2xl">Select an organization to view their news feed.</p>
          </div>
          
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-16">
            {/* TUSGU Button */}
            <button 
              onClick={() => handleSelect('tusgu')}
              className="w-full bg-white dark:bg-slate-800 p-6 md:p-20 rounded-3xl md:rounded-[3rem] shadow-soft border border-slate-100 dark:border-slate-700 flex flex-col items-center gap-4 md:gap-10 group active:scale-95 transition-all"
            >
              <div className="h-16 md:h-40 flex items-center justify-center pointer-events-none">
                <Logo size="lg" />
              </div>
              <div className="flex items-center gap-3 md:gap-4 text-tusgu-blue dark:text-blue-400 font-bold text-xl md:text-4xl">
                TUSGU News <ArrowRight className="w-5 h-5 md:w-10 md:h-10 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* UCMAS Button */}
            <button 
              onClick={() => handleSelect('ucmas')}
              className="w-full bg-white dark:bg-slate-800 p-6 md:p-20 rounded-3xl md:rounded-[3rem] shadow-soft border border-slate-100 dark:border-slate-700 flex flex-col items-center gap-4 md:gap-10 group active:scale-95 transition-all"
            >
               <div className="h-16 md:h-40 flex items-center justify-center pointer-events-none">
                 <img src={ucmasLogo} alt="UCMAS" className="h-14 md:h-36 object-contain" />
              </div>
              <div className="flex items-center gap-3 md:gap-4 text-[#1877F2] font-bold text-xl md:text-4xl">
                UCMAS Sri Lanka <ArrowRight className="w-5 h-5 md:w-10 md:h-10 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // --- View 2: Content Screen (No Scroll Layout) ---
  const org = DATA[selectedOrg];
  
  return (
    <Layout 
        title={org.name} 
        onBack={handleBack} 
        noPadding={true}
        center={false}
    >
      <div className="flex flex-col h-full overflow-hidden bg-slate-100 dark:bg-slate-900 w-full">
        
        {/* Top Control Bar */}
        <div className="bg-white dark:bg-slate-800 px-4 py-3 shadow-sm border-b border-slate-200 dark:border-slate-700 flex items-center justify-end shrink-0 z-10">
          <a 
            href={org.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-tusgu-blue text-white px-5 py-2 rounded-xl font-bold text-sm shadow-md shadow-blue-900/20 active:scale-95 transition-transform"
          >
            Visit Website <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* Facebook Feed Container */}
        <div ref={containerRef} className="flex-1 w-full relative bg-white flex items-center justify-center overflow-hidden">
           
           {dimensions.width > 0 ? (
             <iframe 
                src={`https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(org.fbUrl)}&tabs=timeline&width=${dimensions.width}&height=${dimensions.height}&small_header=true&adapt_container_width=true&hide_cover=false&show_facepile=false&appId`}
                width={dimensions.width}
                height={dimensions.height}
                style={{ border: 'none', overflow: 'hidden' }}
                scrolling="no"
                frameBorder="0"
                allowFullScreen={true}
                allow="encrypted-media"
                title="Facebook Feed"
             ></iframe>
           ) : (
              <span className="text-xs font-bold uppercase tracking-widest animate-pulse text-slate-400">Loading Feed...</span>
           )}
        </div>
        
        {/* Footer info */}
        <div className="bg-slate-50 dark:bg-slate-900 p-2 text-center shrink-0 border-t border-slate-200 dark:border-slate-800 pb-safe-bottom md:pb-2">
           <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
             <Facebook className="w-3 h-3" /> Showing live updates from Facebook
           </p>
        </div>

      </div>
    </Layout>
  );
};