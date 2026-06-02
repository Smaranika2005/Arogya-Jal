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
import { Shield, LogOut, Droplets, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import {
  fetchMunicipalitiesOverview,
  fetchMunicipalityDashboard,
  fetchWaterBodyDetails,
  fetchBoothTrends,
  fetchWardTrends,
  fetchWaterBodies,
} from '@/services/arogya-api';
import { MunicipalityDashboardView } from '@/components/dashboard/MunicipalityDashboardView';
import type { Municipality, MunicipalityDashboard, WaterBodyDetails, WaterBody } from '@/types/arogya';

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
        const list = await fetchMunicipalitiesOverview();
        setMunicipalities(list);
        if (list.length) setSelectedMunicipalityId(list[0].id);
      } catch (e: unknown) {
        toast({ title: 'Failed to load dashboard', description: (e as Error).message, variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate, toast]);

  const loadDashboard = async (municipalityId: number) => {
    setLoading(true);
    try {
      setDashboard(await fetchMunicipalityDashboard(municipalityId));
    } catch (e: unknown) {
      toast({ title: 'Dashboard error', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedMunicipalityId) loadDashboard(selectedMunicipalityId);
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur sticky top-0 z-10">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-sky-600" />
            <div>
              <h1 className="text-xl font-bold">Arogya Jal — Government Dashboard</h1>
              <p className="text-sm text-muted-foreground">Welcome, {userName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Select
              value={selectedMunicipalityId ? String(selectedMunicipalityId) : ''}
              onValueChange={(v) => setSelectedMunicipalityId(Number(v))}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Municipality" />
              </SelectTrigger>
              <SelectContent>
                {municipalities.map((m) => (
                  <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
        {loading && !dashboard ? (
          <p className="text-muted-foreground">Loading municipality data...</p>
        ) : dashboard ? (
          <MunicipalityDashboardView
            data={dashboard}
            onSelectWaterBody={handleSelectWaterBody}
            waterBodyDetails={waterBodyDetails}
            boothTrend={boothTrend}
            wardTrend={wardTrend}
            selectedBoothId={selectedBoothId}
            selectedWardId={selectedWardId}
            onSelectBooth={handleSelectBooth}
            onSelectWard={handleSelectWard}
            boothWaterBodies={boothWaterBodies}
          />
        ) : (
          <div className="text-center py-16">
            <Droplets className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No municipality data available. Run database seed.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default GovDashboard;
