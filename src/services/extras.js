import { supabase } from '../supabaseClient.js';
import { round2 } from '../utils/money.js';

export const Variants = {
  async listByProduct(productId) {
    const { data, error } = await supabase.from('product_variants').select('*').eq('product_id', productId).order('created_at');
    if (error) throw error; return data || [];
  },
  async create(p) { const { data, error } = await supabase.from('product_variants').insert(p).select().single(); if (error) throw error; return data; },
  async remove(id) { const { error } = await supabase.from('product_variants').delete().eq('id', id); if (error) throw error; }
};

export const QuotationTemplates = {
  async list() {
    const { data, error } = await supabase.from('quotation_templates').select('*, plans(name)').order('created_at', { ascending:false });
    if (error) throw error; return data || [];
  },
  async get(id) {
    const { data, error } = await supabase.from('quotation_templates').select('*, plans(*)').eq('id', id).single();
    if (error) throw error;
    const { data: lines } = await supabase.from('quotation_template_lines').select('*, products(name), product_variants(name,price_delta)').eq('template_id', id);
    data.lines = lines || [];
    return data;
  },
  async create(p) { const { data, error } = await supabase.from('quotation_templates').insert(p).select().single(); if (error) throw error; return data; },
  async addLine(l) { const { data, error } = await supabase.from('quotation_template_lines').insert(l).select().single(); if (error) throw error; return data; },
  async removeLine(id) { const { error } = await supabase.from('quotation_template_lines').delete().eq('id', id); if (error) throw error; },
  async remove(id) {
    await supabase.from('quotation_template_lines').delete().eq('template_id', id);
    const { error } = await supabase.from('quotation_templates').delete().eq('id', id);
    if (error) throw error;
  }
};

export const Discounts = {
  async list() {
    const { data, error } = await supabase.from('discounts').select('*, products(name)').order('created_at', { ascending:false });
    if (error) throw error; return data || [];
  },
  async create(p) { const { data, error } = await supabase.from('discounts').insert(p).select().single(); if (error) throw error; return data; },
  async update(id, p) { const { data, error } = await supabase.from('discounts').update(p).eq('id', id).select().single(); if (error) throw error; return data; },
  async remove(id) { const { error } = await supabase.from('discounts').delete().eq('id', id); if (error) throw error; },
  // active discounts applicable now
  async active() {
    const today = new Date().toISOString().slice(0,10);
    const { data, error } = await supabase.from('discounts').select('*').eq('is_active', true)
      .or(`start_date.is.null,start_date.lte.${today}`)
      .or(`end_date.is.null,end_date.gte.${today}`);
    if (error) throw error;
    return (data || []).filter(d => d.used_count < (d.usage_limit ?? Infinity));
  }
};

// helper: compute discount amount for an invoice context
export function applyDiscounts(discounts, { subtotal, qty, productId, isSubscription }) {
  let totalDiscount = 0;
  for (const d of discounts) {
    if (d.scope === 'product' && d.product_id && d.product_id !== productId) continue;
    if (d.scope === 'subscription' && !isSubscription) continue;
    if (d.min_purchase && subtotal < d.min_purchase) continue;
    if (d.min_qty && qty < d.min_qty) continue;
    let amt = d.type === 'percentage' ? subtotal * (d.value/100) : d.value;
    if (amt > subtotal) amt = subtotal;
    totalDiscount += amt;
  }
  if (totalDiscount > subtotal) totalDiscount = subtotal;
  
  return round2(totalDiscount);
}
