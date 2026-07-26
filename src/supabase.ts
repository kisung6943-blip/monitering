import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let supabaseInstance: any = null;

if (supabaseUrl && supabaseAnonKey) {
  try {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  } catch (err) {
    console.error("Failed to initialize Supabase client:", err);
  }
}

if (!supabaseInstance) {
  console.warn("Supabase credentials missing or invalid. Falling back to local storage mode.");
  supabaseInstance = {
    from: () => ({
      select: () => Promise.resolve({ data: null, error: new Error("Supabase not configured") }),
      upsert: () => Promise.resolve({ error: new Error("Supabase not configured") }),
      insert: () => Promise.resolve({ error: new Error("Supabase not configured") }),
      delete: () => Promise.resolve({ error: new Error("Supabase not configured") }),
      update: () => Promise.resolve({ error: new Error("Supabase not configured") }),
      eq: () => ({
        single: () => Promise.resolve({ data: null, error: new Error("Supabase not configured") })
      })
    })
  };
}

export const supabase = supabaseInstance;
