import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { getNews } from '../services/newsService';
import { NewsItem } from '../types';
import { Calendar, ExternalLink, Facebook, Layers, AlertCircle, Globe, ArrowRight } from 'lucide-react';

// --- Channels Configuration ---
interface Channel {
  id: string;
  name: string;
  type: 'facebook' | 'website';
  url: string;
  description?: string;
}

const CHANNELS: Channel[] = [
  { 
    id: 'tusgu-fb', 
    name: 'TUSGU', 
    type: 'facebook', 
    url: 'https://www.facebook.com/tusgueducation' 
  },
  { 
    id: 'ucmas-fb', 
    name: 'UCMAS Sri Lanka', 
    type: 'facebook', 
    url: 'https://www.facebook.com/srilankaucmas' 
  },
  { 
    id: 'tusgu-web', 
    name: 'TUSGU Website', 
    type: 'website', 
    url: 'https://www.tusgu.org/',
    description: 'Visit our official portal for course details and registrations.'
  },
  { 
    id: 'ucmas-web', 
    name: 'UCMAS Website', 
    type: 'website', 
    url: 'https://www.ucmassrilanka.com/',
    description: 'The official website for UCMAS Sri Lanka.'
  },
];

export const NewsBoard: React.FC = () => {
  const [activeChannel, setActiveChannel] = useState<Channel>(CHANNELS[0]);
  const [manualNews, setManualNews] = useState<NewsItem[]>([]);
  const [loadingManual, setLoadingManual] = useState(true);

  useEffect(() => {
    refreshManualNews();
  }, []);

  const refreshManualNews = async () => {
    setLoadingManual(true);
    const data = await getNews();
    setManualNews(data);
    setLoadingManual(false);
  };

  const isUrl = (text: string) => text.trim().startsWith('http');

  const handleVisitWebsite = () => {
    window.open(activeChannel.url, '_blank');
  };

  return (
    <Layout title="News & Updates">
      <div className="space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* --- Channel Selector --- */}
        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
          {CHANNELS.map((channel) => {
            const isActive = activeChannel.id === channel.id;
            const Icon = channel.type === 'facebook' ? Facebook : Globe;
            
            return (
              <button
                key={channel.id}
                onClick={() => setActiveChannel(channel)}
                className={`
                  flex items-center gap-2 px-5 py-3 rounded-full font-bold whitespace-nowrap transition-all border
                  ${isActive 
                    ? 'bg-tusgu-blue text-white shadow-lg shadow-blue-900/20 border-tusgu-blue' 
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700'}
                `}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'fill-current' : ''}`} />
                {channel.name}
              </button>
            );
          })}
        </div>

        {/* --- Main Content Grid --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Live Feed or Website Card */}
          <div className="lg:col-span-2 flex flex-col">
             <div className="flex items-center gap-2 mb-2 px-1">
               {activeChannel.type === 'facebook' ? (
                 <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
               ) : (
                 <Globe className="w-4 h-4 text-tusgu-blue dark:text-blue-400" />
               )}
               <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                 {activeChannel.type === 'facebook' ? `Live Feed: ${activeChannel.name}` : `Web Portal: ${activeChannel.name}`}
               </h2>
             </div>
             
             {/* 
                For Facebook: Max width 500px to match plugin limit, centered in column.
                For Website: Full width.
             */}
             <div className={`
                bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-soft border border-slate-100 dark:border-slate-700 flex flex-col relative transition-all duration-300
                ${activeChannel.type === 'facebook' ? 'w-full max-w-[500px] mx-auto min-h-[700px]' : 'w-full min-h-[400px]'}
             `}>
                
                {activeChannel.type === 'facebook' ? (
                  // --- Facebook View ---
                  // The container IS the card now, so the iframe fills it completely.
                  <>
                    <iframe
                        key={activeChannel.url}
                        src={`https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(activeChannel.url)}&tabs=timeline&width=500&height=800&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=true&appId`}
                        width="100%"
                        height="100%"
                        style={{ border: 'none', overflow: 'hidden', flex: 1 }}
                        scrolling="no"
                        frameBorder="0"
                        allowFullScreen={true}
                        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                        title={`Facebook Feed - ${activeChannel.name}`}
                        className="flex-1"
                      ></iframe>
                      <div className="bg-slate-50 dark:bg-slate-900 p-3 text-center text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-800">
                        <p>Scroll within the feed to see past updates.</p>
                      </div>
                  </>
                ) : (
                  // --- Website View ---
                  <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-800 dark:to-slate-900">
                    <div className="w-24 h-24 bg-white dark:bg-slate-700 rounded-3xl shadow-sm flex items-center justify-center mb-6">
                      <Globe className="w-12 h-12 text-tusgu-blue dark:text-blue-400" />
                    </div>
                    <h3 className="text-3xl font-bold text-slate-800 dark:text-white mb-4">{activeChannel.name}</h3>
                    <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-8 text-lg leading-relaxed">
                      {activeChannel.description}
                    </p>
                    <button 
                      onClick={handleVisitWebsite}
                      className="group flex items-center gap-3 px-8 py-4 bg-tusgu-blue text-white rounded-xl font-bold text-lg hover:bg-blue-900 hover:scale-105 transition-all shadow-lg shadow-blue-900/20"
                    >
                      Visit Website <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <p className="mt-8 text-xs text-slate-400">
                      {activeChannel.url}
                    </p>
                  </div>
                )}
             </div>
          </div>

          {/* Right Column: Pinned / Manual Notices */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2 px-1">
               <Layers className="w-4 h-4 text-slate-400" />
               <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Important Notices</h2>
            </div>

            {loadingManual ? (
               <div className="flex justify-center py-10">
                 <div className="w-8 h-8 border-4 border-slate-200 border-t-tusgu-blue rounded-full animate-spin"></div>
               </div>
            ) : manualNews.length === 0 ? (
               <div className="glass-panel p-8 text-center rounded-2xl border border-white/50 dark:border-slate-700">
                 <p className="text-slate-400 font-medium">No pinned notices.</p>
               </div>
            ) : (
              manualNews.map((item) => {
                const isLink = isUrl(item.content);
                return (
                  <div key={item.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 transition-all hover:shadow-md">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase">
                        <Calendar className="w-3 h-3" />
                        {item.created_at}
                      </div>
                      <AlertCircle className="w-4 h-4 text-tusgu-blue dark:text-blue-400" />
                    </div>
                    
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">{item.title}</h3>
                    
                    {isLink ? (
                      <a 
                        href={item.content} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="mt-2 inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" /> Open Link
                      </a>
                    ) : (
                      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        {item.content}
                      </p>
                    )}
                  </div>
                );
              })
            )}
            
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl mt-4">
              <p className="text-xs text-blue-800 dark:text-blue-300 font-medium text-center">
                Select a channel above to filter the main view. Important notices remain visible here.
              </p>
            </div>
          </div>
          
        </div>
      </div>
    </Layout>
  );
};