// Discrepancy screen for handling missing items individually

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, Camera, Check, Keyboard, Package, ShoppingCart } from 'lucide-react';
import BarcodeScanner from '@/components/scanner/BarcodeScanner';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useAuth } from '@/hooks/useAuth';
import { useSessions } from '@/hooks/useSessions';
import { useSessionItems } from '@/hooks/useSessionItems';
import { useShrinkage } from '@/hooks/useShrinkage';
import { useBackOfHouse } from '@/hooks/useBackOfHouse';
import { useBaskets } from '@/hooks/useBaskets';
import { useBarcodeScan } from '@/hooks/useBarcodeScan';
import { SessionItem } from '@/lib/types';

export default function DiscrepancyScreen() {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  const { teamMember } = useAuth();
  const { getSessionById, updateSession } = useSessions();
  const {
    getUnresolvedItems,
    markItemAsPurchased,
    markItemAsRestocked,
    markItemAsLost: markItemAsLostInDb,
  } = useSessionItems();
  const { logLostItem } = useShrinkage();
  const { addItem: addToBackOfHouse } = useBackOfHouse();
  const { getOrCreateBasket, addItemToBasket } = useBaskets();

  const [unresolvedItems, setUnresolvedItems] = useState<SessionItem[]>([]);
  const [currentItem, setCurrentItem] = useState<SessionItem | null>(null);
  const [scannedItem, setScannedItem] = useState<SessionItem | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [itemToMarkLost, setItemToMarkLost] = useState<SessionItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lostCount, setLostCount] = useState(0);
  const [manualEntry, setManualEntry] = useState('');
  const [resolvedItems, setResolvedItems] = useState<Array<{
    item: SessionItem;
    resolution: 'purchased' | 'restocked' | 'lost';
    timestamp: string;
  }>>([]);

  useEffect(() => {
    if (sessionId) {
      loadUnresolvedItems();
    }
  }, [sessionId]);

  const loadUnresolvedItems = async () => {
    if (!sessionId) return;

    setLoading(true);
    try {
      const items = await getUnresolvedItems(sessionId);
      setUnresolvedItems(items);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleScanClick = (item: SessionItem) => {
    setCurrentItem(item);
    setShowScanner(true);
    setError(null);
    setManualEntry('');
  };

  const handleManualEntry = () => {
    const barcode = manualEntry.trim().toUpperCase();

    if (!barcode) {
      setError('Please enter a barcode');
      return;
    }

    handleItemScan.handleScan(barcode);
    setManualEntry('');
  };

  const handleItemScan = useBarcodeScan(async (barcode) => {
    if (!sessionId || !currentItem) return;

    setError(null);

    try {
      // Check if scanned barcode matches the current item
      if (barcode === currentItem.item_barcode) {
        // Found it! Show resolution options
        setScannedItem(currentItem);
        setShowScanner(false);
      } else {
        setError(`Scanned ${barcode} but expected ${currentItem.item_barcode}`);
      }
    } catch (err: any) {
      setError(err.message);
    }
  });

  const handlePurchase = async () => {
    if (!scannedItem || !sessionId) return;

    try {
      const basketId = await getOrCreateBasket(sessionId);
      if (!basketId) {
        setError('Failed to create basket');
        return;
      }

      await markItemAsPurchased(scannedItem.id);
      await addItemToBasket(scannedItem.id, basketId);

      // Add to resolved items
      setResolvedItems(prev => [...prev, {
        item: scannedItem,
        resolution: 'purchased',
        timestamp: new Date().toISOString()
      }]);

      setUnresolvedItems(unresolvedItems.filter(i => i.id !== scannedItem.id));
      setScannedItem(null);
      setCurrentItem(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRestock = async () => {
    if (!scannedItem || !sessionId || !teamMember) return;

    try {
      await markItemAsRestocked(scannedItem.id);
      await addToBackOfHouse(sessionId, scannedItem.item_barcode, teamMember.id);

      // Add to resolved items
      setResolvedItems(prev => [...prev, {
        item: scannedItem,
        resolution: 'restocked',
        timestamp: new Date().toISOString()
      }]);

      setUnresolvedItems(unresolvedItems.filter(i => i.id !== scannedItem.id));
      setScannedItem(null);
      setCurrentItem(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleMarkAsLostClick = (item: SessionItem) => {
    setItemToMarkLost(item);
    setShowConfirm(true);
  };

  const confirmMarkAsLost = async () => {
    if (!sessionId || !teamMember || !itemToMarkLost) return;

    try {
      // Mark item as lost in database
      await markItemAsLostInDb(itemToMarkLost.id);

      // Log in shrinkage
      await logLostItem(
        sessionId,
        itemToMarkLost.item_barcode,
        teamMember.id,
        'Item not returned from changing room'
      );

      // Add to resolved items
      setResolvedItems(prev => [...prev, {
        item: itemToMarkLost,
        resolution: 'lost',
        timestamp: new Date().toISOString()
      }]);

      // Remove from unresolved list
      setUnresolvedItems(unresolvedItems.filter(i => i.id !== itemToMarkLost.id));
      setLostCount(prev => prev + 1);

      setShowConfirm(false);
      setItemToMarkLost(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleComplete = async () => {
    if (!sessionId) return;

    setLoading(true);

    try {
      const session = await getSessionById(sessionId);
      if (!session) return;

      // Calculate final counts
      const itemsLost = lostCount;
      const itemsPurchased = session.total_items_in - itemsLost;

      await updateSession(sessionId, {
        status: itemsLost > 0 ? 'flagged' : 'complete',
        total_items_out: session.total_items_in,
        items_purchased: itemsPurchased,
        items_lost: itemsLost,
        exit_complete_time: new Date().toISOString(),
      });

      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && unresolvedItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primark-red">
        <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-primark-red text-white p-6">
      <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={64} className="text-primark-red" />
          </div>
          <h1 className="text-4xl font-bold mb-2"> {unresolvedItems.length} ITEM{unresolvedItems.length !== 1 ? 'S' : ''} UNACCOUNTED FOR</h1>
          <p className="text-xl">Please ask the customer about the following items</p>
        </div>

        {/* Resolution options after successful scan */}
        {scannedItem && !showScanner && (
          <div className="mb-6">
            <div className="bg-white rounded-lg p-6">
              <h3 className="text-primark-navy font-bold text-xl mb-2">
                Item Found!
              </h3>
              <p className="text-2xl font-mono font-bold text-primark-navy mb-4">
                {scannedItem.item_barcode}
              </p>
              <p className="text-primark-grey mb-6">
                How should this item be resolved?
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={handleRestock}
                  variant="secondary"
                  size="lg"
                  className="inline-flex items-center justify-center gap-2"
                >
                  <Package size={24} />
                  Restock
                </Button>
                <Button
                  onClick={handlePurchase}
                  variant="success"
                  size="lg"
                  className="inline-flex items-center justify-center gap-2"
                >
                  <ShoppingCart size={24} />
                  Add to Basket
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Scanner overlay */}
        {showScanner && currentItem && !scannedItem && (
          <div className="mb-6">
            <div className="bg-white rounded-lg p-4">
              <h3 className="text-primark-navy font-bold mb-2">
                Scan: {currentItem.item_barcode}
              </h3>
              <BarcodeScanner
                onScan={handleItemScan.handleScan}
                isActive={true}
              />

              {/* Manual entry */}
              <div className="mt-4 flex gap-2">
                <input
                  type="text"
                  value={manualEntry}
                  onChange={(e) => setManualEntry(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleManualEntry()}
                  placeholder="Enter barcode"
                  className="flex-1 px-4 py-2 border-2 border-primark-navy rounded-lg text-primark-navy font-medium"
                />
                <Button
                  onClick={handleManualEntry}
                  variant="outline"
                  className="px-6 border-2 border-primark-navy text-primark-navy hover:bg-primark-light-grey inline-flex items-center gap-2"
                >
                  <Keyboard size={20} />
                  Add
                </Button>
              </div>

              <Button
                onClick={() => {
                  setShowScanner(false);
                  setCurrentItem(null);
                  setError(null);
                  setManualEntry('');
                }}
                variant="outline"
                className="w-full mt-4 border-2 border-primark-navy text-primark-navy hover:bg-primark-light-grey"
              >
                Cancel
              </Button>
            </div>
            {error && (
              <div className="mt-4 p-3 bg-white/20 rounded-lg text-sm">
                {error}
              </div>
            )}
          </div>
        )}

        {/* Unresolved items list */}
        {!showScanner && !scannedItem && (
          <>
            <div className="bg-white/10 rounded-lg p-6 mb-6 flex-1 overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4">
                Unresolved Items ({unresolvedItems.length})
              </h2>

              {unresolvedItems.length === 0 ? (
                <div className="text-center py-8">
                  <Check size={48} className="mx-auto mb-3 text-white" />
                  <p className="text-lg">All items resolved!</p>
                  <p className="text-sm opacity-80 mt-2">Tap Complete to finish</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {unresolvedItems.map((item) => (
                    <div key={item.id} className="bg-white/20 rounded-lg p-4">
                      <p className="text-xl font-mono font-bold mb-1">
                        {item.item_barcode}
                      </p>
                      <p className="text-sm opacity-80 mb-3">
                        Scanned in at{' '}
                        {new Date(item.scanned_in_at).toLocaleTimeString('en-GB', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>

                      <div className="flex flex-row w-full gap-2">
                        <Button
                          onClick={() => handleScanClick(item)}
                          variant="primary"
                          size="lg"
                          className="flex-1 bg-primark-blue hover:bg-white/90 inline-flex items-center justify-center gap-2"
                        >
                          <Camera size={20} />
                          SCAN
                        </Button>
                        <Button
                          onClick={() => handleMarkAsLostClick(item)}
                          variant="danger"
                          size="lg"
                          className="flex-1 bg-primark-navy hover:bg-primark-navy/80 inline-flex items-center justify-center gap-2"
                        >
                          <AlertTriangle size={20} />
                          MARK LOST
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Resolved items summary */}
            {resolvedItems.length > 0 && (
              <div className="bg-white/10 rounded-lg p-6 mb-6">
                <h2 className="text-2xl font-bold mb-4">
                  Resolved Items ({resolvedItems.length})
                </h2>
                <div className="space-y-2">
                  {resolvedItems.map((resolved, index) => (
                    <div
                      key={`${resolved.item.id}-${index}`}
                      className={`rounded-lg p-4 ${
                        resolved.resolution === 'lost'
                          ? 'bg-red-500/20 border-2 border-red-400/50'
                          : resolved.resolution === 'restocked'
                          ? 'bg-amber-500/20 border-2 border-amber-400/50'
                          : 'bg-green-500/20 border-2 border-green-400/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-lg font-mono font-bold mb-1">
                            {resolved.item.item_barcode}
                          </p>
                          <p className="text-sm opacity-80">
                            Resolved at {' '}
                            {new Date(resolved.timestamp).toLocaleTimeString('en-GB', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${
                            resolved.resolution === 'lost'
                              ? 'bg-red-400 text-red-900'
                              : resolved.resolution === 'restocked'
                              ? 'bg-amber-400 text-amber-900'
                              : 'bg-green-400 text-green-900'
                          }`}>
                            {resolved.resolution === 'lost' ? '✗ LOST' :
                             resolved.resolution === 'restocked' ? '↺ RESTOCK' :
                             '✓ Added to Basket'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Complete button */}
            {unresolvedItems.length === 0 && (
              <Button
                onClick={handleComplete}
                variant="success"
                size="lg"
                isLoading={loading}
                className="w-full bg-primark-green hover:bg-primark-green/80 inline-flex items-center justify-center gap-2"
              >
                <Check size={24} />
                COMPLETE
              </Button>
            )}

            {/* Info message */}
            <p className="text-center text-sm opacity-80 mt-4">
              Items marked as lost will be logged for shrinkage reporting
            </p>
          </>
        )}
      </div>

      {/* Confirmation dialog */}
      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => {
          setShowConfirm(false);
          setItemToMarkLost(null);
        }}
        onConfirm={confirmMarkAsLost}
        title="Mark Item as Lost?"
        message={`Mark ${itemToMarkLost?.item_barcode} as lost? This will be logged for shrinkage reporting.`}
        confirmText="Mark as Lost"
        variant="danger"
      />
    </div>
  );
}
