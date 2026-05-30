import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.from('messages').select('*').eq('is_read', false).limit(1);
  console.log('Unread:', data?.[0]);
  if (data?.[0]) {
    const { error: updErr } = await supabase.from('messages').update({ is_read: true }).eq('id', data[0].id);
    console.log('Update error:', updErr);
  }
}
run();
