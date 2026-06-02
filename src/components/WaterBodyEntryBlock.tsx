import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Droplets } from 'lucide-react';
import { PhDisplay } from '@/components/dashboard/ScoreCard';
import type { WaterBody, WaterBodyEntry } from '@/types/arogya';
import { scoreColor } from '@/services/arogya-api';

interface WaterBodyEntryBlockProps {
  index: number;
  entry: WaterBodyEntry;
  waterBodies: WaterBody[];
  usedWaterBodyIds: number[];
  onChange: (index: number, patch: Partial<WaterBodyEntry>) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
}

export function WaterBodyEntryBlock({
  index,
  entry,
  waterBodies,
  usedWaterBodyIds,
  onChange,
  onRemove,
  canRemove,
}: WaterBodyEntryBlockProps) {
  const priority = index + 1;
  const priorityLabel =
    priority === 1 ? 'Highest Priority' : priority === 2 ? 'Medium Priority' : 'Lower Priority';

  const availableBodies = waterBodies.filter(
    (wb) => wb.id === entry.waterBodyId || !usedWaterBodyIds.includes(wb.id)
  );

  return (
    <Card className="border-l-4 border-l-sky-500">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <Droplets className="h-5 w-5 text-sky-600" />
          <CardTitle className="text-base">Water Body #{priority}</CardTitle>
          <Badge variant="outline">{priorityLabel}</Badge>
        </div>
        {canRemove && (
          <Button type="button" variant="ghost" size="icon" onClick={() => onRemove(index)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Water Body</Label>
          <Select
            value={entry.waterBodyId ? String(entry.waterBodyId) : ''}
            onValueChange={(v) => onChange(index, { waterBodyId: Number(v), wqi: null, phSummary: null })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select water body" />
            </SelectTrigger>
            <SelectContent>
              {availableBodies.map((wb) => (
                <SelectItem key={wb.id} value={String(wb.id)}>
                  {wb.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {entry.loading && (
          <p className="text-sm text-muted-foreground">Loading pH data...</p>
        )}

        {entry.phSummary && !entry.loading && (
          <PhDisplay
            currentPh={entry.phSummary.currentPh}
            avgPh7Days={entry.phSummary.avgPh7Days}
            avgPh30Days={entry.phSummary.avgPh30Days}
          />
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor={`tds-${index}`}>TDS (mg/L)</Label>
            <Input
              id={`tds-${index}`}
              type="number"
              min={0}
              step="0.1"
              value={entry.tds}
              onChange={(e) => onChange(index, { tds: e.target.value, wqi: null })}
              placeholder="e.g. 250"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`turb-${index}`}>Turbidity (NTU)</Label>
            <Input
              id={`turb-${index}`}
              type="number"
              min={0}
              step="0.1"
              value={entry.turbidity}
              onChange={(e) => onChange(index, { turbidity: e.target.value, wqi: null })}
              placeholder="e.g. 4"
            />
          </div>
        </div>

        {entry.wqi != null && (
          <div className="rounded-lg bg-sky-50 dark:bg-sky-950/30 p-3">
            <p className="text-sm text-muted-foreground">Generated WQI</p>
            <p className={`text-2xl font-bold ${scoreColor(entry.wqi)}`}>{entry.wqi.toFixed(2)}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
