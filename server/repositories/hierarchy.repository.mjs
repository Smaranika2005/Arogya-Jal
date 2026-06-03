import { supabaseAdmin } from '../lib/supabase-admin.mjs';

export class HierarchyRepository {
  async listMunicipalities() {
    const { data, error } = await supabaseAdmin()
      .from('municipalities')
      .select('*');
    if (error) throw error;
    return data;
  }

  async listWards(municipalityId) {
    const { data, error } = await supabaseAdmin()
      .from('wards')
      .select('*')
      .eq('municipality_id', municipalityId)
      .order('ward_number');
    if (error) throw error;
    return data;
  }

  async listBooths(wardId) {
    const { data, error } = await supabaseAdmin()
      .from('booths')
      .select('*')
      .eq('ward_id', wardId)
      .order('booth_number');
    if (error) throw error;
    return data;
  }

  async listWaterBodies(boothId) {
    const { data, error } = await supabaseAdmin()
      .from('water_bodies')
      .select('*')
      .eq('booth_id', boothId)
      .order('name');
    if (error) throw error;
    return data;
  }

  async getWaterBody(id) {
    const { data, error } = await supabaseAdmin()
      .from('water_bodies')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  }

  async getBooth(id) {
    const { data, error } = await supabaseAdmin()
      .from('booths')
      .select('*, wards(id, municipality_id)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  }

  async getWard(id) {
    const { data, error } = await supabaseAdmin()
      .from('wards')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  }

  async getMunicipality(id) {
    const { data, error } = await supabaseAdmin()
      .from('municipalities')
      .select('*')
      .or(`id.eq.${id},municipality_id.eq.${id}`)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return {
      id: Number(data.id || data.municipality_id),
      name: data.name || data.municipality_name || '',
      created_at: data.created_at
    };
  }
}
