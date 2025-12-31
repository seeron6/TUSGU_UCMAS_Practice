import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gohappecxmqukkdvegvh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvaGFwcGVjeG1xdWtrZHZlZ3ZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMTM3MDYsImV4cCI6MjA4MjY4OTcwNn0.zH4CTmzFBnK5ju6U9nuKXXnDXB8-4x_PLuldpC8U5mQ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
