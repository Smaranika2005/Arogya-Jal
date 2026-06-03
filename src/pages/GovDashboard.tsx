import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Shield, 
  LogOut, 
  Droplets, 
  RefreshCw, 
  Building2, 
  Users, 
  ClipboardList, 
  ChevronLeft, 
  Printer, 
  Eye, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  TrendingUp,
  FileText
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import {
  fetchMunicipalities,
  fetchMunicipalitiesOverview,
  fetchMunicipalityDashboard,
  fetchWaterBodyDetails,
  fetchBoothTrends,
  fetchWardTrends,
  fetchWaterBodies,
  scoreColor,
} from '@/services/arogya-api';
import { getSymptomSurveysForMunicipality, getAshaWorkersCount, getAshaWorkersList } from '@/services/surveys';
import { MunicipalityDashboardView } from '@/components/dashboard/MunicipalityDashboardView';
import type { Municipality, MunicipalityDashboard, WaterBodyDetails, WaterBody } from '@/types/arogya';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
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
  Cell,
  Legend,
} from 'recharts';

const AGE_COLORS = ['#38bdf8', '#8b5cf6', '#f59e0b']; // sky-400, purple-500, amber-500

const GovDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userName, setUserName] = useState('');
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [selectedMunicipalityId, setSelectedMunicipalityId] = useState<number | null>(null);
  const [dashboard, setDashboard] = useState<MunicipalityDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [waterBodyDetails, setWaterBodyDetails] = useState<WaterBodyDetails | null>(null);
  const [boothTrend, setBoothTrend] = useState<{ booth_score: number; generated_at: string }[]>([]);
  const [wardTrend, setWardTrend] = useState<{ ward_score: number; generated_at: string }[]>([]);
  const [selectedBoothId, setSelectedBoothId] = useState<number | null>(null);
  const [selectedWardId, setSelectedWardId] = useState<number | null>(null);
  const [boothWaterBodies, setBoothWaterBodies] = useState<WaterBody[]>([]);

  // Extended Dashboard States
  const [surveys, setSurveys] = useState<any[]>([]);
  const [ashaCount, setAshaCount] = useState(0);
  const [totalSurveysCount, setTotalSurveysCount] = useState(0);
  const [surveysLoading, setSurveysLoading] = useState(false);
  const [detailSurvey, setDetailSurvey] = useState<any | null>(null);
  const [detailSurveyOpen, setDetailSurveyOpen] = useState(false);
  const [reportSurvey, setReportSurvey] = useState<any | null>(null);
  const [reportSurveyOpen, setReportSurveyOpen] = useState(false);
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

  const selectedMuniObject = municipalities.find(m => m.id === selectedMunicipalityId);
  const activeMunicipalityName = dashboard?.municipality.name || selectedMuniObject?.name || 'Selected Municipality';
  const municipalityScoreValue = dashboard?.municipalityScore;

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/gov/login'); return; }
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (!profile || profile.role !== 'government') {
        await supabase.auth.signOut();
        navigate('/gov/login');
        return;
      }
      setUserName(profile.name);
      try {
        let list: Municipality[] = [];
        try {
          const overviewList = await fetchMunicipalitiesOverview();
          list = overviewList.map((m: any) => ({
            id: Number(m.id || m.municipality_id),
            name: m.name || m.municipality_name || '',
            municipalityScore: m.municipalityScore
          }));
        } catch (fetchErr) {
          console.warn('Backend overview fetch failed, falling back to direct Supabase fetch:', fetchErr);
          list = await fetchMunicipalities();
        }
        setMunicipalities(list);
        
        // Fetch ASHA workers count
        const ac = await getAshaWorkersCount();
        setAshaCount(ac);
        
        // Fetch ASHA workers list
        try {
          const workers = await getAshaWorkersList();
          const map: Record<string, string> = {};
          workers.forEach((w: any) => {
            map[w.id] = w.name;
          });
          setAsHAWorkersMap(map);
        } catch (err) {
          console.warn('Failed to load ASHA workers list:', err);
        }
        
        // Fetch total survey count
        const { count: sc } = await supabase
          .from('symptom_survey')
          .select('*', { count: 'exact', head: true });
        setTotalSurveysCount(sc || 0);

        // Fetch water bodies list
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
      } catch (e: unknown) {
        toast({ title: 'Failed to load dashboard', description: (e as Error).message, variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate, toast]);

  const loadDashboard = async (municipalityId: number) => {
    setLoading(true);
    setSurveysLoading(true);
    setDashboard(null);
    setSurveys([]);
    try {
      try {
        const dbData = await fetchMunicipalityDashboard(municipalityId);
        setDashboard(dbData);
      } catch (dbErr) {
        console.warn('Failed to load Express dashboard data:', dbErr);
      }
      
      const sList = await getSymptomSurveysForMunicipality(municipalityId);
      setSurveys(sList);
    } catch (e: unknown) {
      toast({ title: 'Dashboard error', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setLoading(false);
      setSurveysLoading(false);
    }
  };

  useEffect(() => {
    if (selectedMunicipalityId) {
      loadDashboard(selectedMunicipalityId);
    } else {
      setDashboard(null);
      setSurveys([]);
    }
  }, [selectedMunicipalityId]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/gov/login');
  };

  const handleSelectWaterBody = async (waterBodyId: number) => {
    try {
      setWaterBodyDetails(await fetchWaterBodyDetails(waterBodyId));
    } catch (e: unknown) {
      toast({ title: 'Failed to load water body', description: (e as Error).message, variant: 'destructive' });
    }
  };

  const handleSelectBooth = async (boothId: number) => {
    setSelectedBoothId(boothId);
    try {
      setBoothTrend(await fetchBoothTrends(boothId));
      setBoothWaterBodies(await fetchWaterBodies(boothId));
    } catch {
      setBoothTrend([]);
      setBoothWaterBodies([]);
    }
  };

  const handleSelectWard = async (wardId: number) => {
    setSelectedWardId(wardId);
    try {
      setWardTrend(await fetchWardTrends(wardId));
    } catch {
      setWardTrend([]);
    }
  };

  // Compute analytics from survey list
  const analyticsData = (() => {
    if (surveys.length === 0) return null;

    let totalPeopleSurveyed = 0;
    let diarrhoeaCount = 0;
    let abdominalPainCount = 0;
    let dehydrationCount = 0;
    let vomitingCount = 0;
    let feverCount = 0;
    let skinRashesCount = 0;

    let childCount = 0;
    let adultCount = 0;
    let seniorCount = 0;

    let totalPH = 0;
    let totalTDS = 0;
    let totalTurbidity = 0;
    let waterAssessmentsCount = 0;

    surveys.forEach((s) => {
      const data = s.survey_data;
      totalPeopleSurveyed += data.totalPeopleSurveyed || 0;
      diarrhoeaCount += data.symptoms?.diarrhoea || 0;
      abdominalPainCount += data.symptoms?.abdominalPain || 0;
      dehydrationCount += data.symptoms?.dehydrationWeakness || 0;
      vomitingCount += data.symptoms?.vomiting || 0;
      feverCount += data.symptoms?.fever || 0;
      skinRashesCount += data.symptoms?.skinRashes || 0;

      childCount += data.ageGroups?.children0to12 || 0;
      adultCount += data.ageGroups?.adults13to60 || 0;
      seniorCount += data.ageGroups?.elderly60plus || 0;

      if (data.waterBodyAssessments && data.waterBodyAssessments.length > 0) {
        data.waterBodyAssessments.forEach((w: any) => {
          const phVal = parseFloat(w.ph);
          const tdsVal = parseFloat(w.tds);
          const turbVal = parseFloat(w.turbidity);

          if (!isNaN(phVal)) {
            totalPH += phVal;
            waterAssessmentsCount++;
          }
          if (!isNaN(tdsVal)) {
            totalTDS += tdsVal;
          }
          if (!isNaN(turbVal)) {
            totalTurbidity += turbVal;
          }
        });
      }
    });

    const averagePH = waterAssessmentsCount > 0 ? totalPH / waterAssessmentsCount : null;
    const averageTDS = waterAssessmentsCount > 0 ? totalTDS / waterAssessmentsCount : null;
    const averageTurbidity = waterAssessmentsCount > 0 ? totalTurbidity / waterAssessmentsCount : null;

    const symptomsList = [
      { name: 'Diarrhoea', count: diarrhoeaCount },
      { name: 'Abdominal Pain', count: abdominalPainCount },
      { name: 'Dehydration/Weakness', count: dehydrationCount },
      { name: 'Vomiting', count: vomitingCount },
      { name: 'Fever', count: feverCount },
      { name: 'Skin Rashes', count: skinRashesCount },
    ];

    const symptomsChartData = symptomsList.map((sym) => {
      const percentage = totalPeopleSurveyed > 0 ? (sym.count / totalPeopleSurveyed) * 100 : 0;
      return {
        name: sym.name,
        percentage: parseFloat(percentage.toFixed(1)),
        count: sym.count,
      };
    });

    const totalAffected = childCount + adultCount + seniorCount;
    const ageChartData = [
      { name: 'Children (0-12)', value: childCount, percentage: totalAffected > 0 ? (childCount / totalAffected) * 100 : 0 },
      { name: 'Adults (13-60)', value: adultCount, percentage: totalAffected > 0 ? (adultCount / totalAffected) * 100 : 0 },
      { name: 'Elderly (60+)', value: seniorCount, percentage: totalAffected > 0 ? (seniorCount / totalAffected) * 100 : 0 },
    ].filter(item => item.value > 0);

    return {
      totalPeopleSurveyed,
      averagePH,
      averageTDS,
      averageTurbidity,
      symptomsChartData,
      ageChartData,
      totalAffected,
      childCount,
      adultCount,
      seniorCount,
    };
  })();

  const getPHStatus = (ph: number) => {
    if (ph >= 6.5 && ph <= 8.5) return { label: 'Safe', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200' };
    if (ph >= 6.0 && ph <= 9.0) return { label: 'Acceptable', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200' };
    return { label: 'Hazardous', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200' };
  };

  const getTDSStatus = (tds: number) => {
    if (tds < 300) return { label: 'Safe', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200' };
    if (tds <= 600) return { label: 'Acceptable', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200' };
    return { label: 'Hazardous', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200' };
  };

  const getTurbidityStatus = (turb: number) => {
    if (turb < 5) return { label: 'Safe', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200' };
    if (turb <= 10) return { label: 'Acceptable', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200' };
    return { label: 'Hazardous', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200' };
  };

  const handleOpenSurveyDetails = (survey: any) => {
    setDetailSurvey(survey);
    setDetailSurveyOpen(true);
  };

  const handleGenerateReport = (survey: any) => {
    setReportSurvey(survey);
    setReportSurveyOpen(true);
  };

  // Welcome Screen (If no municipality is selected)
  if (!selectedMunicipalityId && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-tr from-slate-50 via-sky-50/20 to-white dark:from-slate-950 dark:to-slate-900 flex flex-col justify-between">
        <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur sticky top-0 z-10">
          <div className="container flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-sky-600 animate-pulse" />
              <div>
                <h1 className="text-xl font-bold">Arogya Jal Portal</h1>
                <p className="text-sm text-muted-foreground">Government Administrative Console</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium hidden md:inline text-muted-foreground">Welcome, {userName}</span>
              <Button variant="ghost" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" /> Logout
              </Button>
            </div>
          </div>
        </header>

        <main className="container py-12 flex-1 flex flex-col justify-center items-center">
          <div className="w-full max-w-4xl space-y-8">
            <div className="text-center space-y-4">
              <Badge className="bg-sky-500/10 text-sky-600 dark:text-sky-400 border-none px-3 py-1 hover:bg-sky-500/20">
                Arogya Jal Surveillance
              </Badge>
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-sky-600 to-indigo-600 dark:from-sky-400 dark:to-indigo-400">
                Water Safety & Disease Surveillance
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Real-time biological contamination tracking and public health monitoring dashboard. Monitor, analyze, and deploy sanitation resources.
              </p>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <Card className="hover:scale-[1.02] transition-all duration-300 shadow-md hover:shadow-lg border-sky-100 dark:border-slate-800">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Municipalities</p>
                    <p className="text-2xl font-bold">{municipalities.length}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:scale-[1.02] transition-all duration-300 shadow-md hover:shadow-lg border-violet-100 dark:border-slate-800">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-violet-100 dark:bg-violet-950 text-violet-600 dark:text-violet-400">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active ASHA Workers</p>
                    <p className="text-2xl font-bold">{ashaCount}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:scale-[1.02] transition-all duration-300 shadow-md hover:shadow-lg border-emerald-100 dark:border-slate-800">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                    <ClipboardList className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Submitted Surveys</p>
                    <p className="text-2xl font-bold">{totalSurveysCount}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Selection Card */}
            <Card className="shadow-xl border-sky-100 dark:border-slate-800 backdrop-blur-md bg-white/60 dark:bg-slate-900/60 p-8 max-w-md mx-auto">
              <div className="space-y-6 text-center">
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">Select Municipality</h3>
                  <p className="text-sm text-muted-foreground">
                    Access localized data, analytics, health surveys, and water parameter values.
                  </p>
                </div>

                <Select
                  onValueChange={(v) => {
                    setSelectedMunicipalityId(Number(v));
                  }}
                >
                  <SelectTrigger className="w-full h-11 border-sky-200 dark:border-slate-800 shadow-sm focus:ring-sky-500">
                    <SelectValue placeholder="Choose a municipality..." />
                  </SelectTrigger>
                  <SelectContent>
                    {municipalities.map((m) => (
                      <SelectItem key={m.id} value={String(m.id)}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </Card>
          </div>
        </main>

        <footer className="py-6 border-t text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Arogya Jal. Confidential Administrative Access.
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur sticky top-0 z-10 print:hidden">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setSelectedMunicipalityId(null)} className="h-9 w-9">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Shield className="h-8 w-8 text-sky-600" />
            <div>
              <h1 className="text-xl font-bold">Arogya Jal Portal</h1>
              <p className="text-sm text-muted-foreground">{activeMunicipalityName} Administration</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={() => selectedMunicipalityId && loadDashboard(selectedMunicipalityId)}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="ghost" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8">
        {loading && surveys.length === 0 && !dashboard ? (
          <p className="text-muted-foreground">Loading municipality data...</p>
        ) : selectedMunicipalityId ? (
          <div className="space-y-6">
            {/* Municipality Header Card */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur border p-6 rounded-2xl print:hidden">
              <div>
                <span className="text-xs font-bold text-sky-600 uppercase tracking-widest">Active Municipality</span>
                <h2 className="text-2xl font-bold mt-0.5">{activeMunicipalityName}</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  System Health Score updated based on ASHA surveys and sensor feeds.
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-xs text-muted-foreground block">Safety Rating</span>
                  <span className={`text-3xl font-extrabold ${scoreColor(municipalityScoreValue)}`}>
                    {municipalityScoreValue != null ? municipalityScoreValue.toFixed(1) : '—'}
                  </span>
                </div>
                <div className="h-10 w-px bg-slate-200 dark:bg-slate-800" />
                <Button variant="outline" onClick={() => setSelectedMunicipalityId(null)}>
                  Change Municipality
                </Button>
              </div>
            </div>

            <Tabs defaultValue="analytics" className="w-full space-y-6 print:hidden">
              <TabsList className="bg-slate-100/80 dark:bg-slate-900/80 p-1 border rounded-lg max-w-md flex w-full">
                <TabsTrigger value="analytics" className="flex-1 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 shadow-sm">
                  <TrendingUp className="h-4 w-4 mr-2" /> Analytics & Stats
                </TabsTrigger>
                <TabsTrigger value="surveys" className="flex-1 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 shadow-sm">
                  <FileText className="h-4 w-4 mr-2" /> Survey Records
                </TabsTrigger>
              </TabsList>

              {/* Tab 1: Analytics & Stats */}
              <TabsContent value="analytics" className="space-y-6">
                {analyticsData ? (
                  <div className="space-y-6 animate-fade-in">
                    {/* Water Parameter Averages Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      {/* pH Card */}
                      <Card className="border-sky-50/50 dark:border-slate-800/50 shadow-sm">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                            Avg. Acidity Level (pH)
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-baseline justify-between">
                            <span className="text-3xl font-bold font-mono">
                              {analyticsData.averagePH ? analyticsData.averagePH.toFixed(2) : '—'}
                            </span>
                            {analyticsData.averagePH && (
                              <Badge className={getPHStatus(analyticsData.averagePH).color}>
                                {getPHStatus(analyticsData.averagePH).label}
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center justify-between border-t pt-2">
                            <span>Safe Standard: 6.5 – 8.5</span>
                            <span className="font-semibold text-sky-600">Physiological Scale</span>
                          </div>
                        </CardContent>
                      </Card>

                      {/* TDS Card */}
                      <Card className="border-violet-50/50 dark:border-slate-800/50 shadow-sm">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                            Avg. Dissolved Solids (TDS)
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-baseline justify-between">
                            <span className="text-3xl font-bold font-mono">
                              {analyticsData.averageTDS ? `${analyticsData.averageTDS.toFixed(0)}` : '—'}
                              <span className="text-sm font-normal text-muted-foreground ml-1">ppm</span>
                            </span>
                            {analyticsData.averageTDS && (
                              <Badge className={getTDSStatus(analyticsData.averageTDS).color}>
                                {getTDSStatus(analyticsData.averageTDS).label}
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center justify-between border-t pt-2">
                            <span>Safe Standard: &lt; 300 ppm</span>
                            <span className="font-semibold text-violet-600">Chemical Purity</span>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Turbidity Card */}
                      <Card className="border-amber-50/50 dark:border-slate-800/50 shadow-sm">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                            Avg. Turbidity Level
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-baseline justify-between">
                            <span className="text-3xl font-bold font-mono">
                              {analyticsData.averageTurbidity ? `${analyticsData.averageTurbidity.toFixed(2)}` : '—'}
                              <span className="text-sm font-normal text-muted-foreground ml-1">NTU</span>
                            </span>
                            {analyticsData.averageTurbidity && (
                              <Badge className={getTurbidityStatus(analyticsData.averageTurbidity).color}>
                                {getTurbidityStatus(analyticsData.averageTurbidity).label}
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center justify-between border-t pt-2">
                            <span>Safe Standard: &lt; 5.0 NTU</span>
                            <span className="font-semibold text-amber-600">Physical Clarity</span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Charts Panel */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Symptoms Card */}
                      <Card className="shadow-sm">
                        <CardHeader>
                          <CardTitle className="text-base font-semibold">Symptomatic Incidences</CardTitle>
                          <CardDescription>
                            Percentage of monitored population exhibiting waterborne symptoms (Total: {analyticsData.totalPeopleSurveyed} people).
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={analyticsData.symptomsChartData} layout="vertical" margin={{ left: 10, right: 35, top: 10, bottom: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-muted" />
                                <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
                                <YAxis dataKey="name" type="category" width={135} tick={{ fontSize: 11 }} />
                                <Tooltip formatter={(value) => [`${value}%`, 'Incidence Rate']} />
                                <Bar dataKey="percentage" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={16} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Age Distribution Card */}
                      <Card className="shadow-sm">
                        <CardHeader>
                          <CardTitle className="text-base font-semibold">Affected Age Cohort Distribution</CardTitle>
                          <CardDescription>
                            Proportion of symptomatic individuals grouped by age range (Total affected: {analyticsData.totalAffected} people).
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center justify-center">
                          {analyticsData.totalAffected > 0 ? (
                            <div className="h-[300px] w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={analyticsData.ageChartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={65}
                                    outerRadius={85}
                                    paddingAngle={5}
                                    dataKey="value"
                                    label={({ name, percentage }) => `${percentage.toFixed(1)}%`}
                                  >
                                    {analyticsData.ageChartData.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={AGE_COLORS[index % AGE_COLORS.length]} />
                                    ))}
                                  </Pie>
                                  <Tooltip formatter={(value, name, props) => [value, `${props.payload.name} (Count)`]} />
                                  <Legend verticalAlign="bottom" height={36} tick={{ fontSize: 11 }} />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                          ) : (
                            <div className="text-center py-16 text-muted-foreground">
                              <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
                              <p className="text-sm font-medium">No sickness/symptoms recorded.</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                ) : (
                  <Card className="p-8 text-center bg-white/40 dark:bg-slate-900/40 border border-dashed">
                    <Droplets className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <h4 className="text-md font-bold mb-1">No Active Survey Records</h4>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                      No epidemiological survey data has been submitted by ASHA workers for this municipality. Check safety evaluations under the Water Quality Hierarchy tab.
                    </p>
                  </Card>
                )}
              </TabsContent>



              {/* Tab 3: Survey Records */}
              <TabsContent value="surveys" className="space-y-6">
                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border">
                  <div>
                    <h3 className="font-bold text-sm">ASHA Survey Submissions</h3>
                    <p className="text-xs text-muted-foreground">
                      Collected biological surveillance checklists (View-only administrative records).
                    </p>
                  </div>
                  <Badge variant="outline" className="font-mono bg-white dark:bg-slate-950">
                    Total: {surveys.length} Reports
                  </Badge>
                </div>

                {surveysLoading ? (
                  <p className="text-sm text-muted-foreground">Loading collected survey files...</p>
                ) : surveys.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {surveys.map((survey) => (
                      <Card key={survey.id} className="hover:border-sky-500/50 hover:shadow-md transition-all duration-300">
                        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 rounded-t-xl">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-sm font-bold">
                                Submitted by: {ashaWorkersMap[survey.user_id] || 'Unknown ASHA Worker'}
                              </CardTitle>
                              <CardDescription className="text-xs mt-1">
                                Submitted {new Date(survey.created_at).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                              </CardDescription>
                            </div>
                            <Badge className="bg-sky-500/10 text-sky-600 dark:text-sky-400 border-none">
                              Ward {survey.survey_data.wardNo} / Booth {survey.survey_data.boothNo}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4">
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div className="bg-slate-50/30 dark:bg-slate-900/30 p-2.5 rounded-lg border">
                              <p className="text-muted-foreground font-semibold">Survey Size</p>
                              <p className="text-sm font-bold mt-1 text-slate-800 dark:text-slate-200">
                                {survey.total_people} People
                              </p>
                            </div>
                            <div className="bg-slate-50/30 dark:bg-slate-900/30 p-2.5 rounded-lg border">
                              <p className="text-muted-foreground font-semibold">Toxicity Index</p>
                              <p className="text-sm font-bold mt-1 text-slate-800 dark:text-slate-200">
                                pH {survey.survey_data.avgPH || '—'} / Turbidity {survey.survey_data.avgTurbidity || '—'}
                              </p>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1 text-xs" 
                              onClick={() => handleOpenSurveyDetails(survey)}
                            >
                              <Eye className="h-3.5 w-3.5 mr-1" /> View Questionnaire
                            </Button>
                            <Button 
                              size="sm" 
                              className="flex-1 text-xs bg-sky-600 hover:bg-sky-700 text-white"
                              onClick={() => handleGenerateReport(survey)}
                            >
                              Generate Report
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 border-2 border-dashed rounded-xl">
                    <ClipboardList className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm font-semibold">No survey submissions available.</p>
                    <p className="text-xs text-muted-foreground mt-0.5">ASHA workers haven't logged any health sheets here yet.</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="text-center py-16">
            <Droplets className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No municipality data available. Run database seed.</p>
          </div>
        )}
      </main>

      {/* Survey Detail Modal (View Only) */}
      {detailSurvey && (
        <Dialog open={detailSurveyOpen} onOpenChange={setDetailSurveyOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">
                ASHA Survey Details — Submitted by {ashaWorkersMap[detailSurvey.user_id] || 'Unknown ASHA Worker'}
              </DialogTitle>
              <CardDescription>Administrative view-only registry record. Editing permissions disabled.</CardDescription>
            </DialogHeader>

            <div className="space-y-6 py-2">
              {/* General details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <p className="text-muted-foreground uppercase font-bold">Survey Date</p>
                  <p className="font-semibold mt-0.5">{detailSurvey.survey_data.surveyDate}</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <p className="text-muted-foreground uppercase font-bold">Municipality</p>
                  <p className="font-semibold mt-0.5">{detailSurvey.survey_data.municipality}</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <p className="text-muted-foreground uppercase font-bold">Ward / Booth</p>
                  <p className="font-semibold mt-0.5">Ward {detailSurvey.survey_data.wardNo} / Booth {detailSurvey.survey_data.boothNo}</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <p className="text-muted-foreground uppercase font-bold">Pincode</p>
                  <p className="font-semibold mt-0.5 font-mono">{detailSurvey.survey_data.pincode}</p>
                </div>
              </div>

              {/* Epidemiology Section */}
              <div className="space-y-3">
                <h4 className="font-bold text-sm border-b pb-1 text-sky-600 dark:text-sky-400">Biological Symptoms & Incidence Rates</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[
                    { label: 'Diarrhoea', value: detailSurvey.survey_data.symptoms.diarrhoea },
                    { label: 'Abdominal Pain', value: detailSurvey.survey_data.symptoms.abdominalPain },
                    { label: 'Dehydration/Weakness', value: detailSurvey.survey_data.symptoms.dehydrationWeakness },
                    { label: 'Vomiting', value: detailSurvey.survey_data.symptoms.vomiting },
                    { label: 'Fever', value: detailSurvey.survey_data.symptoms.fever },
                    { label: 'Skin Rashes', value: detailSurvey.survey_data.symptoms.skinRashes },
                  ].map((symptom, idx) => {
                    const pct = detailSurvey.total_people > 0 
                      ? ((symptom.value / detailSurvey.total_people) * 100).toFixed(1)
                      : '0.0';
                    return (
                      <div key={idx} className="p-3 border rounded-lg flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">{symptom.label}</p>
                          <p className="text-base font-bold mt-0.5">{symptom.value}</p>
                        </div>
                        <Badge className="bg-red-500/10 text-red-600 dark:text-red-400 border-none">{pct}%</Badge>
                      </div>
                    );
                  })}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs mt-2">
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg flex justify-between items-center">
                    <span className="text-muted-foreground font-semibold">Total People Surveyed</span>
                    <span className="font-bold text-sm">{detailSurvey.total_people}</span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg flex justify-between items-center">
                    <span className="text-muted-foreground font-semibold">Avg. Symptom Duration</span>
                    <span className="font-bold text-sm">{detailSurvey.survey_data.avgSymptomDuration} Days</span>
                  </div>
                </div>
              </div>

              {/* Age demographics */}
              <div className="space-y-3">
                <h4 className="font-bold text-sm border-b pb-1 text-sky-600 dark:text-sky-400">Demographic Distribution of Affected</h4>
                <div className="grid grid-cols-3 gap-4 text-xs">
                  <div className="p-3 border rounded-lg">
                    <p className="text-muted-foreground uppercase font-bold text-[10px]">Children (0-12)</p>
                    <p className="text-lg font-bold mt-1 text-sky-500">{detailSurvey.survey_data.ageGroups.children0to12}</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="text-muted-foreground uppercase font-bold text-[10px]">Adults (13-60)</p>
                    <p className="text-lg font-bold mt-1 text-purple-500">{detailSurvey.survey_data.ageGroups.adults13to60}</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="text-muted-foreground uppercase font-bold text-[10px]">Elderly (60+)</p>
                    <p className="text-lg font-bold mt-1 text-amber-500">{detailSurvey.survey_data.ageGroups.elderly60plus}</p>
                  </div>
                </div>
              </div>

              {/* Water quality tests */}
              <div className="space-y-3">
                <h4 className="font-bold text-sm border-b pb-1 text-sky-600 dark:text-sky-400">Assessed Water Sources</h4>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50 dark:bg-slate-900">
                      <TableRow>
                        <TableHead>Water Body Source</TableHead>
                        <TableHead className="text-center">pH Value</TableHead>
                        <TableHead className="text-center">TDS (ppm)</TableHead>
                        <TableHead className="text-center">Turbidity (NTU)</TableHead>
                        <TableHead className="text-center">Safety Rating</TableHead>
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
                            ratingColor = 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-400';
                          } else if (phVal < 6.5 || phVal > 8.5 || tdsVal > 300 || turbVal > 5) {
                            rating = 'Acceptable';
                            ratingColor = 'bg-amber-100 text-amber-800 dark:bg-amber-955 dark:text-amber-400';
                          }

                          return (
                            <TableRow key={index}>
                              <TableCell className="font-semibold">{waterBodiesMap[Number(w.wid)] || `Water Body #${w.wid}`}</TableCell>
                              <TableCell className="text-center font-mono">{w.ph || '—'}</TableCell>
                              <TableCell className="text-center font-mono">{w.tds || '—'}</TableCell>
                              <TableCell className="text-center font-mono">{w.turbidity || '—'}</TableCell>
                              <TableCell className="text-center">
                                <Badge className={`${ratingColor} border-none`}>{rating}</Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-4 text-muted-foreground text-sm">
                            No physical/chemical assessments registered for this survey.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={() => setDetailSurveyOpen(false)}>Close Registry File</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Official Report Generation Modal */}
      {reportSurvey && (
        <Dialog open={reportSurveyOpen} onOpenChange={setReportSurveyOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="print:hidden">
              <DialogTitle>Official Public Health Sanitary Report</DialogTitle>
            </DialogHeader>
            
            {/* Print Styling */}
            <style>{`
              @media print {
                body * {
                  visibility: hidden !important;
                }
                #print-report-modal, #print-report-modal * {
                  visibility: visible !important;
                }
                #print-report-modal {
                  position: absolute !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 100% !important;
                  margin: 0 !important;
                  padding: 1.5cm !important;
                  box-shadow: none !important;
                  background: white !important;
                  color: black !important;
                }
                .no-print {
                  display: none !important;
                }
              }
            `}</style>
            
            <div id="print-report-modal" className="space-y-6 bg-white dark:bg-slate-950 p-6 rounded-lg border text-slate-900 dark:text-white">
              {/* Report Header */}
              <div className="flex items-center justify-between border-b-2 border-slate-900 dark:border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <Shield className="h-12 w-12 text-slate-800 dark:text-slate-200" />
                  <div>
                    <h2 className="text-xl font-bold tracking-tight uppercase text-slate-900 dark:text-white">
                      Department of Public Health & Sanitation
                    </h2>
                    <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                      Sanitary Survey & Disease Surveillance Report
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className="bg-slate-900 text-white hover:bg-slate-900 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-slate-100">
                    Official Record
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1 font-mono">Report ID: AJ-{reportSurvey.id}</p>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-bold">Municipality</p>
                  <p className="font-semibold">{reportSurvey.survey_data.municipality}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-bold">Ward / Booth</p>
                  <p className="font-semibold">Ward {reportSurvey.survey_data.wardNo} / Booth {reportSurvey.survey_data.boothNo}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-bold">Survey Date</p>
                  <p className="font-semibold">{new Date(reportSurvey.survey_data.surveyDate).toLocaleDateString('en-US', { dateStyle: 'medium' })}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-bold">Report Pincode</p>
                  <p className="font-semibold font-mono">{reportSurvey.survey_data.pincode}</p>
                </div>
              </div>

              {/* Population & Health Indicators */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wide border-b pb-1 text-slate-900 dark:text-white">
                  I. Epidemiological Surveillance Metrics
                </h3>
                <p className="text-sm">
                  During the sanitary survey, a total of <strong>{reportSurvey.total_people}</strong> residents were monitored. The reported average symptom duration for affected individuals is <strong>{reportSurvey.survey_data.avgSymptomDuration} days</strong>.
                </p>
                
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50 dark:bg-slate-900">
                      <TableRow className="border-slate-300 dark:border-slate-700">
                        <TableHead className="font-bold text-slate-800 dark:text-slate-200">Symptom Category</TableHead>
                        <TableHead className="font-bold text-slate-800 dark:text-slate-200 text-center">Incidence Count</TableHead>
                        <TableHead className="font-bold text-slate-800 dark:text-slate-200 text-center">Incidence Rate (%)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[
                        { label: 'Diarrhoea', count: reportSurvey.survey_data.symptoms.diarrhoea },
                        { label: 'Abdominal Pain', count: reportSurvey.survey_data.symptoms.abdominalPain },
                        { label: 'Dehydration & Weakness', count: reportSurvey.survey_data.symptoms.dehydrationWeakness },
                        { label: 'Vomiting', count: reportSurvey.survey_data.symptoms.vomiting },
                        { label: 'Fever', count: reportSurvey.survey_data.symptoms.fever },
                        { label: 'Skin Rashes', count: reportSurvey.survey_data.symptoms.skinRashes },
                      ].map((sym, idx) => {
                        const percentage = reportSurvey.total_people > 0 
                          ? ((sym.count / reportSurvey.total_people) * 100).toFixed(1)
                          : '0.0';
                        return (
                          <TableRow key={idx} className="border-slate-200 dark:border-slate-800">
                            <TableCell className="font-medium">{sym.label}</TableCell>
                            <TableCell className="text-center">{sym.count}</TableCell>
                            <TableCell className="text-center font-semibold">{percentage}%</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Water Quality Section */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wide border-b pb-1 text-slate-900 dark:text-white">
                  II. Water Quality Parameters & Laboratory Verification
                </h3>
                <p className="text-sm">
                  ASHA Workers collected and assessed physical and chemical parameters of <strong>{reportSurvey.survey_data.numberOfWaterBodies}</strong> water body points within the booth limits.
                </p>
                
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50 dark:bg-slate-900">
                      <TableRow className="border-slate-300 dark:border-slate-700">
                        <TableHead className="font-bold text-slate-800 dark:text-slate-200">Water Body Source</TableHead>
                        <TableHead className="font-bold text-slate-800 dark:text-slate-200 text-center">pH Value</TableHead>
                        <TableHead className="font-bold text-slate-800 dark:text-slate-200 text-center">TDS Level (ppm)</TableHead>
                        <TableHead className="font-bold text-slate-800 dark:text-slate-200 text-center">Turbidity (NTU)</TableHead>
                        <TableHead className="font-bold text-slate-800 dark:text-slate-200 text-center">Safety Assessment</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportSurvey.survey_data.waterBodyAssessments && reportSurvey.survey_data.waterBodyAssessments.length > 0 ? (
                        reportSurvey.survey_data.waterBodyAssessments.map((wb: any, idx: number) => {
                          const ph = parseFloat(wb.ph);
                          const tds = parseFloat(wb.tds);
                          const turb = parseFloat(wb.turbidity);
                          
                          let status = 'Safe';
                          let statusColor = 'text-emerald-600 dark:text-emerald-400 font-bold';
                          
                          if (ph < 6.0 || ph > 9.0 || tds > 600 || turb > 10) {
                            status = 'Hazardous';
                            statusColor = 'text-red-600 dark:text-red-400 font-bold';
                          } else if (ph < 6.5 || ph > 8.5 || tds > 300 || turb > 5) {
                            status = 'Acceptable';
                            statusColor = 'text-amber-600 dark:text-amber-400 font-bold';
                          }
                          
                          return (
                            <TableRow key={idx} className="border-slate-200 dark:border-slate-800">
                              <TableCell className="font-medium">{waterBodiesMap[Number(wb.wid)] || `Water Body #${wb.wid}`}</TableCell>
                              <TableCell className="text-center font-mono">{wb.ph || '—'}</TableCell>
                              <TableCell className="text-center font-mono">{wb.tds || '—'}</TableCell>
                              <TableCell className="text-center font-mono">{wb.turbidity || '—'}</TableCell>
                              <TableCell className={`text-center ${statusColor}`}>{status}</TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-4 text-muted-foreground text-sm">
                            No physical/chemical assessments registered for this survey.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Risk & Directives */}
              {(() => {
                let hasHazardous = false;
                let hasAcceptable = false;
                let hasSevereSymptoms = false;
                
                if (reportSurvey.survey_data.waterBodyAssessments) {
                  reportSurvey.survey_data.waterBodyAssessments.forEach((wb: any) => {
                    const ph = parseFloat(wb.ph);
                    const tds = parseFloat(wb.tds);
                    const turb = parseFloat(wb.turbidity);
                    if (ph < 6.0 || ph > 9.0 || tds > 600 || turb > 10) hasHazardous = true;
                    else if (ph < 6.5 || ph > 8.5 || tds > 300 || turb > 5) hasAcceptable = true;
                  });
                }
                
                const maxSymptomRate = reportSurvey.total_people > 0 ? Math.max(
                  reportSurvey.survey_data.symptoms.diarrhoea,
                  reportSurvey.survey_data.symptoms.abdominalPain,
                  reportSurvey.survey_data.symptoms.vomiting
                ) / reportSurvey.total_people : 0;
                
                if (maxSymptomRate > 0.1) {
                  hasSevereSymptoms = true;
                }
                
                let riskTitle = 'LOW RISK';
                let riskColor = 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900';
                let directive = 'Water quality indicators are within physiological limits. Public health symptoms remain at routine baseline levels. Standard monitoring is recommended.';
                let riskIcon = <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />;

                if (hasHazardous || (hasAcceptable && hasSevereSymptoms)) {
                  riskTitle = 'HIGH RISK - IMMEDIATE INTERVENTION';
                  riskColor = 'border-red-200 bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900';
                  directive = 'CRITICAL ALERT: Physical/chemical water contamination detected alongside symptomatic clustering. Directives: (1) Temporarily suspend contaminated water body consumption. (2) Deploy chlorine tablets and boil-water advisories immediately. (3) Initiate sanitary pipeline audits to locate the source of organic/chemical intrusion.';
                  riskIcon = <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />;
                } else if (hasAcceptable || hasSevereSymptoms) {
                  riskTitle = 'MODERATE RISK - MONITORING INITIATED';
                  riskColor = 'border-amber-200 bg-amber-50 text-amber-800 dark:bg-amber-955/30 dark:text-amber-400 dark:border-amber-900';
                  directive = 'ELEVATED VIGILANCE: Sub-optimal water parameters or minor epidemiological symptoms recorded. Recommendations: (1) Increase testing frequency of local water wells. (2) Educate local community on water purification and sanitary hygiene. (3) Conduct routine chlorine levels verification at storage points.';
                  riskIcon = <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />;
                }
                
                return (
                  <div className={`p-4 border rounded-lg flex gap-3 items-start ${riskColor}`}>
                    <div className="mt-0.5">{riskIcon}</div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider">Public Health Risk Assessment</p>
                      <h4 className="text-sm font-extrabold uppercase mt-0.5">{riskTitle}</h4>
                      <p className="text-xs mt-2 leading-relaxed font-medium">{directive}</p>
                    </div>
                  </div>
                );
              })()}

              {/* Signature Box */}
              <div className="pt-8 border-t border-dashed flex justify-between text-xs font-medium">
                <div className="space-y-4">
                  <p className="text-muted-foreground uppercase">Prepared By:</p>
                  <div className="border-b w-40 border-slate-400 dark:border-slate-800"></div>
                  <p className="font-semibold">{ashaWorkersMap[reportSurvey.user_id] || 'ASHA Representative'}</p>
                  <p className="text-muted-foreground">Local Health Worker</p>
                </div>
                <div className="space-y-4 text-right">
                  <p className="text-muted-foreground uppercase">Certified By:</p>
                  <div className="border-b w-40 ml-auto border-slate-400 dark:border-slate-800"></div>
                  <p className="font-semibold">Administrative Health Officer</p>
                  <p className="text-muted-foreground">Municipal Sanitary Inspection Division</p>
                </div>
              </div>

              {/* Verification stamp */}
              <div className="text-center text-[10px] text-muted-foreground pt-4 border-t uppercase tracking-widest font-mono">
                Arogya Jal Platform Verified Report • Generated on {new Date().toLocaleString()}
              </div>
            </div>

            <DialogFooter className="print:hidden">
              <Button variant="outline" onClick={() => setReportSurveyOpen(false)}>
                Close
              </Button>
              <Button onClick={() => window.print()} className="bg-sky-600 text-white hover:bg-sky-700">
                <Printer className="h-4 w-4 mr-2" /> Print / Save PDF
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default GovDashboard;
