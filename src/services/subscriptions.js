import { supabase } from '../supabaseClient.js';
export const Customers = {
  async list({ page=1, pageSize=25, search='' }={}) {
    const from=(page-1)*pageSize;
    let q = supabase.from('profiles').select('*', { count:'exact' }).eq('role','customer').order('created_at',{ascending:false});
    if (search) q = q.ilike('full_name', `%${search}%`);
    const { data, error, count } = await q.range(from, from+pageSize-1);
    if (error) throw error; return { rows:data, total:count??0 };
  }
};
export const Subscriptions = {
  async list({ page=1, pageSize=25, status='', customerId='' }={}) {
    const from=(page-1)*pageSize;
    let q = supabase.from('subscriptions').select('*, customers:profiles!customer_id(full_name), plans(name)', { count:'exact' }).order('created_at',{ascending:false});
    if (status) q = q.eq('status', status);
    if (customerId) q = q.eq('customer_id', customerId);
    const { data, error, count } = await q.range(from, from+pageSize-1);
    if (error) throw error; return { rows:data, total:count??0 };
  },
  async get(id) {
    const { data, error } = await supabase.from('subscriptions').select('*, customers:profiles!customer_id(*), plans(*)').eq('id', id).single();
    if (error) throw error;
    const { data: lines } = await supabase.from('subscription_lines').select('*, products(name)').eq('subscription_id', id);
    data.lines = lines || [];
    return data;
  },
  async create(payload) { const { data, error } = await supabase.from('subscriptions').insert(payload).select().single(); if (error) throw error; return data; },
  async update(id, payload) { const { data, error } = await supabase.from('subscriptions').update(payload).eq('id', id).select().single(); if (error) throw error; return data; },
  async addLine(line) { const { data, error } = await supabase.from('subscription_lines').insert(line).select().single(); if (error) throw error; return data; },
  async removeLine(id) { const { error } = await supabase.from('subscription_lines').delete().eq('id', id); if (error) throw error; },
  async remove(id) { await supabase.from('subscription_lines').delete().eq('subscription_id', id); const { error } = await supabase.from('subscriptions').delete().eq('id', id); if (error) throw error; }
};
