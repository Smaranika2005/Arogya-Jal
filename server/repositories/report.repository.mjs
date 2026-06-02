import { supabaseAdmin } from '../lib/supabase-admin.mjs';

export class ReportRepository {
  async insertWaterQualityReport(report) {
    const { data, error } = await supabaseAdmin()
      .from('water_quality_reports')
      .insert({
        booth_id: report.boothId,
        water_body_id: report.waterBodyId,
        avg_ph_used: report.avgPhUsed,
        tds: report.tds,
        turbidity: report.turbidity,
        ph_score: report.phScore,
        tds_score: report.tdsScore,
        turbidity_score: report.turbidityScore,
        wqi: report.wqi,
        water_body_priority: report.priority,
        submitted_by: report.submittedBy ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async getLatestByWaterBody(waterBodyId) {
    const { data, error } = await supabaseAdmin()
      .from('water_quality_reports')
      .select('*')
      .eq('water_body_id', waterBodyId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async getWqiTrend(waterBodyId, limit = 50) {
    const { data, error } = await supabaseAdmin()
      .from('water_quality_reports')
      .select('wqi, created_at')
      .eq('water_body_id', waterBodyId)
      .order('created_at', { ascending: true })
      .limit(limit);
    if (error) throw error;
    return data;
  }

  async insertBoothReport({ boothId, boothScore, generatedBy }) {
    const { data, error } = await supabaseAdmin()
      .from('booth_reports')
      .insert({
        booth_id: boothId,
        booth_score: boothScore,
        generated_by: generatedBy ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async getLatestBoothScore(boothId) {
    const { data, error } = await supabaseAdmin()
      .from('booth_reports')
      .select('*')
      .eq('booth_id', boothId)
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async getBoothScoreTrend(boothId, limit = 50) {
    const { data, error } = await supabaseAdmin()
      .from('booth_reports')
      .select('booth_score, generated_at')
      .eq('booth_id', boothId)
      .order('generated_at', { ascending: true })
      .limit(limit);
    if (error) throw error;
    return data;
  }

  async insertWardReport({ wardId, wardScore }) {
    const { data, error } = await supabaseAdmin()
      .from('ward_reports')
      .insert({ ward_id: wardId, ward_score: wardScore })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async getLatestWardScore(wardId) {
    const { data, error } = await supabaseAdmin()
      .from('ward_reports')
      .select('*')
      .eq('ward_id', wardId)
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async getWardScoreTrend(wardId, limit = 50) {
    const { data, error } = await supabaseAdmin()
      .from('ward_reports')
      .select('ward_score, generated_at')
      .eq('ward_id', wardId)
      .order('generated_at', { ascending: true })
      .limit(limit);
    if (error) throw error;
    return data;
  }

  async insertMunicipalityReport({ municipalityId, municipalityScore }) {
    const { data, error } = await supabaseAdmin()
      .from('municipality_reports')
      .insert({ municipality_id: municipalityId, municipality_score: municipalityScore })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async getLatestMunicipalityScore(municipalityId) {
    const { data, error } = await supabaseAdmin()
      .from('municipality_reports')
      .select('*')
      .eq('municipality_id', municipalityId)
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async getMunicipalityScoreTrend(municipalityId, limit = 50) {
    const { data, error } = await supabaseAdmin()
      .from('municipality_reports')
      .select('municipality_score, generated_at')
      .eq('municipality_id', municipalityId)
      .order('generated_at', { ascending: true })
      .limit(limit);
    if (error) throw error;
    return data;
  }

  async getReportsByBoothSession(boothId, submittedBy) {
    const { data, error } = await supabaseAdmin()
      .from('water_quality_reports')
      .select('*')
      .eq('booth_id', boothId)
      .eq('submitted_by', submittedBy)
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) throw error;
    return data;
  }
}
