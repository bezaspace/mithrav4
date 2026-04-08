"use client";

interface Milestone {
  milestone_name: string;
  target_date: string;
  achieved_date: string | null;
  category: string;
  description: string;
}

interface MilestonesChartProps {
  data: {
    milestones: Milestone[];
    summary: {
      completed: number;
      pending: number;
      completionPercent: number;
    };
  };
  compact?: boolean;
}

const categoryColors: Record<string, string> = {
  Mobility: "#0891B2",
  ADL: "#10B981",
  Cognitive: "#8B5CF6",
  Recovery: "#F59E0B",
  Independence: "#EC4899",
};

export function MilestonesChart({ data, compact = false }: MilestonesChartProps) {
  const milestones = data.milestones || [];
  const summary = data.summary;

  if (milestones.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-zinc-500">
        No milestones data available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      {!compact && (
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="bg-zinc-800/50 rounded-lg p-3">
            <p className="text-zinc-400 text-xs">Completed</p>
            <p className="text-lg font-semibold text-green-400">
              {summary.completed}
            </p>
          </div>
          <div className="bg-zinc-800/50 rounded-lg p-3">
            <p className="text-zinc-400 text-xs">Pending</p>
            <p className="text-lg font-semibold text-yellow-400">
              {summary.pending}
            </p>
          </div>
          <div className="bg-zinc-800/50 rounded-lg p-3">
            <p className="text-zinc-400 text-xs">Progress</p>
            <p className="text-lg font-semibold text-cyan-400">
              {summary.completionPercent}%
            </p>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="bg-zinc-800/50 rounded-lg p-3">
        <div className="flex justify-between text-xs text-zinc-400 mb-2">
          <span>Overall Milestone Progress</span>
          <span>{summary.completionPercent}%</span>
        </div>
        <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-green-500 rounded-full transition-all duration-500"
            style={{ width: `${summary.completionPercent}%` }}
          />
        </div>
      </div>

      {/* Milestones List */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {milestones.map((milestone, index) => {
          const isCompleted = milestone.achieved_date !== null;
          const categoryColor =
            categoryColors[milestone.category] || "#71717a";

          return (
            <div
              key={index}
              className="flex items-center gap-3 p-3 bg-zinc-800/30 rounded-lg hover:bg-zinc-800/50 transition-colors"
            >
              {/* Status Icon */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isCompleted ? "bg-green-500/20" : "bg-zinc-700"
                }`}
              >
                {isCompleted ? (
                  <svg
                    className="w-4 h-4 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <span className="text-xs text-zinc-400">{index + 1}</span>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                  {milestone.milestone_name}
                </p>
                <p className="text-xs text-zinc-500 truncate">
                  {milestone.description}
                </p>
              </div>

              {/* Category Badge & Status */}
              <div className="text-right flex-shrink-0">
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: `${categoryColor}20`,
                    color: categoryColor,
                  }}
                >
                  {milestone.category}
                </span>
                <p
                  className={`text-xs mt-1 ${
                    isCompleted ? "text-green-400" : "text-yellow-400"
                  }`}
                >
                  {isCompleted
                    ? `Done: ${milestone.achieved_date}`
                    : `Target: ${milestone.target_date}`}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
