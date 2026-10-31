import { supabase } from '../supabaseClient.js';
export const Invoices = {
  async list({ page=1, pageSize=25, status='', customerId='' }={}) {
    const from=(page-1)*pageSize;
    let q = supabase.from('invoices').select('*, customers:profiles!customer_id(full_name), subscriptions(number)', { count:'exact' }).order('created_at',{ascending:false});
    if (status) q = q.eq('status', status);
    if (customerId) q = q.eq('customer_id', customerId);
    const { data, error, count } = await q.range(from, from+pageSize-1);
    if (error) throw error; return { rows:data, total:count??0 };
  },
  async get(id) {
    const { data, error } = await supabase.from('invoices').select('*, customers:profiles!customer_id(*), subscriptions(number)').eq('id', id).single();
    if (error) throw error;
    const { data: lines } = await supabase.from('invoice_lines').select('*, products(name)').eq('invoice_id', id);
    data.lines = lines || [];
    const { data: pays } = await supabase.from('payments').select('*').eq('invoice_id', id).order('paid_on',{ascending:false});
    data.payments = pays || [];
    const { data: discs } = await supabase.from('invoice_discounts').select('*, discounts(name,type,value)').eq('invoice_id', id);
    data.discounts = discs || [];
    return data;
  },
  async create(payload) { const { data, error } = await supabase.from('invoices').insert(payload).select().single(); if (error) throw error; return data; },
  async update(id, payload) { const { data, error } = await supabase.from('invoices').update(payload).eq('id', id).select().single(); if (error) throw error; return data; },
  async addLine(line) { const { data, error } = await supabase.from('invoice_lines').insert(line).select().single(); if (error) throw error; return data; },
  async removeLine(id) { const { error } = await supabase.from('invoice_lines').delete().eq('id', id); if (error) throw error; }
};
export const Payments = {
  async list({ page=1, pageSize=25 }={}) {
    const from=(page-1)*pageSize;
    const { data, error, count } = await supabase.from('payments').select('*, invoices(number, customers:profiles!customer_id(full_name))', { count:'exact' }).order('paid_on',{ascending:false}).range(from, from+pageSize-1);
    if (error) throw error; return { rows:data, total:count??0 };
  },
  async create(p) { const { data, error } = await supabase.from('payments').insert(p).select().single(); if (error) throw error; return data; }
};
export const DashboardSvc = {
  async stats() {
    const { data, error } = await supabase.rpc('get_dashboard_stats');
    if (error) throw error;
    return {
      activeSubs: Number(data.activeSubs || 0),
      totalInvoiced: Number(data.totalInvoiced || 0),
      totalPaid: Number(data.totalPaid || 0),
      outstanding: Number(data.outstanding || 0),
      overdue: Number(data.overdue || 0),
      invoiceCount: Number(data.invoiceCount || 0),
    };
  }
};
