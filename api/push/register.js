import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "https://dummy.supabase.co";
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "dummy";
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { user_id, subscription } = req.body;
  if (!user_id || !subscription) {
    return res.status(400).json({ error: "Kolom nama/subscriptions kosong" });
  }

  try {
    const { data: existing } = await supabase.from('push_subscriptions').select('id').eq('endpoint', subscription.endpoint).single();
    if (existing) {
      await supabase.from('push_subscriptions').update({ user_id, keys: subscription.keys }).eq('id', existing.id);
    } else {
      await supabase.from('push_subscriptions').insert({
        user_id,
        endpoint: subscription.endpoint,
        keys: subscription.keys
      });
    }
    return res.status(200).json({ success: true });
  } catch(e) {
    console.error("Gagal menyimpan subscription ke db", e);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
