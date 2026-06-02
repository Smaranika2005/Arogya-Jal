import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Plus, Save, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { WaterBodyEntryBlock } from '@/components/WaterBodyEntryBlock';
import type { WaterBodyEntry } from '@/types/arogya';
import {
  fetchMunicipalities,
  fetchWards,
  fetchBooths,
  fetchWaterBodies,
  fetchPhSummary,
  submitBoothReport,
} from '@/services/arogya-api';
import type { Municipality, Ward, Booth, WaterBody } from '@/types/arogya';
import { Alert, AlertDescription } from '@/components/ui/alert';

const emptyEntry = (): WaterBodyEntry => ({
  waterBodyId: 0,
  tds: '',
  turbidity: '',
  wqi: null,
  phSummary: null,
});

const ASHAWaterQuality = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [booths, setBooths] = useState<Booth[]>([]);
  const [waterBodies, setWaterBodies] = useState<WaterBody[]>([]);

  const [municipalityId, setMunicipalityId] = useState<number | null>(null);
  const [wardId, setWardId] = useState<number | null>(null);
  const [boothId, setBoothId] = useState<number | null>(null);
  const [entries, setEntries] = useState<WaterBodyEntry[]>([emptyEntry()]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/asha/login');
        return;
      }
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (!profile || profile.role !== 'asha_worker') {
        navigate('/asha/login');
        return;
      }
      try {
        setMunicipalities(await fetchMunicipalities());
      } catch (e: unknown) {
        toast({ title: 'Failed to load municipalities', description: (e as Error).message, variant: 'destructive' });
      }
    })();
  }, [navigate, toast]);

  useEffect(() => {
    if (!municipalityId) { setWards([]); return; }
    fetchWards(municipalityId).then(setWards).catch(() => setWards([]));
    setWardId(null);
    setBoothId(null);
    setWaterBodies([]);
  }, [municipalityId]);

  useEffect(() => {
    if (!wardId) { setBooths([]); return; }
    fetchBooths(wardId).then(setBooths).catch(() => setBooths([]));
    setBoothId(null);
    setWaterBodies([]);
  }, [wardId]);

  useEffect(() => {
    if (!boothId) { setWaterBodies([]); return; }
    fetchWaterBodies(boothId).then(setWaterBodies).catch(() => setWaterBodies([]));
    setEntries([emptyEntry()]);
  }, [boothId]);

  const loadPhForEntry = useCallback(async (index: number, waterBodyId: number) => {
    setEntries((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], loading: true };
      return next;
    });
    try {
      const phSummary = await fetchPhSummary(waterBodyId);
      setEntries((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], phSummary, loading: false };
        return next;
      });
    } catch (e: unknown) {
      setEntries((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], loading: false };
        return next;
      });
      toast({ title: 'pH data unavailable', description: (e as Error).message, variant: 'destructive' });
    }
  }, [toast]);

  const updateEntry = (index: number, patch: Partial<WaterBodyEntry>) => {
    setEntries((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
    if (patch.waterBodyId && patch.waterBodyId > 0) {
      loadPhForEntry(index, patch.waterBodyId);
    }
  };

  const usedWaterBodyIds = entries.map((e) => e.waterBodyId).filter(Boolean);

  const handleSubmit = async () => {
    if (!boothId) {
      toast({ title: 'Select a booth', variant: 'destructive' });
      return;
    }

    const validEntries = entries.filter(
      (e) => e.waterBodyId && e.tds !== '' && e.turbidity !== ''
    );

    if (validEntries.length === 0) {
      toast({ title: 'Add at least one complete water body entry', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitBoothReport({
        boothId,
        entries: validEntries.map((e) => ({
          waterBodyId: e.waterBodyId,
          tds: Number(e.tds),
          turbidity: Number(e.turbidity),
        })),
      });

      setEntries((prev) =>
        prev.map((e, i) => ({
          ...e,
          wqi: result.reports[i]?.scores.wqi ?? e.wqi,
        }))
      );

      toast({
        title: 'Report submitted',
        description: `Booth Score: ${result.boothScore.toFixed(2)}`,
      });
    } catch (e: unknown) {
      toast({ title: 'Submission failed', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white dark:from-slate-950 dark:to-slate-900">
      <div className="container max-w-3xl py-8 px-4">
        <Button variant="ghost" className="mb-4" onClick={() => navigate('/asha/dashboard')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
        </Button>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">Water Quality Assessment</CardTitle>
            <CardDescription>
              Arogya Jal — Booth-level water quality reporting for ASHA workers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Municipality</Label>
                <Select
                  value={municipalityId ? String(municipalityId) : ''}
                  onValueChange={(v) => setMunicipalityId(Number(v))}
                >
                  <SelectTrigger><SelectValue placeholder="Select municipality" /></SelectTrigger>
                  <SelectContent>
                    {municipalities.map((m) => (
                      <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Ward</Label>
                <Select
                  value={wardId ? String(wardId) : ''}
                  onValueChange={(v) => setWardId(Number(v))}
                  disabled={!municipalityId}
                >
                  <SelectTrigger><SelectValue placeholder="Select ward" /></SelectTrigger>
                  <SelectContent>
                    {wards.map((w) => (
                      <SelectItem key={w.id} value={String(w.id)}>
                        {w.ward_name || `Ward ${w.ward_number}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Booth</Label>
                <Select
                  value={boothId ? String(boothId) : ''}
                  onValueChange={(v) => setBoothId(Number(v))}
                  disabled={!wardId}
                >
                  <SelectTrigger><SelectValue placeholder="Select booth" /></SelectTrigger>
                  <SelectContent>
                    {booths.map((b) => (
                      <SelectItem key={b.id} value={String(b.id)}>
                        {b.booth_name || `Booth ${b.booth_number}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {boothId && (
          <>
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Add water bodies from most important/largest water body to least important/smallest water body.
                First entry = highest priority.
              </AlertDescription>
            </Alert>

            <div className="space-y-4 mb-6">
              {entries.map((entry, index) => (
                <WaterBodyEntryBlock
                  key={index}
                  index={index}
                  entry={entry}
                  waterBodies={waterBodies}
                  usedWaterBodyIds={usedWaterBodyIds}
                  onChange={updateEntry}
                  onRemove={(i) => setEntries((prev) => prev.filter((_, j) => j !== i))}
                  canRemove={entries.length > 1}
                />
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEntries((prev) => [...prev, emptyEntry()])}
                disabled={entries.length >= waterBodies.length}
              >
                <Plus className="h-4 w-4 mr-2" /> Add Water Body
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Submitting...' : 'Generate WQI & Submit Booth Report'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ASHAWaterQuality;
