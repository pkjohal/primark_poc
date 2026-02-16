// Status pill component for displaying status badges

import { cn } from '@/lib/utils';

interface StatusPillProps {
  status: 'in_progress' | 'exiting' | 'complete' | 'flagged' | 'awaiting_return' | 'returned' | 'lost' | 'recovered' | 'in_room' | 'purchased' | 'restocked';
  className?: string;
}

const statusConfig = {
  in_progress: { label: 'In Progress', color: 'badge-blue' },
  exiting: { label: 'Exiting', color: 'badge-amber' },
  complete: { label: 'Complete', color: 'badge-green' },
  flagged: { label: 'Flagged', color: 'badge-red' },
  awaiting_return: { label: 'Awaiting Return', color: 'badge-amber' },
  returned: { label: 'Returned', color: 'badge-green' },
  lost: { label: 'Lost', color: 'badge-red' },
  recovered: { label: 'Recovered', color: 'badge-green' },
  in_room: { label: 'In Room', color: 'badge-blue' },
  purchased: { label: 'Purchased', color: 'badge-green' },
  restocked: { label: 'Restocked', color: 'badge-grey' },
};

export default function StatusPill({ status, className }: StatusPillProps) {
  const config = statusConfig[status];

  return (
    <span className={cn('badge', config.color, className)}>
      {config.label}
    </span>
  );
}
