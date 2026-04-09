import { Pill, Apple, Home, Activity, Brain, Stethoscope, Calendar } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface DailyScheduleChartProps {
  data: {
    schedule: Array<{
      time: string;
      title: string;
      expert: string;
      type: string;
      instructions: string;
    }>;
  };
  compact?: boolean;
}

export function DailyScheduleChart({ data, compact = false }: DailyScheduleChartProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const scheduleData = data.schedule || [];

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
    <div className="w-full space-y-3">
      {scheduleData.map((session, i) => {
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
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
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
  );
}
