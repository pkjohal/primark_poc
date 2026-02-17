// Confirmation dialog component

import { AlertTriangle } from 'lucide-react';
import Button from './Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'warning',
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-4 sm:p-6 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start gap-3 sm:gap-4 mb-4">
          <div className={`p-2 rounded-lg flex-shrink-0 ${variant === 'danger' ? 'bg-red-100' : variant === 'info' ? 'bg-blue-100' : 'bg-amber-100'}`}>
            <AlertTriangle size={24} className={variant === 'danger' ? 'text-red-600' : variant === 'info' ? 'text-blue-600' : 'text-amber-600'} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-semibold text-primark-navy mb-1 break-words">{title}</h3>
            <p className="text-sm text-primark-grey break-words">{message}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-6">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 order-2 sm:order-1"
          >
            {cancelText}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={handleConfirm}
            className="flex-1 order-1 sm:order-2"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
