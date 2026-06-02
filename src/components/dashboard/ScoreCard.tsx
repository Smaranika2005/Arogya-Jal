import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { scoreColor, scoreBadgeVariant } from '@/services/arogya-api';

interface ScoreCardProps {
  title: string;
  score: number | null | undefined;
  subtitle?: string;
  icon?: React.ReactNode;
}

export function ScoreCard({ title, score, subtitle, icon }: ScoreCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-bold ${scoreColor(score)}`}>
          {score != null ? score.toFixed(1) : '—'}
        </div>
        {score != null && (
          <Badge variant={scoreBadgeVariant(score)} className="mt-2">
            {score >= 80 ? 'Good' : score >= 60 ? 'Moderate' : 'Poor'}
          </Badge>
        )}
        {subtitle && <p className="text-xs text-muted-foreground mt-2">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

interface PhDisplayProps {
  currentPh: number | null;
  avgPh7Days: number | null;
  avgPh30Days: number | null;
}

export function PhDisplay({ currentPh, avgPh7Days, avgPh30Days }: PhDisplayProps) {
  const fmt = (v: number | null) => (v != null ? v.toFixed(2) : '—');
  return (
    <div className="grid grid-cols-3 gap-3 rounded-lg bg-muted/50 p-3 text-sm">
      <div>
        <p className="text-muted-foreground text-xs">Current pH</p>
        <p className="font-semibold">{fmt(currentPh)}</p>
      </div>
      <div>
        <p className="text-muted-foreground text-xs">7 Day Avg pH</p>
        <p className="font-semibold">{fmt(avgPh7Days)}</p>
      </div>
      <div>
        <p className="text-muted-foreground text-xs">30 Day Avg pH</p>
        <p className="font-semibold">{fmt(avgPh30Days)}</p>
      </div>
    </div>
  );
}
