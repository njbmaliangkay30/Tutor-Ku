import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!key) {
  console.log("No service role key");
  process.exit(1);
}

const supabaseAdmin = createClient(url, key, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function run() {
  const { data: messages, error } = await supabaseAdmin.from('messages').select('*').eq('is_read', false).limit(5);
  console.log("Unread messages:", messages?.length);
  
  if (messages && messages.length > 0) {
     const msg = messages[0];
     console.log("Trying to read as user", msg.receiver_id);
     
     // Let's create an anon client and act as that user by passing the JWT? 
     // We can't generate a JWT for that user without signing in, except via admin api?
     // We can just use the admin client to mark them read for now so we can test.
     
     console.log(msg);
  }
}
run();
