import { Stethoscope, Zap } from 'lucide-react';

interface ClinicalProfileCardProps {
  data: {
    name: string;
    id: string;
    diagnosis: string;
    surgeon: string;
    rehabPlan: string;
    nextAssessment: string;
    stats: {
      cognitiveScore: string;
      mobilityIndex: string;
      heartRateAvg: string;
      dailyGoal: string;
      weeklyImprovement: string;
    };
  };
  compact?: boolean;
}

export function ClinicalProfileCard({ data, compact = false }: ClinicalProfileCardProps) {
  return (
    <div className="w-full space-y-4">
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
      <div>
        <p className="text-[10px] text-neutral-500 uppercase tracking-wider mb-0.5">Next Assessment</p>
        <p className="text-xs text-neutral-200 font-medium">{data.nextAssessment}</p>
      </div>
      <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center gap-3">
        <Zap className="text-blue-400" size={14} />
        <p className="text-[10px] text-blue-200">
          Weekly improvement: <span className="font-bold">{data.stats.weeklyImprovement}</span>
        </p>
      </div>
    </div>
  );
}
