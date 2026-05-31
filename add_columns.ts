import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL || '', process.env.VITE_SUPABASE_ANON_KEY || '');

async function run() {
  const { data, error } = await supabase.rpc('exec_sql', { sql: `
    ALTER TABLE tutor_profiles ADD COLUMN can_speak_english BOOLEAN DEFAULT false;
    ALTER TABLE tutor_profiles ADD COLUMN preferred_grades TEXT[];
  ` });
  
  if (error) {
     console.log("RPC exec_sql not found or failed");
  }
}
run();
