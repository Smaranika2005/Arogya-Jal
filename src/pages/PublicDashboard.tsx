import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import {
  Shield,
  LogOut,
  Droplets,
  RefreshCw,
  MapPin,
  Activity,
  FileText,
  Users,
  CheckCircle2,
  Eye
} from 'lucide-react';
import {
  fetchMunicipalityDashboard
} from '@/services/arogya-api';
import { getSymptomSurveysForMunicipality, getAshaWorkersList } from '@/services/surveys';
import HydraHelpChat from '@/components/HydraHelpChat';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const PublicDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userName, setUserName] = useState('');
  const [municipalityId, setMunicipalityId] = useState<number | null>(null);
  const [municipalityName, setMunicipalityName] = useState('');
  const [muniScore, setMuniScore] = useState<number | null>(null);
  const [surveys, setSurveys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [surveysLoading, setSurveysLoading] = useState(false);
  const [detailSurvey, setDetailSurvey] = useState<any | null>(null);
  const [detailSurveyOpen, setDetailSurveyOpen] = useState(false);
  const [ashaWorkersMap, setAsHAWorkersMap] = useState<Record<string, string>>({});
  const [waterBodiesMap, setWaterBodiesMap] = useState<Record<number, string>>({
    1: 'Rabindra Sarobar Lake',
    2: 'Subhash Sarobar Lake',
    3: 'East Kolkata Wetlands',
    4: 'Santragachi Jheel',
    5: 'Mirik Lake',
    6: 'Senchal Lake',
    7: 'Amrita Bandh',
    8: 'Kalyani Lake Park',
    9: 'Barasat Dighi',
    10: 'Bally Khal Point',
    13: 'Hooghly River Point'
  });

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800';
    if (score >= 50) return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-955/30 border-amber-200 dark:border-amber-800';
    return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800';
  };

  // Fetch initial profile and municipality information
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/public/login'); return; }
      const { data: profile } = await supabase
        .from('profiles')
        .select('*, municipalities(*)')
        .eq('id', user.id)
        .single();

      if (!profile || profile.role !== 'public_user') {
        await supabase.auth.signOut();
        navigate('/public/login');
        return;
      }

      setUserName(profile.name);

      let muniId = profile.municipality_id;
      if (!muniId && profile.municipality) {
        const { data: muniList } = await supabase
          .from('municipalities')
          .select('*');
        const muni = (muniList || []).find((m: any) => (m.municipality_name === profile.municipality || m.name === profile.municipality));
        muniId = muni?.municipality_id ?? muni?.id;
      }

      if (!muniId) {
        toast({ title: 'No municipality assigned', description: 'Contact administrator.', variant: 'destructive' });
        setLoading(false);
        return;
      }

      setMunicipalityId(muniId);
      const muniName = profile.municipalities?.municipality_name ?? profile.municipalities?.name ?? 'Your Municipality';
      setMunicipalityName(muniName);
    })();
  }, [navigate, toast]);

  // Load dashboard data and metadata
  const loadDashboardData = async (muniId: number) => {
    setSurveysLoading(true);
    try {
      // 1. Fetch municipality health score
      try {
        const dbData = await fetchMunicipalityDashboard(muniId);
        if (dbData && typeof dbData.municipalityScore === 'number') {
          setMuniScore(dbData.municipalityScore);
        }
      } catch (scoreErr) {
        console.warn('Failed to load municipality score index:', scoreErr);
      }

      // 2. Fetch ASHA workers for worker id mapping
      try {
        const workers = await getAshaWorkersList();
        const map: Record<string, string> = {};
        workers.forEach((w: any) => {
          map[w.id] = w.name;
        });
        setAsHAWorkersMap(map);
      } catch (workerErr) {
        console.warn('Failed to load ASHA workers list:', workerErr);
      }

      // 3. Fetch water bodies list for names mapping
      try {
        const { data: wbList } = await supabase.from('water_bodies').select('*');
        if (wbList && wbList.length > 0) {
          const wbMap: Record<number, string> = {};
          wbList.forEach((wb: any) => {
            const key = wb.wid ?? wb.id;
            const name = wb.wname ?? wb.name;
            if (key !== undefined && name !== undefined) {
              wbMap[Number(key)] = name;
            }
          });
          setWaterBodiesMap(prev => ({ ...prev, ...wbMap }));
        }
      } catch (wbErr) {
        console.warn('Failed to load water bodies list:', wbErr);
      }

      // 4. Fetch symptom surveys for municipality
      const sList = await getSymptomSurveysForMunicipality(muniId);
      setSurveys(sList);
    } catch (e: unknown) {
      toast({ title: 'Dashboard load failed', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setLoading(false);
      setSurveysLoading(false);
    }
  };

  useEffect(() => {
    if (municipalityId) {
      loadDashboardData(municipalityId);
    }
  }, [municipalityId]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/public/login');
  };

  // Compute stats aggregates dynamically from loaded surveys list
  const stats = useMemo(() => {
    if (!surveys || surveys.length === 0) return null;

    let totalDiarrhoea = 0;
    let totalAbdominalPain = 0;
    let totalDehydration = 0;
    let totalVomiting = 0;
    let totalFever = 0;
    let totalSkinRashes = 0;

    let totalChildren = 0;
    let totalAdults = 0;
    let totalElderly = 0;

    let totalSurveyed = 0;

    let phSum = 0;
    let phCount = 0;
    let tdsSum = 0;
    let tdsCount = 0;
    let turbiditySum = 0;
    let turbidityCount = 0;

    surveys.forEach((s) => {
      const data = s.survey_data;
      totalSurveyed += s.total_people || 0;

      if (data.symptoms) {
        totalDiarrhoea += data.symptoms.diarrhoea || 0;
        totalAbdominalPain += data.symptoms.abdominalPain || 0;
        totalDehydration += data.symptoms.dehydrationWeakness || 0;
        totalVomiting += data.symptoms.vomiting || 0;
        totalFever += data.symptoms.fever || 0;
        totalSkinRashes += data.symptoms.skinRashes || 0;
      }

      if (data.ageGroups) {
        totalChildren += data.ageGroups.children0to12 || 0;
        totalAdults += data.ageGroups.adults13to60 || 0;
        totalElderly += data.ageGroups.elderly60plus || 0;
      }

      if (data.waterBodyAssessments) {
        data.waterBodyAssessments.forEach((w: any) => {
          const phVal = parseFloat(w.ph);
          const tdsVal = parseFloat(w.tds);
          const turbVal = parseFloat(w.turbidity);

          if (!isNaN(phVal) && phVal > 0) {
            phSum += phVal;
            phCount++;
          }
          if (!isNaN(tdsVal) && tdsVal > 0) {
            tdsSum += tdsVal;
            tdsCount++;
          }
          if (!isNaN(turbVal) && turbVal >= 0) {
            turbiditySum += turbVal;
            turbidityCount++;
          }
        });
      }
    });

    const avgPH = phCount > 0 ? phSum / phCount : 0;
    const avgTds = tdsCount > 0 ? tdsSum / tdsCount : 0;
    const avgTurbidity = turbidityCount > 0 ? turbiditySum / turbidityCount : 0;

    const symptomChartData = [
      { name: 'Diarrhoea', count: totalDiarrhoea, color: '#3b82f6' },
      { name: 'Abdominal Pain', count: totalAbdominalPain, color: '#10b981' },
      { name: 'Dehydration', count: totalDehydration, color: '#f59e0b' },
      { name: 'Vomiting', count: totalVomiting, color: '#ef4444' },
      { name: 'Fever', count: totalFever, color: '#8b5cf6' },
      { name: 'Skin Rashes', count: totalSkinRashes, color: '#ec4899' },
    ];

    const ageChartData = [
      { name: 'Children (0-12)', value: totalChildren, color: '#38bdf8' },
      { name: 'Adults (13-60)', value: totalAdults, color: '#8b5cf6' },
      { name: 'Elderly (60+)', value: totalElderly, color: '#f59e0b' },
    ];

    return {
      avgPH,
      avgTds,
      avgTurbidity,
      totalSurveyed,
      symptomChartData,
      ageChartData,
      totalChildren,
      totalAdults,
      totalElderly
    };
  }, [surveys]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <RefreshCw className="h-10 w-10 text-emerald-600 animate-spin mx-auto" />
          <p className="text-muted-foreground font-medium">Loading public dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/30 to-white dark:from-slate-950 dark:to-slate-900">
      <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur sticky top-0 z-10">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <Droplets className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-800 dark:text-white">Arogya Jal</h1>
              <p className="text-xs text-muted-foreground">Public Health & Sanitary Monitoring</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              className="border-slate-200 dark:border-slate-800"
              onClick={() => municipalityId && loadDashboardData(municipalityId)}
              disabled={surveysLoading}
            >
              <RefreshCw className={`h-4 w-4 ${surveysLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="ghost" className="text-slate-600 dark:text-slate-350" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 rounded-2xl p-6 md:p-8 mb-8 relative overflow-hidden shadow-sm backdrop-blur-sm">
          <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -z-10" />
          <div className="absolute right-12 bottom-0 translate-y-12 w-48 h-48 bg-teal-500/10 rounded-full blur-2xl -z-10" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <Badge className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-none px-3 py-1 font-semibold text-xs rounded-full">
                Public Safety Portal
              </Badge>
              <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">
                Welcome back, <span className="text-emerald-600 dark:text-emerald-400">{userName}</span>! 👋
              </h2>
              <p className="text-slate-600 dark:text-slate-300 text-sm max-w-2xl">
                Stay updated with the environmental water quality and community health status of your registered municipality. Together, we ensure safe drinking water and health hygiene.
              </p>
              <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-emerald-500" />
                  Municipality: <strong className="text-slate-700 dark:text-slate-200">{municipalityName}</strong>
                </span>
              </div>
            </div>

            {/* Water Safety Score Index */}
            {muniScore !== null && (
              <div className="flex flex-col items-center bg-white/60 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/50 p-4 rounded-xl shadow-sm min-w-[180px] text-center">
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-1">Water Safety Index</span>
                <div className="relative flex items-center justify-center">
                  <div className={`text-4xl font-black ${
                    muniScore >= 80 ? 'text-emerald-500' : muniScore >= 50 ? 'text-amber-500' : 'text-red-500'
                  }`}>
                    {muniScore.toFixed(0)}
                    <span className="text-xs font-semibold text-muted-foreground">/100</span>
                  </div>
                </div>
                <Badge className={`mt-2 border-none font-bold ${getScoreColor(muniScore)}`}>
                  {muniScore >= 80 ? 'Safe & Clean' : muniScore >= 50 ? 'Moderate Alert' : 'Hazardous Quality'}
                </Badge>
              </div>
            )}
          </div>
        </div>

        {surveys && surveys.length > 0 ? (
          <>
            {/* Parameters Overview Header */}
            <div className="mb-6">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Droplets className="h-5 w-5 text-emerald-500" />
                Water Quality Overview
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Averages calculated from all water samples tested in {municipalityName}.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* pH Card */}
              <Card className="border border-slate-200/60 dark:border-slate-800/60 bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-950 shadow-sm hover:shadow-md transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <div>
                    <CardTitle className="text-sm font-bold text-slate-700 dark:text-slate-300">Average pH Level</CardTitle>
                    <CardDescription className="text-[11px] text-muted-foreground">Acidity / Alkalinity</CardDescription>
                  </div>
                  <div className="p-2 bg-blue-500/10 rounded-lg text-blue-600 dark:text-blue-400">
                    <Activity className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
                      {stats?.avgPH ? stats.avgPH.toFixed(2) : '—'}
                    </span>
                    {stats?.avgPH ? (
                      <Badge className={`border-none font-bold ${
                        stats.avgPH >= 6.5 && stats.avgPH <= 8.5
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-400'
                      }`}>
                        {stats.avgPH >= 6.5 && stats.avgPH <= 8.5 ? 'Optimal' : 'Imbalanced'}
                      </Badge>
                    ) : null}
                  </div>
                  <div className="space-y-1">
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${stats?.avgPH && stats.avgPH >= 6.5 && stats.avgPH <= 8.5 ? 'bg-emerald-500' : 'bg-red-500'}`} 
                        style={{ width: stats?.avgPH ? `${(stats.avgPH / 14) * 100}%` : '0%' }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                      <span>Acidic (0)</span>
                      <span className="font-semibold text-emerald-600">Safe: 6.5 - 8.5</span>
                      <span>Alkaline (14)</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed italic border-t pt-2">
                    Drinking water pH should ideally be neutral. Imbalances can affect taste and indicate chemical contamination.
                  </p>
                </CardContent>
              </Card>

              {/* TDS Card */}
              <Card className="border border-slate-200/60 dark:border-slate-800/60 bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-950 shadow-sm hover:shadow-md transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <div>
                    <CardTitle className="text-sm font-bold text-slate-700 dark:text-slate-300">Average TDS</CardTitle>
                    <CardDescription className="text-[11px] text-muted-foreground">Total Dissolved Solids</CardDescription>
                  </div>
                  <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-600 dark:text-emerald-400">
                    <Droplets className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
                      {stats?.avgTds ? `${stats.avgTds.toFixed(0)}` : '—'} <span className="text-xs font-semibold text-muted-foreground">ppm</span>
                    </span>
                    {stats?.avgTds ? (
                      <Badge className={`border-none font-bold ${
                        stats.avgTds <= 300 
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400'
                          : stats.avgTds <= 600
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-955 dark:text-amber-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-400'
                      }`}>
                        {stats.avgTds <= 300 ? 'Excellent' : stats.avgTds <= 600 ? 'Good' : 'Hazardous'}
                      </Badge>
                    ) : null}
                  </div>
                  <div className="space-y-1">
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${stats?.avgTds && stats.avgTds <= 300 ? 'bg-emerald-500' : stats?.avgTds && stats.avgTds <= 600 ? 'bg-amber-500' : 'bg-red-500'}`} 
                        style={{ width: stats?.avgTds ? `${Math.min((stats.avgTds / 1000) * 100, 100)}%` : '0%' }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                      <span>0 ppm</span>
                      <span className="font-semibold text-emerald-600">Safe: &lt; 300 ppm</span>
                      <span>1000+ ppm</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed italic border-t pt-2">
                    TDS measures minerals and salts. High levels indicate high salinity or mineral pollution.
                  </p>
                </CardContent>
              </Card>

              {/* Turbidity Card */}
              <Card className="border border-slate-200/60 dark:border-slate-800/60 bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-950 shadow-sm hover:shadow-md transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <div>
                    <CardTitle className="text-sm font-bold text-slate-700 dark:text-slate-300">Average Turbidity</CardTitle>
                    <CardDescription className="text-[11px] text-muted-foreground">Water Clarity / Cloudiness</CardDescription>
                  </div>
                  <div className="p-2 bg-amber-500/10 rounded-lg text-amber-600 dark:text-amber-400">
                    <Shield className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
                      {stats?.avgTurbidity ? `${stats.avgTurbidity.toFixed(2)}` : '—'} <span className="text-xs font-semibold text-muted-foreground">NTU</span>
                    </span>
                    {stats?.avgTurbidity ? (
                      <Badge className={`border-none font-bold ${
                        stats.avgTurbidity <= 5 
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400'
                          : stats.avgTurbidity <= 10
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-955 dark:text-amber-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-400'
                      }`}>
                        {stats.avgTurbidity <= 5 ? 'Clear' : stats.avgTurbidity <= 10 ? 'Acceptable' : 'Cloudy/Haz'}
                      </Badge>
                    ) : null}
                  </div>
                  <div className="space-y-1">
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${stats?.avgTurbidity && stats.avgTurbidity <= 5 ? 'bg-emerald-500' : stats?.avgTurbidity && stats.avgTurbidity <= 10 ? 'bg-amber-500' : 'bg-red-500'}`} 
                        style={{ width: stats?.avgTurbidity ? `${Math.min((stats.avgTurbidity / 20) * 100, 100)}%` : '0%' }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                      <span>Clear (0)</span>
                      <span className="font-semibold text-emerald-600">Safe: &lt; 5 NTU</span>
                      <span>Cloudy (20+)</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed italic border-t pt-2">
                    Turbidity represents suspended particles. High values block light and harbor micro-organisms.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
              {/* Symptoms Chart Card */}
              <Card className="border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Activity className="h-5 w-5 text-emerald-500" />
                    Symptom Incidence Rates
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Aggregated distribution of reported biological symptoms across the community.
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[320px]">
                  {stats && stats.symptomChartData.some(d => d.count > 0) ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={stats.symptomChartData}
                        layout="vertical"
                        margin={{ top: 10, right: 30, left: 40, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:stroke-slate-800" horizontal={true} vertical={false} />
                        <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} />
                        <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} width={80} tickLine={false} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            fontSize: '12px'
                          }}
                          itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                          labelStyle={{ color: '#64748b' }}
                        />
                        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                          {stats.symptomChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center p-6 border-2 border-dashed rounded-xl">
                      <CheckCircle2 className="h-10 w-10 text-emerald-500/80 mb-2" />
                      <p className="font-semibold text-slate-700 dark:text-slate-300 text-sm">No Active Symptom Reports</p>
                      <p className="text-xs text-muted-foreground mt-1 max-w-[280px]">
                        No symptoms have been reported in this municipality's surveys yet.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Age Groups Donut Chart */}
              <Card className="border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Users className="h-5 w-5 text-emerald-500" />
                    Affected Age Distribution
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Age-wise breakdown of individuals reporting health concerns in surveys.
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[320px] flex flex-col justify-between">
                  {stats && stats.ageChartData.some(d => d.value > 0) ? (
                    <div className="grid grid-cols-1 sm:grid-cols-5 items-center h-full gap-4">
                      <div className="sm:col-span-3 h-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={stats.ageChartData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={85}
                              paddingAngle={4}
                              dataKey="value"
                            >
                              {stats.ageChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0',
                                fontSize: '12px'
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        {/* Inside text for donut hole */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Total Cases</span>
                          <span className="text-2xl font-black text-slate-800 dark:text-slate-100">
                            {stats.totalChildren + stats.totalAdults + stats.totalElderly}
                          </span>
                        </div>
                      </div>
                      <div className="sm:col-span-2 space-y-4 px-2">
                        {stats.ageChartData.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">{item.name}</p>
                              <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                                {item.value} <span className="text-xs text-muted-foreground font-normal">cases</span>
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center p-6 border-2 border-dashed rounded-xl">
                      <Users className="h-10 w-10 text-slate-400 mb-2" />
                      <p className="font-semibold text-slate-700 dark:text-slate-300 text-sm">No Demographic Data</p>
                      <p className="text-xs text-muted-foreground mt-1 max-w-[280px]">
                        No demographic records have been submitted in surveys.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        ) : null}

        {/* Surveys Registry Table Header */}
        <div className="mb-6">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-emerald-500" />
            Health & Sanitation Surveys Registry
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Historical sanitary monitoring logs recorded by certified ASHA workers within {municipalityName}.
          </p>
        </div>

        <Card className="border border-slate-200/60 dark:border-slate-800/60 shadow-sm overflow-hidden mb-12 bg-white dark:bg-slate-900">
          {surveysLoading ? (
            <div className="p-12 text-center">
              <RefreshCw className="h-8 w-8 text-emerald-650 animate-spin mx-auto mb-3" />
              <p className="text-sm text-muted-foreground font-medium">Refreshing survey logs...</p>
            </div>
          ) : surveys && surveys.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-slate-900">
                  <TableRow className="border-slate-200 dark:border-slate-800">
                    <TableHead className="font-bold text-slate-700 dark:text-slate-300">Survey Date</TableHead>
                    <TableHead className="font-bold text-slate-700 dark:text-slate-300">ASHA Worker</TableHead>
                    <TableHead className="font-bold text-slate-700 dark:text-slate-300">Ward / Booth</TableHead>
                    <TableHead className="text-center font-bold text-slate-700 dark:text-slate-300">People Monitored</TableHead>
                    <TableHead className="text-center font-bold text-slate-700 dark:text-slate-300">Water Bodies Tested</TableHead>
                    <TableHead className="text-right font-bold text-slate-700 dark:text-slate-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {surveys.map((survey, index) => (
                    <TableRow key={index} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors duration-150 border-slate-200 dark:border-slate-800">
                      <TableCell className="font-medium text-slate-850 dark:text-slate-200">
                        {new Date(survey.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </TableCell>
                      <TableCell className="text-slate-700 dark:text-slate-300 font-semibold">
                        {ashaWorkersMap[survey.user_id] || 'Local ASHA Worker'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-slate-200 dark:border-slate-850 font-medium">
                          Ward {survey.survey_data.wardNo} / Booth {survey.survey_data.boothNo}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-bold font-mono text-slate-700 dark:text-slate-300">
                        {survey.total_people}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-none font-bold font-mono">
                          {survey.survey_data.numberOfWaterBodies}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-350 font-bold flex items-center gap-1.5 ml-auto"
                          onClick={() => {
                            setDetailSurvey(survey);
                            setDetailSurveyOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-16 px-6">
              <FileText className="h-12 w-12 mx-auto text-slate-350 dark:text-slate-700 mb-3" />
              <h4 className="font-bold text-slate-750 dark:text-slate-250 text-base">No Registry Files Loaded</h4>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                There are no water quality or sanitation surveys registered for your municipality yet. Live statistics will display once ASHA workers start monitoring.
              </p>
            </div>
          )}
        </Card>
      </main>

      {/* Read-Only Survey Detail Dialog */}
      {detailSurvey && (
        <Dialog open={detailSurveyOpen} onOpenChange={setDetailSurveyOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto border border-slate-200/80 dark:border-slate-800/80">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-slate-850 dark:text-slate-100 flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-500" />
                ASHA Survey Registry File
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Official health monitoring log submitted by {ashaWorkersMap[detailSurvey.user_id] || 'Local ASHA Worker'}. Editing permissions disabled.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-2">
              {/* Administrative Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg">
                  <p className="text-muted-foreground uppercase font-bold text-[10px] tracking-wider">Survey Date</p>
                  <p className="font-bold text-slate-850 dark:text-slate-200 mt-1">
                    {new Date(detailSurvey.survey_data.surveyDate).toLocaleDateString('en-US', {
                      dateStyle: 'medium'
                    })}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg">
                  <p className="text-muted-foreground uppercase font-bold text-[10px] tracking-wider">Municipality</p>
                  <p className="font-bold text-slate-850 dark:text-slate-200 mt-1">{detailSurvey.survey_data.municipality}</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg">
                  <p className="text-muted-foreground uppercase font-bold text-[10px] tracking-wider">Ward / Booth</p>
                  <p className="font-bold text-slate-850 dark:text-slate-200 mt-1">
                    Ward {detailSurvey.survey_data.wardNo} / Booth {detailSurvey.survey_data.boothNo}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg">
                  <p className="text-muted-foreground uppercase font-bold text-[10px] tracking-wider">Pincode</p>
                  <p className="font-bold text-slate-850 dark:text-slate-200 mt-1 font-mono">{detailSurvey.survey_data.pincode}</p>
                </div>
              </div>

              {/* Biological Symptoms & Incidence Rates */}
              <div className="space-y-3">
                <h4 className="font-bold text-sm border-b pb-1 text-emerald-600 dark:text-emerald-400">
                  Biological Symptoms & Incidence Rates
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[
                    { label: 'Diarrhoea', value: detailSurvey.survey_data.symptoms.diarrhoea },
                    { label: 'Abdominal Pain', value: detailSurvey.survey_data.symptoms.abdominalPain },
                    { label: 'Dehydration & Weakness', value: detailSurvey.survey_data.symptoms.dehydrationWeakness },
                    { label: 'Vomiting', value: detailSurvey.survey_data.symptoms.vomiting },
                    { label: 'Fever', value: detailSurvey.survey_data.symptoms.fever },
                    { label: 'Skin Rashes', value: detailSurvey.survey_data.symptoms.skinRashes },
                  ].map((symptom, idx) => {
                    const pct = detailSurvey.total_people > 0
                      ? ((symptom.value / detailSurvey.total_people) * 100).toFixed(1)
                      : '0.0';
                    return (
                      <div key={idx} className="p-3 border border-slate-100 dark:border-slate-800 rounded-lg flex items-center justify-between bg-white dark:bg-slate-900 shadow-sm">
                        <div>
                          <p className="text-xs text-muted-foreground font-medium">{symptom.label}</p>
                          <p className="text-base font-bold mt-1 text-slate-855 dark:text-slate-100">{symptom.value}</p>
                        </div>
                        <Badge className="bg-red-500/10 text-red-600 dark:text-red-400 border-none font-extrabold text-[10px]">
                          {pct}%
                        </Badge>
                      </div>
                    );
                  })}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs mt-2">
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg flex justify-between items-center border border-slate-100 dark:border-slate-800">
                    <span className="text-muted-foreground font-bold font-semibold">Total People Surveyed</span>
                    <span className="font-extrabold text-sm text-slate-850 dark:text-slate-100">{detailSurvey.total_people}</span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg flex justify-between items-center border border-slate-100 dark:border-slate-800">
                    <span className="text-muted-foreground font-bold font-semibold">Avg. Symptom Duration</span>
                    <span className="font-extrabold text-sm text-slate-850 dark:text-slate-100">{detailSurvey.survey_data.avgSymptomDuration} Days</span>
                  </div>
                </div>
              </div>

              {/* Age Demographics */}
              <div className="space-y-3">
                <h4 className="font-bold text-sm border-b pb-1 text-emerald-600 dark:text-emerald-400">
                  Demographic Distribution of Affected
                </h4>
                <div className="grid grid-cols-3 gap-4 text-xs">
                  <div className="p-3 border border-slate-100 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 shadow-sm">
                    <p className="text-muted-foreground uppercase font-bold text-[9px] tracking-wider">Children (0-12)</p>
                    <p className="text-lg font-black mt-1 text-sky-500">{detailSurvey.survey_data.ageGroups.children0to12}</p>
                  </div>
                  <div className="p-3 border border-slate-100 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 shadow-sm">
                    <p className="text-muted-foreground uppercase font-bold text-[9px] tracking-wider">Adults (13-60)</p>
                    <p className="text-lg font-black mt-1 text-purple-500">{detailSurvey.survey_data.ageGroups.adults13to60}</p>
                  </div>
                  <div className="p-3 border border-slate-100 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 shadow-sm">
                    <p className="text-muted-foreground uppercase font-bold text-[9px] tracking-wider">Elderly (60+)</p>
                    <p className="text-lg font-black mt-1 text-amber-500">{detailSurvey.survey_data.ageGroups.elderly60plus}</p>
                  </div>
                </div>
              </div>

              {/* Assessed Water Sources Table */}
              <div className="space-y-3">
                <h4 className="font-bold text-sm border-b pb-1 text-emerald-600 dark:text-emerald-400">
                  Assessed Water Sources & Chemical Tests
                </h4>
                <div className="border border-slate-200/60 dark:border-slate-800/60 rounded-lg overflow-hidden shadow-sm bg-white dark:bg-slate-900">
                  <Table>
                    <TableHeader className="bg-slate-50 dark:bg-slate-900">
                      <TableRow>
                        <TableHead className="font-bold text-slate-700 dark:text-slate-300">Water Body Source</TableHead>
                        <TableHead className="text-center font-bold text-slate-700 dark:text-slate-300">pH Value</TableHead>
                        <TableHead className="text-center font-bold text-slate-700 dark:text-slate-300">TDS (ppm)</TableHead>
                        <TableHead className="text-center font-bold text-slate-700 dark:text-slate-300">Turbidity (NTU)</TableHead>
                        <TableHead className="text-center font-bold text-slate-700 dark:text-slate-300">Safety Assessment</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detailSurvey.survey_data.waterBodyAssessments && detailSurvey.survey_data.waterBodyAssessments.length > 0 ? (
                        detailSurvey.survey_data.waterBodyAssessments.map((w: any, index: number) => {
                          const phVal = parseFloat(w.ph);
                          const tdsVal = parseFloat(w.tds);
                          const turbVal = parseFloat(w.turbidity);

                          let rating = 'Safe';
                          let ratingColor = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400';
                          
                          if (phVal < 6.0 || phVal > 9.0 || tdsVal > 600 || turbVal > 10) {
                            rating = 'Hazardous';
                            ratingColor = 'bg-red-100 text-red-800 dark:bg-red-955 dark:text-red-400';
                          } else if (phVal < 6.5 || phVal > 8.5 || tdsVal > 300 || turbVal > 5) {
                            rating = 'Acceptable';
                            ratingColor = 'bg-amber-100 text-amber-800 dark:bg-amber-955 dark:text-amber-400';
                          }

                          return (
                            <TableRow key={index} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                              <TableCell className="font-semibold text-slate-805 dark:text-slate-200">
                                {waterBodiesMap[Number(w.wid)] || `Water Body #${w.wid}`}
                              </TableCell>
                              <TableCell className="text-center font-mono font-bold text-slate-850 dark:text-slate-100">
                                {w.ph || '—'}
                              </TableCell>
                              <TableCell className="text-center font-mono font-bold text-slate-850 dark:text-slate-100">
                                {w.tds || '—'}
                              </TableCell>
                              <TableCell className="text-center font-mono font-bold text-slate-850 dark:text-slate-100">
                                {w.turbidity || '—'}
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge className={`${ratingColor} border-none font-bold text-[10px]`}>
                                  {rating}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-4 text-muted-foreground text-sm">
                            No water quality parameter testing registered for this survey.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>

            <DialogFooter className="mt-4 border-t pt-3">
              <Button 
                onClick={() => setDetailSurveyOpen(false)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                Close Registry File
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <HydraHelpChat />
    </div>
  );
};

export default PublicDashboard;
