import { RadialBarChart, RadialBar, ResponsiveContainer, Tooltip } from 'recharts';

interface RecoveryScoresChartProps {
  data: {
    scores: Array<{
      name: string;
      value: number;
      fill: string;
    }>;
  };
  compact?: boolean;
}

export function RecoveryScoresChart({ data, compact = false }: RecoveryScoresChartProps) {
  const chartData = data.scores || [];

  return (
    <div className="w-full flex flex-col">
      <ResponsiveContainer width="100%" height={compact ? 200 : 250}>
        <RadialBarChart 
          cx="50%" 
          cy="50%" 
          innerRadius="20%" 
          outerRadius="100%" 
          barSize={compact ? 10 : 12} 
          data={chartData}
          startAngle={180}
          endAngle={-180}
        >
          <RadialBar
            background={{ fill: '#171717' }}
            dataKey="value"
            cornerRadius={10}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#171717', border: '1px solid #262626', borderRadius: '8px' }}
            itemStyle={{ fontSize: '10px' }}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4">
        {chartData.map((score, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: score.fill }} />
            <span className="text-[10px] text-neutral-400">{score.name}</span>
            <span className="text-[10px] font-bold text-neutral-200 ml-auto">{score.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
