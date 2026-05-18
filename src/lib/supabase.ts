/// <reference types="vite/client" />
import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || "https://kfodznsmqpupuuncdzgi.supabase.co";
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtmb2R6bnNtcXB1cHV1bmNkemdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyOTM0NTUsImV4cCI6MjA5MTg2OTQ1NX0.GCVnH8xB_-NMV4BvwtdhTqzfE9E6chKUaDG4qirbq40";

if (
  !import.meta.env.VITE_SUPABASE_URL ||
  !import.meta.env.VITE_SUPABASE_ANON_KEY
) {
  console.warn(
    "Supabase URL or Anon Key is missing. Please check your environment variables.",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
