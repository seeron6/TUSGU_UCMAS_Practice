import { supabase } from './supabaseClient';
import { NewsItem, RequestItem } from '../types';

export const getNews = async (): Promise<NewsItem[]> => {
  const { data, error } = await supabase
    .from('news')
    .select('id, title, content, created_at')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching news:', error);
    return [];
  }
  
  return data.map((item: any) => ({
    id: item.id,
    title: item.title,
    content: item.content,
    created_at: item.created_at ? new Date(item.created_at).toLocaleDateString() : '',
  }));
};

export const addNews = async (title: string, content: string): Promise<void> => {
  const { error } = await supabase
    .from('news')
    .insert([{ title, content }]);
  
  if (error) {
    console.error('Error adding news:', error);
    throw error;
  }
};

export const deleteNews = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('news')
    .delete()
    .eq('id', id);

  if (error) {
     console.error('Error deleting news:', error);
     throw error;
  }
};

export const submitRequest = async (request: RequestItem): Promise<void> => {
  const { error } = await supabase
    .from('requests')
    .insert([{ 
      email: request.email, 
      phone: request.phone, 
      materials: request.materials 
    }]);

  if (error) {
    console.error('Error submitting request:', error);
    throw error;
  }
};
