import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(url, key);

async function run() {
   const sql = fs.readFileSync('get_policies.sql', 'utf8');
   
   // It's not easy to run raw SQL without service key or rpc function, wait, run_sql.js uses rpc('exec_sql').
   const { data, error } = await supabase.rpc('exec_sql', { sql_string: sql });
   console.log('Result:', data);
   if (error) console.log('Error:', error);
}
run();
