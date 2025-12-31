import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import { Send, CheckCircle, Mail, Loader } from 'lucide-react';
import { submitRequest } from '../services/newsService';

export const RequestPapers: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    materials: ''
  });
  const [status, setStatus] = useState<'IDLE' | 'SENDING' | 'SENT' | 'ERROR'>('IDLE');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('SENDING');
    
    try {
      // 1. Insert into Supabase DB
      await submitRequest(formData);

      // 2. Auto-open email client with pre-filled info
      const subject = encodeURIComponent(`${formData.name} - Material Request`);
      const body = encodeURIComponent(
        `New material request submitted:\n\n` +
        `Student Name: ${formData.name}\n` +
        `Email: ${formData.email}\n` +
        `Phone: ${formData.phone}\n\n` +
        `Requested Materials:\n${formData.materials}`
      );
      
      // Open mailto in a new window/tab so it doesn't block the UI

      // Set status to SENT immediately (don't wait for email to be sent)
      setStatus('SENT');
    } catch (error: any) {
      console.error(error);
      setStatus('ERROR');
      alert(`Submission Failed: ${error.message || 'Unknown Error'}`);
    }
  };

  const handleEmailRedirect = () => {
     const subject = encodeURIComponent(`${formData.name} - Material Request`);
     const body = encodeURIComponent(
       `Student Name: ${formData.name}\n` +
       `Email: ${formData.email}\n` +
       `Phone: ${formData.phone}\n\n` +
       `Requested Materials:\n${formData.materials}`
     );
  };

  if (status === 'SENT') {
    return (
      <Layout title="Request Papers">
        <div className="flex flex-col items-center justify-center min-h-[50vh] glass-panel rounded-3xl shadow-soft p-12 text-center animate-in zoom-in-95 duration-300">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-tusgu-blue mb-4">Request Sent!</h2>
          <p className="text-slate-600 mb-8 text-lg max-w-md mx-auto leading-relaxed">
            We have recorded your request for materials. We will contact you at <span className="font-bold text-slate-800">{formData.email}</span> when they are ready.
          </p>
          
          <div className="space-y-4 w-full max-w-xs">
            <button 
              onClick={() => {
                setFormData({ name: '', email: '', phone: '', materials: '' });
                setStatus('IDLE');
              }}
              className="w-full py-3 bg-slate-100 text-tusgu-blue font-bold rounded-xl hover:bg-slate-200 transition-colors"
            >
              Submit Another Request
            </button>
            
            {/* Optional: Manual Email Trigger for redundancy */}
            <button 
              onClick={handleEmailRedirect}
              className="w-full py-3 border border-slate-200 text-slate-500 font-medium rounded-xl hover:bg-white hover:text-slate-700 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <Mail className="w-4 h-4" /> Resend Email
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Request Papers">
      <div className="max-w-xl mx-auto glass-panel rounded-3xl shadow-soft p-10 border border-white/50 animate-in fade-in slide-in-from-bottom-8">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Study Material Request</h2>
          <p className="text-slate-500">
            Fill out the details below to request specific workbooks or practice sheets.
          </p>
        </div>
        
        {status === 'ERROR' && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-center text-sm font-bold">
            We could not submit the form. Please check your internet or try again later.
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Student Name</label>
            <input
              required
              type="text"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all placeholder-gray-300"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Email Address</label>
            <input
              required
              type="email"
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all placeholder-gray-300"
              placeholder="student@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Phone Number</label>
            <input
              required
              type="tel"
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all placeholder-gray-300"
              placeholder="(123) 456-7890"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Requested Materials</label>
            <textarea
              required
              rows={4}
              value={formData.materials}
              onChange={e => setFormData({...formData, materials: e.target.value})}
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all placeholder-gray-300 resize-none"
              placeholder="E.g., Grade 2 Mental Paper, Category A Paper ..."
            />
          </div>

          <button
            type="submit"
            disabled={status === 'SENDING'}
            className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
              status === 'SENDING' 
                ? 'bg-gray-100 cursor-not-allowed text-gray-400' 
                : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 active:scale-[0.99]'
            }`}
          >
            {status === 'SENDING' ? <Loader className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            {status === 'SENDING' ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>
      </div>
    </Layout>
  );
};