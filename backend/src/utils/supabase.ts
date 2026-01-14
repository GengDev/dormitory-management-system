import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
// Use SERVICE_ROLE_KEY if available (to bypass RLS for backend), otherwise use ANON_KEY
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase URL or Key is missing. Storage features may not work.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
