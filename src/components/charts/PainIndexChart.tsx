import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface PainIndexChartProps {
  data: {
    painIndex: Array<{
      date: string;
      pain_level: number;
    }>;
  };
  compact?: boolean;
}

export function PainIndexChart({ data, compact = false }: PainIndexChartProps) {
  const chartData = data.painIndex || [];

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={compact ? 200 : 250}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="colorPain" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
          <XAxis 
            dataKey="date" 
            stroke="#525252" 
            fontSize={10} 
            tickLine={false} 
            axisLine={false} 
            tickFormatter={(value) => value.slice(5)} 
          />
          <YAxis 
            stroke="#525252" 
            fontSize={10} 
            tickLine={false} 
            axisLine={false} 
            domain={[0, 10]} 
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#171717', border: '1px solid #262626', borderRadius: '8px' }}
            itemStyle={{ fontSize: '10px' }}
            formatter={(value: any) => [value, 'Pain Level']}
          />
          <Area 
            type="monotone" 
            dataKey="pain_level" 
            stroke="#ef4444" 
            fillOpacity={1} 
            fill="url(#colorPain)" 
            strokeWidth={2} 
            name="Pain Level" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
