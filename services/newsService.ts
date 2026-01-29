import { supabase } from './supabaseClient';
import { NewsItem } from '../types';

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

export const submitRequest = async (data: { email: string; phone: string; materials: string }): Promise<void> => {
  const { error } = await supabase
    .from('requests')
    .insert([data]);
  
  if (error) {
    console.error('Error submission request:', error);
    throw error;
  }
};