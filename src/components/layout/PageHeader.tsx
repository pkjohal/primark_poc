// Page header component

import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  actions?: React.ReactNode;
  className?: string;
}

export default function PageHeader({ title, subtitle, showBack, onBack, actions, className }: PageHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <div className={cn('bg-white border-b border-primark-grey/20 px-4 py-4', className)}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            {showBack && (
              <button
                onClick={handleBack}
                className="p-2 hover:bg-primark-light-grey rounded-lg transition-colors"
              >
                <ArrowLeft size={24} className="text-primark-navy" />
              </button>
            )}
            <div className="flex-1">
              <h1 className="text-xl font-bold text-primark-navy">{title}</h1>
              {subtitle && <p className="text-sm text-primark-grey mt-1">{subtitle}</p>}
            </div>
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      </div>
    </div>
  );
}
