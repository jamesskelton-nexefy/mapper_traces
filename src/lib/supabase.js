import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://bcinjxawjnsluevsnisk.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjaW5qeGF3am5zbHVldnNuaXNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTgzODQwMDIsImV4cCI6MjAxMzk2MDAwMn0.nJV5JaV0sLREsfs1NRzzMS918jToyx1HmplPBz62Ujw'

export const supabase = createClient(supabaseUrl, supabaseAnonKey) 