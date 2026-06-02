import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Shield, LogOut, Droplets, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import {
  fetchMunicipalityDashboard,
  fetchWaterBodyDetails,
  fetchBoothTrends,
  fetchWardTrends,
} from '@/services/arogya-api';
import { MunicipalityDashboardView } from '@/components/dashboard/MunicipalityDashboardView';
import HydraHelpChat from '@/components/HydraHelpChat';
import type { MunicipalityDashboard, WaterBodyDetails } from '@/types/arogya';

const PublicDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userName, setUserName] = useState('');
  const [municipalityId, setMunicipalityId] = useState<number | null>(null);
  const [municipalityName, setMunicipalityName] = useState('');
  const [dashboard, setDashboard] = useState<MunicipalityDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [waterBodyDetails, setWaterBodyDetails] = useState<WaterBodyDetails | null>(null);
  const [boothTrend, setBoothTrend] = useState<{ booth_score: number; generated_at: string }[]>([]);
  const [wardTrend, setWardTrend] = useState<{ ward_score: number; generated_at: string }[]>([]);
  const [selectedBoothId, setSelectedBoothId] = useState<number | null>(null);
  const [selectedWardId, setSelectedWardId] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/public/login'); return; }
      const { data: profile } = await supabase
        .from('profiles')
        .select('*, municipalities(id, name)')
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
        const { data: muni } = await supabase
          .from('municipalities')
          .select('id, name')
          .eq('name', profile.municipality)
          .maybeSingle();
        muniId = muni?.id;
      }

      if (!muniId) {
        toast({ title: 'No municipality assigned', description: 'Contact administrator.', variant: 'destructive' });
        setLoading(false);
        return;
      }

      setMunicipalityId(muniId);
      const { data: muniRow } = await supabase.from('municipalities').select('name').eq('id', muniId).single();
      setMunicipalityName(muniRow?.name ?? 'Your Municipality');
    })();
  }, [navigate, toast]);

  const loadDashboard = async (id: number) => {
    setLoading(true);
    try {
      setDashboard(await fetchMunicipalityDashboard(id));
    } catch (e: unknown) {
      toast({ title: 'Dashboard error', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (municipalityId) loadDashboard(municipalityId);
  }, [municipalityId]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/public/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white dark:from-slate-950 dark:to-slate-900">
      <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur sticky top-0 z-10">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <Droplets className="h-8 w-8 text-emerald-600" />
            <div>
              <h1 className="text-xl font-bold">Arogya Jal — Public Portal</h1>
              <p className="text-sm text-muted-foreground">{municipalityName} · {userName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => municipalityId && loadDashboard(municipalityId)}>
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
          <p className="text-muted-foreground">Loading water quality data...</p>
        ) : dashboard ? (
          <MunicipalityDashboardView
            data={dashboard}
            onSelectWaterBody={async (id) => {
              try {
                setWaterBodyDetails(await fetchWaterBodyDetails(id));
              } catch (e: unknown) {
                toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' });
              }
            }}
            waterBodyDetails={waterBodyDetails}
            boothTrend={boothTrend}
            wardTrend={wardTrend}
            selectedBoothId={selectedBoothId}
            selectedWardId={selectedWardId}
            onSelectBooth={async (id) => {
              setSelectedBoothId(id);
              try { setBoothTrend(await fetchBoothTrends(id)); } catch { setBoothTrend([]); }
            }}
            onSelectWard={async (id) => {
              setSelectedWardId(id);
              try { setWardTrend(await fetchWardTrends(id)); } catch { setWardTrend([]); }
            }}
          />
        ) : (
          <div className="text-center py-16">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No data available for your municipality yet.</p>
          </div>
        )}
      </main>

      <HydraHelpChat />
    </div>
  );
};

export default PublicDashboard;
