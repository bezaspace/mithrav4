import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface RecoveryTrajectoryChartProps {
  data: {
    recoveryTrajectory: Array<{
      day: string;
      cognitive: number;
      physical: number;
      speech: number;
    }>;
  };
  compact?: boolean;
}

export function RecoveryTrajectoryChart({ data, compact = false }: RecoveryTrajectoryChartProps) {
  const chartData = data.recoveryTrajectory || [];

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={compact ? 200 : 250}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="colorCog" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorPhys" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
          <XAxis dataKey="day" stroke="#525252" fontSize={10} tickLine={false} axisLine={false} />
          <YAxis stroke="#525252" fontSize={10} tickLine={false} axisLine={false} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#171717', border: '1px solid #262626', borderRadius: '8px' }}
            itemStyle={{ fontSize: '10px' }}
          />
          <Legend />
          <Area type="monotone" dataKey="cognitive" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCog)" strokeWidth={2} name="Cognitive" />
          <Area type="monotone" dataKey="physical" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorPhys)" strokeWidth={2} name="Physical" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
