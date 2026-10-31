import { supabase } from '../supabaseClient.js';
export const Products = {
  async list({ page=1, pageSize=25, search='' }={}) {
    const from=(page-1)*pageSize;
    let q = supabase.from('products').select('*', { count:'exact' }).order('created_at',{ascending:false});
    if (search) q = q.ilike('name', `%${search}%`);
    const { data, error, count } = await q.range(from, from+pageSize-1);
    if (error) throw error; return { rows:data, total:count??0 };
  },
  async get(id){const{data,error}=await supabase.from('products').select('*').eq('id',id).single();if(error)throw error;return data;},
  async create(p){const{data,error}=await supabase.from('products').insert(p).select().single();if(error)throw error;return data;},
  async update(id,p){const{data,error}=await supabase.from('products').update(p).eq('id',id).select().single();if(error)throw error;return data;},
  async remove(id){const{error}=await supabase.from('products').delete().eq('id',id);if(error)throw error;}
};
