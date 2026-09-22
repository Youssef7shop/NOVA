const SUPABASE_URL = "https://qerdrkhjmcussgfkwflo.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_a0u7Sm3eSqg0N8i_49B52w_g44TrK_D";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

window.NOVA_SUPABASE = supabaseClient;