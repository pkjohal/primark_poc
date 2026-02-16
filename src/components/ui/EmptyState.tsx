// Empty state component

import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  message: string;
  action?: React.ReactNode;
  className?: string;
}

export default function EmptyState({ icon: Icon, title, message, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-4 text-center', className)}>
      <div className="w-16 h-16 rounded-full bg-primark-light-grey flex items-center justify-center mb-4">
        <Icon size={32} className="text-primark-grey" />
      </div>
      <h3 className="text-lg font-semibold text-primark-navy mb-2">{title}</h3>
      <p className="text-sm text-primark-grey max-w-sm mb-6">{message}</p>
      {action}
    </div>
  );
}
