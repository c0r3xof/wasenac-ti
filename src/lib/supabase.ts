import { createClient } from '@supabase/supabase-js';

// Colocamos os valores direto aqui para o Next.js não se perder
const supabaseUrl = 'https://iuqiirxiwotjhjjbwxqa.supabase.co';
const supabaseAnonKey = 'sb_publishable_rcc7vUUN3ROUY80HVlVKoQ_jgqHWCwL';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);