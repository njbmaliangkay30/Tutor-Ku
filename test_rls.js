import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.from('messages').select('*').limit(5);
  console.log('Messages:', data?.map(d => ({id: d.id, is_read: d.is_read})));
  
  if (data?.length > 0) {
    const { error: updErr } = await supabase.from('messages').update({ is_read: true }).eq('id', data[0].id);
    console.log('Update Error:', updErr);
  }
}
test();
