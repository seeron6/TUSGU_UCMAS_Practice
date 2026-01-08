import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { addNews, getNews, deleteNews } from '../services/newsService';
import { NewsItem } from '../types';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Loader, Lock, Trash2, Calendar, LayoutList, PenTool, Link as LinkIcon } from 'lucide-react';

export const AdminNews: React.FC = () => {
  const navigate = useNavigate();
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  
  // App state
  const [activeTab, setActiveTab] = useState<'create' | 'manage'>('create');
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  
  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // --- Auth Logic ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'tusguadmin') {
      setIsAuthenticated(true);
      fetchNews(); // Load news immediately upon login
    } else {
      alert('Incorrect Password');
      setPassword('');
    }
  };

  // --- Data Logic ---
  const fetchNews = async () => {
    setIsLoading(true);
    try {
      const data = await getNews();
      setNewsList(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;
    
    setIsSubmitting(true);
    try {
      await addNews(title, content);
      setTitle('');
      setContent('');
      alert('Posted successfully!');
      // Switch to manage tab to see it
      fetchNews();
      setActiveTab('manage');
    } catch (error: any) {
      console.error('Post Error:', error);
      // Show the actual error from Supabase
      alert(`Failed to post news. Error: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this item? This cannot be undone.')) return;
    
    try {
      await deleteNews(id);
      fetchNews(); // Refresh list
    } catch (error: any) {
      alert(`Failed to delete. Error: ${error.message}`);
    }
  };

  // --- Render Login ---
  if (!isAuthenticated) {
    return (
      <Layout title="Admin Portal" showHome={true} showBack={true}>
        <div className="min-h-[60vh] flex flex-col items-center justify-center animate-in zoom-in-95 duration-500">
          <div className="glass-panel p-10 rounded-3xl shadow-soft w-full max-w-md border border-white/50 dark:border-slate-700">
            <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-tusgu-blue dark:text-blue-400">
                <Lock className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Admin Access</h2>
              <p className="text-slate-500 dark:text-slate-400">Please enter credentials to continue</p>
            </div>
            
            <form onSubmit={handleLogin} className="space-y-4">
              <input 
                type="password"
                className="w-full p-4 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-tusgu-blue outline-none transition-all text-center tracking-widest text-lg"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
              <button 
                type="submit"
                className="w-full py-4 bg-tusgu-blue text-white rounded-xl font-bold hover:bg-blue-900 transition-colors shadow-lg shadow-blue-900/20"
              >
                Unlock Portal
              </button>
            </form>
          </div>
        </div>
      </Layout>
    );
  }

  // --- Render Dashboard ---
  return (
    <Layout title="Admin Dashboard" showHome={true} showBack={true}>
      <div className="animate-in fade-in slide-in-from-bottom-4">
        
        {/* Tabs */}
        <div className="flex gap-4 mb-8 justify-center">
          <button 
            onClick={() => setActiveTab('create')}
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all ${activeTab === 'create' ? 'bg-tusgu-blue text-white shadow-lg shadow-blue-900/20' : 'bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
          >
            <PenTool className="w-4 h-4" /> Create New
          </button>
          <button 
            onClick={() => { setActiveTab('manage'); fetchNews(); }}
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all ${activeTab === 'manage' ? 'bg-tusgu-blue text-white shadow-lg shadow-blue-900/20' : 'bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
          >
            <LayoutList className="w-4 h-4" /> Manage Existing
          </button>
        </div>

        {/* Create Tab */}
        {activeTab === 'create' && (
          <div className="glass-panel p-8 rounded-3xl shadow-soft max-w-2xl mx-auto border border-white/50 dark:border-slate-700">
            <div className="mb-6 pb-4 border-b border-gray-100 dark:border-slate-700">
               <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Post Update</h2>
               <p className="text-slate-400 text-sm mt-1">Post a text update or paste a Facebook link.</p>
            </div>
            
            <form onSubmit={handlePost} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide">Headline / Title</label>
                <input 
                  type="text" 
                  className="w-full p-4 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl font-semibold text-slate-800 dark:text-white focus:ring-2 focus:ring-tusgu-blue outline-none transition-all"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. New Schedule or Facebook Post"
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide">Link OR Text Content</label>
                <textarea 
                  rows={4}
                  className="w-full p-4 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-tusgu-blue outline-none transition-all resize-none"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Paste a Facebook link here (https://facebook.com/...) OR write a message."
                  disabled={isSubmitting}
                />
              </div>
              
              <button 
                type="submit"
                disabled={isSubmitting}
                className={`
                  w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all
                  ${isSubmitting 
                    ? 'bg-gray-100 dark:bg-slate-800 text-gray-400 cursor-not-allowed' 
                    : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 active:scale-[0.99]'}
                `}
              >
                {isSubmitting ? <Loader className="w-5 h-5 animate-spin" /> : <PlusCircle className="w-5 h-5" />}
                {isSubmitting ? 'Posting...' : 'Publish Update'}
              </button>
            </form>
          </div>
        )}

        {/* Manage Tab */}
        {activeTab === 'manage' && (
          <div className="max-w-2xl mx-auto space-y-4">
             {isLoading ? (
               <div className="text-center py-20"><Loader className="w-8 h-8 animate-spin mx-auto text-tusgu-blue" /></div>
             ) : newsList.length === 0 ? (
               <div className="text-center py-12 text-slate-400 glass-panel rounded-2xl">No items found.</div>
             ) : (
               newsList.map((item) => (
                 <div key={item.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex justify-between items-center group">
                   <div className="overflow-hidden">
                     <h3 className="font-bold text-slate-800 dark:text-white text-lg truncate pr-4">{item.title}</h3>
                     <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                       <Calendar className="w-3 h-3" /> {item.created_at}
                       {item.content.startsWith('http') && <><LinkIcon className="w-3 h-3 ml-2" /> Link</>}
                     </div>
                   </div>
                   <button 
                    onClick={() => handleDelete(item.id)}
                    className="p-3 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all flex-shrink-0"
                    title="Delete Item"
                   >
                     <Trash2 className="w-5 h-5" />
                   </button>
                 </div>
               ))
             )}
          </div>
        )}

      </div>
    </Layout>
  );
};