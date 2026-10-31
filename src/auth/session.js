import { supabase } from '../supabaseClient.js';

export async function getSession() { const { data } = await supabase.auth.getSession(); return data.session; }
export async function getUser() { const { data } = await supabase.auth.getUser(); return data.user; }

export async function getProfile(userId) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (error) return null;
  return data;
}

export async function signUp(email, password, fullName) {
  const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } });
  if (error) throw error;
  return data;
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() { await supabase.auth.signOut(); }

export async function resetPassword(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/#reset-password' });
  if (error) throw error;
}

export function onAuthChange(cb) { return supabase.auth.onAuthStateChange((_e, session) => cb(session)); }
