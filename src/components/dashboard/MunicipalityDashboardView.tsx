import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScoreCard, PhDisplay } from '@/components/dashboard/ScoreCard';
import { TrendChart, ReportTrendChart } from '@/components/dashboard/TrendChart';
import type { MunicipalityDashboard, WaterBodyDetails } from '@/types/arogya';
import { scoreColor } from '@/services/arogya-api';
import { format } from 'date-fns';

interface MunicipalityDashboardViewProps {
  data: MunicipalityDashboard;
  onSelectWaterBody: (id: number) => void;
  waterBodyDetails: WaterBodyDetails | null;
  boothTrend: { booth_score: number; generated_at: string }[];
  wardTrend: { ward_score: number; generated_at: string }[];
  selectedBoothId: number | null;
  selectedWardId: number | null;
  onSelectBooth: (id: number) => void;
  onSelectWard: (id: number) => void;
  boothWaterBodies?: { id: number; name: string }[];
  onOpenWaterBody?: (id: number) => void;
}

export function MunicipalityDashboardView({
  data,
  onSelectWaterBody,
  waterBodyDetails,
  boothTrend,
  wardTrend,
  selectedBoothId,
  selectedWardId,
  onSelectBooth,
  onSelectWard,
  boothWaterBodies = [],
  onOpenWaterBody,
}: MunicipalityDashboardViewProps) {
  const [detailOpen, setDetailOpen] = useState(false);

  const openWaterBody = (id: number) => {
    onSelectWaterBody(id);
    setDetailOpen(true);
  };

  return (
    <div className="space-y-6">
      <ScoreCard
        title="Municipality Score"
        score={data.municipalityScore}
        subtitle={data.lastUpdated ? `Updated ${format(new Date(data.lastUpdated), 'PPp')}` : undefined}
      />

      <ReportTrendChart
        title="Municipality Score Trend"
        data={data.trends.municipalityScore}
        dataKey="municipality_score"
      />

      {data.wards.map((ward) => (
        <Card key={ward.id}>
          <CardHeader
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => onSelectWard(ward.id)}
          >
            <div className="flex items-center justify-between">
              <CardTitle>{ward.ward_name || `Ward ${ward.ward_number}`}</CardTitle>
              <div className="flex items-center gap-2">
                <span className={`text-xl font-bold ${scoreColor(ward.wardScore)}`}>
                  {ward.wardScore?.toFixed(1) ?? '—'}
                </span>
                <Badge variant="outline">Ward Score</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {selectedWardId === ward.id && wardTrend.length > 0 && (
              <div className="mb-4">
                <ReportTrendChart title="Ward Score Trend" data={wardTrend} dataKey="ward_score" color="#8b5cf6" />
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {ward.booths?.map((booth) => (
                <Card
                  key={booth.id}
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => onSelectBooth(booth.id)}
                >
                  <CardContent className="pt-4">
                    <p className="font-medium text-sm">{booth.booth_name || `Booth ${booth.booth_number}`}</p>
                    <p className={`text-2xl font-bold mt-1 ${scoreColor(booth.boothScore)}`}>
                      {booth.boothScore?.toFixed(1) ?? '—'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Booth Score</p>
                    {selectedBoothId === booth.id && boothTrend.length > 0 && (
                      <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                        <ReportTrendChart
                          title=""
                          data={boothTrend}
                          dataKey="booth_score"
                          color="#f59e0b"
                        />
                      </div>
                    )}
                    {selectedBoothId === booth.id && boothWaterBodies.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1" onClick={(e) => e.stopPropagation()}>
                        {boothWaterBodies.map((wb) => (
                          <Badge
                            key={wb.id}
                            variant="secondary"
                            className="cursor-pointer hover:bg-primary/20"
                            onClick={() => openWaterBody(wb.id)}
                          >
                            {wb.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{waterBodyDetails?.waterBody.name ?? 'Water Body Details'}</DialogTitle>
          </DialogHeader>
          {waterBodyDetails && (
            <div className="space-y-4">
              <PhDisplay
                currentPh={waterBodyDetails.summary.currentPh}
                avgPh7Days={waterBodyDetails.summary.avgPh7Days}
                avgPh30Days={waterBodyDetails.summary.avgPh30Days}
              />
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Latest TDS</p>
                  <p className="font-semibold">{waterBodyDetails.latest.tds ?? '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Latest Turbidity</p>
                  <p className="font-semibold">{waterBodyDetails.latest.turbidity ?? '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Latest WQI</p>
                  <p className={`font-semibold ${scoreColor(waterBodyDetails.latest.wqi)}`}>
                    {waterBodyDetails.latest.wqi?.toFixed(2) ?? '—'}
                  </p>
                </div>
              </div>
              {waterBodyDetails.summary.lastUpdated && (
                <p className="text-xs text-muted-foreground">
                  Last updated: {format(new Date(waterBodyDetails.summary.lastUpdated), 'PPp')}
                </p>
              )}
              <TrendChart title="Historical pH Trend" data={waterBodyDetails.trends.ph} color="#0284c7" />
              <TrendChart title="Historical WQI Trend" data={waterBodyDetails.trends.wqi} color="#059669" yDomain={[0, 100]} />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader><CardTitle className="text-base">Quick Access — Water Bodies</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {data.wards.flatMap((w) =>
            (w.booths ?? []).flatMap((b) =>
              /* water bodies loaded on demand via dialog - show booth links */
              [{ boothId: b.id, boothName: b.booth_name || b.booth_number }]
            )
          ).map((item, i) => (
            <Badge key={i} variant="secondary" className="cursor-default">
              Booth {item.boothName}
            </Badge>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// Export helper to pick first water body from booth - used by parent
export function WaterBodyPicker({
  boothId,
  onSelect,
}: {
  boothId: number;
  onSelect: (id: number) => void;
}) {
  return (
    <button type="button" className="text-sm text-primary underline" onClick={() => onSelect(boothId)}>
      View water bodies for booth {boothId}
    </button>
  );
}
