export interface Municipality {
  id: number;
  name: string;
  created_at?: string;
  municipalityScore?: number | null;
}

export interface Ward {
  id: number;
  municipality_id: number;
  ward_number: string | null;
  ward_name: string | null;
  wardScore?: number | null;
  lastUpdated?: string | null;
  booths?: Booth[];
}

export interface Booth {
  id: number;
  ward_id: number;
  booth_number: string | null;
  booth_name: string | null;
  boothScore?: number | null;
  lastUpdated?: string | null;
}

export interface WaterBody {
  id: number;
  booth_id: number;
  name: string;
  description?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface PhSummary {
  waterBodyId: number;
  currentPh: number | null;
  avgPh7Days: number | null;
  avgPh30Days: number | null;
  totalReadings: number;
  lastUpdated: string | null;
}

export interface WaterBodyEntry {
  waterBodyId: number;
  tds: string;
  turbidity: string;
  wqi?: number | null;
  phSummary?: PhSummary | null;
  loading?: boolean;
}

export interface MunicipalityDashboard {
  municipality: Municipality;
  municipalityScore: number | null;
  lastUpdated: string | null;
  wards: Ward[];
  trends: { municipalityScore: { municipality_score: number; generated_at: string }[] };
}

export interface WaterBodyDetails {
  waterBody: WaterBody;
  summary: {
    currentPh: number | null;
    avgPh7Days: number | null;
    avgPh30Days: number | null;
    lastUpdated: string | null;
  };
  latest: {
    tds: number | null;
    turbidity: number | null;
    wqi: number | null;
    reportDate: string | null;
  };
  trends: {
    ph: { value: number; date: string }[];
    wqi: { value: number; date: string }[];
  };
}

export interface BoothSubmissionResult {
  boothScore: number;
  boothReport: { booth_score: number; generated_at: string };
  reports: Array<{
    scores: { wqi: number; phScore: number; tdsScore: number; turbidityScore: number };
    phSummary: PhSummary;
  }>;
}
