import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, RadialBarChart, RadialBar, Legend
} from 'recharts';
import { 
  Activity, Brain, Calendar, ChevronDown, Clock, Heart, 
  Stethoscope, Target, TrendingUp, Zap, Apple, Pill, Home
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';

const activityColors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b'];

export function StatsGrid({ data }: { data: any }) {
  const stats = [
    { label: 'Cognitive Score', value: data.stats.cognitiveScore, icon: Brain, color: 'text-purple-400', trend: '+12%' },
    { label: 'Mobility Index', value: data.stats.mobilityIndex, icon: Activity, color: 'text-blue-400', trend: '+5%' },
    { label: 'Heart Rate Avg', value: data.stats.heartRateAvg, icon: Heart, color: 'text-red-400', trend: 'Stable' },
    { label: 'Daily Goal', value: data.stats.dailyGoal, icon: Target, color: 'text-emerald-400', trend: '+2%' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-2xl backdrop-blur-md"
        >
          <div className="flex justify-between items-start mb-2">
            <div className={`p-2 rounded-xl bg-neutral-800 ${stat.color}`}>
              <stat.icon size={18} />
            </div>
            <span className="text-[10px] font-medium text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
              {stat.trend}
            </span>
          </div>
          <p className="text-xs text-neutral-500 font-medium">{stat.label}</p>
          <h3 className="text-lg font-bold text-neutral-100">{stat.value}</h3>
        </motion.div>
      ))}
    </div>
  );
}

export function RecoveryTrajectory({ data }: { data: any }) {
  return (
    <div className="bg-neutral-900/60 border border-neutral-800 p-6 rounded-3xl backdrop-blur-md h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-semibold text-neutral-200 flex items-center gap-2">
          <TrendingUp size={16} className="text-blue-400" />
          Recovery Trajectory
        </h3>
      </div>
      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data.recoveryTrajectory}>
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
            <Area type="monotone" dataKey="cognitive" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCog)" strokeWidth={2} />
            <Area type="monotone" dataKey="physical" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorPhys)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function TherapyAllocation({ data }: { data: any }) {
  return (
    <div className="bg-neutral-900/60 border border-neutral-800 p-6 rounded-3xl backdrop-blur-md">
      <h3 className="text-sm font-semibold text-neutral-200 mb-4">Therapy Allocation</h3>
      <div className="h-[180px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data.therapyAllocation}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={60}
              paddingAngle={5}
              dataKey="value"
            >
              {data.therapyAllocation.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={activityColors[index % activityColors.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ backgroundColor: '#171717', border: '1px solid #262626', borderRadius: '8px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-4">
        {data.therapyAllocation.map((item: any, i: number) => (
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

export function ClinicalProfile({ data }: { data: any }) {
  return (
    <div className="bg-neutral-900/60 border border-neutral-800 p-6 rounded-3xl backdrop-blur-md">
      <h3 className="text-sm font-bold text-neutral-100 mb-4 flex items-center gap-2">
        <Stethoscope size={18} className="text-blue-500" />
        Clinical Profile
      </h3>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] text-neutral-500 uppercase tracking-wider mb-0.5">Diagnosis</p>
            <p className="text-xs text-neutral-200 font-medium">{data.diagnosis}</p>
          </div>
          <div>
            <p className="text-[10px] text-neutral-500 uppercase tracking-wider mb-0.5">Surgeon</p>
            <p className="text-xs text-neutral-200 font-medium">{data.surgeon}</p>
          </div>
        </div>
        <div>
          <p className="text-[10px] text-neutral-500 uppercase tracking-wider mb-0.5">Rehab Plan</p>
          <p className="text-xs text-neutral-200 font-medium">{data.rehabPlan}</p>
        </div>
      </div>
      <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center gap-3">
        <Zap className="text-blue-400" size={14} />
        <p className="text-[10px] text-blue-200">
          Weekly improvement: <span className="font-bold">{data.stats.weeklyImprovement}</span>
        </p>
      </div>
    </div>
  );
}

export function ScheduleList({ data }: { data: any }) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const getIcon = (type: string) => {
    switch (type) {
      case 'Medication': return Pill;
      case 'Diet': return Apple;
      case 'Home Therapy': return Home;
      case 'Physical': return Activity;
      case 'Cognitive': return Brain;
      case 'Clinical': return Stethoscope;
      default: return Calendar;
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'Medication': return 'text-amber-400';
      case 'Diet': return 'text-emerald-400';
      case 'Home Therapy': return 'text-blue-400';
      case 'Physical': return 'text-purple-400';
      case 'Cognitive': return 'text-pink-400';
      case 'Clinical': return 'text-red-400';
      default: return 'text-neutral-400';
    }
  };

  return (
    <div className="bg-neutral-900/60 border border-neutral-800 p-6 rounded-3xl backdrop-blur-md">
      <h3 className="text-sm font-bold text-neutral-100 mb-4 flex items-center gap-2">
        <Calendar size={18} className="text-emerald-500" />
        Today's Schedule
      </h3>
      <div className="space-y-3">
        {data.schedule?.map((session: any, i: number) => {
          const Icon = getIcon(session.type);
          const isExpanded = expandedIndex === i;

          return (
            <motion.div 
              key={i} 
              layout
              className={`overflow-hidden transition-all duration-300 bg-neutral-800/30 rounded-2xl border ${isExpanded ? 'border-neutral-700 bg-neutral-800/50' : 'border-neutral-800/50'}`}
            >
              <button 
                onClick={() => setExpandedIndex(isExpanded ? null : i)}
                className="w-full flex items-center justify-between p-4 text-left"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-xl bg-neutral-900/50 ${getIconColor(session.type)}`}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-medium text-neutral-500">{session.time}</span>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded-full bg-neutral-900/50 border border-neutral-800 ${getIconColor(session.type)}`}>
                        {session.type}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-neutral-100">{session.title}</p>
                    <p className="text-[10px] text-neutral-500">{session.expert}</p>
                  </div>
                </div>
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  className="text-neutral-600"
                >
                  <ChevronDown size={18} />
                </motion.div>
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-4 pb-4"
                  >
                    <div className="pt-2 border-t border-neutral-800/50">
                      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">Instructions</p>
                      <p className="text-xs text-neutral-300 leading-relaxed bg-neutral-900/40 p-3 rounded-xl border border-neutral-800/30">
                        {session.instructions}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export function RadialScoreChart({ data }: { data: any }) {
  return (
    <div className="bg-neutral-900/60 border border-neutral-800 p-6 rounded-3xl backdrop-blur-md h-full flex flex-col">
      <h3 className="text-sm font-bold text-neutral-100 mb-6 flex items-center gap-2">
        <Activity size={18} className="text-blue-500" />
        Recovery Metrics
      </h3>
      <div className="flex-1 min-h-[250px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart 
            cx="50%" 
            cy="50%" 
            innerRadius="20%" 
            outerRadius="100%" 
            barSize={12} 
            data={data.scores || []}
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
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4">
        {data.scores?.map((score: any, i: number) => (
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
