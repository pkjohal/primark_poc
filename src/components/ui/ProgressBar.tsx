// Progress bar component

import { cn } from '@/lib/utils';

interface ProgressBarProps {
  current: number;
  total: number;
  showLabel?: boolean;
  className?: string;
}

export default function ProgressBar({ current, total, showLabel = true, className }: ProgressBarProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between text-sm text-primark-grey mb-2">
          <span>{current} of {total} resolved</span>
          <span>{percentage}%</span>
        </div>
      )}
      <div className="w-full h-3 bg-primark-light-grey rounded-full overflow-hidden">
        <div
          className="h-full bg-primark-green transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
