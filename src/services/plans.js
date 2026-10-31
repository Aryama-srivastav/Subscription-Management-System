import { supabase } from '../supabaseClient.js';
export const Plans = {
  async list({ page=1, pageSize=25 }={}) { const from=(page-1)*pageSize; const { data, error, count } = await supabase.from('plans').select('*', { count:'exact' }).order('created_at',{ascending:false}).range(from, from+pageSize-1); if (error) throw error; return { rows:data, total:count??0 }; },
  async get(id){const{data,error}=await supabase.from('plans').select('*').eq('id',id).single();if(error)throw error;return data;},
  async create(p){const{data,error}=await supabase.from('plans').insert(p).select().single();if(error)throw error;return data;},
  async update(id,p){const{data,error}=await supabase.from('plans').update(p).eq('id',id).select().single();if(error)throw error;return data;},
  async remove(id){const{error}=await supabase.from('plans').delete().eq('id',id);if(error)throw error;}
};
export const Taxes = {
  async list(){const{data,error}=await supabase.from('taxes').select('*').order('created_at',{ascending:false});if(error)throw error;return data;},
  async create(p){const{data,error}=await supabase.from('taxes').insert(p).select().single();if(error)throw error;return data;},
  async update(id,p){const{data,error}=await supabase.from('taxes').update(p).eq('id',id).select().single();if(error)throw error;return data;},
  async remove(id){const{error}=await supabase.from('taxes').delete().eq('id',id);if(error)throw error;}
};
