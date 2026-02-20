// Stat card component for displaying metrics

import { LucideIcon, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: 'blue' | 'green' | 'red' | 'amber' | 'grey';
  subtitle?: string;
  tooltip?: string;
  className?: string;
}

export default function StatCard({ title, value, icon: Icon, color = 'blue', subtitle, tooltip, className }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-primark-light-blue text-primark-blue',
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
    amber: 'bg-amber-100 text-amber-600',
    grey: 'bg-primark-light-grey text-primark-grey',
  };

  return (
    <div className={cn('card', className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-1 mb-1">
            <p className="text-sm font-medium text-primark-grey">{title}</p>
            {tooltip && (
              <div className="relative group">
                <Info size={13} className="text-primark-grey/60 cursor-help" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-primark-navy text-white text-xs rounded-lg px-3 py-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-20 leading-relaxed">
                  {tooltip}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-primark-navy" />
                </div>
              </div>
            )}
          </div>
          <p className="text-3xl font-bold text-primark-navy">{value}</p>
          {subtitle && <p className="text-xs text-primark-grey mt-1">{subtitle}</p>}
        </div>
        <div className={cn('p-3 rounded-lg', colorClasses[color])}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
}
