import { createClient } from '@supabase/supabase-js';

// Hardcoded for project stability across environments (Local & Vercel)
const supabaseUrl = 'https://phasmtynpvcccrrlvztf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoYXNtdHlucHZjY2Nycmx2enRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5MDEzMTgsImV4cCI6MjA4MzQ3NzMxOH0.ivJhqh1gkv5dvHF_5qrQ-G7wXA8FWcs3J0j3hGj9ots';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
