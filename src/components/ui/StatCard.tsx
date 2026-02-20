// Stat card component for displaying metrics

import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: 'blue' | 'green' | 'red' | 'amber' | 'grey';
  subtitle?: string;
  className?: string;
}

export default function StatCard({ title, value, icon: Icon, color = 'blue', subtitle, className }: StatCardProps) {
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
          <p className="text-sm font-medium text-primark-grey mb-1">{title}</p>
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
