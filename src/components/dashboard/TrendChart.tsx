import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';

interface TrendChartProps {
  title: string;
  data: { value: number; date: string }[];
  dataKey?: string;
  color?: string;
  yDomain?: [number, number];
}

export function TrendChart({
  title,
  data,
  color = 'hsl(var(--primary))',
  yDomain,
}: TrendChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    label: format(new Date(d.date), 'MMM d'),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No trend data yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis domain={yDomain} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

interface MultiTrendChartProps {
  title: string;
  data: { booth_score?: number; ward_score?: number; municipality_score?: number; generated_at: string }[];
  dataKey: 'booth_score' | 'ward_score' | 'municipality_score';
  color?: string;
}

export function ReportTrendChart({ title, data, dataKey, color = '#0ea5e9' }: MultiTrendChartProps) {
  const chartData = data.map((d) => ({
    value: d[dataKey],
    date: d.generated_at,
    label: format(new Date(d.generated_at), 'MMM d'),
  }));

  return (
    <TrendChart
      title={title}
      data={chartData.filter((d) => d.value != null) as { value: number; date: string }[]}
      color={color}
      yDomain={[0, 100]}
    />
  );
}
