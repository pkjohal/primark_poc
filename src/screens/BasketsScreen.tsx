// Baskets screen showing all purchased item baskets

import { useState, useEffect } from 'react';
import { ShoppingCart, Package, Clock, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import NavBar from '@/components/layout/NavBar';
import BottomNav from '@/components/layout/BottomNav';
import PageHeader from '@/components/layout/PageHeader';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useBaskets } from '@/hooks/useBaskets';
import { formatElapsedTime } from '@/lib/utils';

export default function BasketsScreen() {
  const { baskets, loading, fetchBaskets, deleteBasket } = useBaskets();
  const [expandedBaskets, setExpandedBaskets] = useState<Set<string>>(new Set());
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; basketId: string | null; basketNumber: number | null }>({
    show: false,
    basketId: null,
    basketNumber: null,
  });

  useEffect(() => {
    fetchBaskets();
  }, []);

  const toggleBasket = (basketId: string) => {
    const newExpanded = new Set(expandedBaskets);
    if (newExpanded.has(basketId)) {
      newExpanded.delete(basketId);
    } else {
      newExpanded.add(basketId);
    }
    setExpandedBaskets(newExpanded);
  };

  const handleDeleteClick = (basketId: string, basketNumber: number) => {
    setDeleteConfirm({ show: true, basketId, basketNumber });
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirm.basketId) {
      await deleteBasket(deleteConfirm.basketId);
      setDeleteConfirm({ show: false, basketId: null, basketNumber: null });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-primark-light-grey">
        <NavBar />
        <PageHeader title="Baskets" subtitle="View purchased item baskets" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primark-blue/30 border-t-primark-blue rounded-full animate-spin mx-auto mb-4" />
            <p className="text-primark-grey">Loading baskets...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-primark-light-grey pb-20">
      <NavBar />
      <PageHeader title="Baskets" subtitle="View purchased item baskets" />

      <div className="flex-1 max-w-7xl mx-auto w-full p-4">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-primark-navy">
              All Baskets ({baskets.length})
            </h2>
          </div>

          {baskets.length === 0 ? (
            <EmptyState
              icon={ShoppingCart}
              title="No Baskets"
              message="Purchased items will appear here grouped by session."
            />
          ) : (
            <div className="space-y-3">
              {baskets.map((basket) => {
                const isExpanded = expandedBaskets.has(basket.id);
                const itemCount = basket.items?.length || 0;

                return (
                  <div
                    key={basket.id}
                    className="border-2 border-primark-grey/30 rounded-lg overflow-hidden hover:border-primark-blue transition-all"
                  >
                    {/* Basket Header */}
                    <div
                      className="p-4 bg-white cursor-pointer"
                      onClick={() => toggleBasket(basket.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <ShoppingCart size={20} className="text-primark-blue" />
                            <span className="font-bold text-primark-navy text-lg">
                              Basket {basket.basket_number}
                            </span>
                          </div>
                          <div className="text-sm text-primark-grey space-y-1">
                            <p>Tag: {basket.session?.tag_barcode || 'N/A'}</p>
                            <p>Team Member: {basket.session?.team_member?.full_name || 'Unknown'}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Package size={16} />
                              <span className="font-medium">{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
                              <span className="mx-2">•</span>
                              <Clock size={16} />
                              <span>{formatElapsedTime(basket.created_at)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(basket.id, basket.basket_number);
                            }}
                            variant="danger"
                            size="sm"
                          >
                            <Trash2 size={16} />
                          </Button>
                          {isExpanded ? (
                            <ChevronUp size={24} className="text-primark-grey" />
                          ) : (
                            <ChevronDown size={24} className="text-primark-grey" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Basket Items (Expanded) */}
                    {isExpanded && (
                      <div className="border-t border-primark-grey/30 bg-primark-light-grey p-4">
                        {itemCount === 0 ? (
                          <p className="text-sm text-primark-grey text-center py-4">
                            No items in this basket
                          </p>
                        ) : (
                          <div className="space-y-2">
                            <h3 className="font-semibold text-primark-navy mb-2">Items:</h3>
                            {basket.items?.map((item, index) => (
                              <div
                                key={item.id}
                                className="bg-white p-3 rounded border border-primark-grey/20 flex items-center justify-between"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-primark-blue/10 rounded-full flex items-center justify-center">
                                    <span className="text-sm font-bold text-primark-blue">
                                      {index + 1}
                                    </span>
                                  </div>
                                  <div>
                                    <p className="font-semibold text-primark-navy">
                                      {item.item_barcode}
                                    </p>
                                    <p className="text-xs text-primark-grey">
                                      Added {formatElapsedTime(item.created_at)}
                                    </p>
                                  </div>
                                </div>
                                <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                                  PURCHASED
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <BottomNav />

      <ConfirmDialog
        isOpen={deleteConfirm.show}
        title="Delete Basket"
        message={`Are you sure you want to delete Basket ${deleteConfirm.basketNumber}? This will not delete the items, just the basket grouping.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteConfirm({ show: false, basketId: null, basketNumber: null })}
      />
    </div>
  );
}
