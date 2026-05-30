import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "https://dummy.supabase.co";
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "dummy";
const supabase = createClient(supabaseUrl, supabaseKey);

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || "BIMeGpOzRPQ9Ios0j8B7JkAHpf63riIWv8Z8oL_moiWbvnaZBADs8XWeSDUXmQ3vsAX0wgOK-oc4uh4j96os7q8";
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || "RN0Docyp4IlIp4FXbA2bns4zjbo-Z-zWZokV13s_EDs";

webpush.setVapidDetails("mailto:njbmaliangkay30@gmail.com", vapidPublicKey, vapidPrivateKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  let notificationRecord = req.body;
  
  if (req.body.type === 'INSERT' && req.body.record) {
    notificationRecord = req.body.record;
  }
  
  const receiverId = notificationRecord.user_id;

  if (!receiverId) {
     return res.status(400).json({ error: "No user_id found in payload" });
  }

  try {
    const { data: userSubs } = await supabase.from('push_subscriptions').select('*').eq('user_id', receiverId);
    if (!userSubs || userSubs.length === 0) {
        return res.status(200).json({ success: true, message: "No subscriptions for user" });
    }

    const payloadString = JSON.stringify({
        title: notificationRecord.title || "TutorKu",
        body: notificationRecord.message || "Anda memiliki notifikasi baru",
        url: notificationRecord.link || "/",
        icon: notificationRecord.icon || "/icon.svg",
        badge: "/icon.svg"
    });

    for (const sub of userSubs) {
      try {
        const webPushSub = {
          endpoint: sub.endpoint,
          keys: sub.keys
        };
        await webpush.sendNotification(webPushSub, payloadString);
      } catch (err) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          console.log(`Menghapus subscription kedaluwarsa`);
          await supabase.from('push_subscriptions').delete().eq('id', sub.id);
        } else {
          console.error("Gagal mengirimkan notifikasi push:", err);
        }
      }
    }

    return res.status(200).json({ success: true });
  } catch(e) {
    console.error("Gagal membaca sub dari db", e);
    return res.status(500).json({ error: "Internal server error" });
  }
}
