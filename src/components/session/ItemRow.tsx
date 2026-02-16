// Item row component for displaying scanned items

import { X } from 'lucide-react';
import { SessionItem } from '@/lib/types';

interface ItemRowProps {
  item: SessionItem;
  onRemove?: (itemId: string) => void;
  showRemove?: boolean;
}

export default function ItemRow({ item, onRemove, showRemove = true }: ItemRowProps) {
  return (
    <div className="flex items-center justify-between p-3 bg-primark-light-blue rounded-lg">
      <div className="flex-1">
        <p className="font-medium text-primark-navy">{item.item_barcode}</p>
        <p className="text-xs text-primark-grey">
          Scanned {new Date(item.scanned_in_at).toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
      {showRemove && onRemove && (
        <button
          onClick={() => onRemove(item.id)}
          className="p-2 hover:bg-red-100 rounded-lg transition-colors"
          title="Remove item"
        >
          <X size={20} className="text-red-600" />
        </button>
      )}
    </div>
  );
}
