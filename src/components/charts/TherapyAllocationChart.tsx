import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface TherapyAllocationChartProps {
  data: {
    therapyAllocation: Array<{
      name: string;
      value: number;
    }>;
  };
  compact?: boolean;
}

const activityColors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b'];

export function TherapyAllocationChart({ data, compact = false }: TherapyAllocationChartProps) {
  const chartData = data.therapyAllocation || [];

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={compact ? 180 : 220}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={compact ? 35 : 45}
            outerRadius={compact ? 50 : 60}
            paddingAngle={5}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={activityColors[index % activityColors.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ backgroundColor: '#171717', border: '1px solid #262626', borderRadius: '8px' }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      <div className="grid grid-cols-2 gap-2 mt-4">
        {chartData.map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-[10px]">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: activityColors[i % activityColors.length] }} />
            <span className="text-neutral-400 truncate">{item.name}</span>
            <span className="text-neutral-200 ml-auto">{item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
