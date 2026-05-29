const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || "BIMeGpOzRPQ9Ios0j8B7JkAHpf63riIWv8Z8oL_moiWbvnaZBADs8XWeSDUXmQ3vsAX0wgOK-oc4uh4j96os7q8";

export default function handler(req, res) {
  res.status(200).json({ publicKey: vapidPublicKey });
}
