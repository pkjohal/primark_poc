// Back-of-house screen for managing restocked items

import { useState, useEffect } from 'react';
import { Package, CheckCircle, Filter } from 'lucide-react';
import NavBar from '@/components/layout/NavBar';
import BottomNav from '@/components/layout/BottomNav';
import PageHeader from '@/components/layout/PageHeader';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import { useBackOfHouse } from '@/hooks/useBackOfHouse';
import { formatWaitTime, getWaitTimeCategory } from '@/lib/utils';
import { BackOfHouseItemWithDetails } from '@/lib/types';

type FilterType = 'all' | '30min' | '1hr';

export default function BackOfHouseScreen() {
  const { items, loading, fetchItems, markAsReturned } = useBackOfHouse();
  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    await fetchItems();
  };

  const handleMarkAsReturned = async (itemId: string) => {
    try {
      await markAsReturned(itemId);
    } catch (err) {
      console.error('Error marking item as returned:', err);
    }
  };

  const getFilteredItems = () => {
    switch (filter) {
      case '30min':
        return items.filter((item) => {
          const category = getWaitTimeCategory(item.received_at);
          return category === 'warning' || category === 'critical';
        });
      case '1hr':
        return items.filter((item) => {
          const category = getWaitTimeCategory(item.received_at);
          return category === 'critical';
        });
      default:
        return items;
    }
  };

  const filteredItems = getFilteredItems();

  const getItemBorderColor = (item: BackOfHouseItemWithDetails) => {
    const category = getWaitTimeCategory(item.received_at);
    switch (category) {
      case 'critical':
        return 'border-red-300 bg-red-50';
      case 'warning':
        return 'border-amber-300 bg-amber-50';
      default:
        return 'border-primark-grey/30 bg-white';
    }
  };

  const getWaitTimeColor = (item: BackOfHouseItemWithDetails) => {
    const category = getWaitTimeCategory(item.received_at);
    switch (category) {
      case 'critical':
        return 'text-red-600';
      case 'warning':
        return 'text-amber-600';
      default:
        return 'text-primark-grey';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-primark-light-grey pb-20">
      <NavBar />
      <PageHeader title="Back of House" subtitle="Items awaiting return to floor" />

      <div className="flex-1 max-w-7xl mx-auto w-full p-4">
        {/* Filter tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              filter === 'all'
                ? 'bg-primark-blue text-white'
                : 'bg-white text-primark-grey hover:bg-primark-light-blue'
            }`}
          >
            <Filter size={16} className="inline mr-2" />
            All ({items.length})
          </button>
          <button
            onClick={() => setFilter('30min')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              filter === '30min'
                ? 'bg-primark-blue text-white'
                : 'bg-white text-primark-grey hover:bg-primark-light-blue'
            }`}
          >
            &gt; 30 min
          </button>
          <button
            onClick={() => setFilter('1hr')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              filter === '1hr'
                ? 'bg-primark-blue text-white'
                : 'bg-white text-primark-grey hover:bg-primark-light-blue'
            }`}
          >
            &gt; 1 hr
          </button>
        </div>

        {/* Items list */}
        <div className="card">
          {loading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-primark-blue/30 border-t-primark-blue rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-primark-grey">Loading items...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <EmptyState
              icon={Package}
              title={filter === 'all' ? 'No Items in Back of House' : 'No Items Match Filter'}
              message={
                filter === 'all'
                  ? 'All restocked items have been returned to the floor.'
                  : 'No items match the current filter criteria.'
              }
            />
          ) : (
            <div className="space-y-3">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 border-2 rounded-lg ${getItemBorderColor(item)}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <p className="text-lg font-mono font-bold text-primark-navy mb-1">
                        {item.item_barcode}
                      </p>
                      <p className="text-sm text-primark-grey">
                        Received by {item.team_member?.full_name || 'Unknown'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${getWaitTimeColor(item)}`}>
                        {formatWaitTime(item.received_at)}
                      </p>
                      <p className="text-xs text-primark-grey">wait time</p>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleMarkAsReturned(item.id)}
                    variant="success"
                    size="md"
                    className="w-full"
                  >
                    <CheckCircle size={20} className="mr-2" />
                    Returned to Floor
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
