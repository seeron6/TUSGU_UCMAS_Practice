import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { getNews } from '../services/newsService';
import { NewsItem } from '../types';
import { Calendar } from 'lucide-react';

export const NewsBoard: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    refreshNews();
  }, []);

  const refreshNews = async () => {
    setLoading(true);
    const data = await getNews();
    setNews(data);
    setLoading(false);
  };

  return (
    <Layout title="Center News Board">
      <div className="space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {loading ? (
           <div className="flex justify-center py-20">
             <div className="w-10 h-10 border-4 border-tusgu-blue dark:border-blue-400 border-t-transparent rounded-full animate-spin"></div>
           </div>
        ) : news.length === 0 ? (
           <div className="glass-panel text-center py-16 text-slate-400 dark:text-slate-500 rounded-3xl border border-white/50 dark:border-slate-700">
             <p className="text-lg font-medium">No announcements at the moment.</p>
           </div>
        ) : (
          news.map((item) => (
            <div 
              key={item.id} 
              className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-md rounded-3xl shadow-soft p-8 border border-white/50 dark:border-slate-700 transition-all hover:shadow-xl hover:shadow-blue-900/5 hover:-translate-y-1 relative group overflow-hidden"
            >
              {/* Decorative side accent */}
              <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-gradient-to-b from-tusgu-blue to-indigo-600 dark:from-blue-500 dark:to-indigo-500"></div>
              
              <div className="flex justify-between items-start mb-4 pl-2">
                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{item.title}</h3>
              </div>
              
              <div className="flex items-center gap-2 text-sm font-semibold text-tusgu-blue dark:text-blue-300 mb-6 bg-blue-50 dark:bg-blue-900/30 w-fit px-4 py-1.5 rounded-full border border-blue-100 dark:border-blue-800/50 ml-2">
                <Calendar className="w-4 h-4" />
                <span>{item.created_at}</span>
              </div>
              
              <div className="pl-2">
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-lg whitespace-pre-wrap font-light">
                  {item.content}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </Layout>
  );
};