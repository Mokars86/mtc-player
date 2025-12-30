import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://polxbcvqcrjuyrrgjdhr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvbHhiY3ZxY3JqdXlycmdqZGhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwNjE4NzIsImV4cCI6MjA4MjYzNzg3Mn0.S4W7BzCP_jrhO6frRfso8xAIXgJR_nKyruDFmLg__ac';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
