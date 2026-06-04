import { supabase } from '@/lib/supabase';
import type {
  Municipality,
  Ward,
  Booth,
  WaterBody,
  PhSummary,
  MunicipalityDashboard,
  WaterBodyDetails,
  BoothSubmissionResult,
} from '@/types/arogya';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8788/api';

async function getAuthHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...headers, ...options.headers },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return body as T;
}

export async function fetchMunicipalities(): Promise<Municipality[]> {
  const { data, error } = await supabase
    .from('municipalities')
    .select('*');
  if (error) throw error;
  return (data || [])
    .map((m: any) => {
      const id = m.municipality_id !== undefined ? m.municipality_id : m.id;
      const name = m.municipality_name !== undefined ? m.municipality_name : m.name;
      return {
        id: Number(id),
        name: String(name || ''),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function fetchWards(municipalityId: number): Promise<Ward[]> {
  return apiFetch(`/municipalities/${municipalityId}/wards`);
}

export async function fetchBooths(wardId: number): Promise<Booth[]> {
  return apiFetch(`/wards/${wardId}/booths`);
}

export async function fetchWaterBodies(boothId: number): Promise<WaterBody[]> {
  return apiFetch(`/booths/${boothId}/water-bodies`);
}

export async function fetchPhSummary(waterBodyId: number): Promise<PhSummary> {
  return apiFetch(`/water-bodies/${waterBodyId}/ph-summary`);
}

export async function calculateWqi(params: {
  waterBodyId: number;
  boothId: number;
  tds: number;
  turbidity: number;
  priority: number;
}) {
  return apiFetch<{ scores: { wqi: number }; phSummary: PhSummary }>('/wqi/calculate', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function submitBoothReport(params: {
  boothId: number;
  entries: { waterBodyId: number; tds: number; turbidity: number }[];
}): Promise<BoothSubmissionResult> {
  return apiFetch('/booths/submit-report', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function fetchMunicipalityDashboard(municipalityId: number): Promise<MunicipalityDashboard> {
  return apiFetch(`/dashboard/municipalities/${municipalityId}`);
}

export async function fetchMunicipalitiesOverview(): Promise<Municipality[]> {
  return apiFetch('/dashboard/municipalities');
}

export async function fetchWaterBodyDetails(waterBodyId: number): Promise<WaterBodyDetails> {
  return apiFetch(`/dashboard/water-bodies/${waterBodyId}`);
}

export async function fetchBoothTrends(boothId: number) {
  return apiFetch<{ booth_score: number; generated_at: string }[]>(`/dashboard/booths/${boothId}/trends`);
}

export async function fetchWardTrends(wardId: number) {
  return apiFetch<{ ward_score: number; generated_at: string }[]>(`/dashboard/wards/${wardId}/trends`);
}

export function scoreColor(score: number | null | undefined): string {
  if (score == null) return 'text-muted-foreground';
  if (score >= 80) return 'text-emerald-600';
  if (score >= 60) return 'text-amber-600';
  return 'text-red-600';
}

export function scoreBadgeVariant(score: number | null | undefined): 'default' | 'secondary' | 'destructive' {
  if (score == null) return 'secondary';
  if (score >= 80) return 'default';
  if (score >= 60) return 'secondary';
  return 'destructive';
}
