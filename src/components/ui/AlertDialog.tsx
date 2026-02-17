// Alert dialog component for simple notifications

import { AlertCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import Button from './Button';

interface AlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  confirmText?: string;
  variant?: 'success' | 'error' | 'warning' | 'info';
}

export default function AlertDialog({
  isOpen,
  onClose,
  title,
  message,
  confirmText = 'OK',
  variant = 'info',
}: AlertDialogProps) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (variant) {
      case 'success':
        return <CheckCircle size={24} className="text-green-600" />;
      case 'error':
        return <AlertCircle size={24} className="text-red-600" />;
      case 'warning':
        return <AlertTriangle size={24} className="text-amber-600" />;
      default:
        return <Info size={24} className="text-blue-600" />;
    }
  };

  const getBgColor = () => {
    switch (variant) {
      case 'success':
        return 'bg-green-100';
      case 'error':
        return 'bg-red-100';
      case 'warning':
        return 'bg-amber-100';
      default:
        return 'bg-blue-100';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-4 sm:p-6 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start gap-3 sm:gap-4 mb-4">
          <div className={`p-2 rounded-lg flex-shrink-0 ${getBgColor()}`}>
            {getIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-semibold text-primark-navy mb-1 break-words">{title}</h3>
            <p className="text-sm text-primark-grey break-words">{message}</p>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <Button
            variant="primary"
            onClick={onClose}
            className="w-full sm:w-auto min-w-24"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
