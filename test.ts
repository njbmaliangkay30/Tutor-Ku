import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || "",
  process.env.VITE_SUPABASE_ANON_KEY || ""
);

async function check() {
  const { data, error } = await supabase
    .from('sessions')
    .select(`
      *,
      student:student_profiles(
        id,
        profiles(full_name, avatar_url)
      )
    `)
    .limit(1);
    
  console.log("Sessions:", JSON.stringify(data, null, 2));
  console.log("Error:", error);
}

check();
